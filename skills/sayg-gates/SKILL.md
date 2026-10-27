---
name: sayg-gates
description: Use after implementing a slice in a Spec as you go project, and before merging. Runs security, architecture and performance gates scaled to the slice's risk notes and writes a gate report into the slice file. Blocks on red security findings.
---

# sayg-gates

> Adapt questions, vocabulary, evidence and autonomy to the builder profile (`sayg-profile`), per area of depth.

Quality is checked continuously, per slice, in proportion to risk and to the cell's stage (the stage table in `sayg-stage` sets the minimum per gate). Run only the gates the slice's risk notes call for, plus security whenever input, auth, data or dependencies are touched. Stakeholder approvals the stage requires (`sayg-stakeholders`) are part of the gate: a missing sign-off is amber before S4 and red at S5.

## Security gate

- Trust boundaries crossed by this slice; untrusted input paths and how each is validated
- Authn/authz on every new entry point; secrets handling; logging of sensitive data
- New dependencies: necessity, maintenance, license, known advisories
- Run the project's available scanners (SAST, dependency audit, secret scan) and report actual output
- Read the latest `sonar-report` artifact from `sayg-sonar` if it exists; new security issues or hotspots in files this slice touched count as findings
- Result is **red** if any exploitable finding is unresolved. Red blocks the merge; the human may only waive it by recording an ADR.

## Architecture gate

- Run the boundary rules (fitness functions) set up by `sayg-architect`; any violation is red
- Does the change respect decisions in `.sayg/decisions/`? Cite them.
- New coupling, new layers or new external dependencies: is each justified, and is a decision record needed?
- Reversibility: what is hard to undo here? Flag it for the human.

## Performance gate

- State the budget from intent (latency, memory, cost per request) or propose one
- Measure, don't guess: benchmark, profile or query plan for the hot path touched
- Record the baseline in the slice so later slices can detect regressions

## Output

Append a **Gate report** to the slice file: gate, verdict (green/amber/red), evidence (command + result), follow-ups. Amber items go to `.sayg/discoveries.md`.

## Rules

- Evidence over assertion: if a check was not run, say "not run", never "looks fine".
- Do not review your own work in the same context when a reviewer subagent is available; use one.
