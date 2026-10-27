---
name: sayg-architect
description: Use when starting a new product or when the current structure resists change. Proposes a fast reference architecture with frontend and backend in one repo, organized as "cells" (independent greenfields inside the evolving product), with boundary rules, fitness functions and decision records. Also use to add a new cell or promote an experiment from labs/.
---

# sayg-architect

> Adapt questions, vocabulary, evidence and autonomy to the builder profile (`sayg-profile`), per area of depth.

Goal: a structure where every new idea can start as a clean greenfield **inside** the product, without rewriting the rest, and where any cell can later be extracted into its own service.

## Reference shape (default proposal)

```
apps/            thin deployables that compose cells
  web/           frontend shell (routing, layout, auth session)
  api/           backend host (HTTP server, mounts each cell's routes)
cells/           one folder per business capability = one greenfield
  <cell>/
    cell.json    owner, status (lab|active|deprecated), stage S0–S5, slice links
    contract/    the ONLY public surface: types, schemas, events, client
    domain/      pure business logic, no framework imports
    server/      routes/handlers, persistence, adapters
    ui/          components/pages this cell contributes to apps/web
    db/          migrations owned by this cell (own schema/prefix)
    tests/
packages/        shared kernel: ui-kit, config, auth, observability, contracts-core
labs/            experiments; never imported by cells/ or apps/; promoted via ADR
infra/           IaC, docker, local dev stack
.sayg/           living spec (intent, slices, decisions, discoveries, product)
```

Start from `templates/architecture/` (structure guide, `cell.json`, boundary rules).

## Process

1. Read `.sayg/intent.md` and the non-negotiables. Run `sayg-scout` for the stack: current reference repos, starters, framework maturity.
2. Propose **2–3 stack options** with trade-offs, recommending one. Default bias for a solo fixer: one language end-to-end, typed contracts shared between front and back, one relational database, one deploy target. Name versions only after checking current releases.
3. Draw the first C4 context + container view (Mermaid in `.sayg/architecture.md`). Keep it to one screen.
4. Map intent to the first 1–3 cells. Each cell must be justifiable as a capability someone could own, not a technical layer.
5. Write the **boundary rules** as code (dependency-cruiser, Nx module boundaries, import-linter, ArchUnit — whatever fits the stack) and wire them into CI via `sayg-pipeline`. These are the architecture fitness functions; `sayg-gates` runs them.
6. Record each choice as an ADR (stack, database, auth, deploy, cell boundaries).

## Evolution moves

- **New idea** → create it in `labs/<name>` with its own slice. Cheap, disposable, isolated.
- **Promote** → when a lab proves value, move to `cells/`, define `contract/`, add boundary rules, write an ADR.
- **Extract** → when a cell needs independent scale or team, its `contract/` becomes a network API; nothing outside the cell changes except the client adapter.
- **Retire** → mark `deprecated` in `cell.json`, route callers to the replacement, delete after the last caller is gone.

## Human checkpoint

Stack choice, database, auth model and anything hard to reverse. Present the recommendation and the strongest alternative; wait for a yes.

## Rules

- Cells talk only through `contract/`. Shared database tables across cells are forbidden; share via contract calls or events.
- No cell for a capability with fewer than one real slice behind it. Structure follows demand.
- If a rule gets in the way twice, revisit the rule with an ADR instead of adding exceptions.
