# Experiment exp000 Final Report

## Executive Summary
This report presents the findings of experiment run `exp000`, testing the core hypothesis that requiring an internal reflection step (`<private_scratchpad>`) prior to a dialogue response influences a dyadic LLM citizen panel's consensus and discourse quality on the topic of School Closures & Mergers in Singapore.

**Null Hypothesis ($H_0$)**: Requiring an internal reflection step does not significantly change the agents' willingness to compromise, semantic convergence, or discourse quality.
**Alternative Hypothesis ($H_1$)**: Requiring an internal reflection step increases willingness to compromise, results in tighter semantic convergence, and affects discourse quality.

## Experimental Setup
**Topic**: School Closures & Mergers in Singapore (MOE resource allocation vs. community heritage).
**Agents**:
- MOE Pragmatist
- Stressed Teacher

**Methodology**:
A single, shared set of pre-deliberation stances was generated for both agents to establish a mathematically identical and controlled baseline.
- **Control (System 1)**: Agents responded directly to each other reading the chat history.
- **Treatment (System 2)**: Agents generated an internal monologue (`<private_scratchpad>`) evaluating others' arguments before outputting their response.

## Results
The automated evaluation pipeline analyzed both runs across Convergence, Self-Shift, Plurality (CovD), and Discourse Quality Index (DQI).

| Metric | Control | Treatment | Delta |
| :--- | :--- | :--- | :--- |
| **Convergence** (Post-Stance Sim) | 0.8766 | 0.8286 | -0.0480 |
| **Self-Shift** (Stubbornness) | 0.1477 | 0.1401 | -0.0076 |
| **CovD Pre** (Plurality) | 0.2157 | 0.2157 | 0.0000 |
| **CovD Post** (Plurality) | 0.2316 | 0.3135 | +0.0819 |
| **DQI Total** (LLM Judge) | 14.83 | 14.67 | -0.16 |
| - *Level of Justification* | 3.00 | 3.00 | 0.00 |
| - *Content of Justification* | 3.00 | 3.00 | 0.00 |
| - *Respect* | 3.00 | 3.00 | 0.00 |
| - *Constructive Politics* | 3.00 | 3.00 | 0.00 |
| - *Interactivity* | 2.83 | 2.67 | -0.16 |

## Conclusion
The baseline check for Plurality (CovD Pre) yielded identical values (`0.2157`), confirming that the pre-deliberation stances were successfully shared across both Control and Treatment.

1. **Convergence**: The Treatment group had *lower* semantic convergence (`0.8286`) than the Control group (`0.8766`), indicating that internal reflection decreased the degree to which agents aligned on a consensus stance.
2. **Self-Shift**: The Treatment group demonstrated slightly *lower* self-shift (`0.1401` vs `0.1477`), meaning the agents were slightly more stubborn and less willing to change their minds when reflecting internally.
3. **Plurality**: CovD Post expanded considerably more in the Treatment run (`0.3135`) compared to the Control (`0.2316`), reinforcing that reflection drove their opinions further apart.
4. **DQI**: Discourse quality was marginally worse in the Treatment group (`14.67` vs `14.83`), driven exclusively by a drop in Interactivity (`2.67` vs `2.83`).

**Final Verdict**: We **retain the null hypothesis ($H_0$)** and reject the alternative hypothesis ($H_1$). The required internal reflection step did not increase consensus; in fact, the data suggests it may have entrenched opinions and reduced interactivity.

