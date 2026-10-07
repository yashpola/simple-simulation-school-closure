# School Closure Deliberation Experiment

This repository contains an automated experiment pipeline to test how internal reflection (`<private_scratchpad>`) impacts consensus, plurality, and discourse quality in a dyadic LLM citizen panel (2 agents).

**Null Hypothesis ($H_0$)**: Requiring an internal reflection step does not significantly change the agents' willingness to compromise, semantic convergence, or discourse quality. (i.e. internal reflection has no bearing on consensus).
**Alternative Hypothesis ($H_1$)**: Requiring an internal reflection step increases willingness to compromise, results in tighter semantic convergence, and affects discourse quality.

## Project Structure
- `data/<uid>/config.json`: Master configuration specific to the experiment run. Fully parameterized and grouped into `model_config`, `system_prompts`, `user_prompts`, and `deliberation_config`.
- `docs/`: Contains the experiment design document and coding guidelines.
- `src/main.py`: The entry point script that orchestrates the pipeline.
- `src/deliberation.py`: Handles the core simulation engine, LLM API calls, and multi-agent chat orchestration.
- `src/evaluation.py`: Handles post-run mathematical calculations (Cosine, CovD) and the LLM-as-a-Judge DQI evaluations.
- `src/schemas.py`: Contains strict Python type definitions (`TypedDict`) mapping to the configuration structure.
- `tests/`: Unit tests and API readiness checks.

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure your Together AI API Key:**
   The script uses the standard OpenAI python client configured specifically for Together AI.
   Create a `.env` file in the root directory.

   ```ini
   TOGETHER_API_KEY=your_together_api_key
   ```

## Running the Tests & Experiment

We have provided a convenient shell script that will run the test suite and then automatically execute the main experiment pipeline if the tests pass.

### What is tested?
1. **API Check (`tests/test_api_check.py`)**:
   - Verifies that `TOGETHER_API_KEY` is properly set in your environment.
   - Pings every LLM model specified in your `config.json`'s `model_assignments` to ensure the endpoint is responsive and you have access rights.
2. **Sanity Check (`tests/test_sanity.py`)**:
   - Validates the regex logic in `extract_tags` to ensure the system correctly isolates `<private_scratchpad>` thoughts from `<public_response>` dialogue.

```bash
./run.sh
```

Alternatively, you can run them manually:
```bash
# Run tests
python -m unittest discover -s tests

# Run experiment
python src/main.py --config data/exp000/config.json
```

## How It Works

The script will:
1. Generate **shared pre-deliberation stances** once for both agents to ensure a mathematically identical baseline.
2. Execute **Control** where agents respond directly to each other.
3. Execute **Treatment** where agents must write internal thoughts in `<private_scratchpad>` before responding.
4. Generate post-deliberation stances for each run based on their respective chats.
5. Compute and print the analytical metrics:
   - **Convergence**: Cosine similarity of final stances using local `SentenceTransformer` embeddings.
   - **Self-Shift**: Cosine distance showing how much agents changed their own minds.
   - **CovD (Plurality)**: Determinant of the embedding Gram Matrix, showing the volume/diversity of opinions.
   - **DQI (LLM-as-a-Judge)**: A turn-by-turn evaluation of the transcript across 5 standardized discourse dimensions, calibrated using strict few-shot examples.

Raw results (transcripts and stances) for both runs will be saved in an indexed sub-directory inside `data/` (e.g., `data/exp000/results_control.json` and `data/exp000/results_treatment.json`). The directory uses an `expXXX` format that increments automatically for each run.
