---
name: sayg-profile
description: Use before any other Spec as you go skill when no builder profile exists, when the user says their role or experience changed, or when interaction feels mismatched (too basic, too technical). Captures the builder's technical depth, business experience, decision style and subscription, and defines how every sayg skill adapts its questions, language and autonomy to them.
---

# sayg-profile

Spec as you go serves system thinkers and noble fixers: people who see the whole and take ownership of fixing it. They are not all engineers. An experienced architect and a business-led founder need different questions, different evidence and different amounts of autonomy.

## Where it lives

`~/.sayg/profile.md` (per person, across projects), from `templates/profile.md`. A project may add `.sayg/profile.md` to override the role for that project. If the home directory is not persistent (cloud sessions), keep it in the project and suggest adding it to `.gitignore` if it is private.

## Capture (once, then refine)

Infer first from the conversation and the repo (commit history, code style, what they ask). Then ask only what is still unknown, at most 4 questions, using choice questions where the tool allows:

1. **Technical depth** per area, 1–5: architecture, backend, frontend, data, infra/DevOps, security, AI/LLM.
2. **Business depth** per area, 1–5: product, market/competition, finance/unit economics, sales/distribution, fundraising.
3. **Decision style**: wants options and trade-offs, wants a recommendation, or wants it decided and explained after.
4. **Subscription and budget**: Claude plan, other providers available, monthly spend tolerance (used by `sayg-budget`).

Record evidence for inferred levels ("reviewed the ADR and challenged the consistency model" → architecture 5). Update the profile when behavior contradicts it; tell the user what changed.

## How every sayg skill adapts

Read the profile at the start. Per topic, use the depth for **that** area, not an average: an architect with no fundraising experience gets expert-level architecture talk and guided investor talk.

| | Depth 4–5 in the area | Depth 1–2 in the area |
|---|---|---|
| **Questions** | Constraints and trade-offs: "Strong or eventual consistency between billing and ledger?" | Consequences: "If a payment shows up a few seconds late on the dashboard, is that a problem?" |
| **Recommendations** | Options with trade-offs, recommended one first, cite ADRs and evidence | One recommendation in plain words: what it costs, what it risks, how hard to undo |
| **Vocabulary** | Domain terms, no definitions | Terms explained once, then used; prefer outcome language |
| **Autonomy** | Ask on design choices they will want to shape | Decide technical details autonomously; ask only on irreversible or costly ones, framed in business terms |
| **Evidence** | Raw: commands, metrics, diffs | Summarized: what it means and what to do; raw on request |
| **Teaching** | None unless asked | One-line "why it matters" when it changes a decision |

Decision style overrides the defaults: "decide and explain" lowers the number of checkpoints, never the irreversible ones (security waivers, data deletion, spending, intent changes).

## Rules

- Never ask what you can infer. Never quiz the user on their skills.
- The profile describes how to communicate, not what the user is allowed to decide. They can always ask for the expert view or the plain view.
