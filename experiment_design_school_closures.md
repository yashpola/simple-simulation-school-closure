# Experiment Design: The Impact of Internal Reflection on Consensus in LLM Citizen Panels

## 1. Context & Topic
**Topic**: School Closures & Mergers in Singapore
*Background*: Due to declining birth rates, the Ministry of Education (MOE) regularly merges or closes primary and secondary schools. This is a highly emotional topic, pitting practical resource allocation and diverse social mixing against heritage, alumni loyalty, and localized community disruption.

## 2. The Core Hypothesis: "Think Before You Speak"
To keep the experiment simple with zero need for ground-truth human data, we test how the **agent architecture (specifically, prompting for internal reflection)** affects deliberation outcomes. 

We compare two identical panels of citizen personas. 

* **Run A (Control - "System 1")**: Agents read the chat history and directly output their next dialogue response.
* **Run B (Treatment - "System 2")**: Agents are prompted to generate a `<private_scratchpad>` (internal monologue) evaluating the arguments made by others *before* outputting their `<public_response>`.

**Null Hypothesis ($H_0$)**: Requiring an internal reflection step does not significantly change the agents' willingness to compromise, semantic convergence, or discourse quality.
**Alternative Hypothesis ($H_1$)**: Requiring an internal reflection step increases willingness to compromise, results in tighter semantic convergence, and affects discourse quality.

## 3. Evaluation Metrics (Automated)
We use a suite of fully automated metrics to compare Run A and Run B:

1. **Pre/Post Stance Similarity (Convergence)**: 
   * *Method*: Pairwise cosine similarity of all agents' post-debate stances (using `all-MiniLM-L6-v2` embeddings). Higher similarity indicates tighter consensus.
2. **Stubbornness Index (Self-Shift)**:
   * *Method*: Cosine distance ($1 - \text{similarity}$) between an agent's *own* pre-debate and post-debate stance. Larger distance indicates greater willingness to change their mind.
3. **Plurality of Opinion (CovD)**:
   * *Method*: The embedding covariance matrix determinant (determinant of the Gram matrix of stances). Calculates the geometric *volume* spanned by the opinions. A higher CovD indicates a wider, more orthogonal divergence of opinions.
4. **Discourse Quality Index (DQI - LLM-as-a-Judge)**:
   * *Method*: A turn-by-turn evaluation where a separate "Judge" LLM scores every conversational turn from 1 to 3 across 5 dimensions: Level of Justification, Content of Justification, Respect, Constructive Politics, and Interactivity. 
   * *Crucial Detail*: The prompt uses strict domain-specific **few-shot examples** to calibrate the judge, particularly to penalize "parallel monologues" in the Interactivity score.

## 4. Architecture & Codebase Structure
The repository is structured to be fully configurable and modular:

```text
simple-simulation-school-closure/
├── data/
│   ├── config.json       # Master configuration (topic, personas, models, metrics, judge prompt)
│   ├── results_A.json    # Auto-generated transcript and stances for Control
│   └── results_B.json    # Auto-generated transcript and stances for Treatment
├── src/
│   ├── main.py           # Entry point. Loads config and orchestrates the experiment pipeline.
│   └── experiment.py     # Core logic (run_experiment, metrics calculations, LLM calling)
└── tests/
    └── api_check.py      # Unit tests for API readiness and sanity checks
```

## 5. Configuration (`data/config.json`)
The entire experiment is parameterized in `config.json`. This allows for easy swapping of models, personas, and metrics without altering the source code.

**Key Config Sections:**
* `model_assignments`: Maps personas (e.g., "MOE Official", "Teacher") and the "DQI_Judge" to specific LLM endpoints (e.g., `meta-llama/Llama-3.3-70B-Instruct-Turbo`).
* `personas`: Defines the ID, Role, and system description for each agent.
* `eval_metrics`: An array specifying which metrics to run (e.g., `["cosine_similarity", "covd", "dqi"]`).
* `runs`: Defines the Control and Treatment loops, specifying the `system_prompt_addition` and whether to parse `<private_scratchpad>` tags.
* `dqi_judge_prompt`: The master prompt containing the rubric and few-shot examples used by the LLM-as-a-Judge.

## 6. Execution Flow
1. **Initialization (`src/main.py`)**: Loads `config.json` and environmental variables (API keys).
2. **Pre-Debate**: Agents generate a 1-paragraph stance based on their persona.
3. **Deliberation Loop (`src/experiment.py`)**: Agents take turns responding for $N$ rounds. The chat history is appended contextually.
4. **Post-Debate**: Agents generate a final 1-paragraph stance.
5. **Artifacts Saved**: Raw JSON transcripts and stances are saved to `data/`.
6. **Analysis**: Evaluates Convergence, Self-Shift, CovD, and calls the LLM DQI Judge turn-by-turn on the transcripts. Outputs a final terminal report.
