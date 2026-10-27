---
name: sayg-learn
description: Use at the end of every slice in a Spec as you go project, or when code and spec disagree. Converts what building taught into updated specs, decision records and new discoveries, and detects spec drift. This is what keeps the spec alive.
---

# sayg-learn

> Adapt questions, vocabulary, evidence and autonomy to the builder profile (`sayg-profile`), per area of depth.

Building is the main source of requirements. Capture them before the context is gone.

## Process

1. **Reconcile**: compare the slice's acceptance criteria with the code and tests. Fix whichever is wrong, in the same commit. List any criterion no test covers.
2. **Decisions**: for each non-obvious choice made (and each rejected alternative that mattered), write a short ADR in `.sayg/decisions/NNNN-title.md` from `templates/adr.md`, linked to the slice.
3. **Discoveries**: add new problems, ideas, risks and follow-ups to `.sayg/discoveries.md`, one line each, with a source (slice, gate, user, ecosystem).
4. **Assumptions**: confirm or retire each `ASSUMED` item in `intent.md` that this slice touched.
5. **Drift sweep**: scan other slices and decisions that reference files changed here. Mark stale ones `STALE: <reason>` rather than silently editing history.
6. **Stage**: if the slice completed a stage's exit criteria, propose the promotion (`sayg-stage`) with the evidence and the approvals still needed.
7. **Next**: propose the next slice from discoveries, ranked by risk retired per effort. If a discovery changes intent, hand it to `sayg-frame`; if it opens a new capability gap, hand it to `sayg-scout`; if it changes what users get or who they are, hand it to `sayg-fit`; if it strains the structure, hand it to `sayg-architect`.

## Rules

- Short beats complete. An ADR is five lines, not a design doc.
- Never delete history; supersede it.
