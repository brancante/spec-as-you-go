---
name: sayg-frame
description: Use at the start of any new product, feature or change in a Spec as you go project, or when intent has shifted. Frames the problem as intent, constraints and success signals, and creates or updates .sayg/intent.md. Triggers on "let's build", "new idea", "we need to", or an unclear request.
---

# sayg-frame

> Adapt questions, vocabulary, evidence and autonomy to the builder profile (`sayg-profile`), per area of depth.

Capture *why* before *what*. Keep it short; this is the only document meant to be stable.

## Process

1. Check for `.sayg/intent.md`. If present, read it and `.sayg/discoveries.md` first; you are amending, not starting over. If there is no `.sayg/` at all, run `sayg-discover` first; it calls this skill with the evidence it gathered.
2. Ask the human at most 3 questions, one at a time, only about things you cannot infer from the repo or the request:
   - What outcome would make this worth it? (success signals, measurable if possible)
   - What is non-negotiable? (security, compliance, budget, latency, deadlines)
   - What is explicitly out of scope for now?
   - What must the deliverable be ready for: a demo, user testing, first customers, or production? (sets the target stage with `sayg-stage`)
3. Write or update `.sayg/intent.md` from `templates/intent.md`. Do not specify solutions here.
4. Hand off to `sayg-fit` (is this differentiated, and for whom?) and `sayg-scout` (is this already solved?). For a new product, then `sayg-architect`; otherwise `sayg-slice`.

## Human checkpoint

An **intent change** is a decision for the human. State the diff in intent (old → new) and get a yes before writing it.

## Rules

- Prefer inferring over asking. A wrong guess recorded as an assumption beats a blocked session.
- Mark each assumption `ASSUMED` in the file so `sayg-learn` can confirm or retire it later.
