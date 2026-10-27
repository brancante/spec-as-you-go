---
name: sayg-pipeline
description: Use when setting up or changing CI/CD in a Spec as you go project. Installs a simple per-PR pipeline (affected lint/typecheck/test, cell boundary rules, secret scan, dependency audit) and a full SonarQube Community Build scan every N merged PRs, with a machine-readable report that sayg-gates and sayg-learn consume.
---

# sayg-pipeline

> Adapt questions, vocabulary, evidence and autonomy to the builder profile (`sayg-profile`), per area of depth.

Two layers, both free:

| Workflow | When | What |
|---|---|---|
| `sayg-ci.yml` | every PR and push to main | affected lint, typecheck, tests; boundary rules; secret scan; dependency audit |
| `sayg-sonar.yml` | every N merged PRs, weekly, or on demand | full SonarQube Community Build analysis of main; report + artifact |

Templates are in `templates/ci/`.

## Process

1. Detect the stack (package manager, build tool, languages). The templates assume pnpm + Turborepo + TypeScript; adapt commands, not structure, for other stacks.
2. Copy `templates/ci/workflows/*.yml` to `.github/workflows/`, `templates/ci/sayg/*.sh` to `.github/sayg/`, and `templates/ci/sonar-project.properties` to the repo root. Adjust the branch name if the default branch is not `main`.
3. Pick the Sonar mode and tell the human what to configure:
   - **Ephemeral (default, zero setup):** the workflow starts a throwaway SonarQube Community Build container on the runner, scans, reports, and discards it. No history or trends.
   - **Persistent:** set repo variable `SONAR_HOST_URL` and secret `SONAR_TOKEN` (a user token with Browse + Execute Analysis on the project). Keeps history and lets the quality gate judge new code.
4. Set repo variables as needed: `SAYG_SCAN_EVERY_N_PRS` (default 10), `SONAR_PROJECT_KEY` (default repo name), `SAYG_MAX_BLOCKERS` (default 0).
5. If the project produces coverage (lcov), add the test step to `sayg-sonar.yml` where marked and set the report path in `sonar-project.properties`.
6. Verify: trigger `sayg-sonar` with *Run workflow* and confirm the job summary and `sonar-report` artifact appear. Report the actual result to the human.

## How the results flow back

- `sayg-gates` reads the latest report: `gh run download -n sonar-report -R <repo>` (newest successful `sayg-sonar` run) and cites it as evidence.
- `sayg-learn` turns new security issues and hotspots into discoveries or slices.

## Limits to state plainly

- Community Build analyzes the main branch only; it does not decorate PRs. That is why the full scan runs after merges, while the per-PR layer stays fast.
- In ephemeral mode the quality gate has no previous analysis to compare against, so the workflow's own blocker threshold is what fails the run.
- The merged-PR count comes from GitHub search, which can lag a few seconds; a scan may occasionally land one PR late.
