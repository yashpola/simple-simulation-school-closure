# School Closure Deliberation Experiment

This repository contains an automated experiment pipeline to test how internal reflection (`<private_scratchpad>`) impacts consensus, plurality, and discourse quality in a dyadic LLM citizen panel (2 agents).

**Null Hypothesis ($H_0$)**: Requiring an internal reflection step does not significantly change the agents' willingness to compromise, semantic convergence, or discourse quality. (i.e. internal reflection has no bearing on consensus).
**Alternative Hypothesis ($H_1$)**: Requiring an internal reflection step increases willingness to compromise, results in tighter semantic convergence, and affects discourse quality.

## Project Structure

- `data/config.json`: Master configuration for the experiment run. Fully parameterized and grouped into `model_config`, `system_prompts`, `user_prompts`, and `deliberation_config`.
- `docs/`: Contains an agentic-focused experiment design document & coding guidelines as well as a human-written experiment details document.
- `src/main.py`: The entry point script that orchestrates the pipeline.
- `src/deliberation.py`: Handles the core simulation engine, LLM API calls, and multi-agent chat orchestration.
- `src/evaluation.py`: Handles post-run mathematical calculations (Cosine, CovD) and the LLM-as-a-Judge DQI evaluations.
- `src/schemas.py`: Contains strict Python type definitions (`TypedDict`) mapping to the configuration structure and helper utilities (e.g., `extract_seed`).
- `tests/`: Unit tests and API readiness checks.

## Setup

1. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

2. **Configure your API Key:**
   The script uses the standard OpenAI python client, so it can connect to OpenAI or any OpenAI-compatible service (like Together AI, vLLM, etc.) by specifying a base URL.
   Create a `.env` file in the root directory.

   ```ini
   OPENAI_API_KEY=your_api_key
   # Optional: Set this if you are using a compatible service like Together AI
   # OPENAI_BASE_URL=https://api.together.xyz/v1
   ```

## Running the Tests & Experiment

### What is tested?

1. **API Check (`tests/test_api_check.py`)**:
   - Verifies that `OPENAI_API_KEY` is properly set in your environment.
   - Pings every LLM model specified in your `config.json`'s `model_assignments` to ensure the endpoint is responsive and you have access rights.
2. **Sanity Check (`tests/test_sanity.py`)**:
   - Validates the regex logic in `extract_tags` to ensure the system correctly isolates `<private_scratchpad>` thoughts from `<public_response>` dialogue.

Running Tests:

```bash
# Run tests
python -m unittest discover -s tests
```

Running Experiment:

```bash
# Run experiment
python src/main.py --config <path_to_config.json>
```

## How It Works

Given a valid `data/config.json`, the script will:

1. Digest the configuration details into a usable Python object using the specified `config.json`.
2. Create the OpenAI client for access to a compute service using the `.env`.
3. Generate **shared pre-deliberation stances** once for both agents to ensure a mathematically identical baseline.
4. Execute **Control** where agents respond directly to each other.
5. Execute **Treatment** where agents must write internal thoughts in `<private_scratchpad>` before responding.
6. Generate post-deliberation stances for each run based on their respective chats.
7. Compute and print the analytical metrics:
   - **Convergence**: Cosine similarity of final stances using local `SentenceTransformer` embeddings.
   - **Self-Shift**: Cosine distance showing how much agents changed their own minds.
   - **CovD (Plurality)**: Determinant of the embedding Gram Matrix, showing the volume/diversity of opinions.
   - **DQI (LLM-as-a-Judge)**: A turn-by-turn evaluation of the transcript across 5 standardized discourse dimensions, calibrated using strict few-shot examples.

Raw results (transcripts and stances) for both runs will be saved in an automatically-created and indexed sub-directory inside `data/` (e.g., `data/exp000/results_control.json` and `data/exp000/results_treatment.json`). The directory uses an `expXXX` format that increments automatically for each run.

Essentially, the pipeline abides by this contract:

> **IF** the user specifies the `data/config.json` properly and loads in a valid API key and/or Base URL for an OpenAI-compatible service,
>
> **THEN** the pipeline will run an $N$-turn deliberation between 2 agents using the config-specified model(s) for both the Control & Treatment, and output the turn-based chat histories of each run in separate `json` files. The pipeline will also output an `evals.json` with the config-specificied metrics. All outputs will be saved in an automatically created & indexed sub-directory of `data`.

## 7. Built-in Code Defaults & Fallback Reference

All default parameters, fallback chains, and optimization bounds hardcoded within Python logic are documented below:

