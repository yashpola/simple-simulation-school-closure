# Experiment Report: The Impact of Internal Reflection on Consensus

## 1. Overview
This experiment tests whether requiring Large Language Models (LLMs) to internally reflect before speaking improves the quality of deliberation and consensus building in simulated citizen panels. 

We simulated a debate about a highly emotional topic: the merger of a local heritage primary school. 

## 2. Configuration
**Topic**: The MOE is proposing to merge your local heritage primary school with a newer school 3km away due to falling enrollment. Discuss the impacts and try to reach a consensus on a recommendation to the MOE.

**Personas & Model Assignments**:
- **MOE Official**: `meta-llama/Llama-3.3-70B-Instruct-Turbo`
  - *Description*: You are a Ministry of Education official. Your main concern is efficiency, falling birth rates, and ensuring every school has a critical mass of students for diverse social mixing and viability. You strongly support the school merger.
- **Teacher**: `meta-llama/Llama-3.3-70B-Instruct-Turbo`
  - *Description*: You are a teacher at the heritage school. You are deeply opposed to the merger because it disrupts the local community, threatens job security, and destroys the school's heritage.

**Pipeline**:
- **Run A (Control)**: Agents respond directly to each other.
- **Run B (Treatment)**: Agents are prompted to generate a `<private_scratchpad>` (internal monologue) evaluating the arguments made by others *before* outputting their `<public_response>`.

## 3. Evaluation Metrics Added
To evaluate the simulation, we extract pre-debate and post-debate stances, along with the raw chat history, and automatically calculate the following metrics:

1. **Pre/Post Stance Similarity (Convergence)**: Cosine similarity of the agents' final stances. Higher means tighter consensus.
2. **Stubbornness Index (Self-Shift)**: Cosine distance between an agent's *own* pre-debate stance and post-debate stance.
3. **Plurality of Opinion (CovD)**: The embedding covariance matrix determinant. We compute the determinant of the Gram matrix of the stance embeddings. This calculates the *volume* spanned by the opinions. A higher CovD indicates a wider, more orthogonal divergence of opinions.
4. **Discourse Quality Index (DQI)**: Evaluated using an LLM-as-a-Judge (turn-by-turn). The judge model evaluates each conversational turn sequentially (with context of previous turns) across 5 standardized DQI components, scoring from 1 to 3:
   - *Level of Justification*: Depth of reasoning (using causal markers like "because", "therefore").
   - *Content of Justification*: Narrow self-interest vs broader collective goods.
   - *Respect*: Acknowledging opposing views with civility.
   - *Constructive Politics*: Generating concrete proposals, compromises, or institutional solutions.
   - *Interactivity*: Directly engaging with and responding to each other's arguments.

## 4. Results (Latest Run)

```text
========================================
--- Analysis ---
========================================
Run A (Control):
  Convergence = 0.8456, Self-Shift = 0.1642
  Plurality (CovD): Pre = 0.2601 -> Post = 0.2849
  DQI (Total = 14.67):
    - Level of Justification: 3.00
    - Content of Justification: 3.00
    - Respect: 2.83
    - Constructive Politics: 3.00
    - Interactivity: 2.83

Run B (Treatment):
  Convergence = 0.8881, Self-Shift = 0.2106
  Plurality (CovD): Pre = 0.2915 -> Post = 0.2113
  DQI (Total = 14.67):
    - Level of Justification: 3.00
    - Content of Justification: 3.00
    - Respect: 3.00
    - Constructive Politics: 3.00
    - Interactivity: 2.67

Conclusion:
✅ Treatment increased consensus (Higher Convergence).
✅ Treatment increased willingness to change stance (Higher Self-Shift).
❌ Treatment did NOT improve overall Discourse Quality Index.
```

## 5. Insights & Discussion
The addition of the internal reflection step yielded fascinating dynamics:

* **More Willingness to Change (Self-Shift)**: By privately processing opposing arguments in their scratchpads, the agents demonstrated a much higher willingness to move away from their entrenched starting positions (Self-Shift: 0.21 in Treatment vs 0.16 in Control).
* **Significant Decrease in Plurality (CovD)**: In the control run, the plurality (diversity of opinion) actually *increased* (0.26 ➔ 0.28) over the debate as the agents dug their heels in. In the treatment run, plurality substantially *decreased* (0.29 ➔ 0.21) because the agents successfully converged on a shared middle-ground.
* **LLM-as-a-Judge Ceiling Effect (DQI)**: We shifted DQI scoring from a word-count heuristic to a turn-by-turn LLM-as-a-Judge evaluation. Initially, the LLM suffered from a massive "ceiling effect," automatically giving perfect scores to both runs due to the high syntactic quality of the agents' responses. However, by introducing strict domain-specific **few-shot examples** explicitly defining what a "Score 1" Interactivity (a parallel monologue) looks like vs a "Score 3" Interactivity (a direct rebuttal), the judge model successfully calibrated. It correctly identified that the Treatment run had slightly *lower* Interactivity (2.67) than the Control run (2.83). While not as extreme as the heuristic's penalty (which dropped to 0.17), the LLM judge provides a much more nuanced and realistic assessment that forcing agents to use a `<private_scratchpad>` slightly degrades their public conversational engagement.
