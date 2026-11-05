import React, { useState } from 'react';
import {
  Folder,
  Play,
  ArrowRight,
  TrendingUp,
  Award,
  Calendar,
  Layers,
  FileJson,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ExperimentRun } from '@/types/experiment';

interface RunsDirectoryProps {
  runs: ExperimentRun[];
  selectedRunId: string | null;
  onSelectRun: (id: string) => void;
  onNewRun: () => void;
  onDeleteRun: (id: string) => void;
}

export const RunsDirectory: React.FC<RunsDirectoryProps> = ({
  runs,
  selectedRunId,
  onSelectRun,
  onNewRun,
  onDeleteRun,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRuns = runs.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      r.id.toLowerCase().includes(term) ||
      r.name.toLowerCase().includes(term) ||
      (r.description && r.description.toLowerCase().includes(term))
    );
  });

  const exportAllRunFiles = (run: ExperimentRun) => {
    const files = {
      'config.json': run.config,
      'results_control.json': run.results_control,
      'results_treatment.json': run.results_treatment,
      'evals.json': run.evals,
    };

    // Download each json file
    Object.entries(files).forEach(([filename, data]) => {
      if (!data) return;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${run.id}_${filename}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-neutral-500">
              Interactive Experiment Matrix
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 mt-1">
            Simulation Runs Directory
          </h2>
          <p className="text-xs text-neutral-500 mt-1 max-w-2xl">
            Each entry is an autonomous digital twin of a directory run (<code>expXXX</code>) comparing System 1 (Direct Dialogue) against System 2 (Internal Reflection Scratchpad).
          </p>
        </div>

        <button
          onClick={onNewRun}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-neutral-800 transition-colors"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>Configure & Run New</span>
        </button>
      </div>

      {/* Directory Filter / Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search runs by expXXX, name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none"
          />
        </div>
        <div className="text-xs font-mono text-neutral-500">
          Showing {filteredRuns.length} of {runs.length} experiment runs
        </div>
      </div>

      {/* Runs List Table / Grid */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-200 bg-neutral-50/70 font-mono text-[11px] uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-5 py-3 font-medium">Directory Run</th>
                <th className="px-5 py-3 font-medium">Consensus (Convergence)</th>
                <th className="px-5 py-3 font-medium">Self-Shift (Mind Change)</th>
                <th className="px-5 py-3 font-medium">DQI Score (Total / 15)</th>
                <th className="px-5 py-3 font-medium">Hypothesis Verdict</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-sans">
              {filteredRuns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-neutral-400 text-xs">
                    No experiment runs found. Click "Configure & Run New" to launch your first deliberation experiment.
                  </td>
                </tr>
              ) : (
                filteredRuns.map((run) => {
                  const evals = run.evals;
                  const convA = evals?.Control?.convergence ?? 0;
                  const convB = evals?.Treatment?.convergence ?? 0;
                  const convDelta = convB - convA;
                  const isConvHigher = convDelta > 0;

                  const shiftA = evals?.Control?.self_shift ?? 0;
                  const shiftB = evals?.Treatment?.self_shift ?? 0;

                  const dqiA = evals?.Control?.dqi?.total ?? 0;
                  const dqiB = evals?.Treatment?.dqi?.total ?? 0;

                  const isSelected = run.id === selectedRunId;

                  return (
                    <tr
                      key={run.id}
                      className={`transition-colors hover:bg-neutral-50/80 ${
                        isSelected ? 'bg-neutral-50 font-medium' : ''
                      }`}
                    >
                      {/* Run ID & Name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 text-neutral-700">
                            <Folder className="h-4 w-4 text-amber-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-semibold text-neutral-900">
                                {run.id}
                              </span>
                              {run.id === 'exp000' && (
                                <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-mono text-neutral-600">
                                  Sample Baseline
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-neutral-500 line-clamp-1">
                              {run.name}
                            </p>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              {new Date(run.created_at).toLocaleDateString()} at{' '}
                              {new Date(run.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Convergence Comparison */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 font-mono text-xs">
                            <span className="text-neutral-500">Ctrl: {convA.toFixed(4)}</span>
                            <span className="text-neutral-300">→</span>
                            <span className="font-semibold text-neutral-900">
                              Trt: {convB.toFixed(4)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span
                              className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                                isConvHigher
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {isConvHigher ? '+' : ''}
                              {(convDelta * 100).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Self Shift Comparison */}
                      <td className="px-5 py-4 font-mono">
                        <div className="text-neutral-600">
                          <div>Ctrl: {shiftA.toFixed(4)}</div>
                          <div className="font-semibold text-neutral-900">Trt: {shiftB.toFixed(4)}</div>
                        </div>
                      </td>

                      {/* DQI Score */}
                      <td className="px-5 py-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Award className="h-3.5 w-3.5 text-neutral-400" />
                          <span className="font-semibold text-neutral-900">
                            {dqiB ? dqiB.toFixed(2) : '-'}
                          </span>
                          <span className="text-neutral-400 text-[10px]">
                            (Ctrl: {dqiA ? dqiA.toFixed(2) : '-'})
                          </span>
                        </div>
                      </td>

                      {/* Hypothesis Verdict */}
                      <td className="px-5 py-4">
                        {isConvHigher ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>H₁ Supported (Consensus ↑)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-600 border border-neutral-200">
                            <AlertCircle className="h-3 w-3 text-neutral-400" />
                            <span>H₀ Retained</span>
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectRun(run.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 shadow-2xs"
                            title="Inspect in detail"
                          >
                            <Layers className="h-3.5 w-3.5" />
                            <span>Inspect</span>
                          </button>

                          <button
                            onClick={() => exportAllRunFiles(run)}
                            className="inline-flex items-center rounded-md border border-neutral-200 bg-white p-1.5 text-neutral-600 hover:bg-neutral-50 shadow-2xs"
                            title="Download JSON directory files (config.json, results, evals)"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>

                          {run.id !== 'exp000' && (
                            <button
                              onClick={() => {
                                if (confirm(`Delete run ${run.id}?`)) onDeleteRun(run.id);
                              }}
                              className="inline-flex items-center rounded-md border border-transparent p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50"
                              title="Delete run"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

