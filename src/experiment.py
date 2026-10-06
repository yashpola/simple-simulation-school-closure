import os
import re
import json
import numpy as np
from openai import OpenAI
from sentence_transformers import SentenceTransformer

# Load embedding model globally to avoid reloading
print("Loading embedding model...")
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

def get_embedding(text: str) -> np.ndarray:
    return embedding_model.encode(text)

def cosine_similarity(v1: np.ndarray, v2: np.ndarray) -> float:
    dot_product = np.dot(v1, v2)
    norm_v1 = np.linalg.norm(v1)
    norm_v2 = np.linalg.norm(v2)
    if norm_v1 == 0 or norm_v2 == 0:
        return 0.0
    return dot_product / (norm_v1 * norm_v2)

def generate_response(client: OpenAI, messages, model, system_prompt, temperature=0.7):
    try:
        completion = client.chat.completions.create(
            model=model,
            messages=[{"role": "system", "content": system_prompt}] + messages,
            temperature=temperature
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"Error calling model {model}: {e}")
        return "Error generating response."

def extract_tags(text: str):
    scratchpad = None
    public_response = text.strip()
    
    scratchpad_match = re.search(r'<private_scratchpad>(.*?)</private_scratchpad>', text, re.DOTALL)
    if scratchpad_match:
        scratchpad = scratchpad_match.group(1).strip()
        
    public_match = re.search(r'<public_response>(.*?)</public_response>', text, re.DOTALL)
    if public_match:
        public_response = public_match.group(1).strip()
    else:
        # If they forgot public tags but used scratchpad tags, remove the scratchpad block
        if scratchpad_match:
            public_response = text.replace(scratchpad_match.group(0), "").strip()
        # Strip any dangling tags
        public_response = public_response.replace("<public_response>", "").replace("</public_response>", "").strip()
            
    return scratchpad, public_response

def run_experiment(client: OpenAI, run_config: dict, config: dict):
    print(f"\n{'='*40}")
    print(f"--- Starting {run_config['id']} ---")
    print(f"{'='*40}")
    
    topic_prompt = config["topic_prompt"]
    personas = config["personas"]
    max_turns = config["max_turns_per_agent"]
    agent_temp = config.get("model_parameters", {}).get("agent_temperature", 0.7)
    
    stances_pre = {}
    stances_post = {}
    
    print("\n[1/3] Generating pre-debate stances...")
    for p in personas:
        sys_prompt = f"{p['description']}\n\nYou are participating in a discussion. Based on your persona, write a 1-paragraph stance on the following topic:\n{topic_prompt}"
        stance = generate_response(client, [{"role": "user", "content": "What is your stance?"}], p["model"], sys_prompt, temperature=agent_temp)
        stances_pre[p["id"]] = stance
        print(f"  ✓ {p['id']} ({p['role']}) Pre-stance generated.")

    print("\n[2/3] Starting deliberation...")
    chat_history = []
    
    for round_num in range(max_turns):
        print(f"\n--- Round {round_num + 1} ---")
        for p in personas:
            sys_prompt = f"{p['description']}\n\nTopic: {topic_prompt}\n{run_config['system_prompt_addition']}"
            
            messages = []
            for entry in chat_history:
                # We show the chat history as user messages to the model to represent what others said.
                role = "assistant" if entry["agent"] == p["id"] else "user"
                
                content = entry['public_response']
                if role == "user":
                    content = f"[{entry['agent']}]: {entry['public_response']}"
                elif role == "assistant" and entry.get('private_scratchpad'):
                    # Remind the agent of its own past private thoughts for continuity
                    content = f"<private_scratchpad>\n{entry['private_scratchpad']}\n</private_scratchpad>\n<public_response>\n{entry['public_response']}\n</public_response>"
                    
                messages.append({"role": role, "content": content})
            
            messages.append({"role": "user", "content": "It is your turn to speak. Provide your response."})
            
            raw_response = generate_response(client, messages, p["model"], sys_prompt, temperature=agent_temp)
            
            scratchpad = None
            public_response = raw_response
            
            if run_config.get("extract_tags", False):
                scratchpad, public_response = extract_tags(raw_response)
                
            chat_history.append({
                "agent": p["id"], 
                "public_response": public_response,
                "private_scratchpad": scratchpad,
                "raw_response": raw_response
            })
            # Print a snippet of what they said
            print(f"[{p['id']} - {p['role']}]: {public_response[:120]}...\n")

    print("\n[3/3] Generating post-debate stances...")
    for p in personas:
        sys_prompt = f"{p['description']}\n\nTopic: {topic_prompt}\nYou have just concluded a deliberation with other citizens. Based on the discussion, write your final 1-paragraph stance."
        
        messages = []
        for entry in chat_history:
            messages.append({"role": "user", "content": f"[{entry['agent']}]: {entry['public_response']}"})
        messages.append({"role": "user", "content": "Based on the discussion above, what is your final stance on the topic?"})
        
        stance = generate_response(client, messages, p["model"], sys_prompt, temperature=agent_temp)
        stances_post[p["id"]] = stance
        print(f"  ✓ {p['id']} ({p['role']}) Post-stance generated.")

    return {
        "stances_pre": stances_pre,
        "stances_post": stances_post,
        "chat_history": chat_history
    }

