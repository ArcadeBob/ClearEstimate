# SUCCESS.md — ClearEstimate Phase 1 (Frontend SPA)

## Objective

CGI (a glazing contractor) currently builds estimates in spreadsheets. Formulas break, pricing data gets stale across copies, and there is no benchmark checking. ClearEstimate replaces that with a purpose-built estimation tool.

**This phase** delivers a working React SPA with localStorage persistence. All 5 views functional: Dashboard, Project Setup, Takeoff, Summary, Settings. The calculation engine (material + labor + equipment + markups) must produce correct numbers. The backend (API, database, auth) is a future phase.

## Measurable Success Criteria

### Dashboard

- Create a new project → navigates to Setup with defaults populated
- Projects list shows name, client, bid date, status badge, and contract value
- Search filters by project name and client name
- Duplicate project creates a copy with " (Copy)" suffix and all line items cloned
- Win rate shows correct ratio of Awarded / (Awarded + Lost)

### Project Setup

- Save populates all fields on reload (localStorage round-trip)
- Toggling "Prevailing Wage" reveals PW rate inputs; untoggling hides them
- "Suggest O&P" returns correct tier based on subtotal brackets (<$100K, <$500K, $500K+)
- Saving and clicking "Start Takeoff" navigates to Takeoff view

### Takeoff

- Adding a line item with glass + frame + dimensions → shows calculated material, labor, equipment, and line total
- Line total = material_cost + labor_cost + equipment_cost (no off-by-one or rounding drift)
- Selecting conditions adjusts crew days (positive = penalty, negative = improvement)
- Equipment suggestion appears when height > 0; adding it updates equipment_cost
- Duplicate/delete line items works; running totals sidebar updates live
- VE alternates: add, edit, delete; total VE savings shown; "w/ VE Deducts" line in running totals
- Benchmark check badge shows green/amber/red based on $/SF vs system benchmark range

### Summary

- Schedule of Values table groups by system type with correct direct cost and contract value
- Cost breakdown sidebar: subtotal + overhead + profit = contract value
- Pie chart renders with Materials, Labor, Equipment, Overhead, Profit segments
- Scope descriptions auto-generate from line item data; editable inline
- Export JSON downloads a file with project, SOV, VE items, totals, and line items
- Print layout hides interactive elements, shows header and benchmark analysis

### Settings

- Six tabs render: Glass, Frame Systems, Labor, Conditions, Hardware, Equipment
- Add/Edit/Delete rows in each table; changes persist on reload
- Editing a labor rate recalculates loaded_rate = base × (1 + burden) + health_hourly

### Cross-Cutting

- Layout sidebar navigation works across all views; breadcrumb updates
- Project nav disabled when no project is active
- All state persists in localStorage under key `cgi_estimating_app_v1`
- App loads default pricing data on first launch (21 system types, 14 glass types, 5 frame systems, etc.)

## Definition of Done

- [ ] `npm run dev` starts without errors
- [ ] `npm run build` produces a production bundle with no TypeScript errors
- [ ] All 5 views render and navigate correctly
- [ ] Calculation engine: a test line item with known inputs produces the expected material_cost, labor_cost, equipment_cost, and line_total
- [ ] localStorage: create project → refresh page → project still visible
- [ ] No console errors during normal workflow (create → setup → takeoff → summary)

## Non-Goals

- No backend API, database, or authentication (future phase)
- No real-time collaboration or multi-user support
- No PDF export (JSON export only for now)
- No import from existing spreadsheets
- No automated testing in this phase (tests come in the TDD implementation phase)
- No mobile-responsive layout (desktop-first tool)
- No undo/redo system
