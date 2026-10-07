# Coding Guidelines

This repository follows strict structural and typing paradigms designed for clarity, modularity, and future maintainability by autonomous agents. If you are extending or reproducing this repository, adhere to the following principles:

## 1. Strict Typing with Built-in Types
- Avoid heavy external dependencies (like `pydantic` or `marshmallow`) just for validation unless strictly necessary.
- Use Python's built-in `typing` module extensively (`TypedDict`, `List`, `Dict`, `Optional`, `Tuple`).
- Define all object schemas in `src/schemas.py`. 
- Ensure that the JSON structures mapped from `config.json` have exact 1:1 representations as `TypedDict` schemas.
- Use tools like `mypy` or `py_compile` to enforce syntactic correctness.

## 2. Separation of Concerns & File Modularity
- **No Monolithic Scripts**: Avoid catch-all files like `experiment.py`. 
- **Functional Splits**: Group functions logically by domain. For example:
  - `src/deliberation.py` handles LLM calls, chat loops, and prompt injections.
  - `src/evaluation.py` handles math (Cosine, Gram matrices) and scoring (LLM-as-a-judge).
  - `src/main.py` is reserved strictly as the orchestrator and entry point.

## 3. Single-Responsibility Functions
- Every function must do exactly one thing.
- Avoid vague, broad names (e.g. `run_experiment`). Instead, explicitly name the orchestration loop (e.g., `execute_simulation_run`) and the steps it calls (`generate_initial_stances`, `conduct_deliberation`, `generate_final_stances`).
- Include a clear docstring detailing the exact goal of every function.

## 4. Total Configuration Abstraction (No Hardcoded Prompts)
- Absolutely zero prompt strings or textual templates should exist in the Python logic.
- Extract all system, system-augmented, and user prompts into `data/<uid>/config.json`.
- When using `dict.get()`, do not use the raw string as the default fallback. Ensure the fallback defaults to empty strings (`""`), forcing the pipeline to rely strictly on the external configuration.
- Group the `config.json` logically (e.g. `model_config`, `system_prompts`, `user_prompts`, `deliberation_config`) rather than using a flat structure. 

## 5. Defensive LLM Parsing
- Wrap all LLM parsing logic in robust error handling (`try/except`).
- Assume the LLM might hallucinate markdown blocks (e.g., stripping ```json wrappers) when fetching structured output.

## 6. Experiment Output Indexing
- All experiment run outputs (e.g., transcripts, stances, evaluations, and final reports) and the configuration file (`config.json`) must be saved into a dynamically indexed sub-directory inside `data/`.
- The directory must use the `expXXX` string format (e.g., `data/exp000/`, `data/exp001/`).
- The orchestrator (`src/main.py`) must auto-detect existing directories and increment the UID to prevent overwriting past experiment runs.
