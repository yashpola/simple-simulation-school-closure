import React, { useState } from 'react';
import {
  ExperimentConfig,
  Persona,
  ReasoningLevel,
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
  Sparkles,
  MessageSquare,
  Brain,
  ShieldCheck,
  Lock
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
    if (confirm('Reset all parameters to default experiment values?')) {
      onChangeConfig(JSON.parse(JSON.stringify(DEFAULT_CONFIG)));
    }
  };

  const exportConfigJson = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'experiment_config.json';
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
          alert('Invalid configuration format.');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-6 sm:p-7 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-neutral-100 px-2.5 py-1 font-mono text-xs font-bold text-neutral-800">
              Experiment Setup & Parameters
            </span>
            <span className="text-xs text-neutral-500 font-mono">
              Target Run: <strong className="text-neutral-900">{nextExpId}</strong>
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 mt-2">
            Configure Deliberation Simulation
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            Customize agent models, sampling temperatures, conversational turn budgets, and prompts for this experiment.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={resetToDefault}
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 shadow-2xs"
            title="Reset to default experiment values"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={exportConfigJson}
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 shadow-2xs"
            title="Export configuration"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export</span>
          </button>

          <label className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 shadow-2xs cursor-pointer">
            <Upload className="h-3.5 w-3.5" />
            <span>Import</span>
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>

          <button
            onClick={handleRunClick}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold shadow-xs transition-colors ${
              hasApiKey
                ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                : 'bg-amber-600 text-white hover:bg-amber-700'
            }`}
          >
            {hasApiKey ? <Play className="h-4 w-4 fill-current" /> : <Key className="h-4 w-4" />}
            <span>{hasApiKey ? `Run Experiment (${nextExpId})` : 'Set Key & Run'}</span>
          </button>
        </div>
      </div>

      {/* API Key BYOK Banner / Status with Security Assurance */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm">
        <div className="flex items-center gap-3.5">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl border shrink-0 ${
              hasApiKey ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
          >
            {hasApiKey ? <ShieldCheck className="h-5 w-5" /> : <Key className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-neutral-900">
                Active Provider: {currentPreset.name}
              </span>
              <span className="font-mono text-xs text-neutral-500">
                ({apiSettings.baseUrl})
              </span>
              {hasApiKey && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-800">
                  <Lock className="h-2.5 w-2.5" />
                  Client-Secured
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-600 mt-0.5">
              {hasApiKey
                ? 'Your key is kept strictly in local browser memory and never written to Supabase or server disks. Compute is billed directly to your own provider.'
                : 'No API key configured. Provide your Together AI, OpenAI, Groq, or OpenRouter key to launch runs.'}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenApiSettings}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-neutral-300 bg-white px-4 py-2 font-semibold text-neutral-800 hover:bg-neutral-50 shadow-2xs text-xs"
        >
          <span>{hasApiKey ? 'Security & Key Settings' : 'Enter API Key'}</span>
        </button>
      </div>

      {/* Configuration Section Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
        <button
          onClick={() => setActiveSection('deliberation')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
            activeSection === 'deliberation'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>Deliberation Protocol</span>
        </button>

        <button
          onClick={() => setActiveSection('models')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
            activeSection === 'models'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <Cpu className="h-4 w-4" />
          <span>Models & Parameters</span>
        </button>

        <button
          onClick={() => setActiveSection('prompts')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
            activeSection === 'prompts'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Topic & Prompts</span>
        </button>

        <button
          onClick={() => setActiveSection('personas')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
            activeSection === 'personas'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Personas ({config.system_prompts.personas.length})</span>
        </button>
      </div>

      {/* Tab 1: Deliberation Protocol */}
      {activeSection === 'deliberation' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-5">
            <h3 className="text-base font-bold text-neutral-950">
              Dialogue Turns & Evaluation Matrix
            </h3>

            <div>
              <label className="text-sm font-semibold text-neutral-800 block">
                Max Turns Per Agent (Rounds):{' '}
                <span className="font-mono font-bold text-neutral-950">
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
              <p className="text-xs text-neutral-500 mt-1">
                Each round generates 1 turn per persona. (e.g. 3 rounds = 6 dialogue turns total).
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-neutral-800 block">
                Total Trials:
              </label>
              <input
                type="number"
                min={1}
                max={5}
                value={config.deliberation_config.total_trials}
                onChange={(e) => updateDeliberationConfig('total_trials', parseInt(e.target.value, 10))}
                className="w-28 mt-1.5 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-mono font-semibold"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-neutral-800 block mb-2.5">
                Evaluation Metrics Enabled:
              </label>
              <div className="space-y-2.5">
                {[
                  { id: 'cosine_similarity', label: 'Consensus (Convergence) & Stance Change (Self-Shift)' },
                  { id: 'covd', label: 'Plurality of Opinion (Gram Matrix CovD Determinant)' },
                  { id: 'dqi', label: 'Discourse Quality Index (DQI LLM-as-a-Judge 5-Criteria Rubric)' },
                ].map((m) => {
                  const isChecked = config.deliberation_config.eval_metrics.includes(m.id);
                  return (
                    <label key={m.id} className="flex items-center gap-2.5 text-sm text-neutral-800 cursor-pointer">
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
                        className="rounded border-neutral-300 h-4 w-4"
                      />
                      <span>{m.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Deliberation Conditions Compared (Human-friendly labels, no code-specific variable names) */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-5">
            <h3 className="text-base font-bold text-neutral-950">
              Deliberation Conditions Compared
            </h3>

            {/* Condition 1: Standard Deliberation */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <span className="font-bold text-sm text-neutral-900">
                  Condition 1: Standard Deliberation
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                Direct dialogue where agents reply directly in persona to previous arguments.
              </p>
              <textarea
                value={config.deliberation_config.runs[0]?.system_prompt_addition || ''}
                onChange={(e) => {
                  const runs = [...config.deliberation_config.runs];
                  runs[0] = { ...runs[0], system_prompt_addition: e.target.value };
                  updateDeliberationConfig('runs', runs);
                }}
                rows={2}
                className="w-full rounded-lg border border-neutral-300 bg-white p-2.5 text-xs text-neutral-800 leading-relaxed font-sans"
              />
            </div>

            {/* Condition 2: Reflective Deliberation */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-amber-700" />
                <span className="font-bold text-sm text-amber-950">
                  Condition 2: Reflective Deliberation
                </span>
              </div>
              <p className="text-xs text-amber-900">
                Requires agents to write an internal reflection scratchpad before stating their public response.
              </p>
              <textarea
                value={config.deliberation_config.runs[1]?.system_prompt_addition || ''}
                onChange={(e) => {
                  const runs = [...config.deliberation_config.runs];
                  runs[1] = { ...runs[1], system_prompt_addition: e.target.value };
                  updateDeliberationConfig('runs', runs);
                }}
                rows={4}
                className="w-full rounded-lg border border-amber-300 bg-white p-2.5 text-xs text-neutral-800 leading-relaxed font-sans"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Models & Parameters */}
      {activeSection === 'models' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-neutral-950">
                Model Assignments
              </h3>
              <div className="text-xs text-neutral-500 font-mono font-medium">
                Provider: {currentPreset.name}
              </div>
            </div>

            {/* Quick suggested models for active provider */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 space-y-2">
              <span className="text-xs font-bold text-neutral-700 block">
                Quick Apply Model from {currentPreset.name}:
              </span>
              <div className="flex flex-wrap gap-2">
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
                    className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-xs font-mono font-medium text-neutral-800 hover:border-neutral-900 hover:text-neutral-950 shadow-2xs"
                  >
                    Apply {m.split('/').pop()} to all
                  </button>
                ))}
              </div>
            </div>

            {['MOE Official', 'Teacher', 'DQI_Judge'].map((roleKey) => (
              <div key={roleKey}>
                <label className="text-sm font-semibold text-neutral-800 block">
                  {roleKey}:
                </label>
                <input
                  type="text"
                  value={config.model_config.model_assignments[roleKey] || ''}
                  onChange={(e) => {
                    const assignments = { ...config.model_config.model_assignments, [roleKey]: e.target.value };
                    updateModelConfig('model_assignments', assignments);
                  }}
                  className="w-full mt-1.5 rounded-lg border border-neutral-300 px-3.5 py-2 text-sm font-mono text-neutral-900 shadow-2xs"
                />
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-5">
            <h3 className="text-base font-bold text-neutral-950">
              Sampling Hyperparameters
            </h3>

            <div>
              <label className="text-sm font-semibold text-neutral-800 block">
                Agent Temperature:{' '}
                <span className="font-mono font-bold text-neutral-950">
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
              <label className="text-sm font-semibold text-neutral-800 block">
                Judge Temperature:{' '}
                <span className="font-mono font-bold text-neutral-950">
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
              <p className="text-xs text-neutral-500 mt-1">
                Low temperature ensures reproducible, consistent scoring across the DQI rubric.
              </p>
            </div>

            {/* Max Output Tokens */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-neutral-800">
                  Max Tokens (Generation Limit):
                </label>
                <div className="flex gap-1">
                  {[1024, 2048, 4096].map((tok) => (
                    <button
                      key={tok}
                      type="button"
                      onClick={() => updateModelParams('max_tokens', tok)}
                      className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-colors ${
                        config.model_config.model_parameters.max_tokens === tok
                          ? 'border-neutral-900 bg-neutral-900 text-white font-bold'
                          : 'border-neutral-300 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      {tok}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                min={256}
                max={16384}
                step={256}
                value={config.model_config.model_parameters.max_tokens ?? 2048}
                onChange={(e) => updateModelParams('max_tokens', parseInt(e.target.value, 10) || 2048)}
                className="w-full mt-1.5 rounded-lg border border-neutral-300 px-3.5 py-2 text-sm font-mono shadow-2xs"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Upper token generation limit per stance and conversational turn. Automatically mapped to <code className="font-mono text-[11px] bg-neutral-100 px-1 py-0.5 rounded text-neutral-800">max_completion_tokens</code> for OpenAI o-series models.
              </p>
            </div>

            {/* Reasoning Level with Cross-Model Smart Adapter Explanation */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-neutral-800">
                  Reasoning Level:
                </label>
                <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-900 border border-amber-200">
                  <Brain className="h-2.5 w-2.5" />
                  Smart Model Adapter
                </span>
              </div>
              <select
                value={config.model_config.model_parameters.reasoning_level ?? 'auto'}
                onChange={(e) => updateModelParams('reasoning_level', e.target.value as ReasoningLevel)}
                className="w-full mt-1.5 rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-sm font-sans font-medium text-neutral-900 shadow-2xs"
              >
                <option value="auto">Auto / Model Default (Recommended)</option>
                <option value="off">Off (Disable native thinking tokens / fast)</option>
                <option value="low">Low (Fast, ~1,000 thinking tokens / brief reflection)</option>
                <option value="medium">Medium (Balanced, ~2,000 thinking tokens)</option>
                <option value="high">High (Deep, ~4,000 thinking tokens / maximum exploration)</option>
              </select>
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-600 mt-2 space-y-1">
                <p className="font-semibold text-neutral-800">Cross-Model Handling:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-neutral-600">
                  <li><strong>Qwen:</strong> Translated to <code className="font-mono text-neutral-800">reasoning: &#123; enabled &#125;</code> boolean switch.</li>
                  <li><strong>DeepSeek / Muse / GPT-OSS:</strong> Configures thinking token budget & reasoning effort tier.</li>
                  <li><strong>Llama 70B / Mistral:</strong> Safely omits reasoning parameters to avoid HTTP 400 errors.</li>
                </ul>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-neutral-800 block">
                Random Seed:
              </label>
              <input
                type="text"
                placeholder="None or integer (e.g. 42)"
                value={config.model_config.model_parameters.seed ?? 'None'}
                onChange={(e) => updateModelParams('seed', e.target.value === 'None' ? 'None' : e.target.value)}
                className="w-full mt-1.5 rounded-lg border border-neutral-300 px-3.5 py-2 text-sm font-mono shadow-2xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Topic & Prompts */}
      {activeSection === 'prompts' && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-3">
            <h3 className="text-base font-bold text-neutral-950">
              Topic Prompt
            </h3>
            <textarea
              value={config.system_prompts.topic_prompt}
              onChange={(e) => updateSystemPrompts('topic_prompt', e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-neutral-300 p-3.5 text-sm text-neutral-800 leading-relaxed shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-2.5">
              <h4 className="text-sm font-bold text-neutral-950">
                Pre-Stance Prompt (Initial Stance)
              </h4>
              <textarea
                value={config.system_prompts.pre_stance_prompt}
                onChange={(e) => updateSystemPrompts('pre_stance_prompt', e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-neutral-300 p-3 text-sm text-neutral-800 shadow-2xs"
              />
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-2.5">
              <h4 className="text-sm font-bold text-neutral-950">
                Post-Stance Prompt (Final Stance)
              </h4>
              <textarea
                value={config.system_prompts.post_stance_prompt}
                onChange={(e) => updateSystemPrompts('post_stance_prompt', e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-neutral-300 p-3 text-sm text-neutral-800 shadow-2xs"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-2.5">
            <h4 className="text-sm font-bold text-neutral-950">
              DQI Judge Prompt (5-Criteria Rubric)
            </h4>
            <textarea
              value={config.system_prompts.dqi_judge_prompt}
              onChange={(e) => updateSystemPrompts('dqi_judge_prompt', e.target.value)}
              rows={8}
              className="w-full rounded-xl border border-neutral-300 p-3.5 text-xs font-mono text-neutral-800 leading-relaxed shadow-2xs"
            />
          </div>
        </div>
      )}

      {/* Tab 4: Personas */}
      {activeSection === 'personas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {config.system_prompts.personas.map((persona, idx) => (
            <div key={idx} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-neutral-900">
                  Persona #{idx + 1}
                </span>
                <span className="rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-mono font-medium text-neutral-700">
                  {persona.id}
                </span>
              </div>

              <div>
                <label className="text-sm font-semibold text-neutral-800 block">Persona Identifier:</label>
                <input
                  type="text"
                  value={persona.id}
                  onChange={(e) => updatePersona(idx, { id: e.target.value })}
                  className="w-full mt-1.5 rounded-lg border border-neutral-300 px-3.5 py-2 text-sm font-mono shadow-2xs"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-neutral-800 block">Role Title:</label>
                <input
                  type="text"
                  value={persona.role}
                  onChange={(e) => updatePersona(idx, { role: e.target.value })}
                  className="w-full mt-1.5 rounded-lg border border-neutral-300 px-3.5 py-2 text-sm shadow-2xs"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-neutral-800 block">Persona Background & Stance:</label>
                <textarea
                  value={persona.description}
                  onChange={(e) => updatePersona(idx, { description: e.target.value })}
                  rows={4}
                  className="w-full mt-1.5 rounded-xl border border-neutral-300 p-3 text-sm text-neutral-800 leading-relaxed shadow-2xs"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
