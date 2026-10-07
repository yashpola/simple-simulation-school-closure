import json
import numpy as np
from openai import OpenAI
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Optional, Tuple
from schemas import ExperimentConfig, ChatEntry, ExperimentResult, DQIScores

# Load embedding model globally to avoid reloading
print("Loading embedding model...")
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")


def get_embedding(text: str) -> np.ndarray:
    """
    Generate an embedding vector for a given text using the globally loaded SentenceTransformer model.
    """
    return embedding_model.encode(text)


def cosine_similarity(v1: np.ndarray, v2: np.ndarray) -> float:
    """
    Calculate the cosine similarity between two numeric vectors.
    """
    dot_product = np.dot(v1, v2)
    norm_v1 = np.linalg.norm(v1)
    norm_v2 = np.linalg.norm(v2)
    if norm_v1 == 0 or norm_v2 == 0:
        return 0.0
    return float(dot_product / (norm_v1 * norm_v2))


def calculate_cosine_metrics(
    stances_pre: Dict[str, str], stances_post: Dict[str, str]
) -> Tuple[float, float]:
    """
    Calculate the consensus (average convergence between participants' final stances) 
    and self-shift (average change from initial to final stance for each participant).
    """
    post_embeddings = [get_embedding(stances_post[pid]) for pid in stances_post]
    pairwise_sims: List[float] = []
    for i in range(len(post_embeddings)):
        for j in range(i + 1, len(post_embeddings)):
            pairwise_sims.append(
                cosine_similarity(post_embeddings[i], post_embeddings[j])
            )
    avg_convergence = float(np.mean(pairwise_sims)) if pairwise_sims else 0.0

    self_shifts: List[float] = []
    for pid in stances_pre:
        emb_pre = get_embedding(stances_pre[pid])
        emb_post = get_embedding(stances_post[pid])
        sim = cosine_similarity(emb_pre, emb_post)
        self_shifts.append(1.0 - sim)  # Distance
    avg_self_shift = float(np.mean(self_shifts)) if self_shifts else 0.0

    return avg_convergence, avg_self_shift


def calculate_covd(stances: Dict[str, str]) -> float:
    """
    Calculate the Plurality of opinion (CovD) using the determinant of the covariance (Gram) matrix of embeddings.
    """
    embeddings = np.array([get_embedding(stances[pid]) for pid in stances])
    gram_matrix = np.dot(embeddings, embeddings.T)
    covd = float(np.linalg.det(gram_matrix))
    return covd


def evaluate_dqi_for_chat_history(
    client: OpenAI,
    chat_history: Dict[str, List[ChatEntry]],
    judge_model: str,
    judge_prompt: str,
    judge_temperature: float = 0.1,
) -> DQIScores:
    """
    Evaluate the overall Discourse Quality Index (DQI) using an LLM-as-a-Judge for a turn-by-turn evaluation.
    """
    components: DQIScores = {
        "level_of_justification": 0.0,
        "content_of_justification": 0.0,
        "respect": 0.0,
        "constructive_politics": 0.0,
        "interactivity": 0.0,
        "total": 0.0,
    }

    if not chat_history:
        return components

    turn_scores = {k: 0.0 for k in components if k != "total"}
    valid_turns = 0
    context_so_far = ""

    for past_turn in chat_history.values():
        for entry in past_turn:
            current_turn = f"[{entry['agent']}]: {entry['public_response']}"
            prompt_content = (
            f"Context of previous turns:\n{context_so_far}\n\n"
            if context_so_far
            else "Context of previous turns: (None, this is the first turn)\n\n"
            )
            prompt_content += f"Evaluate THIS specific turn:\n{current_turn}\n\nProvide the JSON evaluation:"

            try:
                response = client.chat.completions.create(
                    model=judge_model,
                    messages=[
                        {"role": "system", "content": judge_prompt},
                        {"role": "user", "content": prompt_content},
                    ],
                    temperature=judge_temperature,
                )

                content = response.choices[0].message.content or ""
                content = content.strip()
                if content.startswith("```json"):
                    content = content[7:]
                elif content.startswith("```"):
                    content = content[3:]
                if content.endswith("```"):
                    content = content[:-3]

                result = json.loads(content.strip())

                turn_scores["level_of_justification"] += float(
                    result.get("level_of_justification", 0.0)
                )
                turn_scores["content_of_justification"] += float(
                    result.get("content_of_justification", 0.0)
                )
                turn_scores["respect"] += float(result.get("respect", 0.0))
                turn_scores["constructive_politics"] += float(
                    result.get("constructive_politics", 0.0)
                )
                turn_scores["interactivity"] += float(result.get("interactivity", 0.0))
                valid_turns += 1

            except Exception as e:
                print(f"Error calculating DQI for turn with judge model: {e}")

            context_so_far += current_turn + "\n\n"

    if valid_turns > 0:
        for k in turn_scores:
            # Type ignore since we are dynamically setting TypedDict keys, but we know it's valid
            components[k] = turn_scores[k] / valid_turns  # type: ignore

    components["total"] = sum(v for k, v in components.items() if k != "total")
    return components


