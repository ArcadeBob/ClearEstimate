# Architecture

**Analysis Date:** 2026-03-01

## Pattern Overview

**Overall:** React Context + Pure Calculation Engine

**Key Characteristics:**
- Single AppStoreProvider wrapping the entire application (Context API for state management)
- Pure calculation functions orchestrated by `calcFullLineItem()` — no side effects
- Component-driven UI with React Router for navigation
- localStorage persistence with 500ms debounce and beforeunload flush
- Strong type safety with TypeScript strict mode
- Seed data for reference materials (glass types, frames, systems, labor rates, conditions, hardware, equipment)

## Layers

**Presentation Layer (Views + Components):**
- Purpose: User interface and route handling
- Location: `src/views/` (page-level components), `src/components/` (reusable UI components)
- Contains: React components that consume hooks and dispatch state updates through actions
- Depends on: Hooks (`use-projects`, `use-line-items`, `use-settings`, `use-ve-alternates`, `use-app-store`), calc functions (for display), types
- Used by: Router (App.tsx) and other views

**State Management Layer (Hooks):**
- Purpose: Encapsulate state logic and provide actionable methods (create, update, delete, duplicate)
- Location: `src/hooks/`
- Contains: Custom React hooks that wrap AppStore context and perform CRUD operations
- Depends on: AppStore context, types, calc functions (for validation in useLineItems)
- Used by: Views and components that need to read or modify state

**Calculation Engine (Pure Functions):**
- Purpose: All-business logic — material cost, labor cost, equipment cost, project summaries, benchmarks, win rates
- Location: `src/calc/` (8 core modules + formatCurrency)
- Contains: Pure functions with no I/O or side effects, each responsible for a specific calculation domain
- Depends on: Types only
- Used by: Hooks and views (for computed values)

**Data Layer (Storage + Seed Data):**
- Purpose: Persistence and initial reference data
- Location: `src/storage/storage-service.ts` (localStorage CRUD with schema versioning), `src/data/` (seed data files)
- Contains: localStorage load/save/reset, schema migration (v1→v2), and seed data exports
- Depends on: Types
- Used by: AppStoreProvider (initialization), views (reset), scripts (verification)

**Type Layer:**
- Purpose: Single source of truth for all data shapes
- Location: `src/types/index.ts`
- Contains: Entity types (Project, LineItem, VEAlternate, ScopeDescription), settings types (GlassType, FrameSystem, SystemType, LaborRate, Condition, Hardware, Equipment), computed result types (RunningTotals, SOVGroup, PieSegment), export schema
- Depends on: Nothing
- Used by: All layers

## Data Flow

**1. Page Load & Initialization:**

1. `main.tsx` creates React root and wraps app in `AppStoreProvider`
2. `AppStoreProvider` calls `loadAppState()` from `storage-service.ts`
3. `loadAppState()` checks localStorage for key `cgi_estimating_app_v1`, applies schema migration if needed, or returns `createDefaultAppState()` with seed data
4. `AppState` (projects + settings) becomes initial state in Context
5. Router mounts with `AppLayout` + 5 views

**2. Project CRUD Flow:**

1. View (e.g., `DashboardView`) calls hook method (e.g., `createProject()`)
2. Hook receives `setState` from context and calls it with pure updater function: `setState(prev => ({ ...prev, projects: [...prev.projects, newProject] }))`
3. `setStateRaw` triggers re-render and effect in `AppStoreProvider`
4. Effect debounces `saveAppState(state)` to localStorage (500ms)
5. On page unload, `beforeunload` listener flushes any pending write

**3. Line Item Calculation Flow:**

1. View (e.g., `TakeoffView`) calls `useLineItems(projectId)` to get addLineItem/updateLineItem/deleteLineItem methods
2. User modifies line item (e.g., width, height, glass type, frame system, labor mode via system type)
3. View calls `updateLineItem(id, updates)` hook
4. Hook updates state and re-renders
5. View calls `calcFullLineItem(lineItem, settings, prevailingWage, pwBaseRate, pwFringeRate)` from calc engine
6. Calc engine branches on `systemType.laborMode`:
   - **area mode:** `calcBaseManHoursArea(sqft, sfPerManHour)` → manHours
   - **unit mode:** `calcBaseManHoursUnit(hoursPerUnit, quantity)` → manHours
7. Calc engine computes: materialCost, laborCost (via loadedRate or PW rate), equipmentCost, lineTotal
8. View displays updated line item with computed fields
9. On next project edit, state persists via AppStore debounce

**4. Project Summary Flow:**

1. `SummaryView` calls hooks to get project data
2. Calls `calcRunningTotals(project)` → RunningTotals (material, labor, equipment subtotals, O&P calculation)
3. O&P formula (multiplicative, C-032): `contractValue = adjustedSubtotal × (1 + overhead%) × (1 + profit%)`
4. Calls `calcScheduleOfValues(project)` → SOVGroup[] (grouped by system type)
5. Calls `calcPieData(runningTotals)` → PieSegment[] (for Recharts visualization)
6. Calls `calcWinRate(projects)` → win rate metric
7. All rendered with `formatCurrency()` for consistent $X,XXX.XX display

**5. VE Alternate Cascade (C-015):**

