import os
import json
import argparse
from dotenv import load_dotenv
from openai import OpenAI
from experiment import run_experiment, analyze_results

def main():
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    parser = argparse.ArgumentParser(description="Run the school closure simulation experiment.")
    parser.add_argument("--config", type=str, default=os.path.join(project_root, "data/config.json"), help="Path to config.json")
    args = parser.parse_args()
    
    # Load env vars for API key
    load_dotenv(dotenv_path=os.path.join(project_root, ".env"))
    if not os.environ.get("OPENAI_API_KEY"):
        print("Warning: OPENAI_API_KEY environment variable is not set.")
        print("Please set OPENAI_API_KEY and OPENAI_BASE_URL in your .env file.\n")
        
    client = OpenAI()
    
    # Load config
    config_path = args.config
    if not os.path.exists(config_path):
        print(f"Error: Config file {config_path} not found.")
        return
        
    with open(config_path, "r") as f:
        config = json.load(f)
        
    # Apply model assignments to personas
    model_assignments = config.get("model_assignments", {})
    for p in config.get("personas", []):
        if p["id"] in model_assignments:
            p["model"] = model_assignments[p["id"]]
        
    runs = config.get("runs", [])
    if len(runs) < 2:
        print("Error: Config must define at least 2 runs (Control and Treatment).")
        return
        
    config_A = runs[0]
    config_B = runs[1]
    
    print("Starting experiment pipeline...")
    res_A = run_experiment(client, config_A, config)
    res_B = run_experiment(client, config_B, config)
    
    # Ensure data directory exists for saving results
    data_dir = os.path.dirname(config_path)
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
        
    # Save results to disk
    with open(os.path.join(data_dir, "results_A.json"), "w") as f:
        json.dump(res_A, f, indent=2)
    with open(os.path.join(data_dir, "results_B.json"), "w") as f:
        json.dump(res_B, f, indent=2)
        
    print(f"\nResults saved to {os.path.join(data_dir, 'results_A.json')} and {os.path.join(data_dir, 'results_B.json')}")
    
    analyze_results(client, config, res_A, res_B)

if __name__ == "__main__":
    main()
