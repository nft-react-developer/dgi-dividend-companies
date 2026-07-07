# DGI Analyzer — Agent Operating Guide

Use this file as the first stop for AI coding agents working in this repository. Keep answers and patches small, verify claims against code, and avoid touching unrelated user changes.

## Project snapshot

DGI Analyzer is a Yarn workspaces monorepo for a desktop Dividend Growth Investing app:

| Package | Path | Responsibility |
|---|---|---|
| `@dgi/backend` | `packages/backend` | Express 5 REST API, MySQL access through Drizzle ORM, importer/mapper business logic |
| `@dgi/frontend` | `packages/frontend` | Angular 19 standalone SPA with PrimeNG and ECharts |
| `@dgi/electron` | `packages/electron` | Electron shell that starts/loads the app |
| `@dgi/shared` | `packages/shared` | Reserved/shared code, built before app packages when present |

Domain goal: manage DGI companies, import financial statements from Excel/CSV mappings, persist normalized statements, and display financial data/ratios.

## Start here

1. Read `doc/llm/project-map.md` for package/module layout.
2. Read `doc/llm/development-playbook.md` before editing or running commands.
3. Check `git status --short` before changes. This repo may contain in-progress user edits; do not revert or normalize files you did not intentionally touch.
4. Prefer the root scripts. Package names are scoped (`@dgi/backend`, `@dgi/frontend`, `@dgi/electron`).

## Commands

Run from the repository root unless a note says otherwise.

```bash
yarn dev              # backend + frontend + electron
yarn dev:backend      # backend on API_PORT, normally :3399
yarn dev:frontend     # Angular dev server on :4299
yarn build            # shared -> backend -> frontend -> electron
yarn db:migrate       # Drizzle migrations via backend workspace
yarn db:seed          # backend seed script
yarn lint             # all workspaces that define lint
yarn test             # all workspaces that define test
```

Backend-only helpers from `packages/backend/`:

```bash
yarn generate         # generate Drizzle migration files
yarn studio           # open Drizzle Studio
```

## Architecture rules

- Backend modules live under `packages/backend/src/modules/<feature>/` and should own router, service, repository, and DTO files.
- Backend HTTP validation belongs in DTOs with Zod; repositories should stay focused on Drizzle queries.
- Register backend routers in `packages/backend/src/main.ts` under `/api/<feature>` or `/health`.
- Database tables live under `packages/backend/src/db/schema/*.schema.ts` and must be exported from `schema/index.ts`.
- Frontend features live under `packages/frontend/src/app/features/<feature>/` with standalone Angular components.
- Frontend HTTP calls should go through `packages/frontend/src/app/core/api.service.ts` and feature services.
- UI strings, code comments, identifiers, and docs should be English unless extending Spanish-only existing documentation.

## High-risk areas

- Financial statement schemas and mapper fields must stay aligned across Drizzle schema, DTOs, repositories, frontend models, and UI forms.
- `field_mappers.targetColumn === 'extended_metrics'` drives dynamic extended metrics display and `formatHints` in financial data.
- Importer flow is parser -> mapper -> validator -> repository. Do not bypass validation or repository upsert behavior without documenting why.
- Drizzle migration files should be generated, not hand-edited.
- Electron hardcodes dev ports around backend `3399` and frontend `4299`; keep environment/docs consistent when changing ports.

## Useful references

- `CLAUDE.md` — existing Claude-specific context.
- `README.md` — product overview and user-facing setup.
- `doc/llm/project-map.md` — concise code map for LLM navigation.
- `doc/llm/development-playbook.md` — edit workflow, verification, and gotchas.
- `doc/notebook-llm/index.md` — NotebookLM link for DGI/domain context.
