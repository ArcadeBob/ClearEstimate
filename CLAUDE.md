# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ClearEstimate — a glazing contractor estimation tool replacing spreadsheet-based workflows. Phase 1 is a React SPA with localStorage persistence. The calculation engine handles material, labor, equipment, and markup computations for glass/aluminum system takeoffs.

## Build & Test Commands

```
npm install                    # install dependencies
npm run dev                    # start Vite dev server (localhost:5173)
npm run build                  # production build (tsc -b && vite build)
npm run lint                   # TypeScript type-check (tsc -b)
npm test                       # run all tests (vitest run)
npm run test:watch             # run tests in watch mode
npm run verify                 # run 37-assertion calc verification script
npm run preview                # preview production build locally
```

Run a single test file: `npx vitest run src/calc/material-calc.test.ts`

### Test Setup

- **Framework:** Vitest 4.x with `globals: true` (no need to import `describe`/`it`/`expect`).
- **Environment:** Default is `node`. Tests needing DOM/localStorage use the `// @vitest-environment jsdom` pragma at the top of the file (see `storage-service.test.ts`).
- **Test location:** Tests live next to source files as `*.test.ts` (pattern: `src/**/*.test.ts`).
- **Config:** `vite.config.ts` imports from `vitest/config` (not `vite`) for unified Vite+Vitest configuration. `tsconfigPaths()` plugin enables the `@/` alias in test files.
- **Test data:** Each test file defines its own factory helpers (e.g., `baseLineItem()`, `project()`) inline — no shared test utilities.

## Architecture

- **Entry point:** `src/main.tsx` → `App.tsx`
- **Framework:** React 19 + TypeScript 5 (strict mode) + Vite 6
- **Styling:** Tailwind CSS v4 (CSS-first, no config file)
- **Routing:** React Router 7 (`createBrowserRouter` from `"react-router"`, `RouterProvider` from `"react-router/dom"`)
- **Charts:** Recharts 2.x (with `react-is@^19` peer dep)
- **State:** React Context + useState with 500ms debounced localStorage persistence
- **Storage key:** `cgi_estimating_app_v1` (with schema versioning)

### Key Patterns

- **State management:** Single `AppStoreProvider` (Context + useState) wraps the app. All state changes go through hooks (`use-projects`, `use-line-items`, etc.) that call `setState` on the context. The `setState` accepts a pure updater function `(prev: AppState) => AppState`.
- **Auto-persist:** The app store debounces localStorage writes by 500ms and flushes on `beforeunload`. An `isInitialMount` ref skips the save effect on first render.
- **Calculation flow:** Pure functions in `src/calc/` compute derived values. `calcFullLineItem()` in `line-total-calc.ts` is the central orchestrator — it wires material, labor, and equipment calcs together and returns an updated `LineItem`. Hooks call calc functions on every update.
- **Routing:** URL-derived project context (no stored `activeProjectId`). `ProjectGuard` redirects invalid `:id` params to Dashboard.
- **O&P formula:** Multiplicative — `contractValue = adjustedSubtotal × (1 + OH%) × (1 + profit%)`. Profit is applied AFTER overhead (C-032).
- **VE cascade:** Updating a line item auto-updates `originalCost` and `savings` on any linked VE alternates (C-015). Deleting a line item cascades to delete orphaned VE alternates.

### Calculation Pipeline

The calc engine in `src/calc/` consists of 8 modules orchestrated by `calcFullLineItem()`:

1. **material-calc** — `calcSqft`, `calcPerimeter`, `calcMaterialCost` (glass + frame + hardware)
2. **labor-calc** — `calcLoadedRate`/`calcPWLoadedRate`, `calcCrewDays`, `calcLaborCost` (standard vs prevailing wage paths)
3. **equipment-calc** — `calcEquipmentCost`, `shouldSuggestEquipment`
4. **line-total-calc** — `calcFullLineItem` orchestrator: `lineTotal = materialCost + laborCost + equipmentCost` (C-033)
5. **summary-calc** — `calcRunningTotals` (project-level O&P), `calcScheduleOfValues`, `calcPieData`, `generateScopeDescription`
6. **op-suggest** — `suggestOPPercents` (tiered by subtotal)
7. **benchmark-calc** — `calcBenchmark` (green/amber/red per system type)
8. **win-rate-calc** — `calcWinRate` (awarded / (awarded + lost))

