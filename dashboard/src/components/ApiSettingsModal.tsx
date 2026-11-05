import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Server,
  Loader2,
  Trash2,
  Sparkles
} from 'lucide-react';

export interface ApiSettings {
  apiKey: string;
  baseUrl: string;
  provider: 'together' | 'openai' | 'openrouter' | 'groq' | 'custom';
  storageType: 'local' | 'session';
}

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ApiSettings;
  onSaveSettings: (settings: ApiSettings, updateModels?: boolean) => void;
}

export const PROVIDER_PRESETS = {
  together: {
    name: 'Together AI',
    baseUrl: 'https://api.together.xyz/v1',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    suggestedModels: [
      'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
      'mistralai/Mixtral-8x7B-Instruct-v0.1',
      'Qwen/Qwen2.5-72B-Instruct-Turbo',
    ],
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    suggestedModels: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'],
  },
  openrouter: {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct',
    suggestedModels: [
      'meta-llama/llama-3.3-70b-instruct',
      'anthropic/claude-3.5-sonnet',
      'google/gemini-flash-1.5',
    ],
  },
  groq: {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    suggestedModels: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
  },
  custom: {
    name: 'Custom / Local',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3.2',
    suggestedModels: ['llama3.2', 'mistral', 'custom-model'],
  },
} as const;

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [provider, setProvider] = useState<ApiSettings['provider']>(settings.provider || 'together');
  const [baseUrl, setBaseUrl] = useState<string>(settings.baseUrl || PROVIDER_PRESETS.together.baseUrl);
  const [apiKey, setApiKey] = useState<string>(settings.apiKey || '');
  const [storageType, setStorageType] = useState<'local' | 'session'>(settings.storageType || 'local');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    setProvider(settings.provider || 'together');
    setBaseUrl(settings.baseUrl || PROVIDER_PRESETS.together.baseUrl);
    setApiKey(settings.apiKey || '');
    setStorageType(settings.storageType || 'local');
    setTestResult(null);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSelectProvider = (p: ApiSettings['provider']) => {
    setProvider(p);
    setBaseUrl(PROVIDER_PRESETS[p].baseUrl);
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    if (!apiKey) {
      setTestResult({ ok: false, message: 'Please enter an API Key first.' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          baseUrl,
          model: PROVIDER_PRESETS[provider].defaultModel,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setTestResult({ ok: true, message: data.message });
      } else {
        setTestResult({ ok: false, message: data.error || 'Connection failed.' });
      }
    } catch (err: any) {
      setTestResult({ ok: false, message: err?.message || 'Network error reaching server.' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSaveSettings(
      {
        apiKey: apiKey.trim(),
        baseUrl: baseUrl.trim(),
        provider,
        storageType,
      },
      true // also update model assignments in config editor if appropriate
    );
    onClose();
  };

  const handleClear = () => {
    setApiKey('');
    onSaveSettings({
      apiKey: '',
      baseUrl: PROVIDER_PRESETS.together.baseUrl,
      provider: 'together',
      storageType: 'local',
    });
    setTestResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-xs p-4">
      <div className="flex flex-col max-h-[90vh] w-full max-w-xl rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 bg-neutral-50/80">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white shadow-2xs">
              <Key className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                LLM Provider & BYOK (Bring Your Own Key)
              </h3>
              <p className="text-[11px] text-neutral-500 font-mono">
                Custom API Key & Base URL Settings
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Security Notice */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 flex items-start gap-3 text-blue-900">
            <ShieldCheck className="h-4 w-4 text-blue-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-xs">
                Zero-Knowledge Client-Side Key Storage
              </div>
              <p className="text-[11px] leading-relaxed text-blue-800">
                Your API key is stored <strong>only inside your browser</strong>. It is never saved to the Supabase database, never written to disk, and never shared with other visitors. Runs saved to Supabase have all API keys strictly stripped.
              </p>
            </div>
          </div>

          {/* Provider Preset Picker */}
          <div className="space-y-2">
            <label className="font-semibold text-neutral-800 block text-xs">
              Choose LLM Provider Preset:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(
                [
                  { id: 'together', name: 'Together AI', badge: 'Default' },
                  { id: 'openai', name: 'OpenAI', badge: 'Official' },
                  { id: 'openrouter', name: 'OpenRouter', badge: 'Multi-Model' },
                  { id: 'groq', name: 'Groq', badge: 'Ultra-Fast' },
                  { id: 'custom', name: 'Custom / vLLM', badge: 'Local/Self-host' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectProvider(p.id)}
                  className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all ${
                    provider === p.id
                      ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  <span className="font-bold text-xs">{p.name}</span>
                  <span
                    className={`mt-1 text-[10px] font-mono ${
                      provider === p.id ? 'text-neutral-300' : 'text-neutral-400'
                    }`}
                  >
                    {p.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Base URL Input */}
          <div className="space-y-1.5">
            <label className="font-semibold text-neutral-800 block text-xs">
              API Base URL:
            </label>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 text-neutral-500 shrink-0">
                <Server className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.together.xyz/v1"
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 font-mono text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-neutral-400">
              Any OpenAI-compatible base endpoint (e.g. Together, OpenAI, OpenRouter, Groq, Ollama, vLLM).
            </p>
          </div>

          {/* API Key Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-neutral-800 block text-xs">
                Your API Key:
              </label>
              {apiKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-[10px] text-neutral-400 hover:text-red-600 flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Clear Key</span>
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setTestResult(null);
                }}
                placeholder={
                  provider === 'together'
                    ? 'tgp_v1_...'
                    : provider === 'openai'
                    ? 'sk-...'
                    : 'Paste your API key here'
                }
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 pr-10 font-mono text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-700"
              >
                {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Storage Preference */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3 space-y-2">
            <span className="font-semibold text-neutral-800 block text-xs">
              Where to store this key:
            </span>
            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="storage"
                  checked={storageType === 'local'}
                  onChange={() => setStorageType('local')}
                  className="rounded-full"
                />
                <span className="text-neutral-700">Remember on this device (Local Storage)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="storage"
                  checked={storageType === 'session'}
                  onChange={() => setStorageType('session')}
                  className="rounded-full"
                />
                <span className="text-neutral-700">This session only (Session Storage)</span>
              </label>
            </div>
          </div>

          {/* Test Connection Button & Result */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              disabled={testing || !apiKey}
              onClick={handleTestConnection}
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-2xs hover:bg-neutral-50 disabled:opacity-50"
            >
              {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-neutral-500" />}
              <span>{testing ? 'Testing connection...' : 'Test Connection / Ping API'}</span>
            </button>

            {testResult && (
              <div
                className={`rounded-lg p-3 flex items-start gap-2 text-xs ${
                  testResult.ok
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border border-red-200 bg-red-50 text-red-800'
                }`}
              >
                {testResult.ok ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-6 py-3.5">
          <div className="text-[11px] font-mono text-neutral-500">
            {apiKey ? '🟢 Key ready' : '🟡 Key required to run experiments'}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg bg-neutral-900 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-neutral-800 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

