---
name: sayg-slice
description: Use after framing and scouting, to define the next smallest verifiable piece of work as a minimal spec with executable acceptance criteria and a model/effort recommendation. Creates .sayg/slices/NNN-name.md. Use instead of writing a full up-front spec.
---

# sayg-slice

> Adapt questions, vocabulary, evidence and autonomy to the builder profile (`sayg-profile`), per area of depth.

Spec only what the next slice needs. Everything else stays in `discoveries.md`.

## Process

1. Pick the slice: the smallest change that delivers observable value or retires the biggest risk. If it takes more than a day of agent work, cut it. Check the cell's stage (`sayg-stage`): user-facing work below S2 belongs to `sayg-prototype`, not here. If the slice touches anything another team or repo owns, run `sayg-stakeholders` overlap detection first.
2. Create `.sayg/slices/NNN-name.md` from `templates/slice.md` with:
   - **Goal** (one sentence, linked to intent)
   - **Acceptance criteria** as checks that can run: tests, commands, queries. No criterion without a way to verify it.
   - **Risk notes**: which gates apply (`security`, `architecture`, `performance`) and why
   - **Decisions needed**: open questions that would change the design
3. **Route** the work. For each task or subtask, record a recommendation in the slice file:
   - Judgment-heavy (architecture, ambiguous debugging, security review): strongest model, higher effort
   - Mechanical (rename, boilerplate, test scaffolding, formatting): fastest/cheapest model, low effort
   - Parallelizable research: several cheap subagents, one strong synthesizer
   State the reason in a line. These are recommendations the human can override; model names change, so check what is currently available rather than assuming.
   Read the budget mode from `sayg-budget` (`~/.sayg/budget/state.md` or `.sayg/budget/state.md`): in **tight** mode push every task one tier down unless it is hard to reverse; in **abundant** mode raise effort on reviews and judgment tasks. Treat a missing or stale state (past its reset) as **normal**.
4. Implement. If `superpowers` is installed, delegate execution to its planning, TDD and subagent skills; otherwise implement test-first yourself, one criterion at a time.
5. Run `sayg-gates`, then `sayg-learn`.

## Rules

- A criterion that can't fail is not a criterion.
- If implementation reveals the spec is wrong, change the spec in the same commit. Never leave them disagreeing.