`formatCurrency()` in `src/calc/index.ts` handles all currency display (C-017).

## Key Files

| Path | Purpose |
|------|---------|
| `src/main.tsx` | Application entry point (AppStoreProvider → App) |
| `src/App.tsx` | Router configuration (5 views + ProjectGuard) |
| `src/types/index.ts` | All TypeScript interfaces (Project, LineItem, etc.) |
| `src/calc/` | Pure calculation functions (8 modules + formatCurrency) |
| `src/hooks/` | React hooks for state management (5 hooks) |
| `src/views/` | Page-level components (Dashboard, Setup, Takeoff, Summary, Settings) |
| `src/components/` | Shared UI components (Layout, Sidebar, Breadcrumb, etc.) |
| `src/data/` | Seed data (14 glass types, 5 frames, 21 systems, etc.) |
| `src/storage/storage-service.ts` | localStorage CRUD with schema versioning |
| `scripts/verify-calc.ts` | 37-assertion calculation verification script |
| `docs/adr/` | Architecture Decision Records (6 ADRs) |
| `CONSTRAINTS.md` | Active constraints registry (C-xxx, I-xxx, B-xxx) |
| `SUCCESS.md` | Phase 1 Definition of Done |

## Code Conventions

- Follow existing patterns in the codebase before introducing new ones.
- TypeScript strict mode with `noUncheckedIndexedAccess: true`.
- Prefer named exports over default exports (exception: `App.tsx` default export for Vite).
- Keep files focused — one component/module per file.
- All currency display uses `formatCurrency()` from `@/calc` (C-017).
- React Router imports from `"react-router"` not `"react-router-dom"` (B-004).
- Commit messages: imperative mood, concise subject line (72 chars max).

## Constraint ID Format

Constraints referenced in specs, decisions, and code comments use these prefixes:

| Prefix | Meaning | Example |
|--------|---------|---------|
| `C-xxx` | **Core constraint** — fundamental business rule | `C-001` |
| `I-xxx` | **Interface constraint** — UI/UX or API contract | `I-001` |
| `B-xxx` | **Build constraint** — tooling, CI, infra requirement | `B-001` |

See `CONSTRAINTS.md` for the full registry.

## Known Pitfalls

- **React Router 7 imports:** Use `"react-router"` for most imports and `"react-router/dom"` for `RouterProvider`. Using `"react-router-dom"` will fail.
- **React 19 useRef:** Requires an initial value — `useRef<T | null>(null)`, not `useRef<T>()`.
- **Path aliases outside src/:** The `@/` alias only works inside `src/`. Scripts in `scripts/` must use relative imports (`../src/...`).
- **vite.config.ts import:** Must import `defineConfig` from `vitest/config` (not `vite`) for the `test` property to type-check.
- **Recharts bundle size:** Recharts pulls in D3, producing a 717KB chunk. Code-splitting with `React.lazy()` on the Summary route is the optimization path.
- **ADRs vs current code:** The ADRs in `docs/adr/` describe planned data model changes (dual labor mode, frame-system FK, multiplicative condition factors, waste/contingency fields) that are **not yet implemented** in `src/types/index.ts`. The current code reflects the Phase 1 model.
- **Branch structure:** Work happens on feature branches; PRs target `main`.

## Compaction Rules

When Claude Code compacts conversation context, preserve the following:

1. **Active constraint IDs** (C-xxx, I-xxx, B-xxx) and their current status.
2. **Current task phase** (baseline → spec → plan → test-red → test-green → review → retire).
3. **Failing test names** and the file:line where they fail.
4. **Uncommitted file paths** — anything modified but not yet committed.
5. **Decision rationale** — why an approach was chosen over alternatives (link to `docs/adr/` if one exists).
6. **Branch context** — which branch is checked out and what it targets.

Drop verbose tool output, exploratory dead ends, and resolved error traces.
