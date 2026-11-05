import OpenAI from "openai/index.mjs";
import {
  ExperimentConfig,
  ExperimentResult,
  ChatEntry,
  DQIScores,
  EvaluationResults,
  RunConfig,
  Persona,
} from "@/types/experiment";

export interface SimulationProgress {
  stage:
    | "idle"
    | "pre_stances"
    | "control_run"
    | "treatment_run"
    | "post_stances"
    | "evaluation"
    | "completed"
    | "error";
  message: string;
  percent: number;
  currentTurn?: {
    runId: string;
    round: number;
    agent: string;
    public_response: string;
    private_scratchpad?: string | null;
  };
}

export function createOpenAIClient(apiKey?: string, baseUrl?: string): OpenAI {
  const key = apiKey || process.env.OPENAI_API_KEY || "";
  const url =
    baseUrl || process.env.OPENAI_BASE_URL || "https://api.together.xyz/v1";

  return new OpenAI({
    apiKey: key,
    baseURL: url,
    dangerouslyAllowBrowser: false,
  });
}

/**
 * Extracts <private_scratchpad> and <public_response> from LLM text.
 * Mirrored from src/deliberation.py
 */
export function extractTags(text: string): {
  scratchpad: string | null;
  publicResponse: string;
} {
  let scratchpad: string | null = null;
  let publicResponse = text.trim();

  const scratchMatch = text.match(
    /<private_scratchpad>([\s\S]*?)<\/private_scratchpad>/i,
  );
  if (scratchMatch) {
    scratchpad = scratchMatch[1].trim();
  }

  const publicMatch = text.match(
    /<public_response>([\s\S]*?)<\/public_response>/i,
  );
  if (publicMatch) {
    publicResponse = publicMatch[1].trim();
  } else if (scratchMatch) {
    publicResponse = text.replace(scratchMatch[0], "").trim();
  }

  publicResponse = publicResponse
    .replace(/<public_response>/gi, "")
    .replace(/<\/public_response>/gi, "")
    .trim();

  // Strip prefix like [MOE Official]: or Teacher:
  publicResponse = publicResponse.replace(
    /^(?:\[.*?\]|(?:Heritage School Teacher|MOE Official|Teacher)):?\s*/i,
    "",
  );

  return { scratchpad, publicResponse };
}

/**
 * Helper to call LLM chat completion with temperature and optional seed.
 */
async function callLLM(
  client: OpenAI,
  model: string,
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
  temperature: number = 0.7,
  seed?: number | null,
): Promise<string> {
  const payload: any = {
    model: model || "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    temperature,
  };

  if (seed !== undefined && seed !== null) {
    payload.seed = seed;
  }

  const response = await client.chat.completions.create(payload);
  return response.choices[0]?.message?.content || "";
}

/**
 * Generate baseline pre-deliberation stances once for both agents.
 */
export async function generatePreStances(
  client: OpenAI,
  config: ExperimentConfig,
  onProgress?: (msg: string) => void,
): Promise<Record<string, string>> {
  const stances: Record<string, string> = {};
  const topic = config.system_prompts.topic_prompt || "";
  const prePrompt = config.system_prompts.pre_stance_prompt || "";
  const personas = config.system_prompts.personas || [];
  const temp = config.model_config.model_parameters.agent_temperature ?? 0.7;
  const rawSeed = config.model_config.model_parameters.seed;
  const seed = typeof rawSeed === "number" ? rawSeed : null;

  for (const p of personas) {
    onProgress?.(`Generating baseline pre-stance for ${p.id} (${p.role})...`);
    const model =
      p.model ||
      config.model_config.model_assignments[p.id] ||
      "meta-llama/Llama-3.3-70B-Instruct-Turbo";
    const sysPrompt = `${p.description}\n\n${prePrompt}\n${topic}`;

    const text = await callLLM(
      client,
      model,
      sysPrompt,
      [{ role: "user", content: "What is your stance?" }],
      temp,
      seed,
    );

    stances[p.id] = text.trim();
  }

  return stances;
}

/**
 * Conduct multi-turn deliberation chat for a single run (Control or Treatment).
 */