def calculate_cosine_metrics(stances_pre, stances_post):
    post_embeddings = [get_embedding(stances_post[pid]) for pid in stances_post]
    pairwise_sims = []
    for i in range(len(post_embeddings)):
        for j in range(i+1, len(post_embeddings)):
            pairwise_sims.append(cosine_similarity(post_embeddings[i], post_embeddings[j]))
    avg_convergence = np.mean(pairwise_sims) if pairwise_sims else 0.0
    
    self_shifts = []
    for pid in stances_pre:
        emb_pre = get_embedding(stances_pre[pid])
        emb_post = get_embedding(stances_post[pid])
        sim = cosine_similarity(emb_pre, emb_post)
        self_shifts.append(1.0 - sim) # Distance
    avg_self_shift = np.mean(self_shifts) if self_shifts else 0.0
    
    return avg_convergence, avg_self_shift

def calculate_covd(stances):
    # Embedding covariance matrix determinant (Plurality of opinion)
    # Using the determinant of the Gram matrix for N vectors to measure volume/plurality
    embeddings = np.array([get_embedding(stances[pid]) for pid in stances])
    gram_matrix = np.dot(embeddings, embeddings.T)
    # The determinant of the Gram matrix corresponds to the square of the volume spanned by the embeddings
    covd = np.linalg.det(gram_matrix)
    return covd

def calculate_dqi(client: OpenAI, chat_history, judge_model, judge_prompt, judge_temperature=0.1):
    # LLM-as-a-Judge for Discourse Quality Index (DQI) - Turn-by-Turn
    components = {
        "level_of_justification": 0.0,
        "content_of_justification": 0.0,
        "respect": 0.0,
        "constructive_politics": 0.0,
        "interactivity": 0.0
    }
    
    if not chat_history:
        components["total"] = 0.0
        return components
        
    system_prompt = judge_prompt

    turn_scores = {k: 0.0 for k in components}
    valid_turns = 0
    context_so_far = ""
    
    for entry in chat_history:
        current_turn = f"[{entry['agent']}]: {entry['public_response']}"
        prompt_content = f"Context of previous turns:\n{context_so_far}\n\n" if context_so_far else "Context of previous turns: (None, this is the first turn)\n\n"
        prompt_content += f"Evaluate THIS specific turn:\n{current_turn}\n\nProvide the JSON evaluation:"
        
        try:
            response = client.chat.completions.create(
                model=judge_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt_content}
                ],
                temperature=judge_temperature
            )
            
            content = response.choices[0].message.content.strip()
            if content.startswith("```json"):
                content = content[7:]
            elif content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
                
            result = json.loads(content.strip())
            
            turn_scores["level_of_justification"] += float(result.get("level_of_justification", 0.0))
            turn_scores["content_of_justification"] += float(result.get("content_of_justification", 0.0))
            turn_scores["respect"] += float(result.get("respect", 0.0))
            turn_scores["constructive_politics"] += float(result.get("constructive_politics", 0.0))
            turn_scores["interactivity"] += float(result.get("interactivity", 0.0))
            valid_turns += 1
            
        except Exception as e:
            print(f"Error calculating DQI for turn with judge model: {e}")
            
        context_so_far += current_turn + "\n\n"

    if valid_turns > 0:
        for k in components:
            components[k] = turn_scores[k] / valid_turns

    components["total"] = sum(components.values())
    return components

