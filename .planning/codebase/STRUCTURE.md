# Codebase Structure

**Analysis Date:** 2026-03-01

## Directory Layout

```
ClearEstimate/
├── src/                      # Application source code
│   ├── main.tsx              # React entry point (creates root, wraps AppStoreProvider)
│   ├── App.tsx               # Router configuration (5 routes + AppLayout)
│   ├── index.css             # Global Tailwind CSS styles
│   ├── vite-env.d.ts         # Vite environment type declarations
│   │
│   ├── types/
│   │   └── index.ts          # All TypeScript interfaces (entities, settings, results)
│   │
│   ├── calc/                 # Pure calculation functions (8 modules)
│   │   ├── index.ts          # Exports + formatCurrency()
│   │   ├── line-total-calc.ts       # Orchestrator (material + labor + equipment)
│   │   ├── line-total-calc.test.ts  # Line item calc tests
│   │   ├── material-calc.ts         # Glass, frame, hardware costs
│   │   ├── material-calc.test.ts
│   │   ├── labor-calc.ts            # Loaded rates, area/unit mode, man-hours
│   │   ├── labor-calc.test.ts
│   │   ├── equipment-calc.ts        # Equipment costs by crew days
│   │   ├── equipment-calc.test.ts
│   │   ├── summary-calc.ts          # Project-level totals, SOV, pie data, scope
│   │   ├── summary-calc.test.ts
│   │   ├── op-suggest.ts            # O&P percentage suggestions
│   │   ├── op-suggest.test.ts
│   │   ├── benchmark-calc.ts        # Green/amber/red rating
│   │   ├── benchmark-calc.test.ts
│   │   ├── win-rate-calc.ts         # Awarded/(awarded+lost)
│   │   ├── win-rate-calc.test.ts
│   │   ├── format-currency.test.ts
│   │
│   ├── hooks/                # React hooks for state management
│   │   ├── use-app-store.tsx        # Context provider + useAppStore() hook
│   │   ├── use-projects.ts          # Project CRUD + duplicate + sort
│   │   ├── use-line-items.ts        # Line item CRUD + validation
│   │   ├── use-ve-alternates.ts     # VE alternate CRUD
│   │   ├── use-settings.ts          # Settings update
│   │   └── validate-line-item.test.ts
│   │
│   ├── storage/              # Persistence layer
│   │   └── storage-service.ts       # loadAppState, saveAppState, schema migration
│   │
│   ├── data/                 # Seed data (reference materials)
│   │   ├── index.ts                 # Exports DEFAULT_SETTINGS + createDefaultAppState()
│   │   ├── seed-glass.ts            # 14 glass types
│   │   ├── seed-frames.ts           # 5 frame systems
│   │   ├── seed-systems.ts          # 21 system types (with laborMode, sfPerManHour/hoursPerUnit)
│   │   ├── seed-labor.ts            # Labor rates (Glazier, foreman, helper, etc.)
│   │   ├── seed-conditions.ts       # Conditions (crew-day adjustments)
│   │   ├── seed-equipment.ts        # Equipment list (daily rates)
│   │   └── seed-hardware.ts         # Hardware list (unit costs)
│   │
│   ├── views/                # Page-level components (React Router views)
│   │   ├── DashboardView.tsx        # Project list, win rate, create/duplicate/delete
│   │   ├── ProjectSetupView.tsx     # Project metadata (name, client, address, rates)
│   │   ├── TakeoffView.tsx          # Line item CRUD (48 KB — largest component)
│   │   ├── SummaryView.tsx          # Running totals, SOV, pie chart, scope
│   │   ├── SettingsView.tsx         # Reference data management (18 KB)
│   │   └── NotFoundView.tsx         # 404 page
│   │
│   └── components/           # Reusable UI components
│       ├── AppLayout.tsx             # Main layout (sidebar + breadcrumb + outlet)
│       ├── Sidebar.tsx               # Navigation sidebar
│       ├── Breadcrumb.tsx            # Route breadcrumb
│       ├── ProjectGuard.tsx          # Route guard (validates project :id)
│       ├── StatusBadge.tsx           # Project status display (Bidding, Awarded, etc.)
│       ├── BenchmarkBadge.tsx        # Benchmark rating display (green/amber/red)
│       ├── ConfirmDialog.tsx         # Delete confirmation modal
│       └── SearchInput.tsx           # Project search field
│
├── scripts/                  # Build and verification scripts
│   └── verify-calc.ts        # 37-assertion calculation verification script
│
├── docs/                     # Documentation
│   └── adr/                  # Architecture Decision Records
│
├── .planning/
│   └── codebase/             # Codebase mapping documents
│
├── vite.config.ts            # Vite + Vitest config (imports from vitest/config)
├── tsconfig.json             # TypeScript config (strict mode, @/ alias)
├── package.json              # Dependencies (React 19, Router 7, Tailwind v4, Recharts 2.x)
├── package-lock.json
└── CLAUDE.md                 # This project's Claude Code guidance

```

