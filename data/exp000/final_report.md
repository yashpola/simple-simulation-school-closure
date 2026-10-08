# Final Experiment Report: The Impact of Internal Reflection on Consensus

## 1. Executive Summary
This experiment tested the hypothesis ($H_1$) that prompting LLM agents (representing a dyadic citizen panel) to generate an internal reflection (`<private_scratchpad>`) prior to outputting dialogue would increase willingness to compromise, result in tighter semantic convergence, and improve discourse quality. 

Based on the automated metrics (Cosine Similarity, Covariance Determinant, and DQI via LLM-as-a-Judge), the Treatment (internal reflection) led to a **very marginal increase in semantic convergence** but resulted in **lower self-shift (willingness to compromise)** and a **slight decrease in interactivity**. Therefore, the data largely fails to reject the null hypothesis ($H_0$), indicating that internal reflection in this specific dyadic context did not significantly improve consensus outcomes.

## 2. Experimental Setup
**Topic:** School Closures & Mergers in Singapore (Practical Resource Allocation vs. Heritage/Community Disruption)
**Agents:**
- `agent_1` (Heritage School Teacher): Strongly opposed to closures, advocating for heritage preservation.
- `agent_2` (MOE Official): Focused on resource allocation and demographic realities.

To ensure a perfectly controlled baseline, a single shared set of **pre-deliberation stances** was generated and applied to both the Control (direct response) and Treatment (internal reflection) runs. The agents then engaged in a 3-turn deliberation loop.

## 3. Results Table

| Metric | Description | Control (System 1) | Treatment (System 2) | Difference |
|--------|-------------|---------------------|----------------------|------------|
| **Convergence** | Post-stance similarity (Higher = Tighter consensus) | 0.8319 | 0.8362 | **+ 0.0043** |
| **Self-Shift** | Distance from own pre-stance (Higher = More compromise) | 0.2621 | 0.2225 | **- 0.0396** |
| **CovD (Pre)** | Pre-debate opinion volume (Baseline) | 0.2806 | 0.2806 | Baseline |
| **CovD (Post)** | Post-debate opinion volume (Lower = Shrunk domain) | 0.3079 | 0.3008 | **- 0.0071** |
| **DQI (Total)** | Discourse Quality Index (Out of 15) | 14.83 | 14.67 | **- 0.16** |
| - *Interactivity* | Sub-metric of DQI | 2.83 | 2.67 | - 0.16 |

## 4. Conclusion & Analysis

1. **Baseline Integrity:** The pre-deliberation plurality (CovD Pre) was identical (0.2806) for both runs, confirming that the experimental baselines were successfully controlled.
2. **Plurality Expansion:** Interestingly, in *both* runs, the CovD increased post-deliberation (0.3079 and 0.3008). This indicates that rather than reaching a compromise, the deliberation actually caused the agents' stances to polarize and span a wider volume of opinion space than when they started. 
3. **Hypothesis Evaluation:** 
   - **Convergence:** Treatment saw a very marginal increase in final stance similarity.
   - **Self-Shift (Stubbornness):** Treatment agents were actually *more stubborn* (lower self-shift). The `<private_scratchpad>` may have served to anchor the agents in their own arguments rather than facilitating empathy.
   - **Discourse Quality:** The DQI scores were nearly identical, though Treatment suffered a slight penalty in *Interactivity*. This suggests the internal reflection might have made the agents slightly more prone to parallel monologues.

**Final Verdict:** We **retain the null hypothesis ($H_0$)**. Requiring an internal reflection step did not meaningfully improve willingness to compromise or discourse quality, and in fact, slightly increased agent stubbornness.

