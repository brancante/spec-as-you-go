# Repository structure

| Folder | Purpose | May import |
|---|---|---|
| `apps/*` | Deployables. Composition only, no business rules. | `cells/*/contract`, `cells/*/ui`, `cells/*/server` (mounting), `packages/*` |
| `cells/<x>/contract` | Public surface of a cell. | `packages/*` |
| `cells/<x>/*` (rest) | Private to the cell. | its own folders, other cells' `contract/`, `packages/*` |
| `packages/*` | Shared kernel. Generic, no business rules. | other `packages/*` |
| `labs/*` | Experiments. | anything; **nothing imports labs** |

## Lifecycle of a cell

`lab` → `active` → (`extracted`) → `deprecated` → deleted. Each transition is an ADR in `.sayg/decisions/`.

## Data ownership

Each cell owns its tables (separate schema or table prefix) and its migrations in `cells/<x>/db/`. Cross-cell reads go through the contract, never through SQL.

## Fitness functions

Boundary rules (`.dependency-cruiser.cjs` or equivalent), performance budgets and security checks are executable. They run on every PR (`sayg-ci`) and the full Sonar scan runs every N merged PRs (`sayg-sonar`).
