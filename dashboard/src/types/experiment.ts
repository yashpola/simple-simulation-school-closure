export interface Persona {
  id: string;
  role: string;
  description: string;
  model?: string;
}

export interface ModelParameters {
  agent_temperature: number;
  judge_temperature: number;
  context_window: number;
  seed: string | number | null;
}

export interface RunConfig {
  id: string;
  system_prompt_addition: string;
  extract_tags: boolean;
}

export interface ModelConfig {
  model_assignments: Record<string, string>;
  model_parameters: ModelParameters;
}

export interface SystemPromptsConfig {
  topic_prompt: string;
  pre_stance_prompt: string;
  post_stance_prompt: string;
  dqi_judge_prompt: string;
  personas: Persona[];
}

export interface UserPromptsConfig {
  turn_prompt: string;
  personas?: Persona[];
}

export interface DeliberationConfig {
  total_trials: number;
  max_turns_per_agent: number;
  runs: RunConfig[];
  eval_metrics: string[];
}

export interface ExperimentConfig {
  model_config: ModelConfig;
  system_prompts: SystemPromptsConfig;
  user_prompts: UserPromptsConfig;
  deliberation_config: DeliberationConfig;
}

export interface ChatEntry {
  agent: string;
  public_response: string;
  private_scratchpad?: string | null;
}

export interface ExperimentResult {
  stances_pre: Record<string, string>;
  stances_post: Record<string, string>;
  chat_history: Record<string, ChatEntry[]>;
}

export interface DQIScores {
  level_of_justification: number;
  content_of_justification: number;
  respect: number;
  constructive_politics: number;
  interactivity: number;
  total: number;
}

export interface RunMetrics {
  convergence: number;
  self_shift: number;
  covd_pre: number;
  covd_post: number;
  dqi?: DQIScores;
}

export interface EvaluationResults {
  Control: RunMetrics;
  Treatment: RunMetrics;
}

export interface ExperimentRun {
  id: string;
  created_at: string;
  name: string;
  description?: string;
  status: 'running' | 'completed' | 'failed';
  config: ExperimentConfig;
  results_control?: ExperimentResult;
  results_treatment?: ExperimentResult;
  evals?: EvaluationResults;
  metadata?: Record<string, any>;
}

