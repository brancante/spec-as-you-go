# Slice 001: spec by observation

**Status:** proposed
**Intent link:** roast 2026-10-27, round 6 ("reuse what everyone throws away")
**Cell / stage:** plugin core (`hooks/`) · S1 → S2
**Stakeholders touched:** none outside this repo; users' session content (privacy rules below)

## Goal
Turn the conversation into the spec: after each turn, decisions, requirements, discoveries and risks said in the session are drafted into `.sayg/inbox.md` with their source, so `sayg-learn` confirms them instead of the human writing them from memory.

## Design (first cut)
- `turn.complete` hook, only in projects with `.sayg/` and when not opted out (`.sayg/config.json` `{"observe": false}`).
- Reads the turns since the last processed one with `$.session.messages()`; keeps the cursor in `$.state` and `$.store`.
- One `$.model.complete({ model: 'haiku', effort: 'low' })` per turn, with a fixed extraction prompt (cached), asking for JSON: `{ decisions[], requirements[], discoveries[], risks[] }`, each with a one-line text and the quote it came from.
- Redacts before sending and before writing: strings that look like keys, tokens, emails, and anything inside `.env`-style blocks.
- Appends drafts to `.sayg/inbox.md` as `- [ ] <type>: <text> — "<quote>" (turn N, date)`; never edits intent, ADRs or slices directly.
- `sayg-learn` gains a step: triage the inbox (accept → ADR / discovery / slice criterion; reject → delete line).
- The board's Flow tab shows "inbox: N drafts".
- Budget-aware: skipped in budget mode `tight` or `exhausted`; cost shown in the AI tab.

## Acceptance criteria
- [ ] A turn where the user says "vamos usar Postgres em vez de Mongo porque precisamos de transações" produces a `decision` draft with that quote. — verify: `claude plugin test .` (mocked `model.complete` and `session.messages`)
- [ ] A turn with no decision produces no draft. — verify: same test file
- [ ] A secret-looking string in the conversation never reaches `model.complete` nor `inbox.md`. — verify: test with a fake `ghp_…` token
- [ ] No `.sayg/`, or `observe: false`, means zero model calls. — verify: test counts `model.complete` calls
- [ ] Budget mode `tight` skips extraction. — verify: test with seeded windows at 90%
- [ ] Each extraction costs under 2k input tokens on a typical turn. — verify: `usage` from `model.complete` logged in a real session
- [ ] Precision check on a real session: at least 7 of 10 drafts accepted by the user in `sayg-learn` triage. — verify: inbox triage log

## Risk notes
- Gates: security (session content leaves the main loop to a second model call on the same account; redaction), performance (one extra call per turn), architecture (hook must never block or slow the turn).
- Why: privacy and cost are the reasons a user would turn this off; both must be visible and controllable.

## Routing
| Task | Model / effort | Why |
|---|---|---|
| Extraction prompt and JSON schema | strong model, high | judgment: what counts as a decision |
| Hook, cursor, redaction, inbox writer | everyday model, medium | standard implementation with tests |
| Per-turn extraction at runtime | `haiku`, low | high volume, bounded task |

## Approvals needed
| Who | What | Status |
|---|---|---|
| Gustavo | Privacy defaults (on by default in `.sayg/` projects vs opt-in) | pending |

## Decisions needed
- On by default in projects with `.sayg/`, or opt-in?
- Inbox in one file, or one file per day?

## Gate report
<!-- Filled by sayg-gates -->
