from typing import List, Dict, Optional, TypedDict

class Persona(TypedDict, total=False):
    id: str
    role: str
    description: str
    model: str

class ModelParameters(TypedDict, total=False):
    agent_temperature: float
    judge_temperature: float
    context_window: int

class RunConfig(TypedDict, total=False):
    id: str
    system_prompt_addition: str
    extract_tags: bool

class ModelConfig(TypedDict, total=False):
    model_assignments: Dict[str, str]
    model_parameters: ModelParameters

class SystemPromptsConfig(TypedDict, total=False):
    topic_prompt: str
    pre_stance_prompt: str
    post_stance_prompt: str
    dqi_judge_prompt: str

class UserPromptsConfig(TypedDict, total=False):
    personas: List[Persona]
    turn_prompt: str

class DeliberationConfigSchema(TypedDict, total=False):
    max_turns_per_agent: int
    runs: List[RunConfig]
    eval_metrics: List[str]

class ExperimentConfig(TypedDict, total=False):
    model_config: ModelConfig
    system_prompts: SystemPromptsConfig
    user_prompts: UserPromptsConfig
    deliberation_config: DeliberationConfigSchema

class ChatEntry(TypedDict):
    agent: str
    public_response: str
    private_scratchpad: Optional[str]
    raw_response: str

class ExperimentResult(TypedDict):
    stances_pre: Dict[str, str]
    stances_post: Dict[str, str]
    chat_history: Dict[str, List[ChatEntry]]

class DQIScores(TypedDict):
    level_of_justification: float
    content_of_justification: float
    respect: float
    constructive_politics: float
    interactivity: float
    total: float
