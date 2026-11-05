import React, { useState } from 'react';
import {
  ExperimentRun,
  ChatEntry,
  DQIScores
} from '@/types/experiment';
import {
  FileText,
  MessageSquare,
  Sparkles,
  Award,
  Layers,
  Copy,
  Download,
  Check,
  ChevronDown,
  ChevronRight,
  User,
  ArrowRight,
  Brain,
  Scale
} from 'lucide-react';

interface RunInspectorProps {
  run: ExperimentRun;
  onBackToDirectory: () => void;
}

export const RunInspector: React.FC<RunInspectorProps> = ({
  run,
  onBackToDirectory,
}) => {
  const [activeTab, setActiveTab] = useState<'dialogue' | 'stances' | 'metrics' | 'files'>('dialogue');
  const [deliberationView, setDeliberationView] = useState<'treatment' | 'control' | 'side-by-side'>('side-by-side');
  const [activeJsonFile, setActiveJsonFile] = useState<'config' | 'results_control' | 'results_treatment' | 'evals'>('results_treatment');
  const [copiedFile, setCopiedFile] = useState(false);

  const evals = run.evals;
  const convA = evals?.Control?.convergence ?? 0;
  const convB = evals?.Treatment?.convergence ?? 0;
  const convDelta = convB - convA;
  const isConvHigher = convDelta > 0;

  const shiftA = evals?.Control?.self_shift ?? 0;
  const shiftB = evals?.Treatment?.self_shift ?? 0;
  const shiftDelta = shiftB - shiftA;

  const covdPreA = evals?.Control?.covd_pre ?? 0;
  const covdPostA = evals?.Control?.covd_post ?? 0;
  const covdPreB = evals?.Treatment?.covd_pre ?? 0;
  const covdPostB = evals?.Treatment?.covd_post ?? 0;

  const dqiA = evals?.Control?.dqi;
  const dqiB = evals?.Treatment?.dqi;

  const chatA = run.results_control?.chat_history || {};
  const chatB = run.results_treatment?.chat_history || {};
  const turns = Array.from(new Set([...Object.keys(chatA), ...Object.keys(chatB)])).sort();

  const copyJsonToClipboard = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  const downloadJsonFile = (filename: string, data: any) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${run.id}_${filename}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFileContent = () => {
    switch (activeJsonFile) {
      case 'config':
        return run.config;
      case 'results_control':
        return run.results_control;
      case 'results_treatment':
        return run.results_treatment;
      case 'evals':
        return run.evals;
      default:
        return {};
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToDirectory}
              className="text-xs font-mono font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Runs Directory
            </button>
            <span className="text-neutral-300">/</span>
            <span className="rounded bg-neutral-100 px-2 py-0.5 font-mono text-xs font-bold text-neutral-900">
              {run.id}
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 mt-1">
            {run.name}
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            {run.description || 'School Closure Deliberation simulation experiment'}
          </p>
        </div>

        {/* Quick Hypothesis Verdict Badge */}
        <div className="flex items-center gap-3">
          <div
            className={`rounded-lg border px-3.5 py-2 text-right ${
              isConvHigher
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-neutral-200 bg-neutral-50 text-neutral-700'
            }`}
          >
            <div className="text-[10px] font-mono uppercase tracking-wider font-semibold opacity-75">
              Hypothesis Verdict
            </div>
            <div className="text-xs font-bold mt-0.5">
              {isConvHigher ? 'H₁ Supported (Consensus Increased)' : 'H₀ Retained (No Consensus Gain)'}
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Convergence */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-mono">
            <span>Convergence (Consensus)</span>
            <Scale className="h-3.5 w-3.5 text-neutral-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-neutral-900">
              {convB.toFixed(4)}
            </span>
            <span className="text-xs font-mono text-neutral-400">
              vs {convA.toFixed(4)} ctrl
            </span>
          </div>
          <div className="mt-1 text-[11px] font-mono">
            <span className={convDelta >= 0 ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
              {convDelta >= 0 ? '+' : ''}
              {(convDelta * 100).toFixed(2)}%
            </span>{' '}
            <span className="text-neutral-400">Treatment Δ</span>
          </div>
        </div>

        {/* Self-Shift */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-mono">
            <span>Self-Shift (Mind Change)</span>
            <Brain className="h-3.5 w-3.5 text-neutral-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-neutral-900">
              {shiftB.toFixed(4)}
            </span>
            <span className="text-xs font-mono text-neutral-400">
              vs {shiftA.toFixed(4)} ctrl
            </span>
          </div>
          <div className="mt-1 text-[11px] font-mono">
            <span className={shiftDelta >= 0 ? 'text-emerald-600 font-semibold' : 'text-neutral-600'}>
              {shiftDelta >= 0 ? '+' : ''}
              {(shiftDelta * 100).toFixed(2)}%
            </span>{' '}
            <span className="text-neutral-400">Treatment Δ</span>
          </div>
        </div>

        {/* CovD Plurality */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-mono">
            <span>Plurality (CovD Post)</span>
            <Layers className="h-3.5 w-3.5 text-neutral-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-neutral-900">
              {covdPostB.toFixed(4)}
            </span>
            <span className="text-xs font-mono text-neutral-400">
              (Pre: {covdPreB.toFixed(4)})
            </span>
          </div>
          <div className="mt-1 text-[11px] font-mono text-neutral-500">
            Gram Matrix det
          </div>
        </div>

        {/* DQI Total */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-mono">
            <span>DQI Judge Total</span>
            <Award className="h-3.5 w-3.5 text-neutral-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-neutral-900">
              {dqiB?.total ? dqiB.total.toFixed(2) : '-'}
            </span>
            <span className="text-xs font-mono text-neutral-400">
              / 15 (Ctrl: {dqiA?.total ? dqiA.total.toFixed(2) : '-'})
            </span>
          </div>
          <div className="mt-1 text-[11px] font-mono text-neutral-500">
            5 calibrated rubric dimensions
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center justify-between border-b border-neutral-200">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab('dialogue')}
            className={`flex items-center gap-2 pb-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'dialogue'
                ? 'border-neutral-900 text-neutral-900 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Deliberation Dialogue & Scratchpads</span>
          </button>

          <button
            onClick={() => setActiveTab('stances')}
            className={`flex items-center gap-2 pb-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'stances'
                ? 'border-neutral-900 text-neutral-900 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Pre vs Post Stance Evolution</span>
          </button>

          <button
            onClick={() => setActiveTab('metrics')}
            className={`flex items-center gap-2 pb-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'metrics'
                ? 'border-neutral-900 text-neutral-900 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Award className="h-4 w-4" />
            <span>DQI Rubric Breakdown</span>
          </button>

          <button
            onClick={() => setActiveTab('files')}
            className={`flex items-center gap-2 pb-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'files'
                ? 'border-neutral-900 text-neutral-900 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Directory Files (Raw JSON)</span>
          </button>
        </div>

        {activeTab === 'dialogue' && (
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg text-xs font-medium mb-2">
            <button
              onClick={() => setDeliberationView('side-by-side')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                deliberationView === 'side-by-side' ? 'bg-white shadow-2xs font-semibold' : 'text-neutral-600'
              }`}
            >
              Side-by-Side
            </button>
            <button
              onClick={() => setDeliberationView('treatment')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                deliberationView === 'treatment' ? 'bg-white shadow-2xs font-semibold' : 'text-neutral-600'
              }`}
            >
              Treatment (System 2)
            </button>
            <button
              onClick={() => setDeliberationView('control')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                deliberationView === 'control' ? 'bg-white shadow-2xs font-semibold' : 'text-neutral-600'
              }`}
            >
              Control (System 1)
            </button>
          </div>
        )}
      </div>

      {/* Tab 1: Dialogue & Scratchpads */}
      {activeTab === 'dialogue' && (
        <div className="space-y-6">
          {turns.map((turnKey, turnIdx) => {
            const listA = chatA[turnKey] || [];
            const listB = chatB[turnKey] || [];

            return (
              <div key={turnKey} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-neutral-900 px-2 py-0.5 font-mono text-[11px] font-bold text-white uppercase tracking-wider">
                    Round {turnIdx + 1}
                  </span>
                  <div className="h-px flex-1 bg-neutral-200" />
                </div>

                <div
                  className={`grid gap-4 ${
                    deliberationView === 'side-by-side'
                      ? 'grid-cols-1 lg:grid-cols-2'
                      : 'grid-cols-1'
                  }`}
                >
                  {/* Control Column */}
                  {(deliberationView === 'side-by-side' || deliberationView === 'control') && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-mono font-semibold text-neutral-500 uppercase tracking-wider">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        <span>Control (System 1: Direct Dialogue)</span>
                      </div>
                      {listA.map((entry, idx) => (
                        <div
                          key={`ctrl-${idx}`}
                          className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-neutral-900">
                              {entry.agent}
                            </span>
                            <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-mono text-neutral-500">
                              Direct Turn
                            </span>
                          </div>
                          <p className="text-xs text-neutral-700 leading-relaxed whitespace-pre-wrap">
                            {entry.public_response}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Treatment Column */}
                  {(deliberationView === 'side-by-side' || deliberationView === 'treatment') && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-mono font-semibold text-neutral-500 uppercase tracking-wider">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        <span>Treatment (System 2: Reflection Scratchpad)</span>
                      </div>
                      {listB.map((entry, idx) => (
                        <div
                          key={`trt-${idx}`}
                          className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-neutral-900">
                              {entry.agent}
                            </span>
                            <span className="rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-mono text-amber-800 font-medium">
                              Internal Reflection Active
                            </span>
                          </div>

                          {/* Private Scratchpad Box */}
                          {entry.private_scratchpad && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-950 space-y-1">
                              <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-800">
                                <Brain className="h-3 w-3" />
                                <span>&lt;private_scratchpad&gt; Internal Monologue</span>
                              </div>
                              <p className="text-xs italic leading-relaxed text-amber-900">
                                "{entry.private_scratchpad}"
                              </p>
                            </div>
                          )}

                          {/* Public Response */}
                          <div>
                            <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                              &lt;public_response&gt;
                            </div>
                            <p className="text-xs text-neutral-700 leading-relaxed whitespace-pre-wrap">
                              {entry.public_response}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Stances Evolution */}
      {activeTab === 'stances' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-neutral-900">
              Agent Stance Trajectories
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Comparison between the initial baseline stance (identical before deliberation) and final post-deliberation stance.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {['MOE Official', 'Teacher'].map((agentId) => {
                const pre = run.results_control?.stances_pre[agentId] || '';
                const postA = run.results_control?.stances_post[agentId] || '';
                const postB = run.results_treatment?.stances_post[agentId] || '';

                return (
                  <div key={agentId} className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-white font-mono text-xs font-bold">
                        {agentId[0]}
                      </div>
                      <h4 className="font-semibold text-xs text-neutral-900">{agentId}</h4>
                    </div>

                    {/* Pre Stance */}
                    <div className="rounded-lg border border-neutral-200 bg-white p-3 space-y-1">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Pre-Deliberation Stance (Baseline)
                      </span>
                      <p className="text-xs text-neutral-700 leading-relaxed">
                        {pre}
                      </p>
                    </div>

                    {/* Post Stance Control */}
                    <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-3 space-y-1">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-blue-700">
                        Control Post-Stance (System 1)
                      </span>
                      <p className="text-xs text-neutral-700 leading-relaxed">
                        {postA}
                      </p>
                    </div>

                    {/* Post Stance Treatment */}
                    <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3 space-y-1">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-800">
                        Treatment Post-Stance (System 2 with Reflection)
                      </span>
                      <p className="text-xs text-neutral-700 leading-relaxed">
                        {postB}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: DQI Rubric Breakdown */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-neutral-900">
              Discourse Quality Index (DQI) Calibrated Rubric
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Turn-by-turn evaluation by LLM Judge (1 to 3 scale per dimension) with strict few-shot examples penalizing parallel monologues.
            </p>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-neutral-200 bg-neutral-50 font-mono text-[11px] uppercase tracking-wider text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">DQI Rubric Dimension</th>
                    <th className="px-4 py-3 font-medium">Control (System 1)</th>
                    <th className="px-4 py-3 font-medium">Treatment (System 2)</th>
                    <th className="px-4 py-3 font-medium">Delta</th>
                    <th className="px-4 py-3 font-medium">Operational Criteria</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {[
                    {
                      key: 'level_of_justification',
                      label: 'Level of Justification',
                      desc: 'Assesses whether claims are supported by elaborate, multi-layered reasoning.',
                    },
                    {
                      key: 'content_of_justification',
                      label: 'Content of Justification',
                      desc: 'Evaluates whether justifications extend to broad collective goods vs narrow self-interest.',
                    },
                    {
                      key: 'respect',
                      label: 'Respect',
                      desc: 'Measures civility, explicit concessions, and recognition of opponent arguments.',
                    },
                    {
                      key: 'constructive_politics',
                      label: 'Constructive Politics',
                      desc: 'Captures whether discussion generates concrete proposals, working groups, and compromise.',
                    },
                    {
                      key: 'interactivity',
                      label: 'Interactivity',
                      desc: 'Direct rebuttal and objection-reply loops vs parallel monologues.',
                    },
                  ].map((row) => {
                    const valA = (dqiA as any)?.[row.key] ?? 0;
                    const valB = (dqiB as any)?.[row.key] ?? 0;
                    const delta = valB - valA;

                    return (
                      <tr key={row.key} className="hover:bg-neutral-50/50">
                        <td className="px-4 py-3.5 font-medium text-neutral-900">
                          {row.label}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-neutral-700">
                          {valA.toFixed(2)} / 3.0
                        </td>
                        <td className="px-4 py-3.5 font-mono font-semibold text-neutral-900">
                          {valB.toFixed(2)} / 3.0
                        </td>
                        <td className="px-4 py-3.5 font-mono">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                              delta > 0
                                ? 'bg-emerald-50 text-emerald-700'
                                : delta < 0
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-neutral-100 text-neutral-500'
                            }`}
                          >
                            {delta > 0 ? '+' : ''}
                            {delta.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-neutral-500 text-[11px]">
                          {row.desc}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-neutral-50/80 font-bold">
                    <td className="px-4 py-3 text-neutral-900">Total Score (Sum)</td>
                    <td className="px-4 py-3 font-mono text-neutral-700">
                      {dqiA?.total ? dqiA.total.toFixed(2) : '-'} / 15.0
                    </td>
                    <td className="px-4 py-3 font-mono text-neutral-900">
                      {dqiB?.total ? dqiB.total.toFixed(2) : '-'} / 15.0
                    </td>
                    <td className="px-4 py-3 font-mono" colSpan={2}>
                      {dqiA?.total && dqiB?.total ? (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            dqiB.total >= dqiA.total
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-neutral-200 text-neutral-700'
                          }`}
                        >
                          {dqiB.total >= dqiA.total ? '+' : ''}
                          {(dqiB.total - dqiA.total).toFixed(2)} pts
                        </span>
                      ) : null}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Directory Files (Raw JSON) */}
      {activeTab === 'files' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white p-1 text-xs">
              {(
                [
                  { id: 'results_treatment', label: 'results_treatment.json' },
                  { id: 'results_control', label: 'results_control.json' },
                  { id: 'evals', label: 'evals.json' },
                  { id: 'config', label: 'config.json' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveJsonFile(f.id)}
                  className={`rounded-md px-3 py-1.5 font-mono text-xs transition-colors ${
                    activeJsonFile === f.id
                      ? 'bg-neutral-900 text-white font-semibold'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => copyJsonToClipboard(getFileContent())}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 shadow-2xs"
              >
                {copiedFile ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedFile ? 'Copied' : 'Copy JSON'}</span>
              </button>

              <button
                onClick={() => downloadJsonFile(`${activeJsonFile}.json`, getFileContent())}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 shadow-2xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-neutral-900 p-4 shadow-xs overflow-hidden">
            <pre className="font-mono text-xs text-neutral-200 overflow-x-auto max-h-[500px] leading-relaxed">
              {JSON.stringify(getFileContent(), null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

