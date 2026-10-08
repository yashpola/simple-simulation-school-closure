# Experiment Design: The Impact of Internal Reflection on Consensus in a Dyadic LLM Citizen Panel (2 Agents)

## 1. Context & Topic

**Topic**: School Closures & Mergers in Singapore
_Background_: Due to declining birth rates, the Ministry of Education (MOE) regularly merges or closes primary and secondary schools. This is a highly emotional topic, pitting practical resource allocation and diverse social mixing against heritage, alumni loyalty, and localized community disruption.

## 2. The Core Hypothesis: "Think Before You Speak"

To keep the experiment simple with zero need for ground-truth human data, we test how the **agent architecture (specifically, prompting for internal reflection)** affects deliberation outcomes.

We compare two identical dyadic panels (2 agents).

- **Control (System 1)**: Agents read the chat history and directly output their next dialogue response.
- **Treatment (System 2)**: Agents are prompted to generate a `<private_scratchpad>` (internal monologue) evaluating the arguments made by others _before_ outputting their `<public_response>`.

**Null Hypothesis ($H_0$)**: Requiring an internal reflection step does not significantly change the agents' willingness to compromise, semantic convergence, or discourse quality.
**Alternative Hypothesis ($H_1$)**: Requiring an internal reflection step increases willingness to compromise, results in tighter semantic convergence, and affects discourse quality.

## 3. Evaluation Metrics (Automated)

We use a suite of fully automated metrics to compare Control and Treatment:

1. **Pre/Post Stance Similarity (Convergence)**:
   - _Method_: Pairwise cosine similarity of both agents' post-deliberation stances (using `all-MiniLM-L6-v2` embeddings). Higher similarity indicates tighter consensus.
2. **Stubbornness Index (Self-Shift)**:
   - _Method_: Cosine distance ($1 - \text{similarity}$) between an agent's _own_ pre-deliberation and post-deliberation stance. Larger distance indicates greater willingness to change their mind.
3. **Plurality of Opinion (CovD)**:
   - _Method_: The embedding covariance matrix determinant (determinant of the Gram matrix of stances). Calculates the geometric _volume_ spanned by the opinions. A higher CovD indicates a wider, more orthogonal divergence of opinions.
4. **Discourse Quality Index (DQI - LLM-as-a-Judge)**:
   - _Method_: A turn-by-turn evaluation where a separate "Judge" LLM scores every conversational turn from 1 to 3 across 5 dimensions: Level of Justification, Content of Justification, Respect, Constructive Politics, and Interactivity.
   - _Crucial Detail_: The prompt uses strict domain-specific **few-shot examples** to calibrate the judge, particularly to penalize "parallel monologues" in the Interactivity score.

## 4. Architecture & Codebase Structure

The repository is structured to be fully configurable and modular:

```text
simple-simulation-school-closure/
├── data/
│   ├── config.json           # General dir-level configuration which should be edited before a run and will be copied over after
│   └── exp000/              # Indexed directory for experiment artifacts (auto-increments)
│       ├── config.json       # Master configuration specific to this run (copied from data/config.json)
│       ├── results_control.json    # Auto-generated transcript and stances for Control
│       ├── results_treatment.json  # Auto-generated transcript and stances for Treatment
│       ├── results_control_transcript.pdf    # PDF export of the Control transcript (generated post-run)
│       ├── results_treatment_transcript.pdf  # PDF export of the Treatment transcript (generated post-run)
│       ├── evals.json        # Compiled evaluation metrics (Cosine, CovD, DQI)
│       └── final_report.md   # Synthesized markdown report of the experiment results
├── docs/
│   ├── coding_guidelines.md
│   └── experiment_design_school_closures.md
├── src/
│   ├── main.py           # Entry point. Loads config and coordinates modules.
│   ├── deliberation.py   # Simulation engine, agent prompting, and chat loops.
│   ├── evaluation.py     # Metrics computation (Cosine, CovD, DQI LLM Judge).
│   └── schemas.py        # TypedDict definitions enforcing strict Python typing.
└── tests/
    ├── test_api_check.py # Unit tests to verify LLM endpoint connectivity
    └── test_sanity.py    # Unit tests for the private scratchpad regex parser
```

## 5. Configuration (`data/config.json`)
    
The entire experiment is parameterized in `data/config.json`. This allows for easy swapping of models, personas, and metrics without altering the source code. Each experiment run has its own configuration file copied to its respective directory.

**Key Config Sections:**

- `model_config`: Contains `model_assignments` (mapping personas to specific LLM endpoints) and `model_parameters` (temperatures, context window).
- `system_prompts`: Contains all hardcoded string templates abstracted from the codebase (`topic_prompt`, `pre_stance_prompt`, `post_stance_prompt`, `dqi_judge_prompt`).
- `user_prompts`: Defines the agent `personas` (ID, Role, description for the 2 agent personas) and the `turn_prompt`.
- `deliberation_config`: Configures the simulation mechanics (`max_turns_per_agent`), the `runs` (Control/Treatment definitions), and `eval_metrics`.

## 6. Execution Flow

1. **Initialization (`src/main.py`)**: Loads `config.json` and environmental variables (API keys).
2. **Pre-Deliberation Baseline**: A single, shared set of pre-deliberation stances is generated for both agents to ensure a controlled baseline.
3. **Deliberation Loop (`src/deliberation.py`)**: For each run (Control and Treatment), agents take turns responding for $N$ rounds.
4. **Post-Deliberation**: Agents generate a final 1-paragraph stance after their respective deliberation loops.
5. **Artifacts Saved**: Raw JSON transcripts and stances are saved to an automatically incremented, indexed directory inside `data/` (e.g., `data/exp000/`).
6. **Analysis**: Evaluates Convergence, Self-Shift, CovD, and calls the LLM DQI Judge turn-by-turn on the transcripts. Outputs a final terminal report.

## 7. Final Reporting

After running the experiment pipeline via `src/main.py`, the terminal will output the Cosine, CovD, and DQI metrics. An autonomous agent or human researcher should manually synthesize these terminal outputs into a formal markdown artifact located at `data/<uid>/final_report.md`. Additionally, PDF transcripts of the chat histories (`results_control_transcript.pdf` and `results_treatment_transcript.pdf`) should be generated for both Control and Treatment runs to facilitate reading.

A properly generated `final_report.md` should include:

1. **Executive Summary**: A brief recap of the experiment and core hypothesis.
2. **Experimental Setup**: A summary of the topic, the 2 agent personas, and methodology (explicitly mentioning the shared pre-deliberation baseline).
3. **Results**: A markdown table comparing the metrics (Convergence, Self-Shift, CovD, DQI) between Control and Treatment.
4. **Conclusion**: An analysis of the metrics, specifically checking if the identical pre-deliberation Plurality baselines held, and delivering a final verdict on whether the null hypothesis ($H_0$) was rejected or retained based on the data.