## Directory Purposes

**src/:**
- Purpose: All application source code
- Contains: Components, hooks, calc functions, types, storage, data
- Key files: `main.tsx` (entry), `App.tsx` (router), `types/index.ts` (contracts)

**src/types/:**
- Purpose: Single source of truth for all data shapes
- Contains: Entity interfaces (Project, LineItem, VEAlternate), settings types, computed result types
- Key files: `index.ts` (all types in one file for easy import)

**src/calc/:**
- Purpose: All business logic — pure functions only
- Contains: 8 core modules (material, labor, equipment, line-total orchestrator, summary, op-suggest, benchmark, win-rate) + formatCurrency
- Key files: `line-total-calc.ts` (orchestrator), `index.ts` (exports)
- Pattern: Each module is 1 responsibility, all pure functions, all exported from `index.ts`

**src/hooks/:**
- Purpose: Encapsulate state management logic for consumption by views
- Contains: 5 hooks (useAppStore, useProjects, useLineItems, useVEAlternates, useSettings) + validation helper
- Key files: `use-app-store.tsx` (context provider + hook), others provide CRUD methods
- Pattern: All call setState via AppStore context, all return CRUD methods + lists

**src/storage/:**
- Purpose: Persistence and schema versioning
- Contains: `loadAppState()` (with migration), `saveAppState()`, `resetAppState()`
- Key files: `storage-service.ts` (localStorage key: `cgi_estimating_app_v1`)
- Migration: v1→v2 replaces settings with fresh seed data, adds manHours/conditionIds fields

**src/data/:**
- Purpose: Reference data (seed data) for initial and reset states
- Contains: 7 seed files (glass, frames, systems, labor, conditions, equipment, hardware) + index exporter
- Key files: `index.ts` (DEFAULT_SETTINGS + createDefaultAppState), individual seed-*.ts files
- Pattern: Each seed file exports array of typed objects; index combines into AppSettings

**src/views/:**
- Purpose: Full-page React components tied to routes
- Contains: 6 views (Dashboard, Setup, Takeoff, Summary, Settings, NotFound)
- Key files:
  - `DashboardView.tsx` (5.6 KB) — project list, create, duplicate, delete
  - `ProjectSetupView.tsx` (7.1 KB) — project metadata form
  - `TakeoffView.tsx` (23.6 KB) — line item table, add, edit, delete (largest)
  - `SummaryView.tsx` (16.6 KB) — totals, SOV, pie chart
  - `SettingsView.tsx` (19 KB) — reference data management
- Pattern: Each view uses hooks to get state + CRUD methods, renders and dispatches updates

**src/components/:**
- Purpose: Shared UI components used across multiple views
- Contains: Layout components (AppLayout, Sidebar, Breadcrumb), guards, badges, dialogs, inputs
- Key files: `AppLayout.tsx` (main layout structure)
- Pattern: Small, focused, reusable — no internal state except local UI (e.g., search input)

**scripts/:**
- Purpose: Build and verification utilities (not part of app bundle)
- Contains: `verify-calc.ts` — 37-assertion test suite for calculation pipeline
- Pattern: Import @/ aliases via `vite.config.ts` tsconfigPaths plugin

**docs/:**
- Purpose: Architecture decisions and technical documentation
- Contains: ADR files describing planned features and design rationale
- Key files: See ADRs for dual labor mode, frame-system FK, multiplicative factors, waste/contingency

## Key File Locations

**Entry Points:**
- `src/main.tsx`: React root creation and AppStoreProvider mount
- `src/App.tsx`: Router configuration (5 routes + AppLayout)
- `src/hooks/use-app-store.tsx`: AppStore context initialization and persistence

**Configuration:**
- `vite.config.ts`: Vite + Vitest config (imports from vitest/config for test property)
- `tsconfig.json`: TypeScript strict mode, @/ alias resolution, noUncheckedIndexedAccess: true
- `package.json`: Dependencies (React 19, Router 7, Tailwind v4, Recharts 2.x, Vitest 4.x)

**Core Logic:**
- `src/calc/line-total-calc.ts`: Central orchestrator for line item calculations
- `src/calc/index.ts`: Exports all calc functions + formatCurrency()
- `src/hooks/use-line-items.ts`: Line item CRUD with validation
- `src/hooks/use-projects.ts`: Project CRUD + duplicate with VE alternate remapping
- `src/storage/storage-service.ts`: localStorage with schema migration

**Testing:**
- Test files live co-located with source: `src/**/*.test.ts`
- Config: `vite.config.ts` (test property with globals: true, environment: node)
- Pattern: Each test file defines its own factory helpers (e.g., baseLineItem(), project())

**Data & Types:**
- `src/types/index.ts`: All entity and result types
- `src/data/index.ts`: createDefaultAppState() and DEFAULT_SETTINGS export
- `src/data/seed-*.ts`: Individual seed data arrays

## Naming Conventions

