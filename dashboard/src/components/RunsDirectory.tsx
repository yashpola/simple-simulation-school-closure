import React, { useState } from 'react';
import {
  Folder,
  Play,
  Award,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Brain,
  Scale,
  Clock,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Sparkles,
  FileText,
  Copy,
  Check,
  Settings,
  Cpu,
  Layers,
  Sliders
} from 'lucide-react';
import { ExperimentRun } from '@/types/experiment';

interface RunsDirectoryProps {
  runs: ExperimentRun[];
  expandedRunId: string | null;
  onToggleExpand: (id: string) => void;
  onNewRun: () => void;
  onDeleteRun: (id: string) => void;
}

export const RunsDirectory: React.FC<RunsDirectoryProps> = ({
  runs,
  expandedRunId,
  onToggleExpand,
  onNewRun,
  onDeleteRun,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'outputs' | 'config' | 'dqi' | 'files'>('outputs');
  const [deliberationView, setDeliberationView] = useState<'reflective' | 'standard' | 'side-by-side'>('side-by-side');
  const [activeJsonFile, setActiveJsonFile] = useState<'results_treatment' | 'results_control' | 'evals' | 'config'>('results_treatment');
  const [copiedFile, setCopiedFile] = useState(false);

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

  const copyJsonToClipboard = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  const downloadJsonFile = (runId: string, filename: string, data: any) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${runId}_${filename}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFileContent = (run: ExperimentRun) => {
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

  const formatTimestamp = (isoString: string) => {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { date: 'N/A', time: '' };
    return {
      date: d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      time: d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      full: d.toLocaleString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    };
  };

  const generalExperimentDescription =
    "An investigation evaluating how internal reflection ('think before speaking' via private scratchpads) impacts consensus, opinion plurality, and discourse quality in a dyadic citizen deliberation on primary school closures and mergers in Singapore.";

  return (
    <div className="space-y-6">
      {/* Top Banner: School Closure Deliberation Study is the Main Heading */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500">
                LLM Citizen Deliberation
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900">
              School Closure Deliberation Study
            </h2>
            <p className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-500">
              Experiment Run History & Results
            </p>
          </div>

          <button
            onClick={onNewRun}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-bold text-white shadow-xs hover:bg-neutral-800 transition-colors shrink-0"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>Configure & Run New</span>
          </button>
        </div>

        {/* Plain-Language Explanation of What the Experiment Does & What Metrics Measure */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 border-t border-neutral-100 text-sm">
          <div className="rounded-xl bg-neutral-50 p-4 space-y-1.5 border border-neutral-100">
            <div className="flex items-center gap-2 text-neutral-900 font-bold text-xs uppercase tracking-wider font-mono">
              <Brain className="h-4 w-4 text-neutral-700" />
              <span>What this experiment does</span>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Two AI personas—a <strong>Ministry of Education Official</strong> and a <strong>Primary School Teacher</strong>—deliberate whether to merge a historic primary school. We test whether prompting agents to engage in internal reflection ("think before speaking") improves compromise and discourse quality compared to direct debate.
            </p>
          </div>

          <div className="rounded-xl bg-neutral-50 p-4 space-y-1.5 border border-neutral-100">
            <div className="flex items-center gap-2 text-neutral-900 font-bold text-xs uppercase tracking-wider font-mono">
              <Scale className="h-4 w-4 text-neutral-700" />
              <span>Consensus & Stance Change</span>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              <strong>Consensus (Convergence)</strong> calculates how semantically close both participants' opinions become after discussion (0 to 1.0). <strong>Stance Change</strong> tracks how much each participant moved away from their initial stance, reflecting openness to compromise.
            </p>
          </div>

          <div className="rounded-xl bg-neutral-50 p-4 space-y-1.5 border border-neutral-100">
            <div className="flex items-center gap-2 text-neutral-900 font-bold text-xs uppercase tracking-wider font-mono">
              <Award className="h-4 w-4 text-neutral-700" />
              <span>Discourse Quality (DQI)</span>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              An automated LLM judge scores each turn (out of 15) using a strict political science rubric across 5 dimensions: depth of justification, collective reasoning, mutual civility, concrete solutions, and direct interactivity (penalizing parallel monologues).
            </p>
          </div>
        </div>
      </div>

      {/* Search Filter & Count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search runs by ID, persona, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none shadow-2xs"
          />
        </div>
        <div className="text-xs font-mono font-medium text-neutral-500">
          Showing {filteredRuns.length} of {runs.length} experiment runs · Click any run to expand details
        </div>
      </div>

      {/* Runs Table with Bold Headers, Explicit Timestamp, CovD Column, and Verdict */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-100/90 text-sm font-bold text-neutral-950">
              <tr>
                <th className="px-5 py-5 font-bold text-neutral-950">Run</th>
                <th className="px-5 py-5 font-bold text-neutral-950">Timestamp</th>
                <th className="px-5 py-5 font-bold text-neutral-950">Consensus (Pre → Post)</th>
                <th className="px-5 py-5 font-bold text-neutral-950">Stance Change</th>
                <th className="px-5 py-5 font-bold text-neutral-950">Plurality (CovD)</th>
                <th className="px-5 py-5 font-bold text-neutral-950">Discourse Quality (DQI)</th>
                <th className="px-5 py-5 font-bold text-neutral-950">Verdict</th>
                <th className="px-5 py-5 text-right font-bold text-neutral-950">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 font-sans">
              {filteredRuns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-neutral-500 text-sm">
                    No experiment runs found. Click "Configure & Run New" to launch a deliberation trial.
                  </td>
                </tr>
              ) : (
                filteredRuns.map((run) => {
                  const evals = run.evals;
                  
                  // Compute Pre baseline similarity and Post deliberation convergence
                  const covdPre = evals?.Treatment?.covd_pre ?? evals?.Control?.covd_pre ?? 0.2806;
                  const covdPost = evals?.Treatment?.covd_post ?? evals?.Control?.covd_post ?? 0.3008;
                  const preConv = Math.sqrt(Math.max(0, 1.0 - covdPre));
                  const postConv = evals?.Treatment?.convergence ?? evals?.Control?.convergence ?? 0.8362;
                  const convGain = postConv - preConv;

                  // Stance change
                  const stanceShift = evals?.Treatment?.self_shift ?? evals?.Control?.self_shift ?? 0.2225;

                  // Discourse Quality Index
                  const dqiScore = evals?.Treatment?.dqi?.total ?? evals?.Control?.dqi?.total ?? 0;

                  // Verdict: whether internal scratchpad helped or not
                  const convA = evals?.Control?.convergence ?? 0;
                  const convB = evals?.Treatment?.convergence ?? 0;
                  const scratchpadHelped = convB > convA;
                  const scratchpadDelta = convB - convA;

                  const isExpanded = run.id === expandedRunId;
                  const ts = formatTimestamp(run.created_at);

                  // Deliberation history for expanded view
                  const chatStandard = run.results_control?.chat_history || {};
                  const chatReflective = run.results_treatment?.chat_history || {};
                  const turns = Array.from(new Set([...Object.keys(chatStandard), ...Object.keys(chatReflective)])).sort();

                  const dqiScores = evals?.Treatment?.dqi ?? evals?.Control?.dqi;
                  const dqiStandard = evals?.Control?.dqi;

                  // Config details for Tab 2
                  const runConfig = run.config;
                  const modelAssignments = runConfig?.model_config?.model_assignments || {};
                  const modelParams = runConfig?.model_config?.model_parameters || {};
                  const delibConfig = runConfig?.deliberation_config || {};

                  return (
                    <React.Fragment key={run.id}>
                      {/* Clickable Table Row with Expanded Height & Generous Spacing */}
                      <tr
                        onClick={() => onToggleExpand(run.id)}
                        className={`transition-colors cursor-pointer select-none hover:bg-neutral-50/90 ${
                          isExpanded ? 'bg-neutral-50/90 font-medium' : ''
                        }`}
                      >
                        {/* Run Column */}
                        <td className="px-5 py-6">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-100 text-neutral-800 shrink-0 shadow-2xs">
                              <Folder className="h-5 w-5 text-amber-600" />
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-base font-bold text-neutral-900">
                                  {run.id}
                                </span>
                                {run.id === 'exp000' && (
                                  <span className="rounded-md bg-neutral-200/80 px-2 py-0.5 text-[10px] font-mono font-bold text-neutral-700">
                                    Baseline
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-neutral-500 font-mono block">
                                {modelAssignments['MOE Official']?.split('/').pop() || 'Llama-3.3-70B'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Dedicated Timestamp Column */}
                        <td className="px-5 py-6">
                          <div className="flex items-start gap-2">
                            <Clock className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <div className="text-sm font-bold text-neutral-900 font-mono">
                                {ts.date}
                              </div>
                              <div className="text-xs text-neutral-500 font-mono">
                                {ts.time}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Consensus Pre → Post Column */}
                        <td className="px-5 py-6">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 font-mono text-xs">
                              <span className="text-neutral-500">Pre: {preConv.toFixed(4)}</span>
                              <span className="text-neutral-300">→</span>
                              <span className="font-bold text-neutral-950">
                                Post: {postConv.toFixed(4)}
                              </span>
                            </div>
                            <div>
                              <span
                                className={`inline-flex items-center gap-0.5 rounded-md px-2 py-0.5 font-mono text-xs font-bold ${
                                  convGain >= 0
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {convGain >= 0 ? '+' : ''}
                                {(convGain * 100).toFixed(2)}% Consensus
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Stance Change Column */}
                        <td className="px-5 py-6 font-mono">
                          <div className="space-y-0.5">
                            <div className="text-base font-bold text-neutral-950">
                              {stanceShift.toFixed(4)}
                            </div>
                            <span className="text-xs text-neutral-500 font-sans block">
                              Pre → Post Shift
                            </span>
                          </div>
                        </td>

                        {/* CovD (Plurality) Column */}
                        <td className="px-5 py-6 font-mono">
                          <div className="space-y-0.5">
                            <div className="text-sm font-bold text-neutral-950">
                              {covdPost.toFixed(4)}
                            </div>
                            <span className="text-xs text-neutral-500 font-mono block">
                              Pre: {covdPre.toFixed(4)}
                            </span>
                          </div>
                        </td>

                        {/* DQI Score Column */}
                        <td className="px-5 py-6">
                          <div className="flex items-center gap-2">
                            <Award className="h-4.5 w-4.5 text-neutral-500 shrink-0" />
                            <div>
                              <span className="font-mono text-base font-bold text-neutral-950">
                                {dqiScore > 0 ? dqiScore.toFixed(2) : '-'}
                              </span>
                              <span className="text-xs text-neutral-400 font-mono ml-1">/ 15</span>
                            </div>
                          </div>
                        </td>

                        {/* Verdict Column (Whether Internal Scratchpad Helped or Not) */}
                        <td className="px-5 py-6">
                          {scratchpadHelped ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-200 shadow-2xs">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              <span>Scratchpad Helped (+{(scratchpadDelta * 100).toFixed(1)}%)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 border border-amber-200 shadow-2xs">
                              <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                              <span>Scratchpad Did Not Help</span>
                            </span>
                          )}
                        </td>

                        {/* Actions Column */}
                        <td className="px-5 py-6 text-right">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => onToggleExpand(run.id)}
                              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold shadow-2xs transition-all ${
                                isExpanded
                                  ? 'border-neutral-900 bg-neutral-900 text-white'
                                  : 'border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50'
                              }`}
                              title={isExpanded ? 'Collapse run details' : 'Expand run details'}
                            >
                              <span>{isExpanded ? 'Collapse' : 'Inspect'}</span>
                              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            </button>

                            <button
                              onClick={() => exportAllRunFiles(run)}
                              className="inline-flex items-center rounded-xl border border-neutral-300 bg-white p-2 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 shadow-2xs"
                              title="Download JSON files"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>

                            {run.id !== 'exp000' && (
                              <button
                                onClick={() => {
                                  if (confirm(`Delete run ${run.id}?`)) onDeleteRun(run.id);
                                }}
                                className="inline-flex items-center rounded-xl border border-transparent p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50"
                                title="Delete run"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Inline Expanded Run Details View */}
                      {isExpanded && (
                        <tr className="bg-neutral-50/70 border-b border-neutral-200">
                          <td colSpan={8} className="p-0">
                            <div className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
                              {/* Header with General Study Description (Not Run-Specific) & Exact Timestamp */}
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
                                <div className="space-y-1 max-w-3xl">
                                  <div className="flex items-center gap-2">
                                    <span className="rounded bg-neutral-900 text-white px-2 py-0.5 font-mono text-xs font-bold">
                                      {run.id}
                                    </span>
                                    <span className="text-xs font-bold text-neutral-500 font-mono">
                                      Executed on {ts.full}
                                    </span>
                                  </div>
                                  <h3 className="text-lg font-bold tracking-tight text-neutral-900 mt-1">
                                    School Closure Deliberation · Detailed Findings
                                  </h3>
                                  <p className="text-xs text-neutral-600 leading-relaxed">
                                    {generalExperimentDescription}
                                  </p>
                                </div>

                                <div className="shrink-0">
                                  <div
                                    className={`rounded-xl border px-4 py-2.5 text-right ${
                                      scratchpadHelped
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                                        : 'border-amber-200 bg-amber-50 text-amber-900'
                                    }`}
                                  >
                                    <div className="text-[10px] font-mono uppercase tracking-wider font-bold opacity-75">
                                      Verdict
                                    </div>
                                    <div className="text-xs font-bold mt-0.5">
                                      {scratchpadHelped
                                        ? 'Internal Scratchpad Helped'
                                        : 'Internal Scratchpad Did Not Help'}
                                    </div>
                                    <div className="text-[11px] font-mono mt-0.5 opacity-80">
                                      {scratchpadHelped
                                        ? `+${(scratchpadDelta * 100).toFixed(2)}% Consensus Gain`
                                        : 'Direct dialogue formed equal or higher consensus'}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Key Metrics Row */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
                                  <div className="text-neutral-500 text-xs font-bold uppercase tracking-wider font-mono">
                                    Consensus (Convergence)
                                  </div>
                                  <div className="mt-2 text-2xl font-extrabold font-mono text-neutral-950">
                                    {postConv.toFixed(4)}
                                  </div>
                                  <div className="mt-1 text-xs font-mono text-neutral-500">
                                    Pre: {preConv.toFixed(4)}{' '}
                                    <span className={convGain >= 0 ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                                      ({convGain >= 0 ? '+' : ''}{(convGain * 100).toFixed(2)}%)
                                    </span>
                                  </div>
                                </div>

                                <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
                                  <div className="text-neutral-500 text-xs font-bold uppercase tracking-wider font-mono">
                                    Stance Change
                                  </div>
                                  <div className="mt-2 text-2xl font-extrabold font-mono text-neutral-950">
                                    {stanceShift.toFixed(4)}
                                  </div>
                                  <div className="mt-1 text-xs text-neutral-500">
                                    Pre → Post Shift Distance
                                  </div>
                                </div>

                                <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
                                  <div className="text-neutral-500 text-xs font-bold uppercase tracking-wider font-mono">
                                    Plurality (CovD Post)
                                  </div>
                                  <div className="mt-2 text-2xl font-extrabold font-mono text-neutral-950">
                                    {covdPost.toFixed(4)}
                                  </div>
                                  <div className="mt-1 text-xs font-mono text-neutral-500">
                                    Pre: {covdPre.toFixed(4)}
                                  </div>
                                </div>

                                <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
                                  <div className="text-neutral-500 text-xs font-bold uppercase tracking-wider font-mono">
                                    Discourse Quality (DQI)
                                  </div>
                                  <div className="mt-2 text-2xl font-extrabold font-mono text-neutral-950">
                                    {dqiScore > 0 ? dqiScore.toFixed(2) : '-'} <span className="text-sm font-normal text-neutral-400">/ 15</span>
                                  </div>
                                  <div className="mt-1 text-xs text-neutral-500">
                                    5-Criteria Rubric Sum
                                  </div>
                                </div>
                              </div>

                              {/* Sub-Tabs: 1. Model Outputs & Dialogue | 2. Run Configuration | 3. DQI Breakdown | 4. Directory Files */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-200 gap-3">
                                <div className="flex items-center gap-6">
                                  <button
                                    onClick={() => setActiveSubTab('outputs')}
                                    className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors ${
                                      activeSubTab === 'outputs'
                                        ? 'border-neutral-950 text-neutral-950 font-bold'
                                        : 'border-transparent text-neutral-500 hover:text-neutral-950'
                                    }`}
                                  >
                                    <MessageSquare className="h-4 w-4" />
                                    <span>Model Outputs & Dialogue</span>
                                  </button>

                                  <button
                                    onClick={() => setActiveSubTab('config')}
                                    className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors ${
                                      activeSubTab === 'config'
                                        ? 'border-neutral-950 text-neutral-950 font-bold'
                                        : 'border-transparent text-neutral-500 hover:text-neutral-950'
                                    }`}
                                  >
                                    <Settings className="h-4 w-4" />
                                    <span>Run Configuration Used</span>
                                  </button>

                                  <button
                                    onClick={() => setActiveSubTab('dqi')}
                                    className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors ${
                                      activeSubTab === 'dqi'
                                        ? 'border-neutral-950 text-neutral-950 font-bold'
                                        : 'border-transparent text-neutral-500 hover:text-neutral-950'
                                    }`}
                                  >
                                    <Award className="h-4 w-4" />
                                    <span>Discourse Quality (DQI)</span>
                                  </button>

                                  <button
                                    onClick={() => setActiveSubTab('files')}
                                    className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors ${
                                      activeSubTab === 'files'
                                        ? 'border-neutral-950 text-neutral-950 font-bold'
                                        : 'border-transparent text-neutral-500 hover:text-neutral-950'
                                    }`}
                                  >
                                    <FileText className="h-4 w-4" />
                                    <span>Directory Files (Raw JSON)</span>
                                  </button>
                                </div>

                                {activeSubTab === 'outputs' && (
                                  <div className="flex items-center gap-1 bg-neutral-200/60 p-1 rounded-lg text-xs font-semibold mb-2">
                                    <button
                                      onClick={() => setDeliberationView('side-by-side')}
                                      className={`px-3 py-1 rounded-md transition-all ${
                                        deliberationView === 'side-by-side' ? 'bg-white shadow-2xs font-bold text-neutral-950' : 'text-neutral-600'
                                      }`}
                                    >
                                      Side-by-Side
                                    </button>
                                    <button
                                      onClick={() => setDeliberationView('reflective')}
                                      className={`px-3 py-1 rounded-md transition-all ${
                                        deliberationView === 'reflective' ? 'bg-white shadow-2xs font-bold text-neutral-950' : 'text-neutral-600'
                                      }`}
                                    >
                                      Reflective
                                    </button>
                                    <button
                                      onClick={() => setDeliberationView('standard')}
                                      className={`px-3 py-1 rounded-md transition-all ${
                                        deliberationView === 'standard' ? 'bg-white shadow-2xs font-bold text-neutral-950' : 'text-neutral-600'
                                      }`}
                                    >
                                      Standard
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* TAB 1: Model Outputs & Dialogue */}
                              {activeSubTab === 'outputs' && (
                                <div className="space-y-7">
                                  {/* Dialogue Turns */}
                                  <div className="space-y-5">
                                    <h4 className="text-sm font-bold text-neutral-950 uppercase tracking-wider font-mono">
                                      Conversational Turns & Scratchpads
                                    </h4>

                                    {turns.map((turnKey, turnIdx) => {
                                      const listStandard = chatStandard[turnKey] || [];
                                      const listReflective = chatReflective[turnKey] || [];

                                      return (
                                        <div key={turnKey} className="space-y-3">
                                          <div className="flex items-center gap-2">
                                            <span className="rounded bg-neutral-950 px-2 py-0.5 font-mono text-[11px] font-bold text-white uppercase tracking-wider">
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
                                            {/* Standard Column */}
                                            {(deliberationView === 'side-by-side' || deliberationView === 'standard') && (
                                              <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-xs font-bold text-neutral-600 uppercase tracking-wider">
                                                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                                                  <span>Standard Deliberation (Direct Dialogue)</span>
                                                </div>
                                                {listStandard.map((entry, idx) => (
                                                  <div
                                                    key={`std-${idx}`}
                                                    className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs space-y-2"
                                                  >
                                                    <div className="flex items-center justify-between">
                                                      <span className="font-bold text-xs text-neutral-950">
                                                        {entry.agent}
                                                      </span>
                                                      <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-mono text-neutral-600">
                                                        Direct Turn
                                                      </span>
                                                    </div>
                                                    <p className="text-xs text-neutral-800 leading-relaxed whitespace-pre-wrap">
                                                      {entry.public_response}
                                                    </p>
                                                  </div>
                                                ))}
                                              </div>
                                            )}

                                            {/* Reflective Column */}
                                            {(deliberationView === 'side-by-side' || deliberationView === 'reflective') && (
                                              <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
                                                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                                                  <span>Reflective Deliberation (With Internal Scratchpad)</span>
                                                </div>
                                                {listReflective.map((entry, idx) => (
                                                  <div
                                                    key={`refl-${idx}`}
                                                    className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs space-y-3"
                                                  >
                                                    <div className="flex items-center justify-between">
                                                      <span className="font-bold text-xs text-neutral-950">
                                                        {entry.agent}
                                                      </span>
                                                      <span className="rounded bg-amber-100 border border-amber-200 px-1.5 py-0.5 text-[10px] font-mono font-bold text-amber-900">
                                                        Internal Reflection Active
                                                      </span>
                                                    </div>

                                                    {entry.private_scratchpad && (
                                                      <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-950 space-y-1">
                                                        <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-900">
                                                          <Brain className="h-3 w-3" />
                                                          <span>Private Internal Monologue:</span>
                                                        </div>
                                                        <p className="italic leading-relaxed text-amber-950 text-xs">
                                                          "{entry.private_scratchpad}"
                                                        </p>
                                                      </div>
                                                    )}

                                                    <div>
                                                      <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                                                        Spoken Public Response:
                                                      </div>
                                                      <p className="text-xs text-neutral-800 leading-relaxed whitespace-pre-wrap">
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

                                  {/* Stances Evolution */}
                                  <div className="space-y-3 pt-4 border-t border-neutral-200">
                                    <h4 className="text-sm font-bold text-neutral-950 uppercase tracking-wider font-mono">
                                      Initial Baseline vs Final Post-Deliberation Stances
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                      {['MOE Official', 'Teacher'].map((agentId) => {
                                        const pre = run.results_control?.stances_pre[agentId] || '';
                                        const postA = run.results_control?.stances_post[agentId] || '';
                                        const postB = run.results_treatment?.stances_post[agentId] || '';

                                        return (
                                          <div key={agentId} className="rounded-xl border border-neutral-200 bg-white p-5 space-y-3 shadow-2xs">
                                            <div className="flex items-center gap-2.5">
                                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-white font-mono text-xs font-bold">
                                                {agentId[0]}
                                              </div>
                                              <h5 className="font-bold text-sm text-neutral-900">{agentId}</h5>
                                            </div>

                                            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 space-y-1">
                                              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                                                Pre-Deliberation Stance (Initial Baseline)
                                              </span>
                                              <p className="text-xs text-neutral-800 leading-relaxed">{pre}</p>
                                            </div>

                                            <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-3 space-y-1">
                                              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-blue-900">
                                                Post-Deliberation (Standard Dialogue)
                                              </span>
                                              <p className="text-xs text-neutral-800 leading-relaxed">{postA}</p>
                                            </div>

                                            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 space-y-1">
                                              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-950">
                                                Post-Deliberation (Reflective Deliberation)
                                              </span>
                                              <p className="text-xs text-neutral-800 leading-relaxed">{postB}</p>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* TAB 2: Run Configuration Used (2nd tab as requested) */}
                              {activeSubTab === 'config' && (
                                <div className="space-y-6">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Models & Sampling Parameters */}
                                    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs space-y-4">
                                      <div className="flex items-center gap-2 text-neutral-950 font-bold text-sm">
                                        <Cpu className="h-4 w-4 text-neutral-700" />
                                        <span>Model Assignments & Sampling</span>
                                      </div>

                                      <div className="divide-y divide-neutral-100 text-xs">
                                        <div className="py-2 flex items-center justify-between">
                                          <span className="font-semibold text-neutral-700">MOE Official Model:</span>
                                          <span className="font-mono font-bold text-neutral-900">{modelAssignments['MOE Official'] || 'meta-llama/Llama-3.3-70B-Instruct-Turbo'}</span>
                                        </div>
                                        <div className="py-2 flex items-center justify-between">
                                          <span className="font-semibold text-neutral-700">Teacher Model:</span>
                                          <span className="font-mono font-bold text-neutral-900">{modelAssignments['Teacher'] || 'meta-llama/Llama-3.3-70B-Instruct-Turbo'}</span>
                                        </div>
                                        <div className="py-2 flex items-center justify-between">
                                          <span className="font-semibold text-neutral-700">DQI Judge Model:</span>
                                          <span className="font-mono font-bold text-neutral-900">{modelAssignments['DQI_Judge'] || 'meta-llama/Llama-3.3-70B-Instruct-Turbo'}</span>
                                        </div>
                                        <div className="py-2 flex items-center justify-between">
                                          <span className="font-semibold text-neutral-700">Agent Temperature:</span>
                                          <span className="font-mono font-bold text-neutral-900">{modelParams.agent_temperature ?? 0.7}</span>
                                        </div>
                                        <div className="py-2 flex items-center justify-between">
                                          <span className="font-semibold text-neutral-700">Judge Temperature:</span>
                                          <span className="font-mono font-bold text-neutral-900">{modelParams.judge_temperature ?? 0.1}</span>
                                        </div>
                                        <div className="py-2 flex items-center justify-between">
                                          <span className="font-semibold text-neutral-700">Random Seed:</span>
                                          <span className="font-mono font-bold text-neutral-900">{String(modelParams.seed ?? 'None')}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Deliberation Budget & Conditions */}
                                    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs space-y-4">
                                      <div className="flex items-center gap-2 text-neutral-950 font-bold text-sm">
                                        <Sliders className="h-4 w-4 text-neutral-700" />
                                        <span>Deliberation Protocol Parameters</span>
                                      </div>

                                      <div className="divide-y divide-neutral-100 text-xs">
                                        <div className="py-2 flex items-center justify-between">
                                          <span className="font-semibold text-neutral-700">Turns Per Agent (Rounds):</span>
                                          <span className="font-mono font-bold text-neutral-900">{delibConfig.max_turns_per_agent || 3}</span>
                                        </div>
                                        <div className="py-2 flex items-center justify-between">
                                          <span className="font-semibold text-neutral-700">Total Trials:</span>
                                          <span className="font-mono font-bold text-neutral-900">{delibConfig.total_trials || 1}</span>
                                        </div>
                                        <div className="py-2 flex items-center justify-between">
                                          <span className="font-semibold text-neutral-700">Metrics Evaluated:</span>
                                          <span className="font-mono font-bold text-neutral-900">{(delibConfig.eval_metrics || ['cosine_similarity', 'covd', 'dqi']).join(', ')}</span>
                                        </div>
                                        <div className="py-2 flex items-center justify-between">
                                          <span className="font-semibold text-neutral-700">Conditions Run:</span>
                                          <span className="font-semibold text-neutral-900">Standard Deliberation & Reflective Deliberation</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Topic Prompt Box */}
                                  <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs space-y-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-mono">
                                      Topic Prompt Given to Agents
                                    </span>
                                    <p className="text-xs text-neutral-800 leading-relaxed font-sans bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                                      {runConfig?.system_prompts?.topic_prompt || 'The MOE is proposing to merge your local heritage primary school with a newer school 3km away due to falling enrollment. Discuss the impacts and try to reach a consensus on a recommendation to the MOE.'}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* TAB 3: Discourse Quality (DQI) */}
                              {activeSubTab === 'dqi' && (
                                <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-2xs">
                                  <table className="w-full text-left text-xs">
                                    <thead className="border-b border-neutral-200 bg-neutral-100 text-xs font-bold text-neutral-950">
                                      <tr>
                                        <th className="px-4 py-3 font-bold">DQI Rubric Dimension</th>
                                        <th className="px-4 py-3 font-bold">Standard Deliberation</th>
                                        <th className="px-4 py-3 font-bold">Reflective Deliberation</th>
                                        <th className="px-4 py-3 font-bold">Delta</th>
                                        <th className="px-4 py-3 font-bold">Operational Criteria</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200">
                                      {[
                                        {
                                          key: 'level_of_justification',
                                          label: 'Level of Justification',
                                          desc: 'Claims supported by multi-layered reasoning.',
                                        },
                                        {
                                          key: 'content_of_justification',
                                          label: 'Content of Justification',
                                          desc: 'Justifications extend to broader public goods.',
                                        },
                                        {
                                          key: 'respect',
                                          label: 'Respect',
                                          desc: 'Civility and acknowledgement of opponent points.',
                                        },
                                        {
                                          key: 'constructive_politics',
                                          label: 'Constructive Politics',
                                          desc: 'Proposals, working groups, and compromise.',
                                        },
                                        {
                                          key: 'interactivity',
                                          label: 'Interactivity',
                                          desc: 'Direct rebuttal vs parallel monologues.',
                                        },
                                      ].map((row) => {
                                        const valA = (dqiStandard as any)?.[row.key] ?? 0;
                                        const valB = (dqiScores as any)?.[row.key] ?? 0;
                                        const delta = valB - valA;

                                        return (
                                          <tr key={row.key} className="hover:bg-neutral-50">
                                            <td className="px-4 py-3 font-bold text-neutral-950">{row.label}</td>
                                            <td className="px-4 py-3 font-mono">{valA.toFixed(2)} / 3.0</td>
                                            <td className="px-4 py-3 font-mono font-bold text-neutral-950">{valB.toFixed(2)} / 3.0</td>
                                            <td className="px-4 py-3 font-mono">
                                              <span
                                                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
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
                                            <td className="px-4 py-3 text-neutral-500 text-[11px]">{row.desc}</td>
                                          </tr>
                                        );
                                      })}
                                      <tr className="bg-neutral-100 font-bold text-neutral-950">
                                        <td className="px-4 py-3 font-extrabold">Total Score (Sum)</td>
                                        <td className="px-4 py-3 font-mono">{dqiStandard?.total ? dqiStandard.total.toFixed(2) : '-'} / 15.0</td>
                                        <td className="px-4 py-3 font-mono font-bold">{dqiScores?.total ? dqiScores.total.toFixed(2) : '-'} / 15.0</td>
                                        <td className="px-4 py-3 font-mono" colSpan={2}>
                                          {dqiStandard?.total && dqiScores?.total ? (
                                            <span className="rounded px-2 py-0.5 text-xs font-bold bg-emerald-200 text-emerald-950">
                                              {dqiScores.total >= dqiStandard.total ? '+' : ''}
                                              {(dqiScores.total - dqiStandard.total).toFixed(2)} pts
                                            </span>
                                          ) : null}
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              )}

                              {/* TAB 4: Directory Files */}
                              {activeSubTab === 'files' && (
                                <div className="space-y-3">
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
                                              ? 'bg-neutral-950 text-white font-bold'
                                              : 'text-neutral-600 hover:bg-neutral-100'
                                          }`}
                                        >
                                          {f.label}
                                        </button>
                                      ))}
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => copyJsonToClipboard(getFileContent(run))}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-bold text-neutral-800 hover:bg-neutral-50 shadow-2xs"
                                      >
                                        {copiedFile ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                        <span>{copiedFile ? 'Copied' : 'Copy JSON'}</span>
                                      </button>

                                      <button
                                        onClick={() => downloadJsonFile(run.id, `${activeJsonFile}.json`, getFileContent(run))}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-bold text-neutral-800 hover:bg-neutral-50 shadow-2xs"
                                      >
                                        <Download className="h-3.5 w-3.5" />
                                        <span>Download</span>
                                      </button>
                                    </div>
                                  </div>

                                  <div className="rounded-xl border border-neutral-200 bg-neutral-950 p-4 overflow-hidden">
                                    <pre className="font-mono text-xs text-neutral-200 overflow-x-auto max-h-[450px] leading-relaxed">
                                      {JSON.stringify(getFileContent(run), null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
