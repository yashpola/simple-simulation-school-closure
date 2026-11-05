import React from 'react';
import { Database, FolderGit2, Settings, Layers, Key } from 'lucide-react';
import { ApiSettings } from './ApiSettingsModal';

interface NavbarProps {
  activeTab: 'directory' | 'inspector' | 'config' | 'setup';
  setActiveTab: (tab: 'directory' | 'inspector' | 'config' | 'setup') => void;
  selectedRunId: string | null;
  supabaseConnected: boolean;
  onOpenSetup: () => void;
  apiSettings: ApiSettings;
  onOpenApiSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedRunId,
  supabaseConnected,
  onOpenSetup,
  apiSettings,
  onOpenApiSettings,
}) => {
  const hasApiKey = Boolean(apiSettings.apiKey && apiSettings.apiKey.length > 0);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900 text-white font-mono text-base font-bold shadow-sm">
            Δ
          </div>
          <div>
            <h1 className="text-base font-bold text-neutral-900 tracking-tight leading-none">
              School Closure Deliberation
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Interactive Deliberation Dashboard
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-100/80 p-1 text-sm">
          <button
            onClick={() => setActiveTab('directory')}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 font-medium transition-all ${
              activeTab === 'directory'
                ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
            }`}
          >
            <FolderGit2 className="h-4 w-4" />
            <span>Experiment Run History</span>
          </button>

          <button
            onClick={() => setActiveTab('inspector')}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 font-medium transition-all ${
              activeTab === 'inspector'
                ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>
              Inspector {selectedRunId ? `(${selectedRunId})` : ''}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 font-medium transition-all ${
              activeTab === 'config'
                ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Experiment Setup</span>
          </button>
        </nav>

        {/* Status Pills (API Key BYOK + Supabase) */}
        <div className="flex items-center gap-2.5">
          {/* BYOK API Key Pill */}
          <button
            onClick={onOpenApiSettings}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-mono font-medium border transition-colors ${
              hasApiKey
                ? 'border-neutral-300 bg-neutral-50 text-neutral-800 hover:bg-neutral-100'
                : 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
            }`}
            title="Configure custom LLM API Key & Base URL"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                hasApiKey ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
              }`}
            />
            <Key className="h-3.5 w-3.5" />
            <span>{hasApiKey ? `Key: ${apiSettings.provider}` : 'Set API Key'}</span>
          </button>

          {/* Supabase Status Pill */}
          <button
            onClick={onOpenSetup}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-mono font-medium border transition-colors ${
              supabaseConnected
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                : 'border-neutral-300 bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
            }`}
            title="Supabase Database Status"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                supabaseConnected ? 'bg-emerald-500' : 'bg-neutral-400'
              }`}
            />
            <Database className="h-3.5 w-3.5" />
            <span>{supabaseConnected ? 'Supabase' : 'Local DB'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