def analyze_results(client: OpenAI, config: dict, results_A, results_B):
    print(f"\n{'='*40}")
    print("--- Analysis ---")
    print(f"{'='*40}")
    
    eval_metrics = config.get("eval_metrics", [])
    
    # Run A
    conv_A, shift_A = calculate_cosine_metrics(results_A["stances_pre"], results_A["stances_post"])
    covd_pre_A = calculate_covd(results_A["stances_pre"])
    covd_post_A = calculate_covd(results_A["stances_post"])
    
    # Run B
    conv_B, shift_B = calculate_cosine_metrics(results_B["stances_pre"], results_B["stances_post"])
    covd_pre_B = calculate_covd(results_B["stances_pre"])
    covd_post_B = calculate_covd(results_B["stances_post"])
    
    print(f"Run A (Control):")
    if "cosine_similarity" in eval_metrics:
        print(f"  Convergence = {conv_A:.4f}, Self-Shift = {shift_A:.4f}")
    if "covd" in eval_metrics:
        print(f"  Plurality (CovD): Pre = {covd_pre_A:.4f} -> Post = {covd_post_A:.4f}")
        
    print(f"\nRun B (Treatment):")
    if "cosine_similarity" in eval_metrics:
        print(f"  Convergence = {conv_B:.4f}, Self-Shift = {shift_B:.4f}")
    if "covd" in eval_metrics:
        print(f"  Plurality (CovD): Pre = {covd_pre_B:.4f} -> Post = {covd_post_B:.4f}")

    if "dqi" in eval_metrics:
        judge_model = config.get("model_assignments", {}).get("DQI_Judge", "meta-llama/Llama-3.3-70B-Instruct-Turbo")
        judge_prompt = config.get("dqi_judge_prompt", "You are an expert DQI evaluator...")
        judge_temp = config.get("model_parameters", {}).get("judge_temperature", 0.1)
        print("\nCalculating DQI with LLM Judge...")
        dqi_A = calculate_dqi(client, results_A["chat_history"], judge_model, judge_prompt, judge_temp)
        dqi_B = calculate_dqi(client, results_B["chat_history"], judge_model, judge_prompt, judge_temp)
        
        print(f"\nDQI Results:")
        print(f"Run A (Control) DQI (Total = {dqi_A['total']:.2f}):")
        print(f"    - Level of Justification: {dqi_A['level_of_justification']:.2f}")
        print(f"    - Content of Justification: {dqi_A['content_of_justification']:.2f}")
        print(f"    - Respect: {dqi_A['respect']:.2f}")
        print(f"    - Constructive Politics: {dqi_A['constructive_politics']:.2f}")
        print(f"    - Interactivity: {dqi_A['interactivity']:.2f}")
        
        print(f"\nRun B (Treatment) DQI (Total = {dqi_B['total']:.2f}):")
        print(f"    - Level of Justification: {dqi_B['level_of_justification']:.2f}")
        print(f"    - Content of Justification: {dqi_B['content_of_justification']:.2f}")
        print(f"    - Respect: {dqi_B['respect']:.2f}")
        print(f"    - Constructive Politics: {dqi_B['constructive_politics']:.2f}")
        print(f"    - Interactivity: {dqi_B['interactivity']:.2f}")
        
    print("\nConclusion:")
    if "cosine_similarity" in eval_metrics:
        if conv_B > conv_A:
            print("✅ Treatment increased consensus (Higher Convergence).")
        else:
            print("❌ Treatment did NOT increase consensus.")
            
        if shift_B > shift_A:
            print("✅ Treatment increased willingness to change stance (Higher Self-Shift).")
        else:
            print("❌ Treatment did NOT increase willingness to change stance.")
            
    if "dqi" in eval_metrics:
        if dqi_B['total'] > dqi_A['total']:
            print("✅ Treatment improved overall Discourse Quality Index (Higher DQI).")
        else:
            print("❌ Treatment did NOT improve overall Discourse Quality Index.")
