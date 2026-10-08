import os
import json
import argparse
from dotenv import load_dotenv
from openai import OpenAI

from deliberation import execute_simulation_run, generate_initial_stances
from evaluation import compare_and_evaluate_simulation_runs

from typing import cast
from schemas import ExperimentConfig, RunConfig, ExperimentResult


def main() -> None:
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    parser = argparse.ArgumentParser(
        description="Run the school closure simulation experiment."
    )
    parser.add_argument(
        "--config",
        type=str,
        default=os.path.join(project_root, "data/config.json"),
        help="Path to config.json",
    )
    args = parser.parse_args()

    # Load env vars for API key
    load_dotenv(dotenv_path=os.path.join(project_root, ".env"))
    if not os.environ.get("OPENAI_API_KEY"):
        print("Warning: OPENAI_API_KEY environment variable is not set.")
        print("Please set OPENAI_API_KEY in your .env file.\n")

    client = OpenAI(
        api_key=os.environ.get("OPENAI_API_KEY"),
        base_url=os.environ.get("OPENAI_BASE_URL"),
    )

    # Load config
    config_path = args.config
    if not os.path.exists(config_path):
        print(f"Error: Config file {config_path} not found.")
        return

    with open(config_path, "r") as f:
        raw_config = json.load(f)

    config: ExperimentConfig = cast(ExperimentConfig, raw_config)

    # Apply model assignments to personas
    model_assignments = config.get("model_config", {}).get("model_assignments", {})
    personas = config.get("user_prompts", {}).get("personas", [])
    for p in personas:
        if p["id"] in model_assignments:
            p["model"] = model_assignments[p["id"]]

    runs = config.get("deliberation_config", {}).get("runs", [])
    if len(runs) < 2:
        print("Error: Config must define at least 2 runs (Control and Treatment).")
        return

    config_A: RunConfig = runs[0]
    config_B: RunConfig = runs[1]

    print("Starting experiment pipeline...")
    # Generate identical baseline stances once
    agent_temp = config.get("model_config", {}).get("model_parameters", {}).get("agent_temperature", 0.7)
    shared_stances_pre = generate_initial_stances(client, config, agent_temp)
    
    res_A: ExperimentResult = execute_simulation_run(client, config_A, config, shared_stances_pre)
    res_B: ExperimentResult = execute_simulation_run(client, config_B, config, shared_stances_pre)

    # Determine output directory
    config_dir = os.path.dirname(config_path)
    dir_name = os.path.basename(config_dir)
    
    if dir_name.startswith("exp") and dir_name[3:].isdigit() and len(dir_name) == 6:
        # Config is already in a run-specific directory (e.g. data/exp000/)
        output_dir = config_dir
    else:
        # Config is in a generic directory, create the next expXXX directory
        base_data_dir = config_dir
        existing_dirs = [
            d for d in os.listdir(base_data_dir)
            if os.path.isdir(os.path.join(base_data_dir, d)) and d.startswith("exp") and d[3:].isdigit() and len(d) == 6
        ]
        next_id = max([int(d[3:]) for d in existing_dirs]) + 1 if existing_dirs else 0
        uid_str = f"exp{next_id:03d}"
        output_dir = os.path.join(base_data_dir, uid_str)
        os.makedirs(output_dir, exist_ok=True)
        
        # Copy config.json to the new run directory
        import shutil
        shutil.copy2(config_path, os.path.join(output_dir, "config.json"))

    # Save results to disk
    with open(os.path.join(output_dir, "results_control.json"), "w") as f:
        json.dump(res_A, f, indent=2)
    with open(os.path.join(output_dir, "results_treatment.json"), "w") as f:
        json.dump(res_B, f, indent=2)

    print(
        f"\nResults saved to {os.path.join(output_dir, 'results_control.json')} and {os.path.join(output_dir, 'results_treatment.json')}"
    )

    metrics = compare_and_evaluate_simulation_runs(client, config, res_A, res_B)
    
    with open(os.path.join(output_dir, "evals.json"), "w") as f:
        json.dump(metrics, f, indent=2)
        
    print(f"Metrics saved to {os.path.join(output_dir, 'evals.json')}")


if __name__ == "__main__":
    main()
