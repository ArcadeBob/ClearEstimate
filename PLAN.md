# ClearEstimate Phase 1 — Implementation Plan

## Context

ClearEstimate is a glazing contractor estimation tool replacing spreadsheet-based workflows. The repo is greenfield — no source code exists, only governance docs (`CLAUDE.md`, `SUCCESS.md`, `CONSTRAINTS.md`). This plan delivers **Phase 1: a React SPA** with 5 views, a calculation engine, and localStorage persistence. No backend, no auth, no automated tests (future phases).

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| React | 19.x | UI framework (Vite 7 default; required by React Router 7's `use()` hook) |
| react-is | ^19 | Peer dependency required by Recharts 3.x to match React 19 |
| TypeScript | 5.x | Strict mode |
| Vite | 7.x | Build tooling (manual setup — see Task 1) |
| React Router | 7.x | `createBrowserRouter` + `<Outlet>` for sidebar layout; imports from `"react-router"` |
| Tailwind CSS | 4.x | Styling (via `@tailwindcss/vite` plugin) |
| Recharts | 3.x | Pie chart in Summary view |
| uuid | 11.x | Entity ID generation |

## Folder Structure

```
src/
  main.tsx                    # ReactDOM.createRoot + RouterProvider
  App.tsx                     # createBrowserRouter definition
  index.css                   # Tailwind import
  vite-env.d.ts

  types/
    index.ts                  # ALL TypeScript interfaces

  data/
    seed-glass.ts             # 14 glass types
    seed-frames.ts            # 5 frame systems
    seed-labor.ts             # Labor rates
    seed-conditions.ts        # Site conditions
    seed-hardware.ts          # Hardware items
    seed-equipment.ts         # Equipment items
    seed-systems.ts           # 21 system types + benchmark ranges
    index.ts                  # Aggregates into DEFAULT_SETTINGS + createDefaultAppState()

  storage/
    storage-service.ts        # localStorage CRUD under key cgi_estimating_app_v1

  calc/
    material-calc.ts          # sqft, perimeter, material cost
    labor-calc.ts             # loaded rate, crew days, labor cost
    equipment-calc.ts         # equipment cost + height suggestion
    line-total-calc.ts        # calcFullLineItem orchestrator
    op-suggest.ts             # O&P tier suggestion
    benchmark-calc.ts         # $/SF → green/amber/red
    win-rate-calc.ts          # Awarded / (Awarded + Lost)
    summary-calc.ts           # Running totals, SOV grouping, pie data, scope generation
    index.ts                  # Re-exports

  hooks/
    use-app-store.ts          # React Context + useState + localStorage sync
    use-projects.ts           # Project CRUD
    use-line-items.ts         # Line item CRUD + recalculation
    use-ve-alternates.ts      # VE alternate CRUD
    use-settings.ts           # Reference data table CRUD

  components/
    AppLayout.tsx             # Sidebar + Breadcrumb + <Outlet />
    Sidebar.tsx               # Nav links, project links disabled when no active project
    Breadcrumb.tsx            # Route-aware breadcrumbs
    StatusBadge.tsx           # Colored pill for ProjectStatus
    BenchmarkBadge.tsx        # Green/amber/red indicator
    SearchInput.tsx           # Reusable search input
    ConfirmDialog.tsx         # Simple modal for delete confirmations

  views/
    DashboardView.tsx         # Project list, search, create, duplicate, win rate
    ProjectSetupView.tsx      # Project form, PW toggle, O&P suggest
    TakeoffView.tsx           # Line items, conditions, VE, running totals, benchmarks
    SummaryView.tsx           # SOV table, pie chart, scope, export JSON, print
    SettingsView.tsx          # 6-tab reference data editor
    NotFoundView.tsx          # 404
```

## localStorage Schema

Single key: `cgi_estimating_app_v1` → JSON `AppState`:

```
AppState { schemaVersion: number, projects: Project[], settings: AppSettings }
  NOTE: activeProjectId is derived from URL route param :id, NOT stored in state.
  NOTE: schemaVersion enables migration when AppState shape evolves during development.

Project { id, name, clientName, bidDate, status, address, projectManager, estimator,
          prevailingWage, pwBaseRate?, pwFringeRate?, overheadPercent, profitPercent,
          lineItems: LineItem[], veAlternates: VEAlternate[],
          scopeDescriptions: ScopeDescription[],
          timestamps: { createdAt: string, updatedAt: string } }

ScopeDescription { systemTypeId: string, text: string }

LineItem { id, systemTypeId, glassTypeId, frameSystemId, description, quantity,
           widthInches, heightInches, sqft, materialCost, laborCost, equipmentCost,
           lineTotal, conditionIds[], crewDays, equipmentIds[], hardwareIds[] }

VEAlternate { id, lineItemId, description, originalCost, alternateCost, savings }
  NOTE: savings = originalCost - alternateCost

AppSettings { glassTypes[], frameSystems[], laborRates[], conditions[],
              hardware[], equipment[], systemTypes[] }

ProjectExport { project metadata, lineItems, veAlternates, sovGroups,
                runningTotals, scopeDescriptions }
  NOTE: Defined in src/types/index.ts. Used by JSON export (Task 14). Becomes import contract for Phase 2.
```

## Key Calculation Formulas

| Formula | Expression |
|---------|------------|
| Loaded Rate | `base * (1 + burden) + healthHourly` |
| Square Footage | `(W * H / 144) * qty` |
| Perimeter | `2*(W+H)/12 * qty` |
| Material Cost | `sqft * glass.costPerSqft + perimeter * frame.costPerLinFt + Σ hardware` |
| Crew Days | `frame.laborHoursPerUnit * qty / 8 + Σ condition.adjustment` (min 0) |
| Labor Cost | `adjustedCrewDays * 8 * loadedRate` |
| Equipment Cost | `Σ (equipment.dailyRate * adjustedCrewDays)` |
| Line Total | `material + labor + equipment` |
| O&P Suggest | `<$100K → 10%/10%, <$500K → 8%/8%, ≥$500K → 5%/5%` |
| Benchmark | `lineTotal/sqft` vs system thresholds → green/amber/red |
| Win Rate | `Awarded / (Awarded + Lost)` |
| Contract Value | `(subtotal - veSavings) * (1 + OH) * (1 + profit)` |

---

## Implementation Tasks (Incremental)

### Task 1: Project Scaffold (Manual Setup)
- **Do NOT use `npm create vite@latest .`** — the repo is non-empty (CLAUDE.md, SUCCESS.md, etc.) and Vite's scaffolder has no `--force` flag. It prompts interactively and may delete existing files.
- Instead, manually create the project files:
  - `package.json` — name, scripts (`dev`, `build`, `preview`, `lint`), dependencies matching Vite 7 react-ts template
  - `vite.config.ts` — React plugin + Tailwind plugin (`@tailwindcss/vite`) + `vite-tsconfig-paths` plugin (for `@/` alias)
  - `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` — strict mode, `"paths": { "@/*": ["./src/*"] }`
  - `index.html` — standard Vite entry pointing to `/src/main.tsx`
  - `src/main.tsx` — `ReactDOM.createRoot` placeholder
  - `src/App.tsx` — placeholder component
  - `src/index.css` — `@import "tailwindcss"` (Tailwind v4 — no tailwind.config.js needed)
  - `src/vite-env.d.ts` — Vite client types reference
- Install dependencies: `react@^19 react-dom@^19 react-router recharts react-is@^19 uuid`
- Install dev dependencies: `@vitejs/plugin-react typescript @types/react @types/react-dom @types/uuid tailwindcss @tailwindcss/vite vite vite-tsconfig-paths`
- Verify: `npm run dev` + `npm run build` both pass with 0 errors
- **Depends on:** nothing

### Task 2: TypeScript Interfaces
- Create `src/types/index.ts` with all entity interfaces (Project, LineItem, VEAlternate, ScopeDescription, AppState, AppSettings, GlassType, FrameSystem, SystemType, LaborRate, Condition, Hardware, Equipment, RunningTotals, SOVGroup, PieSegment, ProjectExport)
- All IDs are `string`, dates are ISO strings, `ProjectStatus` is a union type
- Verify: `npm run build`
- **Depends on:** Task 1

### Task 3: Seed Data
- Create 7 seed files in `src/data/` with realistic placeholder data
- Use deterministic IDs like `"glass-001"` for stability
- `src/data/index.ts` exports `DEFAULT_SETTINGS` and `createDefaultAppState()`
- Pre-calculate `loadedRate` in labor seed data as cross-check
- **Spot-check constraint:** Seed values for "1/4" Clear Tempered" glass and "Kawneer Trifab 451T" frame MUST produce ~$879 total for 48"×96" qty 1 with no conditions/equipment. Document the math inline as a comment in the seed files.
- **Key data volumes:** 14 glass types, 5 frame systems, 21 system types, 4 labor roles, 6 conditions, 8 hardware items, 5 equipment items
- **Depends on:** Task 2

### Task 4: Storage Service
- Create `src/storage/storage-service.ts`: `loadAppState()`, `saveAppState()`, `resetAppState()`
- Handle corrupted JSON (try/catch → default state), missing key (first launch)
- **Schema versioning:** Store a `schemaVersion: number` field alongside AppState. On load, if version is missing or outdated, merge stored data with `createDefaultAppState()` to fill new fields. This prevents structurally-valid-but-schema-mismatched data from causing subtle bugs during development as `AppState` evolves.
- **Depends on:** Tasks 2, 3

### Task 5: Calculation Engine
- Create 8 calc files in `src/calc/`, all pure functions
- `calcFullLineItem()` is the key orchestrator — accepts `AppSettings` + project-level PW fields (`prevailingWage`, `pwBaseRate`, `pwFringeRate`)
- Use primary Glazier labor rate for all line items (decided)
- Hardware cost = `Σ(hardware.unitCost * lineItem.quantity)` (decided)
- Equipment suggestion: show when `heightInches > 0` (per SUCCESS.md acceptance criteria)
- PW loaded rate: `pwBaseRate * (1 + burden) + pwFringeRate` when `prevailingWage === true` (decided)
- Round monetary values to 2 decimal places at output
- **`formatCurrency(n: number): string`** — shared display formatter producing `$1,234.56` format (Decision 17). Exported from `src/calc/index.ts`.
- **Condition adjustment units:** `condition.adjustment` values are in **crew-day** units, added to the total crew days for the line item (not per-unit). Document in seed data.
- `src/calc/index.ts` re-exports all
- **Verify spot-check immediately:** 48"×96" qty 1, Clear Tempered + Kawneer → ~$879
- **Depends on:** Task 2 (all types including RunningTotals/SOVGroup/PieSegment defined there)

### Task 6: React Hooks (State Management)
- `use-app-store.ts`: React Context + `useState` + auto-persist to localStorage
- `use-projects.ts`: CRUD, `createProject()` generates defaults with `timestamps: { createdAt, updatedAt }`, `duplicateProject()` deep-clones with "(Copy)" suffix + **ID remapping** (generate new UUIDs for all line items, remap `VEAlternate.lineItemId` via `oldId → newId` map, drop orphaned VE alternates)
- `use-line-items.ts`: CRUD + `recalculateLineItem()` + `recalculateAll()`. **On delete:** also remove any VE alternates referencing the deleted line item (cascade delete). **Input validation:** dimensions must be positive numbers, quantity ≥ 1, glass/frame/system required before calc runs. Invalid line items show inline errors and are excluded from running totals.
- `use-ve-alternates.ts`: CRUD + `totalSavings` computed. `originalCost` auto-updates when linked line item is recalculated.
- `use-settings.ts`: CRUD for all 6 reference tables, auto-recalc `loadedRate`. **On delete:** prevent deletion if the item is referenced by any line item across any project (show "Used by N line items" error).
- **Win rate:** Return `null` when denominator is 0 (no Awarded + Lost projects). Display "N/A" in Dashboard.
- **Performance:** Wrap `LineItemRow` component in `React.memo` to prevent full-tree re-renders on every keystroke. If performance still degrades with 30+ line items, refactor to `useReducer` as architectural fallback.
- **Depends on:** Tasks 2, 4, 5

### Task 7: Layout Shell + Routing
- `AppLayout.tsx`: flex container, Sidebar (w-64 fixed) + main area (Breadcrumb + Outlet)
- `Sidebar.tsx`: NavLink-based, project links disabled when no `:id` param in current route
- `Breadcrumb.tsx`: route-aware, resolves project name from store via URL `:id` param
- `App.tsx`: `createBrowserRouter` with routes: `/` (Dashboard), `/settings`, `/project/:id/setup|takeoff|summary`, `*` (404)
- **React Router 7 imports:** Use `"react-router"` (NOT `"react-router-dom"` which is deprecated). `RouterProvider` imports from `"react-router/dom"`. `createBrowserRouter`, `Outlet`, `NavLink`, `useParams` all from `"react-router"`.
- **Active project:** Derived from URL route param `:id` — NOT stored in AppState. Sidebar reads `:id` from current route.
- **Invalid project ID guard:** Project views check if `:id` matches an existing project. If not, redirect to Dashboard.
- Wrap in `AppStoreProvider`
- Stub all view components as placeholders
- Verify: nav between routes, sidebar highlights, breadcrumbs update
- **Depends on:** Tasks 1, 6

### Task 8: Settings View
- 6 tabs: Glass, Frame Systems, Labor, Conditions, Hardware, Equipment
- Each tab: data table + Add/Edit/Delete inline
- Labor tab: live `loadedRate` recalculation on field change
- Delete with confirmation dialog (uses `ConfirmDialog` from Task 9)
- **Depends on:** Tasks 6, 7, 9

### Task 9: Shared UI Components
- `StatusBadge.tsx`: colored pill (Bidding=blue, Awarded=green, Lost=red, In Progress=amber, Completed=gray)
- `BenchmarkBadge.tsx`: green/amber/red dot with tooltip
- `SearchInput.tsx`: controlled input with search icon
- `ConfirmDialog.tsx`: overlay modal with confirm/cancel
- **Depends on:** Task 2

### Task 10: Dashboard View
- Projects table: name, client, bid date, StatusBadge, contract value, actions
- "New Project" → creates project → navigates to Setup
- Search filters by name and client (case-insensitive)
- Duplicate (deep clone + "(Copy)"), Delete (with confirm)
- Win rate display in header
- Contract value computed from line items via `calcRunningTotals`
- **Depends on:** Tasks 6, 7, 9

### Task 11: Project Setup View
- Form: name, client, bidDate, status, address, PM, estimator, PW toggle, OH%, profit%
- PW toggle reveals/hides PW rate inputs
- "Suggest O&P" computes subtotal → tier suggestion
- **Save semantics:** State auto-persists on every change (via hooks). "Save" button provides UX confirmation feedback (e.g., brief "Saved" indicator). "Start Takeoff" navigates to Takeoff view. No draft/committed distinction in Phase 1.
- All fields pre-populated from store on load (localStorage round-trip verification)
- **Depends on:** Tasks 5, 6, 7

### Task 12: Takeoff View — Line Items
- Line items table with dropdowns for system/glass/frame, dimension inputs, conditions checkboxes
- **UI density:** Consider expandable row / detail panel pattern rather than showing all ~25 interactive/display elements per row. Primary row shows key fields (system, dimensions, qty, line total); expand to reveal conditions, hardware, equipment checkboxes.
- Costs auto-calculated via `calcFullLineItem()` on any input change
- **Input validation (Decision 13):** Inline error indicators for invalid fields (negative dimensions, zero quantity, missing required dropdowns). Invalid line items are visually distinct and excluded from running totals.
- Equipment suggestion when height > 0 (per SUCCESS.md)
- Duplicate/delete line items
- BenchmarkBadge per line item
- **Condition adjustment units:** `condition.adjustment` is in **crew-day units** added to total crew days (not per-unit). Document this in seed data comments.
- **Depends on:** Tasks 5, 6, 7, 9

### Task 13: Takeoff View — Running Totals + VE
- Sticky running totals sidebar: materials, labor, equipment, subtotal, VE deducts, OH, profit, contract value
- VE alternates table: link to line item, original/alternate cost, savings
- All totals update live
- **Depends on:** Task 12

### Task 14: Summary View
- SOV table grouped by system type via `calcScheduleOfValues()`. Per-row contract value = `rowDirectCost * (1 + OH) * (1 + profit)` (proportional distribution that sums to project total). **Known limitation (Decision 18):** sum-of-rows may differ from project total by pennies due to 2-decimal rounding. No reconciliation row in Phase 1.
- Cost breakdown card from `calcRunningTotals()`
- Pie chart (Recharts): Materials, Labor, Equipment, Overhead, Profit
- Scope descriptions **(Decision 14):** Auto-generate only for system types with no existing description. Never overwrite user edits automatically. Provide a "Regenerate" button per system type (with confirmation). Template: `"Furnish and install {systemType} system — {count} units, {totalSqft} SF total. {glassType} glass in {frameSystem} frames."` Stored as `ScopeDescription[]` on Project.
- Export JSON: download as `{project}-estimate-{date}.json`. **Schema:** Define a `ProjectExport` TypeScript interface in `src/types/index.ts` covering project metadata, line items, VE alternates, SOV groups, running totals, and scope descriptions. This interface becomes the import contract for Phase 2.
- **Print layout (basic scope):** `@media print` hides interactive elements, shows header + data. Use `page-break-inside: avoid` on table rows. Note: SVG pie chart rendering varies by browser print dialog. Header repetition and multi-page formatting deferred to Phase 2 PDF export.
- **Depends on:** Tasks 5, 6, 7, 12–13

### Task 15: Polish & Verification
- Run SUCCESS.md Definition of Done checklist
- Verify calculation with known inputs (48"×96" clear tempered + Kawneer = ~$879)
- Cross-view navigation test: Dashboard → Setup → Takeoff → Summary → Dashboard
- Edge cases: empty project, duplicate with line items (verify VE ID remapping), delete all items, invalid inputs (negative dimensions, zero quantity)
- Verify `formatCurrency()` produces consistent `$1,234.56` format across all views
- **Depends on:** Tasks 1–14

### Task 16: Repository & Documentation Cleanup
- Update `CLAUDE.md` with actual architecture details (entry point, key patterns, build commands)
- Create `main` branch from `master` and push
- Update CONSTRAINTS.md with any new constraints discovered during implementation
- **Depends on:** nothing (can run in parallel with Tasks 8–14)

---

## Verification Plan

1. **Build check:** `npm run dev` starts, `npm run build` produces bundle with 0 TS errors
2. **Calculation spot-check:** 48"×96" qty 1, "1/4\" Clear Tempered" + "Kawneer Trifab 451T", no conditions/equipment → material ~$716, labor ~$163, total ~$879
3. **Persistence round-trip:** Create project → fill fields → refresh → all data intact
4. **Navigation flow:** Dashboard → new project → Setup → Start Takeoff → Takeoff → Summary (via sidebar) → Dashboard (via sidebar)
5. **Settings propagation:** Change glass price → add line item with that glass → verify new price used
6. **Edge cases:** Empty project summary, duplicate with line items, search filtering, win rate with 0 projects

## Critical Review (Post-Research)

### Pass 1: Tech Stack Amendments

| Issue | Finding | Fix |
|-------|---------|-----|
| Vite template → React 19 | Vite 7 generates React 19.x; React Router 7 requires React 19 (`use()` hook) | DECIDED: Use React 19 — required by RR7. Add `react-is@^19` for Recharts peer dep. |
| Non-empty dir scaffold | `npm create vite@latest .` can't run non-interactively in non-empty dir | DECIDED: Manual file creation (see Task 1) — deterministic, non-destructive |
| Path aliases need plugin | Vite doesn't read `tsconfig.json` paths natively | Install `vite-tsconfig-paths` dev dep, add to plugins |
| Tailwind v4 is CSS-first | No `tailwind.config.js` — config via `@theme` in CSS | `@import "tailwindcss"` is correct |
| React Router v7 | `createBrowserRouter` + `<Outlet>` + `NavLink` confirmed | No change needed |

### Pass 1: Resolved Decisions (1–6)

1. **Labor rate per line item** — DECIDED: Use primary Glazier rate for all line items in Phase 1. No `laborRateId` on `LineItem`.
2. **Hardware cost aggregation** — DECIDED: `Σ(hardware.unitCost * lineItem.quantity)`.
3. **Equipment height threshold** — DECIDED: Show suggestion when `heightInches > 0` (per SUCCESS.md acceptance criteria). Original plan said > 96" but SUCCESS.md overrides.
4. **Prevailing wage labor calc** — DECIDED: When `prevailingWage === true`, loaded rate = `pwBaseRate * (1 + burden) + pwFringeRate`.
5. **VEAlternate interface** — DECIDED: `{ id, lineItemId, description, originalCost, alternateCost, savings }`.
6. **Scope description template** — DECIDED: `"Furnish and install {systemType} system — {count} units, {totalSqft} SF total. {glassType} glass in {frameSystem} frames."` Editable after generation.

### Pass 1: Fixed Dependencies

| Task | Fix |
|------|-----|
| Task 8 (Settings) | Added Task 9 as dependency (needs `ConfirmDialog`) |
| Task 5 (Calc Engine) | All types defined in Task 2; calc engine just imports them |

### Pass 2: Resolved Decisions (7–12)

7. **`activeProjectId` lifecycle** — DECIDED: Derive from URL route param `:id`, NOT stored in AppState/localStorage. Sidebar reads current route. Eliminates stale-ID bugs. Removed from localStorage schema.

8. **Reference data deletion safety** — DECIDED: Prevent deletion if the item is referenced by any line item across any project. Show "Used by N line items" error. Added to `use-settings.ts` in Task 6.

9. **`scopeDescriptions` shape** — DECIDED: `ScopeDescription { systemTypeId: string, text: string }`. Array on Project, one per system type. Added to localStorage schema.

10. **`timestamps` shape** — DECIDED: `{ createdAt: string, updatedAt: string }` — ISO strings, set on create/save. Added to localStorage schema.

11. **SOV contract value distribution** — DECIDED: Per-row contract value = `rowDirectCost * (1 + OH) * (1 + profit)`. Proportional distribution that sums to project total. Added to Task 14.

12. **Form save semantics** — DECIDED: No draft state in Phase 1. State auto-persists via hooks. "Save" button provides UX confirmation feedback only. "Start Takeoff" navigates. Added to Task 11.

### Pass 3: Resolved Decisions (13–19) — Post-Review

13. **Input validation strategy** — DECIDED: Validate at the hook layer before values reach the calc engine. Rules: dimensions must be positive numbers, quantity ≥ 1, glass/frame/system dropdowns required before calc runs. Invalid line items show inline errors and are excluded from totals until corrected. Added to Tasks 6, 12.

14. **Scope description regeneration lifecycle** — DECIDED: Auto-generate only for system types with no existing `ScopeDescription`. Once a description exists (auto-generated or user-edited), it is never overwritten. A "Regenerate" button per system type allows explicit re-generation (replaces user edits with warning). Added to Task 14.

15. **VE alternate `originalCost` linkage** — DECIDED: `originalCost` auto-updates when the linked line item's cost changes (recalculated via `calcFullLineItem()`). `savings` recomputed accordingly. This keeps VE data current without manual sync.

16. **Hardware quantity per line item** — DECIDED: Phase 1 simplification — every selected hardware item is multiplied by `lineItem.quantity`. No per-unit hardware quantity override. Documented as known limitation; Phase 2 may add `hardwareQuantityOverrides: Record<string, number>`.

17. **Number/currency display formatting** — DECIDED: All monetary values displayed as `$1,234.56` (USD locale, 2 decimal places). A shared `formatCurrency(n: number): string` utility in `src/calc/index.ts`. Percentages displayed as `10.0%`. Dimensions displayed as integers with `"` suffix.

18. **SOV rounding reconciliation** — DECIDED: Phase 1 accepts penny discrepancies between sum-of-rows and project total. No reconciliation row. Document as known limitation. Phase 2 may add a "rounding adjustment" row if contractors flag this.

19. **`duplicateProject()` ID remapping** — DECIDED: Deep-clone generates new UUIDs for all line items. Maintains an `oldId → newId` map during clone. `VEAlternate.lineItemId` is remapped to point to the cloned line item. If a VE alternate references a line item not in the clone set, it is dropped. Added to Task 6.

### Pass 2: Additional Fixes Applied to Tasks

| Area | Fix |
|------|-----|
| VE cascade delete | Task 6: deleting a line item also deletes VE alternates referencing it |
| Win rate ÷ zero | Task 6: return `null` when no Awarded+Lost projects; Dashboard shows "N/A" |
| Invalid project ID | Task 7: project views redirect to Dashboard if `:id` doesn't match any project |
| `calcFullLineItem()` signature | Task 5: accepts `AppSettings` + project PW fields (not just AppSettings) |
| Spot-check constraint | Task 3: seed data values must produce ~$879 for verification; math documented inline |

### Hidden Complexity

1. **Takeoff View is ~600+ lines** — Task 12 alone: dropdowns, dimensions, conditions, auto-calc, equipment suggestions, benchmarks, duplicate/delete. ~25 interactive/display elements per row.
   - **Mitigation:** Build incrementally within Task 12. Use expandable row / detail panel pattern (Decision noted in Task 12).

2. **Context re-render cascade** — `useState` + Context re-renders ALL consumers on every `setAppState()`. Live recalc on keystroke could lag with 30+ line items.
   - **Mitigation:** `React.memo` on `LineItemRow` (Task 6). `useMemo` for derived values. `useReducer` as architectural fallback. Debounce dimension inputs if needed.

3. **`calcFullLineItem()` parameter surface** — Needs `AppSettings` (7 lookup tables) + project PW fields. Wide function signature.
   - **Mitigation:** `AppSettings` as single object + 3 PW params. Keeps it manageable.

4. **Condition toggles cascade to equipment cost** — Toggling a site condition changes crew days → changes BOTH labor cost AND equipment cost. User sees two costs change from one checkbox. Not a bug, but needs clear UI feedback. **Clarification:** `condition.adjustment` is in crew-day units added to total (not per-unit).

5. **Spot-check / seed data circular dependency** — The $879 target and seed data must be internally consistent, but neither exists yet. Seed data must be reverse-engineered to hit the target, or the target updated after seed data is written.
   - **Mitigation:** Document the spot-check math as comments in seed files (Task 3). Verify programmatically after Task 5.

6. **`duplicateProject()` VE ID remapping** — Deep-cloning a project requires generating new line item UUIDs AND remapping `VEAlternate.lineItemId` via an `oldId → newId` map. Not trivial. (Decision 19, Task 6.)

7. **Input validation gap** — Every formula computes happily with garbage (negative dimensions → negative costs, zero quantity → $0 contract value). Validation at the hook layer (Decision 13) prevents NaN cascades.

---

## Top 3 Risks to Success

### Risk 1: Missing Input Validation — Silent Calculation Corruption (HIGH)
**What:** Zero mentions of input validation across 8 calc functions, 5 hooks, and 5 views (prior to this review). The entire verification strategy (the $879 spot-check) assumed valid inputs. In practice: `0` quantity → `$0` contract value, negative dimensions → negative costs, unselected dropdowns → `undefined.costPerSqft` → NaN cascading through every total.
**Why it matters:** Glazing contractors will enter weird values on day 1. Wrong numbers are the one thing they catch immediately. This is the same class of bug as deletion corruption but from the input/creation side.
**Mitigation:** Decision 13 added: validation at the hook layer. Dimensions must be positive, quantity ≥ 1, glass/frame/system required. Invalid line items show inline errors and are excluded from totals. Added to Tasks 6 and 12.

### Risk 2: Takeoff View Concentrated Complexity (HIGH)
**What:** Tasks 12-13 are where all plan complexity converges: calc engine, state management, live recalculation, 6 types of input controls, equipment suggestions, benchmark badges, running totals, VE alternates, condition cascades affecting two cost types, and duplicate/delete with ID integrity. ~25 interactive/display elements per row. Also where Context re-render performance degrades with 30+ line items.
**Why it matters:** If this view doesn't work well, the app fails its core purpose. The plan's mitigation (incremental build) is process-based, not architectural.
**Mitigation:** `React.memo` on `LineItemRow` (Task 6). Expandable row pattern to manage UI density (Task 12). `useReducer` as architectural fallback. Incremental build within Tasks 12-13.

### Risk 3: Data Integrity on Mutations (HIGH)
**What:** Three deletion scenarios silently corrupt data without guards: (a) deleting reference data used by line items → NaN cascades; (b) deleting line items referenced by VE alternates → orphaned VE; (c) navigating to invalid project ID → crash. Additionally, `duplicateProject()` requires VE ID remapping that's non-trivial to implement correctly.
**Why it matters:** Corrupted data produces wrong calculations silently. NaN propagating through totals erodes trust in the entire tool.
**Mitigation:** Task 6: prevent deletion of referenced settings items, cascade-delete VE alternates, ID remapping on duplicate (Decision 19). Task 7: redirect on invalid project IDs.

---

## Risks & Mitigations (Full List)

| Risk | Severity | Mitigation |
|------|----------|------------|
| Input validation — NaN cascades | HIGH | Decision 13: validate at hook layer; inline errors; exclude invalid items from totals (Tasks 6, 12) |
| Takeoff view complexity + density | HIGH | `React.memo`, expandable rows, incremental sub-steps (Tasks 6, 12-13) |
| Data integrity on mutations | HIGH | Prevent referenced-item deletion; cascade VE deletes; ID remapping on duplicate; redirect on invalid IDs (Tasks 6, 7) |
| Spot-check / seed data coupling | MEDIUM-HIGH | Document math in seed files; verify programmatically after Task 5 |
| Context re-render performance | MEDIUM | `React.memo` on row components; `useMemo` for derived values; `useReducer` fallback (Task 6) |
| Calculation drift | MEDIUM | Pure functions + known-input spot-check after Task 5 (not Task 15) |
| Condition cascade confusion | MEDIUM | Clear UI feedback; `adjustment` units documented as crew-days (Task 12) |
| localStorage schema migration | MEDIUM | Schema version field; merge with defaults on version mismatch (Task 4) |
| SOV rounding discrepancy | LOW | Known limitation (Decision 18); accepted for Phase 1 |
| localStorage size limits (~5MB) | LOW | Sufficient for Phase 1 |
| Seed data accuracy | LOW | Placeholder data clearly marked; user replaces later |
| Branch mismatch (master vs main) | LOW | Create `main` branch in Task 16 |
