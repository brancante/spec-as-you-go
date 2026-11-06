---
name: sayg-gates
description: Use after implementing a slice and before merging, or when setting up CI - runs security, architecture and performance gates scaled to the slice's risk and its cell's stage, checks required approvals, and installs the free pipeline (per-PR lint/typecheck/test, cell boundary rules, secret scan, dependency audit, and a full SonarQube Community Build scan every N merged PRs). Blocks on red security findings.
---

# sayg-gates

> Adapt to the builder profile (`sayg-discover`). Read `openwiki/` before code.

Run the gates the slice's risk notes name, at least the minimum its stage sets (`sayg-slice`), plus security whenever input, auth, data or dependencies change. Prefer a reviewer subagent over reviewing your own work.

## Security

Trust boundaries and untrusted input paths; authn/authz on every entry point; secrets and sensitive logging; new dependencies (need, maintenance, license, advisories); run the available scanners and report real output; read the latest `sonar-report` artifact (`gh run download -n sonar-report`) for issues in touched files. **Red** on any exploitable finding; only an ADR can waive it.

## Architecture

Run the boundary rules (`templates/architecture/.dependency-cruiser.cjs` or equivalent): a violation is red. Respect `.sayg/decisions/`, cite them; justify new coupling or dependencies; flag what is hard to reverse.

## Performance

State the budget from intent or propose one; measure the touched hot path (benchmark, profile, query plan); record the baseline in the slice.

## Approvals

The stage's required sign-offs (`.sayg/stakeholders.md`): missing is amber before S4, red at S5.

Append a **gate report** to the slice: gate, verdict, evidence (command + result), follow-ups; ambers go to `.sayg/discoveries.md`. Never write "looks fine" for a check that did not run.

## Pipeline (install once)

Templates in `templates/ci/`, built for pnpm + Turborepo + TypeScript (adapt commands, not structure):

| Workflow | When | What |
|---|---|---|
| `sayg-ci.yml` | every PR and push to main | affected lint/typecheck/test, boundary rules, gitleaks, dependency audit |
| `sayg-sonar.yml` | every N merged PRs (`SAYG_SCAN_EVERY_N_PRS`, default 10), weekly, on demand | full SonarQube Community Build scan of main; job summary + `sonar-report` artifact |

Copy workflows to `.github/workflows/`, scripts to `.github/sayg/`, `sonar-project.properties` to the root. Sonar mode: **ephemeral** (default, a throwaway container on the runner, no history) or **persistent** (`vars.SONAR_HOST_URL` + `secrets.SONAR_TOKEN`). Optional vars: `SONAR_PROJECT_KEY`, `SAYG_MAX_BLOCKERS` (default 0). Verify with *Run workflow* and report the real result. Community Build analyses main only, which is why the full scan runs after merges.
