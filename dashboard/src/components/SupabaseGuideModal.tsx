import React, { useState } from 'react';
import {
  X,
  Database,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Code
} from 'lucide-react';

interface SupabaseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  supabaseConnected: boolean;
}

export const SupabaseGuideModal: React.FC<SupabaseGuideModalProps> = ({
  isOpen,
  onClose,
  supabaseConnected,
}) => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  if (!isOpen) return null;

  const sqlScript = `-- Create table for Experiment Runs (Digital twin of local expXXX directories)
CREATE TABLE IF NOT EXISTS experiment_runs (
    id TEXT PRIMARY KEY,                 -- e.g. 'exp000', 'exp001'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL DEFAULT 'School Closure Deliberation',
    description TEXT,
    status TEXT DEFAULT 'completed',     -- 'completed', 'running', 'failed'
    
    config JSONB NOT NULL,               -- config.json
    results_control JSONB,               -- results_control.json
    results_treatment JSONB,             -- results_treatment.json
    evals JSONB,                         -- evals.json
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS and public policies for anonymous read/write
ALTER TABLE experiment_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on experiment_runs" ON experiment_runs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on experiment_runs" ON experiment_runs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on experiment_runs" ON experiment_runs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on experiment_runs" ON experiment_runs FOR DELETE USING (true);`;

  const envSnippet = `NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

# LLM Compute Provider (Together AI or OpenAI)
OPENAI_API_KEY=<your-api-key>
OPENAI_BASE_URL=https://api.together.xyz/v1`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-xs p-4">
      <div className="flex flex-col max-h-[90vh] w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 bg-neutral-50/80">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Supabase & Vercel Setup Guide
              </h3>
              <p className="text-[11px] text-neutral-500 font-mono">
                Database: "Simulation Experiments"
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Status Alert */}
          <div
            className={`rounded-xl border p-4 flex items-start gap-3 ${
              supabaseConnected
                ? 'border-emerald-200 bg-emerald-50/60 text-emerald-900'
                : 'border-amber-200 bg-amber-50/60 text-amber-900'
            }`}
          >
            {supabaseConnected ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-semibold text-xs">
                {supabaseConnected
                  ? 'Supabase database is connected & active'
                  : 'Running in Local Storage Fallback Mode'}
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">
                {supabaseConnected
                  ? 'All experiment runs and directory artifacts are automatically persisting to your Supabase table.'
                  : 'Your Supabase credentials are not yet set in .env. Any runs you create will save directly to your browser localStorage until you add your Supabase URL & Key.'}
              </p>
            </div>
          </div>

          {/* Step 1 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-900">
                Step 1: Run SQL Table Creation Script in Supabase
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sqlScript);
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 2000);
                }}
                className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-neutral-700 hover:text-neutral-900"
              >
                {copiedSql ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                <span>{copiedSql ? 'Copied' : 'Copy SQL'}</span>
              </button>
            </div>
            <p className="text-neutral-500 text-[11px]">
              Open your Supabase project (<strong>Simulation Experiments</strong>) → <strong>SQL Editor</strong> → Paste and click <strong>Run</strong>:
            </p>
            <div className="rounded-lg border border-neutral-200 bg-neutral-900 p-3 overflow-x-auto">
              <pre className="font-mono text-[11px] text-neutral-200 leading-relaxed">
                {sqlScript}
              </pre>
            </div>
          </div>

          {/* Step 2 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-900">
                Step 2: Add Keys to <code>website/.env</code> & Vercel
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(envSnippet);
                  setCopiedEnv(true);
                  setTimeout(() => setCopiedEnv(false), 2000);
                }}
                className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-neutral-700 hover:text-neutral-900"
              >
                {copiedEnv ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                <span>{copiedEnv ? 'Copied' : 'Copy .env'}</span>
              </button>
            </div>
            <p className="text-neutral-500 text-[11px]">
              Find your Project URL and Anon API key in <strong>Project Settings → API</strong>:
            </p>
            <div className="rounded-lg border border-neutral-200 bg-neutral-900 p-3 overflow-x-auto">
              <pre className="font-mono text-[11px] text-neutral-200 leading-relaxed">
                {envSnippet}
              </pre>
            </div>
          </div>

          {/* Step 3: Vercel Deploy */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-2">
            <h4 className="font-semibold text-neutral-900">
              Deploying on Vercel
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-neutral-600 text-[11px] leading-relaxed">
              <li>In Vercel dashboard, click <strong>Add New... → Project</strong> and select this repo.</li>
              <li>Set <strong>Root Directory</strong> to <code>website</code>.</li>
              <li>Add the environment variables from your <code>.env</code> in the <strong>Environment Variables</strong> section.</li>
              <li>Click <strong>Deploy</strong>!</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200 bg-neutral-50 px-6 py-3 text-right">
          <button
            onClick={onClose}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

