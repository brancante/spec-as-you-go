---
name: sayg-scale
description: Use when asked whether the product can scale, how big the opportunity is, what its market impact could be, or how attractive it is to investors; also before a pitch, fundraising conversation or major bet. Produces an evidence-graded scorecard across market, economics, technical scalability, defensibility and impact, with the red flags and the moves that would most raise attractiveness.
---

# sayg-scale

> Adapt questions, vocabulary, evidence and autonomy to the builder profile (`sayg-profile`), per area of depth.

An honest investor's read, not a pitch. Output to `.sayg/product/scale-YYYY-MM-DD.md` from `templates/product/scale-scorecard.md`, so successive reads show the trend.

## Process

1. Read the product manifesto (`sayg-fit`), intent, architecture and the latest gate/Sonar reports. If the manifesto is missing or stale, run `sayg-fit` first.
2. Research live (`sayg-scout`, web): market reports, comparable companies, recent funding rounds and exits in the space, pricing of alternatives. Cite each with a date.
3. Score each dimension 1–5 **with the evidence grade** (`measured`, `sourced`, `estimated`, `assumed`):
   - **Problem severity and frequency**
   - **Market size**: bottom-up (number of buyers × realistic price × reachable share). Top-down figures only as a sanity check.
   - **Timing**: what changed that makes this possible or urgent now
   - **Differentiation and moat**: data, network effects, switching costs, distribution, regulation, speed
   - **Traction**: real usage, retention, revenue, pipeline; "none yet" is a valid answer
   - **Unit economics**: price, gross margin (include model/inference and infra cost per unit), CAC hypothesis, payback
   - **Technical scalability**: cost and latency per unit at 10× and 100× load; architectural limits (cells, database, third-party quotas); security and compliance posture from the gates
   - **Distribution**: how the first 100 and first 10,000 customers are reached
   - **Impact**: who is better off and by how much, beyond revenue
4. Write the **verdict**: the one-paragraph thesis an investor would repeat, the three biggest red flags with the objection an investor would raise, and the three moves that would most raise the score per unit of effort (each can become a slice or an experiment).
5. Compare with the previous scorecard if one exists; explain each change in score.

## Rules

- Never fabricate numbers, comparables or traction. If a number is estimated, show the arithmetic and assumptions.
- A score with `assumed` evidence counts at most 3.
- This is a decision aid, not a valuation or financial advice; say so in the report header.
- Technical scalability findings that need work go to `.sayg/discoveries.md` and, if structural, to `sayg-architect`.
