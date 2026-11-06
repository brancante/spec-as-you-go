# Skills worth composing

Spec as you go stays a thin layer: it orchestrates, and borrows proven skills for execution. `sayg-scout` re-checks this list live; treat it as a dated snapshot (2026-10), verified only at the level of public READMEs and third-party write-ups.

| Need | Candidate | How sayg uses it |
|---|---|---|
| TDD, worktrees, subagent execution, systematic debugging | [obra/superpowers](https://github.com/obra/superpowers) | `sayg-slice` delegates implementation |
| Deep security audit (CodeQL/Semgrep variant analysis) | [trailofbits/skills](https://github.com/trailofbits/skills) | `sayg-gates` security gate on high-risk slices |
| Threat modeling (STRIDE) | community threat-modeling skills, e.g. [Security-Phoenix-demo/security-skills-claude-code](https://github.com/Security-Phoenix-demo/security-skills-claude-code) | per new cell / trust boundary |
| Writing and evaluating new skills | Anthropic `skill-creator` | extending sayg itself |
| Browser testing of the web app | Anthropic `webapp-testing`, Playwright | acceptance criteria that touch UI |
| Code review, security review | Claude Code built-in `/code-review`, `/security-review` | reviewer subagent in `sayg-gates` |
| Static analysis over time | SonarQube Community Build | `sayg-gates` pipeline, every N PRs |
| Secret scanning | gitleaks | `sayg-ci` on every PR |
| Prototype data behind the contract | MSW (request mocking) or in-memory adapters | `sayg-slice` S1 |
| Accessibility checks | axe-core (with Playwright) | `sayg-slice` S1, regression later |
| Consumer-driven contract tests across repos | Pact | `sayg-discover` shared contracts |
| Service and owner catalog | Backstage, `CODEOWNERS` | `sayg-discover` overlap detection |
| Codebase wiki for agents | [OpenWiki](https://github.com/langchain-ai/openwiki) (LangChain, MIT) | `sayg-setup` proposes it; every code-touching skill reads it first |
| Usage and cost from local Claude Code logs | [ccusage](https://github.com/ryoppippi/ccusage) | `sayg-setup` daily/weekly/monthly/5-hour reports |
| Brownfield onboarding | `legacy-to-ai-ready` (nicepkg/ai-workflow), `onboard` (parcadei/continuous-claude-v3) | prior art for `sayg-discover`; small community projects, review before adopting |

## Gaps sayg fills itself

Live tool discovery (`sayg-scout`), slice-level living specs with drift sweep (`sayg-slice`, `sayg-learn`), cell-based evolutionary structure (`sayg-architect`), continuous product thesis (`sayg-pitch`) and investor-grade scale reads (`sayg-pitch`).

## Candidates for later versions

- `sayg-pulse`: scheduled review of drift, debt, Sonar trend, manifesto freshness and new ecosystem tools.
- `sayg-observe`: OpenTelemetry baseline per cell (traces, RED metrics, cost per request) feeding the performance gate and `sayg-pitch` scale mode.
- `sayg-threat`: STRIDE per cell contract, if composed skills prove insufficient.
- `drift-check` and `model-router` as CLI/MCP tools.
