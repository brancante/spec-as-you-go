---
name: sayg-slice
description: Use to plan and build the next smallest verifiable piece of work in Spec as you go - the stage ladder from clickable UI prototype to production, experience-first prototyping (journeys, UI on contract mocks, usability tests), a minimal spec with executable acceptance criteria, and model routing by budget mode. Creates .sayg/slices/NNN-name.md. Use instead of a full up-front spec, for a demo or prototype, or to check if a cell can move to the next stage.
---

# sayg-slice

> Adapt to the builder profile (`sayg-discover`). Understanding and design run on the strongest model (a subagent with `model: opus` if this session is weaker). Read `openwiki/` before code.

## Stages

Each cell has `stage` and `target_stage` in `cell.json`; climb one at a time, experience first. Exit criteria: `templates/stages.md`.

| Stage | What exists | Gates minimum |
|---|---|---|
| S0 Sketch | journeys and low-fi screens | journeys agreed |
| S1 Clickable prototype | UI in the repo on contract mocks, preview URL | heuristic + automated a11y; fictional data only |
| S2 Validated experience | usability-tested; contract v1 frozen | user tests; consumers agreed the contract |
| S3 MVP | real server behind the same contract, auth, tests, CI | authz, secrets, deps; boundary rules |
| S4 Beta | threat model, Sonar, observability, perf baseline, backups | + limited real users |
| S5 Production | SLOs, runbook, rollback, compliance, load test | required sign-offs |

Setting or lowering the target, and promoting to S3 and S5, are the person's decisions. Skipping a stage needs an ADR.

## Experience slices (S0–S2)

- **S0**: Mermaid journeys in `.sayg/experience/journeys.md` (entry, steps, errors, empty states); a one-file HTML mock is fine before a repo exists.
- **S1**: write `cells/<x>/contract/` first, then a mock adapter with realistic fictional data (empty, error, slow), screens in `cells/<x>/ui/` mounted in `apps/web/`, each top task scripted end to end (Playwright), heuristic and axe review, a preview deploy.
- **S2**: usability test (`templates/prototype/usability-test.md`, thresholds set in advance, ~5 target users per round). An AI walkthrough is a pre-check, never user evidence. Then freeze contract v1 with an ADR; S3 builds the server behind it.

## Build slices (S3+)

1. Pick the smallest change that delivers observable value or retires the biggest risk; cut anything over a day of agent work. If it touches what another team owns, run the overlap step in `sayg-discover` first.
2. Write `.sayg/slices/NNN-name.md` (template `templates/slice.md`): goal, acceptance criteria that can run (no criterion without a command, test or query), risk notes naming the gates, approvals, open decisions.
3. **Route** each task: judgment (design, architecture, hard debugging, security review) on the strongest model at high effort; everyday implementation on the everyday tier; mechanical work and bulk reading on the fast tier. Try lower effort before a smaller model. Read the budget mode (`~/.sayg/budget/state.md`, see `sayg-setup`): `tight` pushes non-critical tasks one tier down, `abundant` raises effort on reviews; stale or missing means `normal`. Check current model names rather than assuming.
4. Implement test-first; if `superpowers` is installed, delegate to its planning, TDD and subagent skills.
5. Run `sayg-gates`, then `sayg-learn`.

## Rules

- A criterion that can't fail is not a criterion. If the spec is wrong, fix it in the same commit.
- Prototypes never touch real personal data or production secrets; every screen reads through the contract; real copy, never lorem ipsum, in tested flows.
- "Production-ready" is a claim about evidence, not code volume.
