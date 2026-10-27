---
name: sayg-prototype
description: Use for stages S0–S2 of Spec as you go - turning an idea or feature into user journeys, a clickable UI prototype backed by contract mocks, and a usability-validated experience before backend development starts. Use when the user wants a demo, a prototype, to "see it working", or to test an idea with users.
---

# sayg-prototype

> Adapt questions, vocabulary, evidence and autonomy to the builder profile (`sayg-profile`), per area of depth.

Experience first, engineering second, and nothing thrown away: the prototype is built in the real structure, so going to production means replacing mocks with a server, not rewriting the UI.

## S0 Sketch

1. From intent and the product manifesto, name the primary user and their top 3 tasks.
2. Draw each journey as a Mermaid flowchart in `.sayg/experience/journeys.md`: entry point, steps, decisions, error and empty states.
3. If there is no repo yet and the user wants something to look at today, a single-file HTML mock is fine at S0. Say it will be rebuilt in S1.
4. Get the decision-maker's agreement on the journeys.

## S1 Clickable prototype

1. Ensure the cell exists (`sayg-architect`). Write the **contract first** in `cells/<x>/contract/`: types, operations, errors. It is the seam between experience and engineering.
2. Implement a **mock adapter** of the contract (in-memory, or request mocking such as MSW for HTTP) with realistic, fictional data, including empty, error and slow states.
3. Build the screens in `cells/<x>/ui/` and mount them in `apps/web/`. Use the project's design system or a mainstream component library; spend effort on flow and copy, not pixel polish.
4. Script each top task as an end-to-end test (Playwright or equivalent). These scripts become the regression suite later.
5. Review: heuristic review (Nielsen's 10 or similar), automated accessibility check (axe or similar), mobile width. Log issues in `.sayg/discoveries.md`.
6. Publish a preview deploy so stakeholders can try it (`sayg-scout` for the current best free option for the stack).

## S2 Validated experience

1. Plan a usability test with `templates/prototype/usability-test.md`: tasks, success thresholds set in advance, participants. Around five target users per round usually surface most major issues; ask stakeholders (`sayg-stakeholders`) to help recruit.
2. An AI walkthrough of the prototype is a useful pre-check but **not** a usability test; never report it as user evidence.
3. Record results with evidence grades; fix and retest until thresholds are met or the decision-maker accepts the gap.
4. **Freeze contract v1**: review it with every stakeholder who consumes or provides it, version it, and record an ADR. From here, `sayg-slice` builds the real server behind it (S3).

## Rules

- Fictional data only. No real personal data, no production credentials, even in previews.
- Every screen reads data through the contract; a UI that calls anything else is a bug.
- Copy is part of the design: write real labels, errors and empty states, never lorem ipsum in the flows being tested.
