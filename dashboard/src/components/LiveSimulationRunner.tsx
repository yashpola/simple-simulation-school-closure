import React, { useState, useEffect, useRef } from 'react';
import { ExperimentConfig, ExperimentRun } from '@/types/experiment';
import { DiagnosticError, categorizeSimulationError } from '@/lib/simulation';
import { ApiSettings } from './ApiSettingsModal';
import {
  X,
  Play,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Brain,
  MessageSquare,
  Sparkles,
  ArrowRight,
  HelpCircle,
  RotateCcw,
  Key,
  Copy,
  Check,
} from 'lucide-react';

interface LiveSimulationRunnerProps {
  config: ExperimentConfig;
  targetExpId: string;
  isOpen: boolean;
  onClose: () => void;
  onRunFinished: (newRun: ExperimentRun) => void;
  apiSettings: ApiSettings;
  onOpenApiSettings?: () => void;
}

export const LiveSimulationRunner: React.FC<LiveSimulationRunnerProps> = ({
  config,
  targetExpId,
  isOpen,
  onClose,
  onRunFinished,
  apiSettings,
  onOpenApiSettings,
}) => {
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [stage, setStage] = useState<string>('Initializing...');
  const [percent, setPercent] = useState<number>(0);
  const [logs, setLogs] = useState<Array<{ stage: string; text: string; time: string }>>([]);
  const [liveTurns, setLiveTurns] = useState<Array<{ run: string; round: number; entry: any }>>([]);
  const [completedRun, setCompletedRun] = useState<ExperimentRun | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<DiagnosticError | null>(null);
  const [copiedDiagnostic, setCopiedDiagnostic] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  const logsEndRef = useRef<HTMLDivElement>(null);

  const copyErrorDiagnostics = (details: DiagnosticError) => {
    navigator.clipboard.writeText(JSON.stringify(details, null, 2));
    setCopiedDiagnostic(true);
    setTimeout(() => setCopiedDiagnostic(false), 2000);
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, liveTurns]);

  // Handle escape key to trigger confirmation or cancel confirmation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showExitConfirm) {
          setShowExitConfirm(false);
        } else if (isOpen) {
          setShowExitConfirm(true);
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, showExitConfirm]);

  const handleRequestClose = () => {
    setShowExitConfirm(true);
  };

  const startSimulation = async () => {
    setStatus('running');
    setLogs([]);
    setLiveTurns([]);
    setCompletedRun(null);
    setErrorMessage(null);
    setErrorDetails(null);
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
        const details =
          typeof errJson.error === 'object' && errJson.error !== null
            ? (errJson.error as DiagnosticError)
            : categorizeSimulationError(
                errJson.error || 'Failed to start experiment.',
                'Pre-flight Validation',
              );
        setErrorDetails(details);
        setErrorMessage(details.reason || details.raw);
        setStatus('error');
        return;
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
                else if (data.stage === 'evaluation') {
                  setPercent((prev) => Math.min(97, Math.max(92, prev + 2)));
                } else if (data.stage === 'saving') {
                  setPercent(99);
                }
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
                const details =
                  typeof data.error === 'object' && data.error !== null
                    ? (data.error as DiagnosticError)
                    : categorizeSimulationError(
                        data.error || 'Simulation encountered an error.',
                        stage,
                      );
                setErrorDetails(details);
                setErrorMessage(details.reason || details.raw);
              }
            } catch (err) {
              // ignore parse errors for partial chunks
            }
          }
        }
      }
    } catch (err: any) {
      setStatus('error');
      const details = categorizeSimulationError(
        err?.message || 'Network error running simulation.',
        stage,
      );
      setErrorDetails(details);
      setErrorMessage(details.reason || details.raw);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-xs p-4">
      <div className="relative flex flex-col h-[85vh] w-full max-w-4xl rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
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
            onClick={handleRequestClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            title="Close simulation runner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress Bar Header with High-Visibility Completion % Display */}
        <div className="border-b border-neutral-200 bg-white px-6 py-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {status === 'running' && (
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 border border-neutral-200/80 shadow-2xs">
                  <Loader2 className="h-4.5 w-4.5 animate-spin text-neutral-900" />
                </div>
              )}
              {status === 'completed' && (
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                </div>
              )}
              {status === 'error' && (
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-700 border border-red-200 shadow-2xs">
                  <AlertTriangle className="h-4.5 w-4.5 text-red-600" />
                </div>
              )}
              {status === 'idle' && (
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 border border-neutral-200/80 shadow-2xs">
                  <Play className="h-4 w-4 fill-current ml-0.5" />
                </div>
              )}
              <div>
                <span className="text-sm font-bold text-neutral-950 block leading-tight">
                  {stage}
                </span>
                <span className="text-[11px] text-neutral-500 font-mono">
                  {status === 'running'
                    ? 'Deliberation trial actively streaming turns...'
                    : status === 'completed'
                    ? 'Simulation complete · Evaluated & persisted'
                    : status === 'error'
                    ? 'Simulation halted on error'
                    : 'Awaiting execution trigger'}
                </span>
              </div>
            </div>

            {/* High-Visibility Completion % Display Badge */}
            <div className="flex items-center gap-2.5 rounded-xl border border-neutral-200/90 bg-neutral-50/90 px-4 py-2 shadow-2xs">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500">
                Completion:
              </span>
              <span
                className={`font-mono text-2xl sm:text-3xl font-black tracking-tight leading-none ${
                  status === 'completed'
                    ? 'text-emerald-600'
                    : status === 'error'
                    ? 'text-red-600'
                    : 'text-neutral-950'
                }`}
              >
                {percent}%
              </span>
            </div>
          </div>

          <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-100 border border-neutral-200/60">
            <div
              className={`h-full transition-all duration-500 ${
                status === 'error'
                  ? 'bg-red-500'
                  : status === 'completed'
                  ? 'bg-emerald-500'
                  : 'bg-neutral-950'
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
            <div className="rounded-2xl border border-red-200 bg-red-50/70 p-5 shadow-xs space-y-4 animate-in fade-in zoom-in-98 duration-150">
              {/* Error Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 border border-red-200 text-red-700 shrink-0 shadow-2xs">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-red-200/80 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-red-900">
                        Execution Halted
                      </span>
                      {errorDetails?.timestamp && (
                        <span className="font-mono text-xs text-red-700">
                          at {errorDetails.timestamp}
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-red-950">
                      {errorDetails?.title || 'Simulation Encountered an Error'}
                    </h4>
                  </div>
                </div>

                <span className="rounded-lg border border-red-200 bg-white px-2.5 py-1 font-mono text-[11px] font-semibold text-red-800 shrink-0 self-start">
                  Stage: {errorDetails?.stage || stage}
                </span>
              </div>

              {/* What Happened (Explanation) */}
              <div className="rounded-xl bg-white border border-red-200/90 p-4 shadow-2xs space-y-1.5">
                <div className="text-[11px] font-bold font-mono uppercase tracking-wider text-red-800 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                  <span>What Happened</span>
                </div>
                <p className="text-xs text-neutral-800 leading-relaxed font-sans font-medium">
                  {errorDetails?.reason || errorMessage || 'An unexpected error halted the deliberation process.'}
                </p>
              </div>

              {/* Suggested Solution / Recommended Action */}
              <div className="rounded-xl bg-amber-50/90 border border-amber-200 p-4 shadow-2xs space-y-1.5">
                <div className="text-[11px] font-bold font-mono uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-700" />
                  <span>Recommended Action</span>
                </div>
                <p className="text-xs text-amber-950 leading-relaxed font-sans">
                  {errorDetails?.solution || 'Review the technical diagnostics below, verify your parameters in Experiment Setup, and retry.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={startSimulation}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Retry Simulation</span>
                </button>

                {onOpenApiSettings && (errorDetails?.category === 'auth' || errorDetails?.category === 'rate_limit' || errorDetails?.category === 'network') && (
                  <button
                    type="button"
                    onClick={onOpenApiSettings}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-800 shadow-2xs hover:bg-neutral-50 transition-colors"
                  >
                    <Key className="h-3.5 w-3.5 text-neutral-600" />
                    <span>Update API Key / Settings</span>
                  </button>
                )}

                {errorDetails && (
                  <button
                    type="button"
                    onClick={() => copyErrorDiagnostics(errorDetails)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 shadow-2xs hover:bg-neutral-50 transition-colors sm:ml-auto"
                  >
                    {copiedDiagnostic ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-neutral-500" />}
                    <span>{copiedDiagnostic ? 'Copied' : 'Copy Diagnostics'}</span>
                  </button>
                )}
              </div>

              {/* Collapsible Technical Details */}
              <details className="rounded-xl border border-red-200 bg-white p-3 text-xs group">
                <summary className="font-mono text-[11px] font-semibold text-neutral-600 cursor-pointer select-none hover:text-neutral-900 flex items-center justify-between">
                  <span>Technical Diagnostics & Stack</span>
                  <span className="text-[10px] text-neutral-400 group-open:hidden">Click to expand</span>
                </summary>
                <div className="mt-2.5 pt-2 border-t border-neutral-100 font-mono text-[11px] text-neutral-700 space-y-1 overflow-x-auto">
                  <div><strong>Error String:</strong> {errorDetails?.raw || errorMessage}</div>
                  {errorDetails?.status && <div><strong>Status Code:</strong> {errorDetails.status}</div>}
                  <div><strong>Target Run:</strong> {targetExpId}</div>
                  <div><strong>Model Assignment:</strong> {config.model_config.model_assignments['MOE Official'] || 'Llama-3.3-70B'}</div>
                </div>
              </details>
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
              onClick={handleRequestClose}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 shadow-2xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Exit Confirmation Dialog Overlay */}
        {showExitConfirm && (
          <div
            className="absolute inset-0 z-50 flex items-center justify-center bg-neutral-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
            onClick={() => setShowExitConfirm(false)}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 ${
                    status === 'running'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-neutral-100 text-neutral-800 border border-neutral-200'
                  }`}
                >
                  {status === 'running' ? (
                    <AlertTriangle className="h-5 w-5 text-amber-700" />
                  ) : (
                    <HelpCircle className="h-5 w-5 text-neutral-700" />
                  )}
                </div>
                <div>
                  <h4 className="text-base font-bold text-neutral-900">
                    Exit Simulation Runner?
                  </h4>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {status === 'running'
                      ? 'An active experiment trial is in progress.'
                      : 'Please confirm before closing this window.'}
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-neutral-50 p-3.5 border border-neutral-100 text-xs text-neutral-600 leading-relaxed">
                {status === 'running' ? (
                  <>
                    Deliberation trial <strong>{targetExpId}</strong> is currently executing (
                    <strong className="text-neutral-950 font-mono">{percent}%</strong> complete).
                    Closing now will disconnect your view from the live event stream.
                  </>
                ) : (
                  <>
                    Are you sure you want to exit the live simulation runner and return to the experiment dashboard?
                  </>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowExitConfirm(false)}
                  className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 shadow-2xs transition-colors"
                >
                  Cancel / Stay
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExitConfirm(false);
                    onClose();
                  }}
                  className={`rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors ${
                    status === 'running'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-neutral-900 hover:bg-neutral-800'
                  }`}
                >
                  Yes, Exit Runner
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