1. User updates line item cost
2. `useLineItems` calls `updateLineItem()` which updates both LineItem.lineTotal AND cascades to any VEAlternate records linked to that line item
3. VEAlternate.originalCost is set to new LineItem.lineTotal
4. VEAlternate.savings recalculated as originalCost - alternateCost
5. If line item deleted, all orphaned VEAlternates (with that lineItemId) are deleted

## State Management

**Pattern:** React Context + useState with pure updater functions

**AppState shape:**
```typescript
{
  schemaVersion: number
  projects: Project[]
  settings: AppSettings
}
```

**Update invariant:** All state changes go through `setState(updater)` where updater is pure: `(prev: AppState) => AppState`

**Persistence:**
- Write debounced 500ms on any state change (isInitialMount ref skips first render save)
- beforeunload listener flushes pending timeout
- Load on init with schema migration (v1→v2 replaces all settings with new seed data)

## Key Abstractions

**LineItem Calculation Pipeline:**
- Purpose: Central orchestrator for all line item derived fields
- File: `src/calc/line-total-calc.ts`
- Pattern: `calcFullLineItem()` composes 3 domain calcs:
  1. Material: sqft, perimeter → materialCost (glass + frame + hardware)
  2. Labor: manHours (area or unit mode) + loadedRate → laborCost
  3. Equipment: crewDays + equipment list → equipmentCost
  4. Total: `lineTotal = materialCost + laborCost + equipmentCost` (C-033)

**Calculation Modules (Pure Functions):**
- `material-calc.ts`: `calcSqft()`, `calcPerimeter()`, `calcMaterialCost()`
- `labor-calc.ts`: `calcLoadedRate()`, `calcPWLoadedRate()`, `calcBaseManHoursArea()`, `calcBaseManHoursUnit()`, `calcLaborCost()`
- `equipment-calc.ts`: `calcEquipmentCost()`, `shouldSuggestEquipment()`
- `summary-calc.ts`: `calcRunningTotals()`, `calcScheduleOfValues()`, `calcPieData()`, `generateScopeDescription()`
- `op-suggest.ts`: `suggestOPPercents()`
- `benchmark-calc.ts`: `calcBenchmark()`
- `win-rate-calc.ts`: `calcWinRate()`

**Project Entity:**
- Contains: lineItems[], veAlternates[], scopeDescriptions[]
- Mutable fields: name, clientName, status, address, prevailingWage, overheadPercent, profitPercent, etc.
- Immutable: id, timestamps (createdAt, updatedAt managed by update/create hooks)

## Entry Points

**Application Entry:**
- Location: `src/main.tsx`
- Triggers: Browser page load
- Responsibilities: Create React root, wrap app in AppStoreProvider, render App component

**Router Configuration:**
- Location: `src/App.tsx`
- Triggers: React boot
- Responsibilities: Define 5 routes (Dashboard, Settings, Project Setup/Takeoff/Summary), wrap with AppLayout, mount ProjectGuard for project context validation

**AppStoreProvider:**
- Location: `src/hooks/use-app-store.tsx`
- Triggers: App render
- Responsibilities: Initialize state from localStorage with migration, provide setState to all descendants via context, handle 500ms debounce + beforeunload flush

## Error Handling

**Strategy:** Type safety first, inline validation second, graceful degradation third

**Patterns:**

1. **Type Safety:** TypeScript strict mode (`noUncheckedIndexedAccess: true`) prevents runtime null/undefined errors in compilation
2. **Input Validation:** `validateLineItem()` in `use-line-items.ts` checks required fields and numeric bounds before state update (C-013)
3. **Storage Fallback:** `loadAppState()` catches JSON parse errors and returns `createDefaultAppState()` to reset corrupted data
4. **Schema Migration:** `migrateState()` handles v1→v2 incompatibilities by replacing settings with fresh seed data and adding new LineItem fields (C-007)
5. **Calc Guards:** `calcFullLineItem()` returns unmodified line item if any required settings reference (glass, frame, system, labor rate) not found
6. **Router Guards:** `ProjectGuard` component checks URL :id matches a valid project; redirects to Dashboard if not
7. **Missing Role Fallback:** Calc engine looks for 'Glazier' labor rate; falls back to first entry in laborRates[] if not found

## Cross-Cutting Concerns

**Logging:** Not implemented. App is small enough that browser DevTools suffices. Redux DevTools integration could be added if needed.

**Validation:**
- Input validation at hook layer before state commit (`validateLineItem()`)
- Component-level optional validation with error display (e.g., TakeoffView disables save if validation fails)

**Authentication:** Not implemented. Phase 1 is localStorage-only, single-user, single browser. No auth required.

**Currency Formatting:** Centralized in `src/calc/index.ts` as `formatCurrency()` using Intl.NumberFormat for $X,XXX.XX display (C-017). All currency display must use this function.

**Prevailing Wage:** Two-path labor calc branching on `project.prevailingWage` boolean:
- Standard: `calcLoadedRate()` = base × (1 + burden) + health
- PW: `calcPWLoadedRate(pwBaseRate, burden, pwFringeRate)` substitutes project-level rates for seed rates

**Dual Labor Mode (C-020):** SystemType.laborMode field branches line item labor calc:
- area: SF ÷ sfPerManHour = manHours
- unit: hoursPerUnit × quantity = manHours

---

*Architecture analysis: 2026-03-01*
