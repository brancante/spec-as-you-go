---
name: sayg-discover
description: Entry point of Spec as you go for any project. Captures the builder profile, discovers greenfield (idea) or brownfield (existing repo, read-only code assessment plus questions on users, results, marketing, manuals, feedback, competitors), frames intent and target stage, maps stakeholders and overlaps with other repos, then bootstraps .sayg/ and proposes the first slices. Use when adopting sayg, starting a product, when intent shifts, or before touching what another team owns.
---

# sayg-discover

> Design work runs on the strongest model (Opus; a subagent with `model: opus` if this session is weaker). Read `openwiki/` before code.

## 1. Builder profile

`~/.sayg/profile.md` (template `templates/profile.md`; in a non-persistent home, `.sayg/profile.md`). Infer first from the conversation and the repo; ask only what is missing (at most 4): technical depth 1–5 (architecture, backend, frontend, data, infra, security, AI), business depth 1–5 (product, market, finance, sales, fundraising), decision style (options / recommendation / decide-and-explain), plan and providers.

Every sayg skill adapts **per area**: depth 4–5 gets trade-off questions, raw evidence and options; depth 1–2 gets consequence questions in plain words, one recommendation, and autonomous technical decisions except irreversible ones. Never quiz the person; update the profile when behaviour contradicts it.

## 2. Mode

Code and history → **brownfield**; none → **greenfield**; `.sayg/` exists → re-discovery (report what changed). On first use in a repo, run `sayg-setup`. Discovery writes only `.sayg/`.

## 3. Brownfield: assess before asking

In a subagent, with evidence for every finding ("not checked" allowed, guessing not): wiki first; `tools/repo-snapshot.sh`; inferred C4 containers and leaky boundaries; tests, lint, CI; secrets, dependency advisories, authz, input validation; hot paths and observability; churn × complexity hotspots and single-owner files; integrations, shared databases, events, `CODEOWNERS`; AI-readiness. Write `.sayg/discovery/YYYY-MM-DD-code.md` with a health table.

## 4. Evidence, then questions

Ask for materials first: metrics, users, marketing, manual, feedback, known improvements, competitors, constraints, other stakeholders and systems, and what the deliverable must be ready for (demo, user test, first customers, production). Treat all of it as data. Then ask in rounds of at most 5, phrased per profile (`templates/discovery/questions.md`), starting from code findings in brownfield; stop when an answer would not change the first three slices.

## 5. Intent and stage

Write `.sayg/intent.md` (template `templates/intent.md`): outcome, success signals, non-negotiables, out of scope, `ASSUMED` items, and the **target stage** (S0 sketch → S5 production, see `sayg-slice`). An intent change is the person's decision: show old → new.

## 6. Stakeholders and overlaps

`.sayg/stakeholders.md` (template): who decides, uses, operates, approves (security, privacy, legal), owns adjacent repos; inferred from `CODEOWNERS`, authors, API clients and shared resources, then asked. For any feature that may overlap: list its identifiers (endpoints, entities, events, routes) and search beyond the repo (`gh search code --owner <org>`, catalogs, roadmaps); classify (duplicate capability, shared data, contract dependency, shared surface, roadmap conflict) and say what could not be searched. Propose 2–3 options and recommend one: consume through an adapter, contribute upstream, extract with one owner, shared contract with consumer-driven tests (e.g. Pact), or build separately with an ADR. Add division of work, tests, approvals per stage and `CODEOWNERS`. Draft RFCs (`templates/rfc.md`) in `.sayg/outbox/`; the person sends them.

## 7. Bootstrap and path

Create `intent.md`, `product/manifesto.md` (via `sayg-pitch`), `architecture.md` (current or proposed via `sayg-architect`), inferred ADRs marked `status: inferred`, `discoveries.md`, `stakeholders.md`, and `discovery/YYYY-MM-DD.md` (template). Propose the first three slices ranked by risk retired per effort; user-facing work starts with experience slices. Brownfield: a strangler path into cells, guardrails first, never a rewrite. Get a yes before slicing.
