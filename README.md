# Spec as you go

Living, discovery-driven specs for system thinkers and fixers. An evolution of spec-driven development (SDD): the spec grows from what building teaches, quality is checked on every slice, the product thesis is revised with evidence, and the ecosystem is searched live instead of assumed. Every skill adapts to who is building: an experienced architect and a business-led founder get different questions and different autonomy.

> Português: [README.pt-BR.md](README.pt-BR.md)

## Loop

```
profile ─► discover (greenfield | brownfield) ─► stakeholders · stage target
              │
         prototype S0–S2 (journeys → clickable UI on mocks → usability test → contract freeze)
              │
            fit ◄──────────────── scale (on demand)
             │
frame → scout → architect → slice → build → gates → learn ─┐
  ▲                           ▲                             │
  │                        budget (model routing by window) │
  └──────── discoveries become the next slice ◄─────────────┘
       pipeline: per-PR checks + Sonar every N merged PRs
```

| Skill | Job |
|---|---|
| `sayg-profile` | Builder's technical and business depth, decision style, subscription; how every skill adapts |
| `sayg-discover` | Entry point. Greenfield or brownfield discovery with a shared core; code assessment, evidence intake, first slices |
| `sayg-stage` | Maturity ladder S0 sketch → S5 production; exit criteria; gates and approvals scale with stage |
| `sayg-prototype` | Experience first (S0–S2): journeys, clickable UI on contract mocks, usability tests, contract freeze |
| `sayg-stakeholders` | Stakeholder map, overlap detection with other repos/teams, division of work, shared contracts, approvals, RFC drafts |
| `sayg-frame` | Intent, constraints, success signals |
| `sayg-scout` | Live search for skills, MCP servers, libs: adopt / adapt / build |
| `sayg-architect` | Fast reference architecture: front + back in one repo, organized as cells (greenfields inside the product) |
| `sayg-slice` | Smallest verifiable spec + model routing |
| `sayg-gates` | Security, architecture, performance checks per slice |
| `sayg-learn` | Reconcile spec and code, ADRs, discoveries, drift sweep |
| `sayg-pipeline` | GitHub Actions: per-PR checks and SonarQube Community Build scan every N merged PRs |
| `sayg-fit` | Living product manifesto: problem, segment, differentiation, PMF evidence |
| `sayg-scale` | Evidence-graded scale, market impact and investor attractiveness read |
| `sayg-budget` | Usage across 5-hour/weekly/monthly windows, budget mode for routing, upgrades and cheaper providers |

### SAYG board (widget beside the chat)

With many PRs open at once, `/sayg-board` opens a pane that shows:

- **Merge order**: stacked PRs after their parent, ready ones first, then oldest, with a warning when two PRs touch the same files (rebase the later one after merging).
- **Next action per PR**: merge, fix CI (names the failing checks), resolve conflicts, update branch, get a review, address changes, or mark ready.
- **Deploys**: recent GitHub deployments and the latest workflow runs on the default branch.
- **Evolution**: cells by stage, slices by status, open discoveries, PRs merged in the last 7 days.

It refreshes every 5 minutes and shortly after `git push` or `gh pr ...`, shows a summary in the status line, and opens by itself in projects that have `.sayg/`. The command's output is also read by Claude, so you can ask "what should I merge next?". It reads GitHub through `gh api` with your own login (`gh auth login`).

State lives in `.sayg/` in your repo (`intent.md`, `architecture.md`, `stakeholders.md`, `experience/`, `slices/`, `decisions/`, `discoveries.md`, `discovery/`, `product/`, `outbox/` for drafts the user sends) and, per person, in `~/.sayg/` (`profile.md`, `budget/`). Templates are in `templates/`, scripts in `tools/`. Composed skills and the roadmap are in [docs/landscape.md](docs/landscape.md).

## Status

v0.5: skills, templates, CI templates and `tools/repo-snapshot.sh`. Not field-tested yet. Not built: `sayg-pulse`, `sayg-observe`, CLI/MCP tools, non-Claude agents.

## Install (Claude Code)

One step, inside Claude Code (v2.1.275 or later):

```
/plugin install spec-as-you-go --marketplace brancante/spec-as-you-go
```

Or from your shell:

```
claude plugin marketplace add brancante/spec-as-you-go
claude plugin install spec-as-you-go@spec-as-you-go
```

Update later with `claude plugin marketplace update spec-as-you-go`. To try it without installing: `git clone https://github.com/brancante/spec-as-you-go && claude --plugin-dir ./spec-as-you-go`.

Then start with: "use sayg-discover on this repo".