def print_run_metrics(
    run_name: str, 
    conv: float, 
    shift: float, 
    covd_pre: float, 
    covd_post: float, 
    eval_metrics: List[str]
) -> None:
    """
    Print the Cosine Similarity and Covariance Determinant (CovD) metrics for a single simulation run.
    """
    print(f"\n{run_name}:")
    if "cosine_similarity" in eval_metrics:
        print(f"  Convergence = {conv:.4f}, Self-Shift = {shift:.4f}")
    if "covd" in eval_metrics:
        print(f"  Plurality (CovD): Pre = {covd_pre:.4f} -> Post = {covd_post:.4f}")


def print_dqi_results(run_name: str, dqi_scores: DQIScores) -> None:
    """
    Print the structured Discourse Quality Index (DQI) breakdown for a single simulation run.
    """
    print(f"\n{run_name} DQI (Total = {dqi_scores['total']:.2f}):")
    print(f"    - Level of Justification: {dqi_scores['level_of_justification']:.2f}")
    print(f"    - Content of Justification: {dqi_scores['content_of_justification']:.2f}")
    print(f"    - Respect: {dqi_scores['respect']:.2f}")
    print(f"    - Constructive Politics: {dqi_scores['constructive_politics']:.2f}")
    print(f"    - Interactivity: {dqi_scores['interactivity']:.2f}")


def print_experiment_conclusion(
    eval_metrics: List[str], 
    conv_A: float, 
    conv_B: float, 
    shift_A: float, 
    shift_B: float, 
    dqi_A: Optional[DQIScores] = None, 
    dqi_B: Optional[DQIScores] = None
) -> None:
    """
    Compare the metrics between the Control and Treatment runs to draw a conclusion on the experiment's hypothesis.
    """
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

    if "dqi" in eval_metrics and dqi_A and dqi_B:
        if dqi_B["total"] > dqi_A["total"]:
            print("✅ Treatment improved overall Discourse Quality Index (Higher DQI).")
        else:
            print("❌ Treatment did NOT improve overall Discourse Quality Index.")


def compare_and_evaluate_simulation_runs(
    client: OpenAI,
    config: ExperimentConfig,
    results_A: ExperimentResult,
    results_B: ExperimentResult,
) -> dict:
    """
    Evaluate, compare, and display the analysis between the control run (Control) and the treatment run (Treatment).
    Returns a dictionary of all computed metrics.
    """
    print(f"\n{'='*40}")
    print("--- Analysis ---")
    print(f"{'='*40}")

    eval_metrics = config.get("deliberation_config", {}).get("eval_metrics", [])

    # Metrics for Control
    conv_A, shift_A = calculate_cosine_metrics(results_A["stances_pre"], results_A["stances_post"])
    covd_pre_A = calculate_covd(results_A["stances_pre"])
    covd_post_A = calculate_covd(results_A["stances_post"])

    # Metrics for Treatment
    conv_B, shift_B = calculate_cosine_metrics(results_B["stances_pre"], results_B["stances_post"])
    covd_pre_B = calculate_covd(results_B["stances_pre"])
    covd_post_B = calculate_covd(results_B["stances_post"])

    print_run_metrics("Control", conv_A, shift_A, covd_pre_A, covd_post_A, eval_metrics)
    print_run_metrics("Treatment", conv_B, shift_B, covd_pre_B, covd_post_B, eval_metrics)

    dqi_A: Optional[DQIScores] = None
    dqi_B: Optional[DQIScores] = None

    if "dqi" in eval_metrics:
        judge_model = config.get("model_config", {}).get("model_assignments", {}).get("DQI_Judge", "meta-llama/Llama-3.3-70B-Instruct-Turbo")
        judge_prompt = config.get("system_prompts", {}).get("dqi_judge_prompt", "You are an expert DQI evaluator...")
        judge_temp = config.get("model_config", {}).get("model_parameters", {}).get("judge_temperature", 0.1)
        
        print("\nCalculating DQI with LLM Judge...")
        dqi_A = evaluate_dqi_for_chat_history(client, results_A["chat_history"], judge_model, judge_prompt, judge_temp)
        dqi_B = evaluate_dqi_for_chat_history(client, results_B["chat_history"], judge_model, judge_prompt, judge_temp)

        print(f"\nDQI Results:")
        print_dqi_results("Control", dqi_A)
        print_dqi_results("Treatment", dqi_B)

    print_experiment_conclusion(eval_metrics, conv_A, conv_B, shift_A, shift_B, dqi_A, dqi_B)

    metrics_dict = {
        "Control": {
            "convergence": conv_A,
            "self_shift": shift_A,
            "covd_pre": covd_pre_A,
            "covd_post": covd_post_A,
        },
        "Treatment": {
            "convergence": conv_B,
            "self_shift": shift_B,
            "covd_pre": covd_pre_B,
            "covd_post": covd_post_B,
        }
    }
    
    if dqi_A and dqi_B:
        metrics_dict["Control"]["dqi"] = dqi_A
        metrics_dict["Treatment"]["dqi"] = dqi_B
        
    return metrics_dict