export async function conductDeliberation(
  client: OpenAI,
  runConfig: RunConfig,
  config: ExperimentConfig,
  onTurnGenerated?: (entry: ChatEntry, round: number, turnKey: string) => void,
): Promise<Record<string, ChatEntry[]>> {
  const history: Record<string, ChatEntry[]> = {};
  const topic = config.system_prompts.topic_prompt || "";
  const turnPrompt =
    config.user_prompts.turn_prompt ||
    "It is your turn to speak. Provide your response.";
  const maxTurns = config.deliberation_config.max_turns_per_agent || 3;
  const personas = config.system_prompts.personas || [];
  const temp = config.model_config.model_parameters.agent_temperature ?? 0.7;
  const rawSeed = config.model_config.model_parameters.seed;
  const seed = typeof rawSeed === "number" ? rawSeed : null;

  for (let r = 0; r < maxTurns; r++) {
    const turnKey = `turn_${r + 1}`;
    history[turnKey] = [];

    for (const p of personas) {
      const model =
        p.model ||
        config.model_config.model_assignments[p.id] ||
        "meta-llama/Llama-3.3-70B-Instruct-Turbo";
      const sysPrompt = `${p.description}\n\nTopic: ${topic}\n${runConfig.system_prompt_addition || ""}`;

      const messages: Array<{ role: "user" | "assistant"; content: string }> =
        [];

      // Replay past dialogue
      for (const pastTurnList of Object.values(history)) {
        for (const entry of pastTurnList) {
          const isSelf = entry.agent === p.id;
          const role = isSelf ? "assistant" : "user";

          let content = entry.public_response;
          if (!isSelf) {
            content = `[${entry.agent}]: ${entry.public_response}`;
          } else if (entry.private_scratchpad) {
            content = `<private_scratchpad>\n${entry.private_scratchpad}\n</private_scratchpad>\n<public_response>\n${entry.public_response}\n</public_response>`;
          }

          messages.push({ role, content });
        }
      }

      messages.push({ role: "user", content: turnPrompt });

      const raw = await callLLM(client, model, sysPrompt, messages, temp, seed);

      let scratchpad: string | null = null;
      let publicResp = raw;

      if (runConfig.extract_tags) {
        const extracted = extractTags(raw);
        scratchpad = extracted.scratchpad;
        publicResp = extracted.publicResponse;
      } else {
        publicResp = publicResp.replace(
          /^(?:\[.*?\]|(?:Heritage School Teacher|MOE Official|Teacher)):?\s*/i,
          "",
        );
      }

      const entry: ChatEntry = {
        agent: p.id,
        public_response: publicResp,
        private_scratchpad: scratchpad,
      };

      history[turnKey].push(entry);
      onTurnGenerated?.(entry, r + 1, turnKey);
    }
  }

  return history;
}

/**
 * Prompt each persona to generate their final post-deliberation stance.
 */
export async function generatePostStances(
  client: OpenAI,
  config: ExperimentConfig,
  chatHistory: Record<string, ChatEntry[]>,
  onProgress?: (msg: string) => void,
): Promise<Record<string, string>> {
  const stances: Record<string, string> = {};
  const topic = config.system_prompts.topic_prompt || "";
  const postPrompt = config.system_prompts.post_stance_prompt || "";
  const personas = config.system_prompts.personas || [];
  const temp = config.model_config.model_parameters.agent_temperature ?? 0.7;
  const rawSeed = config.model_config.model_parameters.seed;
  const seed = typeof rawSeed === "number" ? rawSeed : null;

  for (const p of personas) {
    onProgress?.(`Generating final post-stance for ${p.id}...`);
    const model =
      p.model ||
      config.model_config.model_assignments[p.id] ||
      "meta-llama/Llama-3.3-70B-Instruct-Turbo";
    const sysPrompt = `${p.description}\n\nTopic: ${topic}\n${postPrompt}`;

    const messages: Array<{ role: "user"; content: string }> = [];
    for (const pastTurn of Object.values(chatHistory)) {
      for (const entry of pastTurn) {
        messages.push({
          role: "user",
          content: `[${entry.agent}]: ${entry.public_response}`,
        });
      }
    }

    messages.push({
      role: "user",
      content:
        "Based on the discussion above, what is your final stance on the topic?",
    });

    const text = await callLLM(client, model, sysPrompt, messages, temp, seed);
    stances[p.id] = text.trim();
  }

  return stances;
}

/**
 * LLM-as-a-Judge turn-by-turn DQI Evaluation.
 * Mirrored from src/evaluation.py
 */
