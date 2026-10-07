import re
from openai import OpenAI
from typing import List, Dict, Optional, Tuple
from schemas import RunConfig, ExperimentConfig, ChatEntry, ExperimentResult

def generate_llm_response(
    client: OpenAI,
    messages: List[Dict[str, str]],
    model: str,
    system_prompt: str,
    temperature: float = 0.7,
) -> str:
    """
    Call the LLM API to generate a response given a message history and system prompt.
    """
    try:
        completion = client.chat.completions.create(
            model=model,
            messages=[{"role": "system", "content": system_prompt}] + messages,
            temperature=temperature,
        )
        return completion.choices[0].message.content or ""
    except Exception as e:
        print(f"Error calling model {model}: {e}")
        return "Error generating response."


def extract_internal_monologue_and_public_response(text: str) -> Tuple[Optional[str], str]:
    """
    Extract the private scratchpad (internal monologue) and the public response from the LLM's raw text generation.
    """
    scratchpad: Optional[str] = None
    public_response: str = text.strip()

    scratchpad_match = re.search(
        r"<private_scratchpad>(.*?)</private_scratchpad>", text, re.DOTALL
    )
    if scratchpad_match:
        scratchpad = scratchpad_match.group(1).strip()

    public_match = re.search(
        r"<public_response>(.*?)</public_response>", text, re.DOTALL
    )
    if public_match:
        public_response = public_match.group(1).strip()
    else:
        # If they forgot public tags but used scratchpad tags, remove the scratchpad block
        if scratchpad_match:
            public_response = text.replace(scratchpad_match.group(0), "").strip()
        # Strip any dangling tags
        public_response = (
            public_response.replace("<public_response>", "")
            .replace("</public_response>", "")
            .strip()
        )

    return scratchpad, public_response


def generate_initial_stances(
    client: OpenAI,
    config: ExperimentConfig,
    agent_temperature: float,
) -> Dict[str, str]:
    """
    Prompt each persona to generate their initial 1-paragraph stance on the topic before any deliberation occurs.
    """
    print("\n[1/3] Generating pre-debate stances...")
    stances_pre: Dict[str, str] = {}
    topic_prompt = config.get("system_prompts", {}).get("topic_prompt", "")
    
    pre_stance_prompt = config.get("system_prompts", {}).get("pre_stance_prompt", "")
    for p in config.get("user_prompts", {}).get("personas", []):
        sys_prompt = f"{p.get('description', '')}\n\n{pre_stance_prompt}\n{topic_prompt}"
        stance = generate_llm_response(
            client,
            [{"role": "user", "content": "What is your stance?"}],
            p.get("model", ""),
            sys_prompt,
            temperature=agent_temperature,
        )
        stances_pre[p["id"]] = stance
        print(f"  ✓ {p['id']} ({p.get('role', '')}) Pre-stance generated.")
        
    return stances_pre


