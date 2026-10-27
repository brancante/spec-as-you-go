---
name: sayg-budget
description: Use to manage AI usage across the builder's subscription windows (5-hour session, weekly, monthly), when limits are close, when usage is low before a reset, or when asked about model choice, cost, upgrades or cheaper providers. Measures consumption, projects it to the next reset, sets a budget mode that sayg-slice uses for routing, and proposes model changes, work to pull forward, plan upgrades or alternative providers.
---

# sayg-budget

Treat AI capacity like a fixer treats any scarce resource: know the burn rate, spend it where it creates the most value, and never let paid capacity expire unused when there is valuable work waiting.

## 1. Read context

- Profile (`sayg-profile`): plan, other providers, spend tolerance, data constraints, and depth in AI/LLM and finance (this sets how the report is written).
- Previous snapshots in `~/.sayg/budget/log.md` (or `.sayg/budget/log.md` when home is not persistent).

## 2. Measure (never guess limits)

Use what exists, say which sources were used and which weren't available:

| Window | Source |
|---|---|
| 5-hour session and weekly limits (subscription) | Claude Code `/usage` (plan usage bars and reset times) or claude.ai Settings → Usage. The agent cannot run `/usage` itself: ask the user to run it and paste the output. Anthropic does not publish exact caps; work with the percentages shown. |
| Daily / weekly / monthly tokens and estimated cost, by model and project | [ccusage](https://github.com/ryoppippi/ccusage) over local Claude Code logs: `npx ccusage@latest daily --json`, `weekly`, `monthly`, `blocks` (5-hour blocks). Reads local logs only: cloud sessions and claude.ai chat are not included; costs are API-price estimates, not billing. |
| API keys (pay-as-you-go) | Anthropic Console usage, or the Admin API usage and cost reports when an admin key exists. |
| Teams | Claude Code OpenTelemetry export, when configured. |

Append a dated row to the log: window, % used, time to reset, tokens by model, top projects.

## 3. Analyze

- **Burn rate and projection**: at the current pace, when does each window run out vs when does it reset?
- **Where it goes**: share by model, project and kind of work (implementation, exploration, review, research).
- **Waste patterns**: top-tier model on mechanical work; very long sessions never compacted; re-reading large files; broad subagent fan-outs whose results aren't used; retries caused by vague specs.
- **Idle capacity**: large share left with little time to reset.

## 4. Set the budget mode

Write `~/.sayg/budget/state.md` with one mode and the date. `sayg-slice` reads it for routing.

| Mode | When | Routing effect |
|---|---|---|
| **abundant** | projected to finish the window with ≥40% unused | Pull work forward (below); strongest model for judgment tasks, higher effort on reviews |
| **normal** | on pace | Default routing in `sayg-slice` |
| **tight** | projected to run out before reset | Mechanical work on the smallest capable model and low effort; top model only for decisions that are hard to reverse; defer non-urgent research |
| **exhausted** | limit hit | Plan only; queue work; consider API or other providers for non-sensitive tasks |

General routing tiers (check the current model lineup live; names and prices change):
- **Top tier** (e.g. Fable): rare, decisive work such as architecture forks, hard security reviews, gnarly debugging. Most expensive.
- **Strong default** (e.g. Opus): design, review, complex implementation.
- **Everyday** (e.g. Sonnet): most implementation and tool use.
- **Fast/cheap** (e.g. Haiku): bulk reading, summarizing, classification, scaffolding, formatting, subagent fan-outs.
- Try a **lower effort** on the same model before switching models; judge by cost per completed task, not per request.

## 5. Recommend

Pick what applies, ranked by value:

- **Use idle capacity before reset** (abundant): a `sayg-scout` sweep for new tools, `sayg-gates` security/architecture review of recent slices, Sonar backlog triage, test coverage on hotspots, `sayg-fit`/`sayg-scale` market research, refactors queued in discoveries. Propose a concrete queue sized to what is left.
- **Stretch a tight window**: model and effort changes per task class, compaction points, narrower subagent scopes, batching research into one session.
- **Upgrade or downgrade**: if limits are hit repeatedly, compare the next plan tier against the extra value delivered; if a plan is consistently under ~30% used, say a smaller plan may fit. Fetch current plan prices; show the arithmetic.
- **API vs subscription**: estimate the month's usage at API prices (from ccusage tokens × current prices) to see whether pay-as-you-go would be cheaper or more expensive.
- **Other providers**: for well-bounded, non-sensitive tasks (bulk summarization, classification, embeddings, translation), cheaper or open-weight models from other providers or local runtimes may cut cost. Only recommend with: the data constraint respected, a quality check on a real sample, and the integration cost stated (Claude Code itself uses Anthropic models; other providers need separate tooling). Check prices and model quality live; they change monthly.

## Communication

Use the profile. An AI-savvy architect gets tokens by model, effort and cache notes, and the routing table. A business-led user gets: "At this pace you hit the weekly limit Thursday; reset is Monday. Option A: … (cost), option B: … (cost). I recommend A."

## Rules

- Never invent limits, prices or quotas. Label every estimate and show its inputs.
- Changing plans, adding providers or sending code/data to a new provider is the user's decision. Present it, don't do it.
- Never change model or settings configuration without approval.