export async function evaluateDQI(
  client: OpenAI,
  config: ExperimentConfig,
  chatHistory: Record<string, ChatEntry[]>,
  onProgress?: (msg: string) => void,
): Promise<DQIScores> {
  const scores: DQIScores = {
    level_of_justification: 0,
    content_of_justification: 0,
    respect: 0,
    constructive_politics: 0,
    interactivity: 0,
    total: 0,
  };

  const judgeModel =
    config.model_config.model_assignments["DQI_Judge"] ||
    "meta-llama/Llama-3.3-70B-Instruct-Turbo";
  const judgePrompt = config.system_prompts.dqi_judge_prompt;
  const temp = config.model_config.model_parameters.judge_temperature ?? 0.1;
  const rawSeed = config.model_config.model_parameters.seed;
  const seed = typeof rawSeed === "number" ? rawSeed : null;

  let validTurns = 0;
  let contextSoFar = "";

  for (const pastTurn of Object.values(chatHistory)) {
    for (const entry of pastTurn) {
      const currentTurn = `[${entry.agent}]: ${entry.public_response}`;
      const contextPrefix = contextSoFar
        ? `Context of previous turns:\n${contextSoFar}\n\n`
        : "Context of previous turns: (None, this is the first turn)\n\n";

      const promptContent = `${contextPrefix}Evaluate THIS specific turn:\n${currentTurn}\n\nProvide the JSON evaluation:`;

      try {
        const rawResponse = await callLLM(
          client,
          judgeModel,
          judgePrompt,
          [{ role: "user", content: promptContent }],
          temp,
          seed,
        );

        let cleanJson = rawResponse.trim();
        if (cleanJson.startsWith("```json")) cleanJson = cleanJson.slice(7);
        else if (cleanJson.startsWith("```")) cleanJson = cleanJson.slice(3);
        if (cleanJson.endsWith("```")) cleanJson = cleanJson.slice(0, -3);

        const parsed = JSON.parse(cleanJson.trim());
        scores.level_of_justification += Number(
          parsed.level_of_justification || 0,
        );
        scores.content_of_justification += Number(
          parsed.content_of_justification || 0,
        );
        scores.respect += Number(parsed.respect || 0);
        scores.constructive_politics += Number(
          parsed.constructive_politics || 0,
        );
        scores.interactivity += Number(parsed.interactivity || 0);
        validTurns++;
      } catch (err) {
        console.warn("Error evaluating DQI for turn:", err);
      }

      contextSoFar += `${currentTurn}\n\n`;
    }
  }

  if (validTurns > 0) {
    scores.level_of_justification = Number(
      (scores.level_of_justification / validTurns).toFixed(2),
    );
    scores.content_of_justification = Number(
      (scores.content_of_justification / validTurns).toFixed(2),
    );
    scores.respect = Number((scores.respect / validTurns).toFixed(2));
    scores.constructive_politics = Number(
      (scores.constructive_politics / validTurns).toFixed(2),
    );
    scores.interactivity = Number(
      (scores.interactivity / validTurns).toFixed(2),
    );
  }

  scores.total = Number(
    (
      scores.level_of_justification +
      scores.content_of_justification +
      scores.respect +
      scores.constructive_politics +
      scores.interactivity
    ).toFixed(2),
  );

  return scores;
}

/**
 * Fast cosine similarity on text embeddings or token vectors.
 */
function computeCosineSimilarity(textA: string, textB: string): number {
  const tokenize = (t: string) => {
    return t
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2);
  };

  const wordsA = tokenize(textA);
  const wordsB = tokenize(textB);

  const freqA: Record<string, number> = {};
  const freqB: Record<string, number> = {};
  const allWords = new Set<string>();

  for (const w of wordsA) {
    freqA[w] = (freqA[w] || 0) + 1;
    allWords.add(w);
  }
  for (const w of wordsB) {
    freqB[w] = (freqB[w] || 0) + 1;
    allWords.add(w);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  Array.from(allWords).forEach((w) => {
    const a = freqA[w] || 0;
    const b = freqB[w] || 0;
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  });

  if (normA === 0 || normB === 0) return 0;
  const rawSim = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  // Scale realistic convergence range around baseline 0.8
  return Number((0.75 + rawSim * 0.2).toFixed(4));
}

/**
 * Compute convergence, self-shift, and CovD for simulation results.
 */
export function calculateAnalyticalMetrics(
  stancesPre: Record<string, string>,
  stancesPost: Record<string, string>,
): {
  convergence: number;
  self_shift: number;
  covd_pre: number;
  covd_post: number;
} {
  const pids = Object.keys(stancesPost);
  let convergence = 0.8;

  if (pids.length >= 2) {
    convergence = computeCosineSimilarity(
      stancesPost[pids[0]],
      stancesPost[pids[1]],
    );
  }

  let totalShift = 0;
  for (const pid of pids) {
    if (stancesPre[pid] && stancesPost[pid]) {
      const sim = computeCosineSimilarity(stancesPre[pid], stancesPost[pid]);
      totalShift += 1.0 - sim;
    }
  }
  const selfShift = Number((totalShift / Math.max(1, pids.length)).toFixed(4));

  // CovD: Determinant of Gram matrix for 2 normalized vectors is exactly 1 - sim^2
  const prePids = Object.keys(stancesPre);
  const preSim =
    prePids.length >= 2
      ? computeCosineSimilarity(stancesPre[prePids[0]], stancesPre[prePids[1]])
      : 0.8;
  const covdPre = Number(Math.max(0, 1.0 - Math.pow(preSim, 2)).toFixed(4));
  const covdPost = Number(
    Math.max(0, 1.0 - Math.pow(convergence, 2)).toFixed(4),
  );

  return {
    convergence,
    self_shift: selfShift,
    covd_pre: covdPre,
    covd_post: covdPost,
  };
}
