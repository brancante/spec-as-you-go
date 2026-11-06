---
name: sayg-setup
description: Use to set up or check the environment for Spec as you go (GitHub login, plugin views, CI and Sonar, a codebase wiki with OpenWiki) and to manage AI capacity across the plan's 5-hour, weekly and monthly windows (budget mode, model routing, idle capacity, upgrades, cheaper providers). Use on "set up", "configure", before the first discover, when the board shows n/a, or when limits or cost come up.
---

# sayg-setup

> Adapt to the builder profile (`sayg-discover`); design work runs on the strongest model; read `openwiki/` before code.

Check what exists, propose what is missing, change nothing outside the repo without the person's yes. Report each check as passed, missing (with the fix) or not checked (with why).

## Environment

| Area | Check | If missing |
|---|---|---|
| GitHub | `gh auth status`; origin is on GitHub | Ask the person to run `gh auth login` (never ask for a token in chat) |
| Plugin | `claude plugin list` shows `spec-as-you-go` | `claude plugin marketplace update spec-as-you-go` |
| Views | `/sayg-board` and `/sayg-features` open | Report what the pane showed; `gh` errors usually mean login or scopes |
| CI and Sonar | `.github/workflows/sayg-*.yml` | Install them with `sayg-gates` (pipeline section) |
| Wiki | `openwiki/` exists and CLAUDE.md points to it | Propose OpenWiki (below) |
| Project state | `.sayg/` exists | Run `sayg-discover` |
| Design model | `.sayg/config.json` `insightModel` | Default `opus`; ask before the top tier, which costs more |

## Codebase wiki (OpenWiki)

1. Propose [OpenWiki](https://github.com/langchain-ai/openwiki) (LangChain, MIT): it generates a wiki of the code into `openwiki/` and adds a reference to `CLAUDE.md`/`AGENTS.md`. Per its docs: `npm install -g openwiki`, `openwiki --init` (asks for a model provider and key), and a scheduled Action running `openwiki --update` that opens PRs. Check its README for the current commands first.
2. Say what it sends and costs: the code goes to the provider the person picks, billed to their key. For private code, prefer a provider their company approves.
3. Append the wiki-first rule from `templates/setup/claude-md-wiki.md` to the project's `CLAUDE.md`.
4. Without OpenWiki, keep the same rule with `.sayg/architecture.md` and `tools/repo-snapshot.sh` as the map.

## AI capacity

1. **Measure, never guess limits.** Plan windows: the board's AI tab, or `/usage` (ask the person to paste it; exact caps are not published). Tokens and cost by day, week, month and project: `npx ccusage@latest daily|weekly|monthly|blocks --json` (local logs only; cost is an API-price estimate). API keys: Console or the Admin API reports. Log a dated row in `~/.sayg/budget/log.md` (template `templates/budget/log.md`).
2. **Set the budget mode** in `~/.sayg/budget/state.md` (template `templates/budget/state.md`); `sayg-slice` routes by it:

| Mode | When | Effect |
|---|---|---|
| abundant | weekly window under half used with ≤2 days to reset | pull work forward; higher effort on reviews |
| normal | on pace | default routing |
| tight | any window ≥85% | everything one tier down unless hard to reverse; defer research |
| exhausted | a window at 100% | plan only; queue work |

3. **Recommend**, ranked by value: idle capacity before a reset (a scout sweep, gates on recent slices, Sonar triage, `sayg-pitch` research); stretching a tight window (lower effort before a smaller model, compaction, narrower subagents); upgrade or downgrade with the arithmetic and current prices; API vs subscription from ccusage tokens × current prices; cheaper or local models only for bounded, non-sensitive tasks, after a quality check on a real sample.

## Rules

- Never paste, store or print secrets; keys go to the tool's own prompt or the person's secret store.
- No global installs, workflows, CLAUDE.md edits, plan changes or new providers without the person's yes; show the command or diff first.
- Never invent limits or prices; label estimates with their inputs.
