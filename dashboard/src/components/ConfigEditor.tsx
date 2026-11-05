import React, { useState } from 'react';
import {
  ExperimentConfig,
  Persona,
} from '@/types/experiment';
import { DEFAULT_CONFIG } from '@/lib/sampleData';
import { ApiSettings, PROVIDER_PRESETS } from './ApiSettingsModal';
import {
  Play,
  RotateCcw,
  Download,
  Upload,
  Cpu,
  FileText,
  Users,
  Key,
  Sliders,
  ExternalLink
} from 'lucide-react';

interface ConfigEditorProps {
  config: ExperimentConfig;
  onChangeConfig: (newConfig: ExperimentConfig) => void;
  onLaunchExperiment: () => void;
  nextExpId: string;
  apiSettings: ApiSettings;
  onOpenApiSettings: () => void;
}

export const ConfigEditor: React.FC<ConfigEditorProps> = ({
  config,
  onChangeConfig,
  onLaunchExperiment,
  nextExpId,
  apiSettings,
  onOpenApiSettings,
}) => {
  const [activeSection, setActiveSection] = useState<'deliberation' | 'models' | 'prompts' | 'personas'>('deliberation');

  const hasApiKey = Boolean(apiSettings.apiKey && apiSettings.apiKey.length > 0);
  const currentPreset = PROVIDER_PRESETS[apiSettings.provider] || PROVIDER_PRESETS.together;

  const updateModelConfig = (field: string, value: any) => {
    onChangeConfig({
      ...config,
      model_config: {
        ...config.model_config,
        [field]: value,
      },
    });
  };

  const updateModelParams = (field: string, value: any) => {
    onChangeConfig({
      ...config,
      model_config: {
        ...config.model_config,
        model_parameters: {
          ...config.model_config.model_parameters,
          [field]: value,
        },
      },
    });
  };

  const updateSystemPrompts = (field: string, value: any) => {
    onChangeConfig({
      ...config,
      system_prompts: {
        ...config.system_prompts,
        [field]: value,
      },
    });
  };

  const updateDeliberationConfig = (field: string, value: any) => {
    onChangeConfig({
      ...config,
      deliberation_config: {
        ...config.deliberation_config,
        [field]: value,
      },
    });
  };

  const updatePersona = (index: number, updated: Partial<Persona>) => {
    const newPersonas = [...config.system_prompts.personas];
    newPersonas[index] = { ...newPersonas[index], ...updated };
    updateSystemPrompts('personas', newPersonas);
  };

  const resetToDefault = () => {
    if (confirm('Reset all parameters to default config.json values?')) {
      onChangeConfig(JSON.parse(JSON.stringify(DEFAULT_CONFIG)));
    }
  };

  const exportConfigJson = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.model_config && parsed.system_prompts) {
          onChangeConfig(parsed);
          alert('Config imported successfully!');
        } else {
          alert('Invalid config.json format.');
        }
      } catch {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleRunClick = () => {
    if (!hasApiKey) {
      onOpenApiSettings();
      return;
    }
    onLaunchExperiment();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-neutral-100 px-2 py-0.5 font-mono text-[11px] font-bold text-neutral-800">
              config.json Studio
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              Target ID: <strong className="text-neutral-900">{nextExpId}</strong>
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 mt-1">
            Experiment Configuration & Runner
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Configure agent models, sampling temperatures, deliberation turn budget, and prompts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetToDefault}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 shadow-2xs"
            title="Reset to default config.json"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={exportConfigJson}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 shadow-2xs"
            title="Download config.json"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export</span>
          </button>

          <label className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 shadow-2xs cursor-pointer">
            <Upload className="h-3.5 w-3.5" />
            <span>Import</span>
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>

          <button
            onClick={handleRunClick}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold shadow-xs transition-colors ${
              hasApiKey
                ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                : 'bg-amber-600 text-white hover:bg-amber-700'
            }`}
          >
            {hasApiKey ? <Play className="h-3.5 w-3.5 fill-current" /> : <Key className="h-3.5 w-3.5" />}
            <span>{hasApiKey ? `Run Experiment (${nextExpId})` : 'Set Key & Run'}</span>
          </button>
        </div>
      </div>

      {/* API Key BYOK Banner / Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 text-xs">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg border shrink-0 ${
              hasApiKey ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'
            }`}
          >
            <Key className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-neutral-900">
                Active Provider: {currentPreset.name}
              </span>
              <span className="font-mono text-[10px] text-neutral-400">
                ({apiSettings.baseUrl})
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              {hasApiKey
                ? 'Your custom API key is loaded locally in this browser. Compute will be billed to your own account.'
                : 'No API key set. Add your Together AI, OpenAI, Groq, or OpenRouter key to run simulations.'}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenApiSettings}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-neutral-200 bg-white px-3 py-1.5 font-medium text-neutral-700 hover:bg-neutral-50 shadow-2xs"
        >
          <span>{hasApiKey ? 'Change Key / Provider' : 'Enter API Key'}</span>
        </button>
      </div>

      {/* Configuration Section Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-2">
        <button
          onClick={() => setActiveSection('deliberation')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
            activeSection === 'deliberation'
              ? 'bg-neutral-900 text-white'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Deliberation Protocol</span>
        </button>

        <button
          onClick={() => setActiveSection('models')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
            activeSection === 'models'
              ? 'bg-neutral-900 text-white'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <Cpu className="h-3.5 w-3.5" />
          <span>Models & Parameters</span>
        </button>

        <button
          onClick={() => setActiveSection('prompts')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
            activeSection === 'prompts'
              ? 'bg-neutral-900 text-white'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Topic & Prompts</span>
        </button>

        <button
          onClick={() => setActiveSection('personas')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
            activeSection === 'personas'
              ? 'bg-neutral-900 text-white'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Personas ({config.system_prompts.personas.length})</span>
        </button>
      </div>

      {/* Tab: Deliberation Protocol */}
      {activeSection === 'deliberation' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900">
              Dialogue Turns & Matrix
            </h3>

            <div>
              <label className="text-xs font-medium text-neutral-700 block">
                Max Turns Per Agent (Rounds):{' '}
                <span className="font-mono font-bold text-neutral-900">
                  {config.deliberation_config.max_turns_per_agent}
                </span>
              </label>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={config.deliberation_config.max_turns_per_agent}
                onChange={(e) => updateDeliberationConfig('max_turns_per_agent', parseInt(e.target.value, 10))}
                className="w-full mt-2"
              />
              <p className="text-[11px] text-neutral-400 mt-1">
                Each round generates 1 turn per persona. E.g. 3 rounds = 6 conversational turns total.
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-700 block">
                Total Trials:
              </label>
              <input
                type="number"
                min={1}
                max={5}
                value={config.deliberation_config.total_trials}
                onChange={(e) => updateDeliberationConfig('total_trials', parseInt(e.target.value, 10))}
                className="w-24 mt-1 rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-700 block mb-2">
                Evaluation Metrics Enabled:
              </label>
              <div className="space-y-2">
                {[
                  { id: 'cosine_similarity', label: 'Cosine Similarity (Consensus & Self-Shift)' },
                  { id: 'covd', label: 'CovD (Plurality Gram Matrix Determinant)' },
                  { id: 'dqi', label: 'DQI (Discourse Quality Index LLM-as-a-Judge)' },
                ].map((m) => {
                  const isChecked = config.deliberation_config.eval_metrics.includes(m.id);
                  return (
                    <label key={m.id} className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const current = config.deliberation_config.eval_metrics;
                          const next = e.target.checked
                            ? [...current, m.id]
                            : current.filter((x) => x !== m.id);
                          updateDeliberationConfig('eval_metrics', next);
                        }}
                        className="rounded border-neutral-300"
                      />
                      <span>{m.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* System 1 vs System 2 Prompt Addition Configuration */}
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900">
              Run Configurations (System 1 vs System 2)
            </h3>

            {/* Run A (Control) */}
            <div className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-800">Control (run_A_control)</span>
                <span className="font-mono text-[10px] text-neutral-500">extract_tags: false</span>
              </div>
              <textarea
                value={config.deliberation_config.runs[0]?.system_prompt_addition || ''}
                onChange={(e) => {
                  const runs = [...config.deliberation_config.runs];
                  runs[0] = { ...runs[0], system_prompt_addition: e.target.value };
                  updateDeliberationConfig('runs', runs);
                }}
                rows={2}
                className="w-full rounded-md border border-neutral-200 bg-white p-2 text-xs font-mono text-neutral-700"
              />
            </div>

            {/* Run B (Treatment) */}
            <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-900">Treatment (run_B_treatment)</span>
                <span className="font-mono text-[10px] text-amber-700 font-bold">extract_tags: true</span>
              </div>
              <textarea
                value={config.deliberation_config.runs[1]?.system_prompt_addition || ''}
                onChange={(e) => {
                  const runs = [...config.deliberation_config.runs];
                  runs[1] = { ...runs[1], system_prompt_addition: e.target.value };
                  updateDeliberationConfig('runs', runs);
                }}
                rows={4}
                className="w-full rounded-md border border-amber-200 bg-white p-2 text-xs font-mono text-neutral-800"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab: Models & Parameters */}
      {activeSection === 'models' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-900">
                Model Assignments
              </h3>
              <div className="text-[11px] text-neutral-400 font-mono">
                Provider: {currentPreset.name}
              </div>
            </div>

            {/* Quick suggested models for active provider */}
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 space-y-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block">
                Quick Apply Model from {currentPreset.name}:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentPreset.suggestedModels.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      updateModelConfig('model_assignments', {
                        'MOE Official': m,
                        Teacher: m,
                        DQI_Judge: m,
                      });
                    }}
                    className="rounded border border-neutral-200 bg-white px-2 py-0.5 text-[10px] font-mono text-neutral-700 hover:border-neutral-900 hover:text-neutral-900 shadow-2xs"
                  >
                    Apply {m.split('/').pop()} to all
                  </button>
                ))}
              </div>
            </div>

            {['MOE Official', 'Teacher', 'DQI_Judge'].map((roleKey) => (
              <div key={roleKey}>
                <label className="text-xs font-medium text-neutral-700 block">
                  {roleKey}:
                </label>
                <input
                  type="text"
                  value={config.model_config.model_assignments[roleKey] || ''}
                  onChange={(e) => {
                    const assignments = { ...config.model_config.model_assignments, [roleKey]: e.target.value };
                    updateModelConfig('model_assignments', assignments);
                  }}
                  className="w-full mt-1 rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-mono"
                />
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900">
              Sampling Hyperparameters
            </h3>

            <div>
              <label className="text-xs font-medium text-neutral-700 block">
                Agent Temperature:{' '}
                <span className="font-mono font-bold text-neutral-900">
                  {config.model_config.model_parameters.agent_temperature}
                </span>
              </label>
              <input
                type="range"
                min={0}
                max={1.0}
                step={0.05}
                value={config.model_config.model_parameters.agent_temperature}
                onChange={(e) => updateModelParams('agent_temperature', parseFloat(e.target.value))}
                className="w-full mt-2"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-700 block">
                Judge Temperature:{' '}
                <span className="font-mono font-bold text-neutral-900">
                  {config.model_config.model_parameters.judge_temperature}
                </span>
              </label>
              <input
                type="range"
                min={0}
                max={0.5}
                step={0.05}
                value={config.model_config.model_parameters.judge_temperature}
                onChange={(e) => updateModelParams('judge_temperature', parseFloat(e.target.value))}
                className="w-full mt-2"
              />
              <p className="text-[10px] text-neutral-400 mt-1">
                Low temperature ensures reproducible, consistent DQI rubric scoring.
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-700 block">
                Random Seed:
              </label>
              <input
                type="text"
                placeholder="None or integer (e.g. 42)"
                value={config.model_config.model_parameters.seed ?? 'None'}
                onChange={(e) => updateModelParams('seed', e.target.value === 'None' ? 'None' : e.target.value)}
                className="w-full mt-1 rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab: Topic & Prompts */}
      {activeSection === 'prompts' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900">
              Topic Prompt
            </h3>
            <textarea
              value={config.system_prompts.topic_prompt}
              onChange={(e) => updateSystemPrompts('topic_prompt', e.target.value)}
              rows={4}
              className="w-full rounded-md border border-neutral-200 p-3 text-xs font-sans text-neutral-800 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs space-y-2">
              <h4 className="text-xs font-semibold text-neutral-900">
                Pre-Stance Prompt
              </h4>
              <textarea
                value={config.system_prompts.pre_stance_prompt}
                onChange={(e) => updateSystemPrompts('pre_stance_prompt', e.target.value)}
                rows={2}
                className="w-full rounded-md border border-neutral-200 p-2 text-xs font-mono text-neutral-800"
              />
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs space-y-2">
              <h4 className="text-xs font-semibold text-neutral-900">
                Post-Stance Prompt
              </h4>
              <textarea
                value={config.system_prompts.post_stance_prompt}
                onChange={(e) => updateSystemPrompts('post_stance_prompt', e.target.value)}
                rows={2}
                className="w-full rounded-md border border-neutral-200 p-2 text-xs font-mono text-neutral-800"
              />
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs space-y-2">
            <h4 className="text-xs font-semibold text-neutral-900">
              DQI Judge Prompt (5 Rubric Dimensions)
            </h4>
            <textarea
              value={config.system_prompts.dqi_judge_prompt}
              onChange={(e) => updateSystemPrompts('dqi_judge_prompt', e.target.value)}
              rows={8}
              className="w-full rounded-md border border-neutral-200 p-3 text-xs font-mono text-neutral-800 leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* Tab: Personas */}
      {activeSection === 'personas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {config.system_prompts.personas.map((persona, idx) => (
            <div key={idx} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-neutral-900">
                  Persona #{idx + 1}
                </span>
                <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-mono text-neutral-600">
                  {persona.id}
                </span>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-700 block">ID:</label>
                <input
                  type="text"
                  value={persona.id}
                  onChange={(e) => updatePersona(idx, { id: e.target.value })}
                  className="w-full mt-1 rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-700 block">Role Title:</label>
                <input
                  type="text"
                  value={persona.role}
                  onChange={(e) => updatePersona(idx, { role: e.target.value })}
                  className="w-full mt-1 rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-sans"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-700 block">System Description / Persona Stance:</label>
                <textarea
                  value={persona.description}
                  onChange={(e) => updatePersona(idx, { description: e.target.value })}
                  rows={4}
                  className="w-full mt-1 rounded-md border border-neutral-200 p-2 text-xs font-sans leading-relaxed"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
