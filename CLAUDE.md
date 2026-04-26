# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**DGI Analyzer** — a Yarn monorepo desktop application (Electron + Angular + Express) for tracking and analyzing dividend growth investing (DGI) companies. It imports financial data from Excel files, stores it in MySQL via Drizzle ORM, and visualizes it in an Angular frontend.

## Monorepo Structure

```
packages/
  backend/    @dgi/backend   — Express 5 REST API + Drizzle ORM (MySQL)
  frontend/   @dgi/frontend  — Angular 19 SPA (PrimeNG + ECharts)
  electron/   @dgi/electron  — Electron shell that spawns backend and loads frontend
  shared/     @dgi/shared    — Shared types/utilities (built first)
```

## Commands

All commands run from the repo root unless noted.

```bash
# Development (all three processes in parallel)
yarn dev

# Individual processes
yarn dev:frontend   # ng serve on port 4299
yarn dev:backend    # ts-node-dev on port 3399 (read from API_PORT env var)

# Build (order matters: shared → backend → frontend → electron)
yarn build

# Database
yarn db:migrate     # drizzle-kit migrate
yarn db:seed        # ts-node src/db/seed.ts

# Drizzle helpers (run from packages/backend/)
yarn generate       # generate new migration files
yarn studio         # open Drizzle Studio

# Lint / Test
yarn lint           # runs in all workspaces
yarn test           # runs in all workspaces
```

## Environment Variables (backend)

Create `packages/backend/.env`:

```
DATABASE_HOST_NAME=localhost
DB_PORT=3306
DATABASE_USER_NAME=root
DATABASE_USER_PASSWORD=
DATABASE_DB_NAME=dgi_analyzer
API_PORT=3399
MAPPER_DEBUG=false   # set to true to enable verbose mapper logs
```

## Backend Architecture

**Entry point:** `packages/backend/src/main.ts`

Module layout — each module owns its own router, service, repository, and DTOs:

```
src/modules/
  companies/       CRUD for tracked companies
  sectors/         Sector lookup
  financial-data/  Query historical financials per company
  importer/        Excel → DB import pipeline
  health/          Health-check endpoints
src/db/
  connection.ts    Singleton drizzle pool (mysql2)
  schema/          Drizzle table definitions (one file per domain)
  migrations/      Auto-generated SQL migrations
```

**API routes:**
- `GET/POST/PATCH/DELETE /api/companies`
- `GET /api/sectors`
- `POST /api/importer` — multipart upload of an Excel file + `ticker` field
- `GET /api/financial-data?ticker=...`
- `GET /health`, `GET /health/db`

## Importer Pipeline

The importer is the core feature. Flow: `importer.router → importer.service → parser → mapper → validator → importer.repository`

1. **Parser** (`lib/parser.ts`) — reads the uploaded `.xlsx` buffer using `xlsx`, extracts rows from the configured sheet indices.
2. **Mapper** (`lib/mapper.ts`) — applies a per-ticker JSON mapping config to turn raw rows into typed `MappedRecord` objects. Supports `direct` (label-match) and `calc` (formula via `expr-eval`) field types. Enable `MAPPER_DEBUG=true` to trace resolution.
3. **Validator** (`lib/validator.ts`) — applies DGI-specific business rules.
4. **Repository** — upserts records into MySQL.

**Mapping configs** live in `packages/backend/src/modules/importer/mappings/{TICKER}.json` (e.g. `LOG.json`). Each file follows the `TickerMapping` type defined in `types/mapping.types.ts`. To add a new company, create a new JSON file in that directory.

## Frontend Architecture

Angular 19 standalone components — no NgModules. All HTTP calls go through the central `ApiService` (`src/app/core/api.service.ts`) which prefixes every request with `environment.apiUrl` (`http://localhost:3399/api` in dev).

**Routes (lazy-loaded standalone components):**
- `/dashboard` — summary dashboard
- `/companies` — company CRUD
- `/importer` — Excel file upload
- `/financial-data` — tabbed financial data viewer (income statement, balance sheet, cash flow, ratios)

UI library: **PrimeNG 19** with custom theming via `ThemeService`. Charts use **ECharts**.

## Electron Shell

`packages/electron/src/main.ts` spawns the backend process on startup and loads the Angular frontend. Ports are hardcoded: backend `3399`, frontend `4299`. In production builds, it loads the compiled frontend from `dist/`.

## Database

MySQL with Drizzle ORM in `default` mode. Schema files in `packages/backend/src/db/schema/` — one file per domain: `companies`, `sectors`, `income-statement`, `dividends`, `balance-sheet`, `cash-flow`, `field-mappers`, `import-log`. All exports are re-exported from `schema/index.ts`.

Run `yarn db:migrate` after any schema change. Never edit migration files manually — regenerate with `yarn generate`.