**Files:**
- Components: PascalCase.tsx (e.g., DashboardView.tsx, AppLayout.tsx)
- Hooks: kebab-case.ts prefix with "use-" (e.g., use-projects.ts, use-line-items.ts)
- Utilities/Services: kebab-case.ts (e.g., storage-service.ts)
- Tests: Same name as source with .test.ts suffix (e.g., line-total-calc.test.ts)
- Data: seed-{domain}.ts (e.g., seed-glass.ts, seed-labor.ts)

**Directories:**
- View directory: views/ (for React Router route components)
- Hook directory: hooks/ (for custom hooks)
- Component directory: components/ (for reusable UI components)
- Logic/domain directories: calc/, storage/, data/, types/ (lowercase, plural for collections)

**Functions:**
- Calc functions: `calc{Domain}()` prefix (e.g., calcSqft, calcLoadedRate, calcFullLineItem)
- State CRUD: `{action}{Entity}()` (e.g., createProject, updateLineItem, deleteVEAlternate)
- Helpers: camelCase, descriptive (e.g., validateLineItem, shouldSuggestEquipment, generateScopeDescription)

**Types/Interfaces:**
- Entity types: PascalCase (e.g., Project, LineItem, VEAlternate)
- Enums/Unions: PascalCase (e.g., ProjectStatus, BenchmarkLevel)
- Computed/Result types: PascalCase (e.g., RunningTotals, SOVGroup, PieSegment)

**Variables:**
- React state: camelCase (e.g., projects, lineItems, isLoading)
- DOM refs: camelCase with Ref suffix (e.g., timerRef, inputRef)
- Constants: SCREAMING_SNAKE_CASE (e.g., STORAGE_KEY, PERSIST_DEBOUNCE_MS)

## Where to Add New Code

**New Feature (e.g., "Add import/export"):**
- Primary logic: Add new function to `src/calc/` (e.g., `src/calc/export-calc.ts`)
- Hook: Add method to existing hook in `src/hooks/` or create new hook if it spans multiple domains
- UI: Add UI in existing view (e.g., SummaryView) or create new route in `src/views/`
- Tests: Co-locate with source file (e.g., `src/calc/export-calc.test.ts`)

**New Component/Module (e.g., "Add project filters"):**
- UI Component: `src/components/{ComponentName}.tsx`
- Logic: If stateless, keep in component file. If complex, extract to hook in `src/hooks/`
- Tests: Co-locate with source (e.g., `src/components/ProjectFilter.tsx` + `src/components/ProjectFilter.test.ts`)

**New Route/View (e.g., "Add Reports view"):**
- View file: `src/views/ReportsView.tsx`
- Register route: Add to router config in `src/App.tsx`
- Hook: If needs state access, use existing hooks (useProjects, useAppStore) or create new hook in `src/hooks/`
- Tests: Co-locate with view file (e.g., `src/views/ReportsView.test.ts`) if component-heavy, or test via integration

**Utilities/Helpers:**
- Shared calculation helpers: `src/calc/` (keep with domain-specific calcs)
- Shared formatting helpers: `src/calc/index.ts` (like formatCurrency)
- Shared storage helpers: `src/storage/storage-service.ts`
- Shared UI helpers: In component file or `src/components/` if multi-component

**Reference Data:**
- New reference data type (e.g., "Add finish options"): Create `src/data/seed-finishes.ts`, export array, import into `src/data/index.ts` under AppSettings
- Update seed data: Modify individual `src/data/seed-*.ts` file, increment CURRENT_SCHEMA_VERSION in `storage-service.ts`, update migration logic in `migrateState()`

**New Type:**
- All types go in `src/types/index.ts` — single file for easy discovery and import

## Special Directories

**src/calc/:**
- Purpose: Pure, side-effect-free business logic
- Generated: No
- Committed: Yes
- Notes: Every function exported via `src/calc/index.ts`; 100% testable (no DOM, no I/O)

**src/data/:**
- Purpose: Seed data for AppSettings (glass types, labor rates, conditions, equipment, hardware, frames, systems)
- Generated: No
- Committed: Yes
- Notes: Modified manually when reference data changes; bumps schema version for migration

**src/storage/:**
- Purpose: Single file that handles localStorage read/write/migration
- Generated: No
- Committed: Yes
- Notes: STORAGE_KEY = `cgi_estimating_app_v1`; localStorage JSON must match AppState contract

**.planning/codebase/:**
- Purpose: Codebase documentation for GSD commands
- Generated: Yes (by `/gsd:map-codebase` orchestrator)
- Committed: Yes (guidelines documents, not generated outputs)
- Notes: Used by `/gsd:plan-phase` and `/gsd:execute-phase` for context

**node_modules/:**
- Purpose: Dependency packages
- Generated: Yes (by npm install)
- Committed: No
- Notes: Use package-lock.json for reproducible installs

**build/ (if it exists):**
- Purpose: Production bundle output
- Generated: Yes (by vite build)
- Committed: No
- Notes: Generated via `npm run build`

---

*Structure analysis: 2026-03-01*
