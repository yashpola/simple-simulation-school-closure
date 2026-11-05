import React, { useState, useEffect, useRef } from 'react';
import { ExperimentConfig, ExperimentRun } from '@/types/experiment';
import { ApiSettings } from './ApiSettingsModal';
import {
  X,
  Play,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Brain,
  MessageSquare,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface LiveSimulationRunnerProps {
  config: ExperimentConfig;
  targetExpId: string;
  isOpen: boolean;
  onClose: () => void;
  onRunFinished: (newRun: ExperimentRun) => void;
  apiSettings: ApiSettings;
}

export const LiveSimulationRunner: React.FC<LiveSimulationRunnerProps> = ({
  config,
  targetExpId,
  isOpen,
  onClose,
  onRunFinished,
  apiSettings,
}) => {
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [stage, setStage] = useState<string>('Initializing...');
  const [percent, setPercent] = useState<number>(0);
  const [logs, setLogs] = useState<Array<{ stage: string; text: string; time: string }>>([]);
  const [liveTurns, setLiveTurns] = useState<Array<{ run: string; round: number; entry: any }>>([]);
  const [completedRun, setCompletedRun] = useState<ExperimentRun | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, liveTurns]);

  const startSimulation = async () => {
    setStatus('running');
    setLogs([]);
    setLiveTurns([]);
    setCompletedRun(null);
    setErrorMessage(null);
    setPercent(5);
    setStage('Connecting to deliberation runner...');

    try {
      const response = await fetch('/api/run-experiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          runId: targetExpId,
          name: `School Closure Deliberation (${targetExpId})`,
          apiKey: apiSettings.apiKey,
          baseUrl: apiSettings.baseUrl,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Failed to start experiment.');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response stream unavailable.');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const raw = line.slice(6);
            try {
              const data = JSON.parse(raw);

              if (data.stage) {
                setStage(data.message || data.stage);
                setLogs((prev) => [
                  ...prev,
                  {
                    stage: data.stage,
                    text: data.message || '',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                  },
                ]);

                // Map stage to rough percent
                if (data.stage === 'pre_stances') setPercent(20);
                else if (data.stage === 'control_run') setPercent(45);
                else if (data.stage === 'treatment_run') setPercent(70);
                else if (data.stage === 'post_stances') setPercent(85);
                else if (data.stage === 'evaluation') setPercent(95);
              }

              if (data.turn) {
                setLiveTurns((prev) => [...prev, data.turn]);
              }

              if (data.status === 'completed' && data.run) {
                setStatus('completed');
                setPercent(100);
                setCompletedRun(data.run);
                onRunFinished(data.run);
              }

              if (data.status === 'error') {
                setStatus('error');
                setErrorMessage(data.error || 'Simulation encountered an error.');
              }
            } catch (err) {
              // ignore parse errors for partial chunks
            }
          }
        }
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err?.message || 'Network error running simulation.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-xs p-4">
      <div className="flex flex-col h-[85vh] w-full max-w-4xl rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 bg-neutral-50/70">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white font-mono text-xs font-bold">
              {targetExpId}
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                School Closure Deliberation Live Runner
              </h3>
              <p className="text-[11px] text-neutral-500 font-mono">
                Standard Deliberation vs Reflective Deliberation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress Bar Header */}
        <div className="border-b border-neutral-200 bg-white px-6 py-3">
          <div className="flex items-center justify-between text-xs font-mono mb-1.5">
            <div className="flex items-center gap-2">
              {status === 'running' && <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-900" />}
              {status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
              {status === 'error' && <AlertTriangle className="h-3.5 w-3.5 text-red-600" />}
              <span className="font-semibold text-neutral-800">{stage}</span>
            </div>
            <span className="text-neutral-500">{percent}%</span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className={`h-full transition-all duration-300 ${
                status === 'error' ? 'bg-red-500' : status === 'completed' ? 'bg-emerald-500' : 'bg-neutral-900'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Live Deliberation Stream & Output Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans bg-neutral-50/30">
          {status === 'idle' && (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-800 border border-neutral-200 shadow-2xs">
                <Play className="h-6 w-6 ml-0.5 fill-current" />
              </div>
              <div className="max-w-md">
                <h4 className="text-sm font-semibold text-neutral-900">
                  Ready to launch target run: {targetExpId}
                </h4>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                  This will generate pre-stances, run {config.deliberation_config.max_turns_per_agent} rounds for both Standard and Reflective Deliberation conditions, score discourse quality with the DQI Judge, and persist the artifacts to Supabase.
                </p>
              </div>
              <button
                onClick={startSimulation}
                className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-neutral-800 transition-colors"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Start Live Experiment</span>
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="h-4 w-4" />
                <span>Simulation Failed</span>
              </div>
              <p>{errorMessage}</p>
              <button
                onClick={startSimulation}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 font-semibold text-red-800 shadow-2xs hover:bg-red-50"
              >
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Live turns feed */}
          {liveTurns.map((item, idx) => (
            <div
              key={idx}
              className={`rounded-xl border p-4 text-xs space-y-2 transition-all ${
                item.run === 'Treatment'
                  ? 'border-amber-200 bg-amber-50/30'
                  : 'border-neutral-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${
                      item.run === 'Treatment'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {item.run === 'Treatment' ? 'Reflective' : 'Standard'} · Round {item.round}
                  </span>
                  <span className="font-semibold text-neutral-900">
                    {item.entry.agent}
                  </span>
                </div>
              </div>

              {/* Private Scratchpad preview if present */}
              {item.entry.private_scratchpad && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-950 space-y-1">
                  <div className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-800">
                    <Brain className="h-3 w-3" />
                    <span>&lt;private_scratchpad&gt; Reflection</span>
                  </div>
                  <p className="italic leading-relaxed text-amber-900">
                    "{item.entry.private_scratchpad}"
                  </p>
                </div>
              )}

              {/* Public response */}
              <p className="text-neutral-700 leading-relaxed whitespace-pre-wrap">
                {item.entry.public_response}
              </p>
            </div>
          ))}

          <div ref={logsEndRef} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-6 py-3.5">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
            <span>Directory Target: <strong>{targetExpId}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            {status === 'running' && (
              <span className="text-xs text-neutral-500 font-mono animate-pulse">
                Deliberating in progress...
              </span>
            )}
            {status === 'completed' && completedRun && (
              <button
                onClick={() => {
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-neutral-800 transition-colors"
              >
                <span>View in Inspector</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 shadow-2xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

