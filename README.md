# Spec as you go

Living, discovery-driven specs for system thinkers and fixers. An evolution of spec-driven development (SDD): the spec grows from what building teaches, quality is checked on every slice, the product thesis is revised with evidence, and the ecosystem is searched live instead of assumed. Every skill adapts to who is building: an experienced architect and a business-led founder get different questions and different autonomy.

> Português: [README.pt-BR.md](README.pt-BR.md)

## Loop

```
setup ─► discover (profile · greenfield | brownfield · intent · stage · stakeholders)
             │
          pitch (fit · scale · roast · insights)
             │
 scout → architect → slice (S0–S2 experience, then build) → gates → learn ─┐
   ▲                   ▲ routed by budget mode (setup)                     │
   └──────────── discoveries become the next slice ◄───────────────────────┘
```

Eight skills:

| Skill | Job |
|---|---|
| `sayg-setup` | Environment (GitHub login, views, CI/Sonar), codebase wiki with OpenWiki and the wiki-first rule, AI capacity across 5-hour/weekly/monthly windows and the budget mode |
| `sayg-discover` | Entry point: builder profile, greenfield or brownfield discovery, intent and target stage, stakeholders and overlaps with other repos, first slices |
| `sayg-scout` | Live search for skills, MCP servers, libs: adopt / adapt / build |
| `sayg-architect` | Fast reference architecture: front + back in one repo, organized as cells (greenfields inside the product) |
| `sayg-slice` | Stage ladder S0 sketch → S5 production, experience-first prototyping, smallest verifiable spec, model routing |
| `sayg-gates` | Security, architecture, performance and approval gates per slice; the free CI + Sonar pipeline |
| `sayg-learn` | Reconcile spec and code, ADRs, discoveries, drift sweep, stage promotion |
| `sayg-pitch` | Product judgment in four modes: fit (living manifesto), scale (investor read), roast ("what would Elon do"), insights (one researched insight, improvement and critique per PR) |

Skills that understand or design run on the strongest model; every skill that touches code reads the project wiki first.

### SAYG board (widget beside the chat)

`/sayg-board` opens a pane with a one-line headline (`PRs 2 ready · 3 blocked │ gate OK │ 2 critical/high vulns │ CI 92% │ 5h 40% 7d 62%`) and four tabs (hotkeys 1–4):

- **PRs**: merge order (stacked after parent, ready first, then oldest), the next action for each (merge, fix CI naming the failing checks, resolve conflicts, update branch, get a review, address changes, mark ready), file-overlap warnings, stale PRs and reviews waiting on you.
- **Health**: latest `sayg-sonar` report (gate, coverage, duplication, BLOCKER/HIGH), CI pass rate and median duration on the default branch, Dependabot, code scanning and secret scanning alerts by severity, Sonar security issues and hotspots.
- **Flow**: PRs merged in 7 days, median open-to-merge time, stale PRs, deploys, cells by stage, slices by status, open discoveries.
- **AI**: your plan's 5-hour and weekly windows with reset times, the budget mode `sayg-setup` would set, session cost and context used, and the skills used this session.

It refreshes every 5 minutes and shortly after `git push` or `gh pr ...`, puts the headline in the status line, and opens by itself in projects that have `.sayg/`. Claude reads the command's output too, so you can ask "what should I merge next?" or "fix the CI on #12". It reads GitHub through `gh api` with your own login (`gh auth login`); sections your login can't read show `n/a`.

### SAYG features (custom view)

`/sayg-features` opens a pane with open PRs and PRs merged in the last 14 days, the **migrations** they carry (schema files, a cell's `contract/`), flagged when merged but not yet deployed to production, and for each PR three short sentences: 💡 **insight**, 🔧 **improvement**, ⚠️ **critique**. A click on a PR opens its thread: the Claude Code session that made it when the PR body links one, else the PR conversation. **Generate insights** starts a background subagent on a strong model (Opus by default, `.sayg/config.json` `insightModel` to change) that reads the wiki, researches the web and writes `.sayg/insights/pr-<n>.json`; it pauses when the budget is tight.

State lives in `.sayg/` in your repo (`intent.md`, `architecture.md`, `stakeholders.md`, `experience/`, `slices/`, `decisions/`, `discoveries.md`, `discovery/`, `product/`, `outbox/` for drafts the user sends) and, per person, in `~/.sayg/` (`profile.md`, `budget/`). Templates are in `templates/`, scripts in `tools/`. Composed skills and the roadmap are in [docs/landscape.md](docs/landscape.md).

## Status

v0.9: skills, templates, CI templates and `tools/repo-snapshot.sh`. Not field-tested yet. Not built: `sayg-pulse`, `sayg-observe`, CLI/MCP tools, non-Claude agents.

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