def conduct_deliberation(
    client: OpenAI,
    run_config: RunConfig,
    config: ExperimentConfig,
    agent_temperature: float,
) -> Dict[str, List[ChatEntry]]:
    """
    Execute the multi-turn deliberation chat among personas based on the configuration and prompt settings.
    """
    print("\n[2/3] Starting deliberation...")
    chat_history: Dict[str, List[ChatEntry]] = {}
    topic_prompt = config.get("system_prompts", {}).get("topic_prompt", "")
    turn_prompt = config.get("user_prompts", {}).get("turn_prompt", "")
    max_turns = config.get("deliberation_config", {}).get("max_turns_per_agent", 1)
    personas = config.get("user_prompts", {}).get("personas", [])

    for round_num in range(max_turns):
        print(f"\n--- Round {round_num + 1} ---")
        turn_key = f"turn_{round_num + 1}"
        chat_history[turn_key] = []
        for p in personas:
            sys_prompt = f"{p.get('description', '')}\n\nTopic: {topic_prompt}\n{run_config.get('system_prompt_addition', '')}"

            messages: List[Dict[str, str]] = []
            for past_turn in chat_history.values():
                for entry in past_turn:
                    # We show the chat history as user messages to the model to represent what others said.
                    role = "assistant" if entry["agent"] == p["id"] else "user"

                    content = entry["public_response"]
                    if role == "user":
                        content = f"[{entry['agent']}]: {entry['public_response']}"
                    elif role == "assistant" and entry.get("private_scratchpad"):
                        # Remind the agent of its own past private thoughts for continuity
                        content = f"<private_scratchpad>\n{entry['private_scratchpad']}\n</private_scratchpad>\n<public_response>\n{entry['public_response']}\n</public_response>"

                    messages.append({"role": role, "content": content})

            messages.append(
                {
                    "role": "user",
                    "content": turn_prompt,
                }
            )

            raw_response = generate_llm_response(
                client, messages, p.get("model", ""), sys_prompt, temperature=agent_temperature
            )

            scratchpad: Optional[str] = None
            public_response: str = raw_response

            if run_config.get("extract_tags", False):
                scratchpad, public_response = extract_internal_monologue_and_public_response(raw_response)

            # Strip any role prefix like [Heritage School Teacher]: or MOE Official:
            role_pattern = r'^(?:\[.*?\]|(?:Heritage School Teacher|MOE Official|Teacher)):?\s*'
            public_response = re.sub(role_pattern, '', public_response, flags=re.IGNORECASE)
            raw_response = re.sub(role_pattern, '', raw_response, flags=re.IGNORECASE)

            chat_history[turn_key].append(
                {
                    "agent": p["id"],
                    "public_response": public_response,
                    "private_scratchpad": scratchpad,
                    "raw_response": raw_response,
                }
            )
            print(f"[{p['id']} - {p.get('role', '')}]: {public_response[:120]}...\n")
            
    return chat_history


def generate_final_stances(
    client: OpenAI,
    config: ExperimentConfig,
    chat_history: Dict[str, List[ChatEntry]],
    agent_temperature: float,
) -> Dict[str, str]:
    """
    Prompt each persona to generate their final 1-paragraph stance after reflecting on the complete deliberation.
    """
    print("\n[3/3] Generating post-debate stances...")
    stances_post: Dict[str, str] = {}
    topic_prompt = config.get("system_prompts", {}).get("topic_prompt", "")
    
    post_stance_prompt = config.get("system_prompts", {}).get("post_stance_prompt", "")
    for p in config.get("user_prompts", {}).get("personas", []):
        sys_prompt = f"{p.get('description', '')}\n\nTopic: {topic_prompt}\n{post_stance_prompt}"

        messages = []
        for past_turn in chat_history.values():
            for entry in past_turn:
                messages.append(
                    {
                        "role": "user",
                        "content": f"[{entry['agent']}]: {entry['public_response']}",
                    }
                )
        messages.append(
            {
                "role": "user",
                "content": "Based on the discussion above, what is your final stance on the topic?",
            }
        )

        stance = generate_llm_response(
            client, messages, p.get("model", ""), sys_prompt, temperature=agent_temperature
        )
        stances_post[p["id"]] = stance
        print(f"  ✓ {p['id']} ({p.get('role', '')}) Post-stance generated.")
        
    return stances_post


def execute_simulation_run(
    client: OpenAI, run_config: RunConfig, config: ExperimentConfig, stances_pre: Dict[str, str]
) -> ExperimentResult:
    """
    Orchestrate a single simulation run, gathering initial stances, conducting deliberation, and collecting final stances.
    """
    print(f"\n{'='*40}")
    print(f"--- Starting {run_config.get('id', 'Unknown Run')} ---")
    print(f"{'='*40}")

    agent_temp = config.get("model_config", {}).get("model_parameters", {}).get("agent_temperature", 0.7)

    chat_history = conduct_deliberation(client, run_config, config, agent_temp)
    stances_post = generate_final_stances(client, config, chat_history, agent_temp)

    return {
        "stances_pre": stances_pre,
        "stances_post": stances_post,
        "chat_history": chat_history,
    }

