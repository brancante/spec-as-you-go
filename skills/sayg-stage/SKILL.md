---
name: sayg-stage
description: Use to set or check how mature a Spec as you go deliverable must be, from clickable UI prototype to production-ready, and whether it can move to the next stage. Defines the stage ladder (experience first, engineering second), the exit criteria per stage and how gates, pipeline and approvals scale with stage. Use at discovery, when the target changes ("we just need a demo", "this goes live in March"), and before promoting a cell.
---

# sayg-stage

> Adapt questions, vocabulary, evidence and autonomy to the builder profile (`sayg-profile`), per area of depth.

The output can be anything from a demo to a production system. Decide the **target stage** explicitly, then climb one stage at a time. Experience comes first: nobody hardens a backend for a flow users haven't validated.

## The ladder

Full exit criteria are in `templates/stages.md`.

| Stage | Name | What exists | Leaves the stage when |
|---|---|---|---|
| S0 | Sketch | User journeys and low-fi screens | Key journeys agreed with the decision-maker |
| S1 | Clickable prototype | Real UI in the repo, data from contract mocks, preview URL | Top tasks completable end to end; heuristic and accessibility review done |
| S2 | Validated experience | Usability tested with target users; contract v1 reviewed | Success thresholds met; contract frozen; stakeholders who consume it agreed |
| S3 | MVP | Real server behind the same contract, persistence, auth, tests, per-PR CI | Acceptance criteria pass on real data; baseline security and boundary gates green |
| S4 | Beta | Hardened: threat model, full Sonar scan, observability, performance baseline, backups, feature flags | Limited real users without severe incidents; budgets met |
| S5 | Production | SLOs and alerts, runbook, rollback, migrations plan, compliance, load test, sign-offs | Required stakeholders signed off; launch checklist complete |

## Process

1. **Set the target.** Ask (phrased for the profile) what the deliverable is for: a pitch or demo (S1), learning from users (S2), first paying customers (S3–S4), or real operation (S5). Record it in `.sayg/intent.md` and, per cell, in `cell.json` (`stage`, `target_stage`). Cells can be at different stages.
2. **Plan the climb.** Each stage becomes one or more slices. S0–S2 slices go to `sayg-prototype`; S3+ slices go through `sayg-slice` as usual.
3. **Scale the gates to the stage** (`sayg-gates` reads this):

   | Gate | S1 | S2 | S3 | S4 | S5 |
   |---|---|---|---|---|---|
   | Usability / accessibility | heuristic + automated a11y | user tests | regression | regression | regression |
   | Security | no real data, no real secrets | same | authn/z, secrets, deps | + threat model, Sonar | + pentest-style review, compliance |
   | Architecture | cell + contract shape | contract frozen | boundary rules in CI | + extraction-ready check | same |
   | Performance | perceived speed only | same | budget stated | baseline measured | load test at expected peak |
   | Operations | preview deploy | same | CI per PR | observability, backups | SLOs, runbook, rollback |

4. **Promotion check.** Before moving a cell up, verify every exit criterion with evidence and list the stakeholder approvals that stage requires (from `sayg-stakeholders`). Missing evidence keeps the cell where it is; say what's missing.

## Human checkpoint

Setting or lowering the target stage, and every promotion to S3 (first real data) and S5 (production).

## Rules

- A prototype never touches real personal data or production secrets.
- Skipping a stage is allowed only with an ADR saying what risk is accepted.
- "Production-ready" is a claim about evidence, not about code volume.
