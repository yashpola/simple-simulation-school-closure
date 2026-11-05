import React from 'react';
import {
  FileText,
  Github,
  ExternalLink,
  Code2,
  Database,
  Layers,
  Sparkles,
  Award,
  BookOpen
} from 'lucide-react';

export const ResourcesView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-7 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500">
            Study Documentation & Code
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900">
          Experiment Resources & Documentation
        </h2>
        <p className="text-sm text-neutral-600 max-w-3xl leading-relaxed">
          Access the project documentation on Overleaf, explore the open-source reproduction repository on GitHub, or inspect the experiment artifact architecture.
        </p>
      </div>

      {/* Primary Resource Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Overleaf Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-5 hover:border-neutral-300 transition-colors">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-blue-700">
                <FileText className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-blue-100/70 px-2.5 py-0.5 font-mono text-[11px] font-bold text-blue-900">
                Live Documentation
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900">Experiment Documentation (Overleaf)</h3>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">
                Theoretical Framework & Protocol Details
              </p>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Read the comprehensive experiment documentation detailing the multi-agent deliberation framework, prompt design, experimental protocol, analytical metric formulations (Cosine consensus convergence, CovD plurality), and calibrated Discourse Quality Index (DQI) evaluation rubric.
            </p>
          </div>

          <a
            href="https://www.overleaf.com/read/nxgtcjgjsdxf#7a6edc"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors"
          >
            <span>Open Documentation on Overleaf</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* GitHub Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-5 hover:border-neutral-300 transition-colors">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100 border border-neutral-200 text-neutral-900">
                <Github className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 font-mono text-[11px] font-bold text-neutral-700">
                Open Source
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900">Code Repository (GitHub)</h3>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">
                yashpola/simple-simulation-school-closure
              </p>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Explore the full Python simulation codebase (<code className="bg-neutral-100 px-1 py-0.5 rounded text-[11px]">src/deliberation.py</code>, <code className="bg-neutral-100 px-1 py-0.5 rounded text-[11px]">src/evaluation.py</code>), prompt templates, analytical metric calculations (Cosine, CovD, DQI LLM Judge), and this Next.js digital twin dashboard.
            </p>
          </div>

          <a
            href="https://github.com/yashpola/simple-simulation-school-closure"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-xs font-bold text-white shadow-xs hover:bg-neutral-800 transition-colors"
          >
            <span>View Repository on GitHub</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Methodology & Directory Architecture */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-7 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
          <Layers className="h-4.5 w-4.5 text-neutral-700" />
          <span>Experiment Artifacts & Directory Structure</span>
        </h3>
        <p className="text-xs text-neutral-600 leading-relaxed">
          Each experiment run in the dashboard corresponds to an indexed directory in the simulation engine (<code className="bg-neutral-100 px-1 py-0.5 rounded font-mono text-[11px]">data/expXXX/</code>), containing four reproducible JSON files:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 space-y-1">
            <div className="font-mono font-bold text-neutral-900 flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5 text-neutral-500" />
              <span>config.json</span>
            </div>
            <p className="text-[11px] text-neutral-600">
              Model assignments, sampling temperatures, seeds, turn budgets, and system/persona prompts.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 space-y-1">
            <div className="font-mono font-bold text-neutral-900 flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-neutral-500" />
              <span>results_control.json</span>
            </div>
            <p className="text-[11px] text-neutral-600">
              Standard deliberation dialogue turns, public statements, and pre/post stance texts.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 space-y-1">
            <div className="font-mono font-bold text-neutral-900 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>results_treatment.json</span>
            </div>
            <p className="text-[11px] text-neutral-600">
              Reflective deliberation with private scratchpad thoughts (&lt;private_scratchpad&gt;) and public responses.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 space-y-1">
            <div className="font-mono font-bold text-neutral-900 flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-neutral-500" />
              <span>evals.json</span>
            </div>
            <p className="text-[11px] text-neutral-600">
              Analytical evaluation: Cosine consensus convergence, stance self-shift, CovD plurality, and DQI rubric scores.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
