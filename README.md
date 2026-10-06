# School Closure Deliberation Experiment

This repository contains an automated experiment pipeline to test how internal reflection (`<private_scratchpad>`) impacts consensus, plurality, and discourse quality in LLM citizen panels.

**Null Hypothesis ($H_0$)**: Requiring an internal reflection step does not significantly change the agents' willingness to compromise, semantic convergence, or discourse quality. (i.e. internal reflection has no bearing on consensus).
**Alternative Hypothesis ($H_1$)**: Requiring an internal reflection step increases willingness to compromise, results in tighter semantic convergence, and affects discourse quality.

## Project Structure
- `data/config.json`: Master configuration for the experiment. Controls the topic, personas, model assignments (including the DQI Judge), evaluation metrics, and the few-shot judge prompt.
- `src/main.py`: The entry point script that orchestrates the pipeline.
- `src/experiment.py`: Core deliberation logic, chat orchestration, and metric calculations (Cosine Similarity, CovD, LLM-as-a-Judge DQI).
- `tests/`: Unit tests and API readiness checks.

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure your LLM Provider:**
   The script uses the standard OpenAI python client.
   Create a `.env` file in the root directory.

   Example `.env` for **Together AI**:
   ```ini
   OPENAI_API_KEY=your_together_api_key
   OPENAI_BASE_URL=https://api.together.xyz/v1
   ```

## Running the Tests & Experiment

We have provided a convenient shell script that will run the test suite and then automatically execute the main experiment pipeline if the tests pass.

### What is tested?
1. **API Check (`tests/test_api_check.py`)**:
   - Verifies that `OPENAI_API_KEY` is properly set in your environment.
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
python src/main.py --config data/config.json
```

## How It Works

The script will:
1. Generate pre-debate stances for all personas.
2. Run **Run A** (Control) where agents respond directly to each other.
3. Run **Run B** (Treatment) where agents must write internal thoughts in `<private_scratchpad>` before responding.
4. Generate post-debate stances.
5. Compute and print the analytical metrics:
   - **Convergence**: Cosine similarity of final stances using local `SentenceTransformer` embeddings.
   - **Self-Shift**: Cosine distance showing how much agents changed their own minds.
   - **CovD (Plurality)**: Determinant of the embedding Gram Matrix, showing the volume/diversity of opinions.
   - **DQI (LLM-as-a-Judge)**: A turn-by-turn evaluation of the transcript across 5 standardized discourse dimensions, calibrated using strict few-shot examples.

Raw results (transcripts and stances) for both runs will be saved as `data/results_A.json` and `data/results_B.json`.
