# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ClearEstimate — a glazing contractor estimation tool replacing spreadsheet-based workflows. Phase 1 is a React SPA with localStorage persistence. The calculation engine handles material, labor, equipment, and markup computations for glass/aluminum system takeoffs.

## Build & Test Commands

```
npm install                    # install dependencies
npm run dev                    # start Vite dev server (localhost:5173)
npm run build                  # production build (tsc -b && vite build)
npm run verify                 # run 37-assertion calc verification script
npm run lint                   # TypeScript type-check (tsc -b)
npm run preview                # preview production build locally
```

No test framework is configured in Phase 1. Use `npm run verify` to validate the calculation engine (scripts/verify-calc.ts).

## Architecture

- **Entry point:** `src/main.tsx` → `App.tsx`
- **Framework:** React 19 + TypeScript 5 (strict mode) + Vite 6
- **Styling:** Tailwind CSS v4 (CSS-first, no config file)
- **Routing:** React Router 7 (`createBrowserRouter` from `"react-router"`, `RouterProvider` from `"react-router/dom"`)
- **Charts:** Recharts 2.x (with `react-is@^19` peer dep)
- **State:** React Context + useState with 500ms debounced localStorage persistence
- **Storage key:** `cgi_estimating_app_v1` (with schema versioning)

### Key Patterns

- **State management:** Single `AppStoreProvider` (Context + useState) wraps the app. All state changes go through hooks (`use-projects`, `use-line-items`, etc.) that call `setState` on the context.
- **Auto-persist:** The app store debounces localStorage writes by 500ms and flushes on `beforeunload`.
- **Calculation flow:** Pure functions in `src/calc/` compute derived values. `calcFullLineItem()` orchestrates per-line-item calculations. Hooks call calc functions on every update.
- **Routing:** URL-derived project context (no stored `activeProjectId`). `ProjectGuard` redirects invalid `:id` params to Dashboard.
- **O&P formula:** Multiplicative — `contractValue = adjustedSubtotal × (1 + OH%) × (1 + profit%)`. Profit is applied AFTER overhead.

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
| `CONSTRAINTS.md` | Active constraints registry (C-xxx, I-xxx, B-xxx) |
| `SUCCESS.md` | Phase 1 Definition of Done |
| `public/_redirects` | Netlify SPA fallback routing |

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

See `CONSTRAINTS.md` for the full registry with 19 core, 3 interface, and 5 build constraints.

## Known Pitfalls

- **React Router 7 imports:** Use `"react-router"` for most imports and `"react-router/dom"` for `RouterProvider`. Using `"react-router-dom"` will fail.
- **React 19 useRef:** Requires an initial value — `useRef<T | null>(null)`, not `useRef<T>()`.
- **Path aliases outside src/:** The `@/` alias only works inside `src/`. Scripts in `scripts/` must use relative imports (`../src/...`).
- **Recharts bundle size:** Recharts pulls in D3, producing a 717KB chunk. Code-splitting with `React.lazy()` on the Summary route is the optimization path.
- **Branch structure:** Work happens on feature branches; PRs target `main`.

## Compaction Rules

When Claude Code compacts conversation context, preserve the following:

1. **Active constraint IDs** (C-xxx, I-xxx, B-xxx) and their current status.
2. **Current task phase** (baseline → spec → plan → test-red → test-green → review → retire).
3. **Failing test names** and the file:line where they fail.
4. **Uncommitted file paths** — anything modified but not yet committed.
5. **Decision rationale** — why an approach was chosen over alternatives (link to `decisions/` ADR if one exists).
6. **Branch context** — which branch is checked out and what it targets.

Drop verbose tool output, exploratory dead ends, and resolved error traces.