| Module / Scope                                      | Parameter                           | Code Default / Fallback                     | Behavior & Purpose                                                                                                                                                                                           |
| :-------------------------------------------------- | :---------------------------------- | :------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **API Credentials** (`src/main.py`)                 | `OPENAI_API_KEY`, `OPENAI_BASE_URL` | Read from `.env` (**no fallback**)          | Strictly loaded via `dotenv`. Base URL defaults to OpenAI official endpoint if omitted. Fails fast with API connection error if key is invalid.                                                              |
| **Simulation Matrix** (`src/main.py`)               | `total_trials`                      | `1`                                         | Read from `deliberation_config.total_trials`. Executes a single paired trial if omitted. When $>1$, sequentially executes $N$ independent trials with distinct random sampling.                              |
| **Output Directory** (`src/main.py`)                | `output_dir`                        | `data/expXXX/`                              | Auto-detects highest existing `expXXX` directory in `data/` and increments to the next index (starts at `data/exp000/`) to prevent overwriting past runs.                                                    |
| **Dialogue Turns** (`src/deliberation.py`)          | `agent_temperature`                 | `0.7`                                       | Read from `model_parameters.agent_temperature`. Balanced exploratory sampling for baseline stance generation, multi-turn chat, and final stances.                                                            |
| **Turn Budget** (`src/deliberation.py`)             | `max_turns_per_agent`               | `1`                                         | Read from `deliberation_config.max_turns_per_agent`. Limits conversational turns per persona to 1 round (2 total turns) if omitted.                                                                          |
| **Random Seed** (`src/schemas.py`)                  | `seed`                              | `None` / `"None"`                           | Read from `model_parameters.seed`. Parsed via `extract_seed()`. If omitted, `null`, or `"None"`, leaves seed unset for default non-deterministic stochastic sampling; accepts integer for reproducible runs. |
| **Scratchpad Parsing** (`src/deliberation.py`)      | `extract_tags`                      | `false`                                     | Boolean flag in run config. When `false`, treats raw model output as public response. When `true`, isolates `<private_scratchpad>` thoughts from `<public_response>`.                                        |
| **Tag Extraction Fallback** (`src/deliberation.py`) | Missing `<public_response>`         | `text.replace(scratchpad, "").strip()`      | If model generates `<private_scratchpad>` but omits `<public_response>` tags, strips scratchpad block and defensively treats the remaining text as public response.                                          |
| **Prompt Abstraction** (`src/deliberation.py`)      | System / User Prompts               | `""` (empty string)                         | `topic_prompt`, `pre_stance_prompt`, `post_stance_prompt`, and `turn_prompt` default to empty strings if omitted, forcing pipeline to rely on external configuration.                                        |
| **DQI Judge Model** (`src/evaluation.py`)           | `DQI_Judge`                         | `"meta-llama/Llama-3.3-70B-Instruct-Turbo"` | Read from `model_assignments.DQI_Judge`. Defaults to Llama-3.3-70B if missing from configuration.                                                                                                            |
| **DQI Judge Temperature** (`src/evaluation.py`)     | `judge_temperature`                 | `0.1`                                       | Read from `model_parameters.judge_temperature`. Low temperature ensures deterministic, reproducible scoring across the 5 DQI rubric dimensions.                                                              |
| **Judge Prompt Fallback** (`src/evaluation.py`)     | `dqi_judge_prompt`                  | `"You are an expert DQI evaluator..."`      | Fallback prompt instruction for LLM judge if `dqi_judge_prompt` is omitted from `system_prompts`.                                                                                                            |
| **Judge Output Parsing** (`src/evaluation.py`)      | Missing / Invalid JSON              | `0.0` per missing dimension                 | Strips markdown code blocks. If JSON parsing fails or rubric dimensions are omitted, defaults missing turn scores to `0.0` to prevent crashes.                                                               |
| **Semantic Metrics** (`src/evaluation.py`)          | Embedding Checkpoint                | `"all-MiniLM-L6-v2"`                        | Globally loaded local SentenceTransformer model (384 dimensions, normalized) for Cosine Similarity (Convergence, Self-Shift) and Gram matrix determinant (CovD).                                             |

## Extra Notes

The script does NOT programmatically generate:

1. Results Transcript PDFs
2. Final Report Markdown

As are seen in `data/exp000`. These were agentically generated by a user after-the-fact. Please refer to Section 7 of `docs/experiment_design_school_closures.md` for more details. This way users are aware that the absence of them after a run is not a failure indicator of the run.
