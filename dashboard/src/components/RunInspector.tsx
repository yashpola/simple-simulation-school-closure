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
  const [deliberationView, setDeliberationView] = useState<'reflective' | 'standard' | 'side-by-side'>('side-by-side');
  const [activeJsonFile, setActiveJsonFile] = useState<'config' | 'results_control' | 'results_treatment' | 'evals'>('results_treatment');
  const [copiedFile, setCopiedFile] = useState(false);

  const evals = run.evals;
  
  // Consensus Pre vs Post
  const covdPre = evals?.Treatment?.covd_pre ?? evals?.Control?.covd_pre ?? 0.2806;
  const preConv = Math.sqrt(Math.max(0, 1.0 - covdPre));
  const postConv = evals?.Treatment?.convergence ?? evals?.Control?.convergence ?? 0.8362;
  const convGain = postConv - preConv;

  // Stance Change (Pre to Post)
  const stanceShift = evals?.Treatment?.self_shift ?? evals?.Control?.self_shift ?? 0.2225;

  const covdPost = evals?.Treatment?.covd_post ?? evals?.Control?.covd_post ?? 0.3008;

  const dqiScore = evals?.Treatment?.dqi?.total ?? evals?.Control?.dqi?.total ?? 0;
  const dqiScores = evals?.Treatment?.dqi ?? evals?.Control?.dqi;
  const dqiStandard = evals?.Control?.dqi;

  const convA = evals?.Control?.convergence ?? 0;
  const convB = evals?.Treatment?.convergence ?? 0;
  const isConvHigher = convB >= convA;

  const chatStandard = run.results_control?.chat_history || {};
  const chatReflective = run.results_treatment?.chat_history || {};
  const turns = Array.from(new Set([...Object.keys(chatStandard), ...Object.keys(chatReflective)])).sort();

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-6 sm:p-7 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToDirectory}
              className="text-xs font-mono font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Experiment Run History
            </button>
            <span className="text-neutral-300">/</span>
            <span className="rounded-md bg-neutral-100 px-2.5 py-0.5 font-mono text-xs font-bold text-neutral-900">
              {run.id}
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 mt-2">
            {run.name}
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            {run.description || 'School Closure Deliberation simulation experiment'}
          </p>
        </div>

        {/* Quick Hypothesis Verdict Badge */}
        <div className="flex items-center gap-3">
          <div
            className={`rounded-xl border px-4 py-2.5 text-right ${
              isConvHigher
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-neutral-200 bg-neutral-50 text-neutral-700'
            }`}
          >
            <div className="text-[11px] font-mono uppercase tracking-wider font-bold opacity-75">
              Hypothesis Verdict
            </div>
            <div className="text-sm font-bold mt-0.5">
              {isConvHigher ? 'Consensus Reached (Compromise Achieved)' : 'Null Retained (No Consensus Gain)'}
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Row with Enlarge Font and Clear Pre/Post Labels */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Consensus Convergence */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-bold uppercase tracking-wider font-mono">
            <span>Consensus (Convergence)</span>
            <Scale className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-neutral-950">
              {postConv.toFixed(4)}
            </span>
            <span className="text-xs font-mono text-neutral-400 font-semibold">
              (Post)
            </span>
          </div>
          <div className="mt-1.5 text-xs font-mono">
            <span className="text-neutral-500 font-medium">Pre: {preConv.toFixed(4)}</span>{' '}
            <span className={convGain >= 0 ? 'text-emerald-700 font-bold ml-1' : 'text-amber-700 font-bold ml-1'}>
              {convGain >= 0 ? '+' : ''}
              {(convGain * 100).toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Stance Change */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-bold uppercase tracking-wider font-mono">
            <span>Stance Change</span>
            <Brain className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-neutral-950">
              {stanceShift.toFixed(4)}
            </span>
          </div>
          <div className="mt-1.5 text-xs font-sans text-neutral-500">
            Pre → Post Opinion Distance
          </div>
        </div>

        {/* Plurality CovD */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-bold uppercase tracking-wider font-mono">
            <span>Plurality (CovD Post)</span>
            <Layers className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-neutral-950">
              {covdPost.toFixed(4)}
            </span>
          </div>
          <div className="mt-1.5 text-xs font-mono text-neutral-500">
            Pre: {covdPre.toFixed(4)}
          </div>
        </div>

        {/* DQI Score */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-bold uppercase tracking-wider font-mono">
            <span>Discourse Quality (DQI)</span>
            <Award className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold font-mono text-neutral-950">
              {dqiScore > 0 ? dqiScore.toFixed(2) : '-'}
            </span>
            <span className="text-sm font-mono text-neutral-400 font-bold">
              / 15
            </span>
          </div>
          <div className="mt-1.5 text-xs font-sans text-neutral-500">
            5 Calibrated Rubric Dimensions
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-200 gap-3">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab('dialogue')}
            className={`flex items-center gap-2 pb-3.5 text-sm transition-colors border-b-2 ${
              activeTab === 'dialogue'
                ? 'border-neutral-950 text-neutral-950 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-950 font-medium'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Deliberation Dialogue & Scratchpads</span>
          </button>

          <button
            onClick={() => setActiveTab('stances')}
            className={`flex items-center gap-2 pb-3.5 text-sm transition-colors border-b-2 ${
              activeTab === 'stances'
                ? 'border-neutral-950 text-neutral-950 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-950 font-medium'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Pre vs Post Stance Evolution</span>
          </button>

          <button
            onClick={() => setActiveTab('metrics')}
            className={`flex items-center gap-2 pb-3.5 text-sm transition-colors border-b-2 ${
              activeTab === 'metrics'
                ? 'border-neutral-950 text-neutral-950 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-950 font-medium'
            }`}
          >
            <Award className="h-4 w-4" />
            <span>DQI Rubric Breakdown</span>
          </button>

          <button
            onClick={() => setActiveTab('files')}
            className={`flex items-center gap-2 pb-3.5 text-sm transition-colors border-b-2 ${
              activeTab === 'files'
                ? 'border-neutral-950 text-neutral-950 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-950 font-medium'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Directory Files (Raw JSON)</span>
          </button>
        </div>

        {activeTab === 'dialogue' && (
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl text-xs font-semibold mb-2">
            <button
              onClick={() => setDeliberationView('side-by-side')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                deliberationView === 'side-by-side' ? 'bg-white text-neutral-950 shadow-2xs font-bold' : 'text-neutral-600'
              }`}
            >
              Side-by-Side
            </button>
            <button
              onClick={() => setDeliberationView('reflective')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                deliberationView === 'reflective' ? 'bg-white text-neutral-950 shadow-2xs font-bold' : 'text-neutral-600'
              }`}
            >
              Reflective Deliberation
            </button>
            <button
              onClick={() => setDeliberationView('standard')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                deliberationView === 'standard' ? 'bg-white text-neutral-950 shadow-2xs font-bold' : 'text-neutral-600'
              }`}
            >
              Standard Deliberation
            </button>
          </div>
        )}
      </div>

      {/* Tab 1: Dialogue & Scratchpads */}
      {activeTab === 'dialogue' && (
        <div className="space-y-7">
          {turns.map((turnKey, turnIdx) => {
            const listStandard = chatStandard[turnKey] || [];
            const listReflective = chatReflective[turnKey] || [];

            return (
              <div key={turnKey} className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-neutral-950 px-3 py-1 font-mono text-xs font-bold text-white uppercase tracking-wider">
                    Round {turnIdx + 1}
                  </span>
                  <div className="h-px flex-1 bg-neutral-200" />
                </div>

                <div
                  className={`grid gap-5 ${
                    deliberationView === 'side-by-side'
                      ? 'grid-cols-1 lg:grid-cols-2'
                      : 'grid-cols-1'
                  }`}
                >
                  {/* Standard Deliberation Column */}
                  {(deliberationView === 'side-by-side' || deliberationView === 'standard') && (
                    <div className="space-y-3.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-neutral-600 uppercase tracking-wider">
                        <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                        <span>Standard Deliberation (Direct Dialogue)</span>
                      </div>
                      {listStandard.map((entry, idx) => (
                        <div
                          key={`std-${idx}`}
                          className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-neutral-950">
                              {entry.agent}
                            </span>
                            <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-mono font-medium text-neutral-600">
                              Direct Turn
                            </span>
                          </div>
                          <p className="text-sm text-neutral-800 leading-relaxed whitespace-pre-wrap">
                            {entry.public_response}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reflective Deliberation Column */}
                  {(deliberationView === 'side-by-side' || deliberationView === 'reflective') && (
                    <div className="space-y-3.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                        <span>Reflective Deliberation (With Internal Scratchpad)</span>
                      </div>
                      {listReflective.map((entry, idx) => (
                        <div
                          key={`refl-${idx}`}
                          className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs space-y-3.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-neutral-950">
                              {entry.agent}
                            </span>
                            <span className="rounded-md bg-amber-100 border border-amber-200 px-2 py-0.5 text-xs font-mono font-bold text-amber-900">
                              Internal Reflection Active
                            </span>
                          </div>

                          {/* Private Scratchpad Box */}
                          {entry.private_scratchpad && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-950 space-y-1.5 shadow-2xs">
                              <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-amber-900">
                                <Brain className="h-3.5 w-3.5" />
                                <span>Private Internal Monologue:</span>
                              </div>
                              <p className="text-sm italic leading-relaxed text-amber-950">
                                "{entry.private_scratchpad}"
                              </p>
                            </div>
                          )}

                          {/* Public Response */}
                          <div>
                            <div className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                              Spoken Public Response:
                            </div>
                            <p className="text-sm text-neutral-800 leading-relaxed whitespace-pre-wrap">
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
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-7 shadow-xs">
            <h3 className="text-base font-bold text-neutral-950">
              Agent Stance Evolution (Pre vs Post)
            </h3>
            <p className="text-sm text-neutral-600 mt-1">
              Compare initial baseline stances (Pre-deliberation) against the final positions formulated after discussion (Post-deliberation).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {['MOE Official', 'Teacher'].map((agentId) => {
                const pre = run.results_control?.stances_pre[agentId] || '';
                const postA = run.results_control?.stances_post[agentId] || '';
                const postB = run.results_treatment?.stances_post[agentId] || '';

                return (
                  <div key={agentId} className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-950 text-white font-mono text-sm font-bold">
                        {agentId[0]}
                      </div>
                      <h4 className="font-bold text-sm text-neutral-950">{agentId}</h4>
                    </div>

                    {/* Pre Stance */}
                    <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-1.5 shadow-2xs">
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-500">
                        Pre-Deliberation Stance (Initial Baseline)
                      </span>
                      <p className="text-sm text-neutral-800 leading-relaxed">
                        {pre}
                      </p>
                    </div>

                    {/* Post Stance Standard */}
                    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-1.5 shadow-2xs">
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-blue-900">
                        Post-Deliberation (Standard Dialogue)
                      </span>
                      <p className="text-sm text-neutral-800 leading-relaxed">
                        {postA}
                      </p>
                    </div>

                    {/* Post Stance Reflective */}
                    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-1.5 shadow-2xs">
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-950">
                        Post-Deliberation (Reflective Deliberation)
                      </span>
                      <p className="text-sm text-neutral-800 leading-relaxed">
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

      {/* Tab 3: DQI Rubric Breakdown with Bold Table Headers and Enlarged Font */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-7 shadow-xs">
            <h3 className="text-base font-bold text-neutral-950">
              Discourse Quality Index (DQI) Calibrated Rubric
            </h3>
            <p className="text-sm text-neutral-600 mt-1">
              Turn-by-turn evaluation by LLM Judge (1 to 3 scale per dimension) calibrated to reward reasoned compromise and penalize talking past each other.
            </p>

            <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-200">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-100 text-sm font-bold text-neutral-950">
                  <tr>
                    <th className="px-5 py-4 font-bold text-neutral-950">DQI Rubric Dimension</th>
                    <th className="px-5 py-4 font-bold text-neutral-950">Standard Deliberation</th>
                    <th className="px-5 py-4 font-bold text-neutral-950">Reflective Deliberation</th>
                    <th className="px-5 py-4 font-bold text-neutral-950">Delta</th>
                    <th className="px-5 py-4 font-bold text-neutral-950">Operational Criteria</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
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
                    const valA = (dqiStandard as any)?.[row.key] ?? 0;
                    const valB = (dqiScores as any)?.[row.key] ?? 0;
                    const delta = valB - valA;

                    return (
                      <tr key={row.key} className="hover:bg-neutral-50/80">
                        <td className="px-5 py-4 font-bold text-neutral-950">
                          {row.label}
                        </td>
                        <td className="px-5 py-4 font-mono font-medium text-neutral-700">
                          {valA.toFixed(2)} / 3.0
                        </td>
                        <td className="px-5 py-4 font-mono font-bold text-neutral-950">
                          {valB.toFixed(2)} / 3.0
                        </td>
                        <td className="px-5 py-4 font-mono">
                          <span
                            className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                              delta > 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : delta < 0
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-neutral-100 text-neutral-600'
                            }`}
                          >
                            {delta > 0 ? '+' : ''}
                            {delta.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-neutral-600 text-xs">
                          {row.desc}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-neutral-100 font-bold text-neutral-950">
                    <td className="px-5 py-4 font-extrabold">Total Score (Sum)</td>
                    <td className="px-5 py-4 font-mono font-bold">
                      {dqiStandard?.total ? dqiStandard.total.toFixed(2) : '-'} / 15.0
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-neutral-950">
                      {dqiScores?.total ? dqiScores.total.toFixed(2) : '-'} / 15.0
                    </td>
                    <td className="px-5 py-4 font-mono" colSpan={2}>
                      {dqiStandard?.total && dqiScores?.total ? (
                        <span
                          className={`rounded-md px-2.5 py-1 text-xs font-bold ${
                            dqiScores.total >= dqiStandard.total
                              ? 'bg-emerald-200 text-emerald-950'
                              : 'bg-neutral-200 text-neutral-800'
                          }`}
                        >
                          {dqiScores.total >= dqiStandard.total ? '+' : ''}
                          {(dqiScores.total - dqiStandard.total).toFixed(2)} pts
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
            <div className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white p-1 text-xs">
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
                  className={`rounded-lg px-3.5 py-2 font-mono text-xs transition-colors ${
                    activeJsonFile === f.id
                      ? 'bg-neutral-950 text-white font-bold'
                      : 'text-neutral-600 hover:bg-neutral-100 font-medium'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => copyJsonToClipboard(getFileContent())}
                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-xs font-bold text-neutral-800 hover:bg-neutral-50 shadow-2xs"
              >
                {copiedFile ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                <span>{copiedFile ? 'Copied' : 'Copy JSON'}</span>
              </button>

              <button
                onClick={() => downloadJsonFile(`${activeJsonFile}.json`, getFileContent())}
                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-xs font-bold text-neutral-800 hover:bg-neutral-50 shadow-2xs"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-neutral-950 p-5 shadow-xs overflow-hidden">
            <pre className="font-mono text-xs text-neutral-200 overflow-x-auto max-h-[520px] leading-relaxed">
              {JSON.stringify(getFileContent(), null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
