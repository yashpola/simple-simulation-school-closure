import { NextRequest, NextResponse } from 'next/server';
import {
  createOpenAIClient,
  generatePreStances,
  conductDeliberation,
  generatePostStances,
  evaluateDQI,
  calculateAnalyticalMetrics,
} from '@/lib/simulation';
import { ExperimentConfig, ExperimentRun, ExperimentResult } from '@/types/experiment';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 300; // Allow long-running simulation on Vercel Pro if available

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      config,
      runId,
      name,
      apiKey: userApiKey,
      baseUrl: userBaseUrl,
    } = body as {
      config: ExperimentConfig;
      runId?: string;
      name?: string;
      apiKey?: string;
      baseUrl?: string;
    };

    if (!config) {
      return NextResponse.json({ error: 'Missing experiment configuration.' }, { status: 400 });
    }

    const effectiveApiKey = userApiKey || process.env.OPENAI_API_KEY;
    const effectiveBaseUrl = userBaseUrl || process.env.OPENAI_BASE_URL || 'https://api.together.xyz/v1';

    if (!effectiveApiKey) {
      return NextResponse.json(
        {
          error:
            'No LLM API Key provided. Set OPENAI_API_KEY in website/.env or provide it in the experiment runner settings.',
        },
        { status: 400 }
      );
    }

    const client = createOpenAIClient(effectiveApiKey, effectiveBaseUrl);

    // Set up SSE stream
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const sendEvent = async (data: any) => {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    };

    // Run experiment asynchronously
    (async () => {
      try {
        await sendEvent({ status: 'started', stage: 'pre_stances', message: 'Generating baseline pre-deliberation stances...' });

        // 1. Pre-stances
        const stancesPre = await generatePreStances(client, config, (msg) => {
          sendEvent({ stage: 'pre_stances', message: msg });
        });

        // 2. Control Run
        await sendEvent({ status: 'running', stage: 'control_run', message: 'Executing Control Run (Direct Deliberation)...' });
        const runAConfig = config.deliberation_config.runs[0] || {
          id: 'run_A_control',
          system_prompt_addition: 'Respond directly to the previous speakers in character.',
          extract_tags: false,
        };

        const chatHistoryControl = await conductDeliberation(client, runAConfig, config, (entry, round) => {
          sendEvent({
            stage: 'control_run',
            message: `Control Round ${round}: ${entry.agent} responded`,
            turn: { run: 'Control', round, entry },
          });
        });

        // 3. Treatment Run
        await sendEvent({ status: 'running', stage: 'treatment_run', message: 'Executing Treatment Run (With Internal Reflection)...' });
        const runBConfig = config.deliberation_config.runs[1] || {
          id: 'run_B_treatment',
          system_prompt_addition:
            'Before responding, you MUST write your internal thoughts inside <private_scratchpad> tags. Analyze what others said, how it affects your persona\'s goals, and where you might compromise. Then, write your verbal response inside <public_response> tags.',
          extract_tags: true,
        };

        const chatHistoryTreatment = await conductDeliberation(client, runBConfig, config, (entry, round) => {
          sendEvent({
            stage: 'treatment_run',
            message: `Treatment Round ${round}: ${entry.agent} produced reflection & response`,
            turn: { run: 'Treatment', round, entry },
          });
        });

        // 4. Post-stances
        await sendEvent({ status: 'running', stage: 'post_stances', message: 'Generating final post-deliberation stances...' });
        const stancesPostControl = await generatePostStances(client, config, chatHistoryControl);
        const stancesPostTreatment = await generatePostStances(client, config, chatHistoryTreatment);

        const resultsControl: ExperimentResult = {
          stances_pre: stancesPre,
          stances_post: stancesPostControl,
          chat_history: chatHistoryControl,
        };

        const resultsTreatment: ExperimentResult = {
          stances_pre: stancesPre,
          stances_post: stancesPostTreatment,
          chat_history: chatHistoryTreatment,
        };

        // 5. Evaluation
        await sendEvent({ status: 'running', stage: 'evaluation', message: 'Evaluating analytical metrics and DQI Judge rubric...' });

        const metricsControl = calculateAnalyticalMetrics(stancesPre, stancesPostControl);
        const metricsTreatment = calculateAnalyticalMetrics(stancesPre, stancesPostTreatment);

        const dqiControl = await evaluateDQI(client, config, chatHistoryControl);
        const dqiTreatment = await evaluateDQI(client, config, chatHistoryTreatment);

        const evals = {
          Control: {
            ...metricsControl,
            dqi: dqiControl,
          },
          Treatment: {
            ...metricsTreatment,
            dqi: dqiTreatment,
          },
        };

        const assignedRunId = runId || `exp_${Date.now()}`;
        const experimentRun: ExperimentRun = {
          id: assignedRunId,
          created_at: new Date().toISOString(),
          name: name || `School Closure Deliberation (${assignedRunId})`,
          description: `Interactive run comparing System 1 (Direct) vs System 2 (Internal Reflection Scratchpad)`,
          status: 'completed',
          config,
          results_control: resultsControl,
          results_treatment: resultsTreatment,
          evals,
          metadata: {
            model: config.model_config.model_assignments['MOE Official'],
            totalTurns: config.deliberation_config.max_turns_per_agent,
          },
        };

        // Try persisting to Supabase if configured on server
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('http') && !supabaseUrl.includes('your-project-id')) {
          try {
            const tableName = process.env.NEXT_PUBLIC_SUPABASE_TABLE || 'school_closure_experiments';
            const supabase = createClient(supabaseUrl, supabaseKey);
            await supabase.from(tableName).upsert({
              id: experimentRun.id,
              created_at: experimentRun.created_at,
              name: experimentRun.name,
              description: experimentRun.description,
              status: experimentRun.status,
              config: experimentRun.config,
              results_control: experimentRun.results_control,
              results_treatment: experimentRun.results_treatment,
              evals: experimentRun.evals,
              metadata: experimentRun.metadata,
            });
          } catch (supaErr) {
            console.warn('Server Supabase upsert error:', supaErr);
          }
        }

        await sendEvent({ status: 'completed', stage: 'completed', message: 'Experiment completed successfully!', run: experimentRun });
      } catch (err: any) {
        console.error('Experiment runner error:', err);
        await sendEvent({ status: 'error', stage: 'error', error: err?.message || 'Unknown simulation error.' });
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}

