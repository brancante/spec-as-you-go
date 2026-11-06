---
name: sayg-setup
description: Use to configure the environment for Spec as you go in a project, or when something it needs is missing - GitHub CLI login, the plugin and its views, CI and Sonar, usage tools, and a codebase wiki with OpenWiki so every later code change starts from the wiki. Use on "set up", "configure", "install", before the first sayg-discover in a repo, or when the board shows n/a or errors.
---

# sayg-setup

> Adapt questions, vocabulary, evidence and autonomy to the builder profile (`sayg-profile`), per area of depth.

Check what exists, propose what is missing, change nothing outside the repo without the person's yes. Every check reports its real result.

## Checklist

| Area | Check | If missing |
|---|---|---|
| GitHub | `gh auth status`; `git remote get-url origin` is GitHub | Ask the person to run `gh auth login` (never ask for a token in chat) |
| Plugin | `claude plugin list` shows `spec-as-you-go` and its version | `claude plugin marketplace update spec-as-you-go` |
| Views | `/sayg-board` and `/sayg-features` open | Report what the pane showed; `gh` errors usually mean login or scopes |
| CI and Sonar | `.github/workflows/sayg-*.yml` present | Run `sayg-pipeline` |
| Usage | the AI tab shows plan windows; `npx ccusage@latest --help` runs | Explain that windows appear only with a subscription login |
| Wiki | `openwiki/` exists and CLAUDE.md references it | Propose OpenWiki (below) |
| Project state | `.sayg/` exists | Run `sayg-discover` |
| Model for design | `.sayg/config.json` `insightModel` | Default `opus`; ask before choosing the top tier, which costs more |

## The codebase wiki (OpenWiki)

Agents fail on code they don't understand, and reading a large repo from scratch every time wastes tokens. A maintained wiki fixes both.

1. **Propose [OpenWiki](https://github.com/langchain-ai/openwiki)** (LangChain, MIT): a CLI that generates a wiki of the codebase into `openwiki/` and adds a reference block to `CLAUDE.md` or `AGENTS.md`. As its docs describe it: `npm install -g openwiki`, then `openwiki --init`, which asks for a model provider and API key; a scheduled GitHub Action running `openwiki --update` opens a PR with wiki changes as the code evolves. Check the repository's README for the current commands before running them.
2. **Say what it costs and sends**: generation sends the code to the model provider the person chooses, billed to their key. That is their decision; for private code, prefer the provider their company already approves.
3. **Add the wiki-first rule** to the project's `CLAUDE.md` (append, keep existing content), from `templates/setup/claude-md-wiki.md`:
   before changing code for a feature, fix or improvement, read `openwiki/` (index first), then only the code the wiki points to; when the wiki is missing, wrong or stale for that area, say so and update it in the same PR.
4. **Add the update workflow** only with the person's yes, and only after `openwiki --init` worked locally.
5. **Without OpenWiki** (declined, no key, policy): keep the same rule with `.sayg/architecture.md` and `tools/repo-snapshot.sh` as the map, and say the wiki would make it cheaper.

## Rules

- Never paste, store or print secrets. API keys go to the tool's own prompt or the person's secret store.
- Never install global tools, add workflows or edit CLAUDE.md without the person's yes; show the exact command or diff first.
- Report each check as passed, missing (with the fix) or not checked (with why).
