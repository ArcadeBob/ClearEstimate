# Project Research Summary

**Project:** ClearEstimate — Door Hardware Selection Feature
**Domain:** Brownfield enhancement to commercial glazing estimation SPA
**Researched:** 2026-03-02
**Confidence:** HIGH

## Executive Summary

Door hardware selection is a brownfield feature addition to an established React 19 + TypeScript 5 SPA. The existing codebase has clear patterns across all layers (seed data, pure calc functions, React hooks, localStorage persistence) that door hardware must follow without deviation. The core challenge is not technology — all necessary tools already exist — but rather getting the data model right before writing any other code. The existing `hardwareIds: string[]` model on `LineItem` assumes 1:1 quantity (one item per door unit), which silently breaks for door hardware requiring per-item quantities (3 hinges per door, 1 closer per door). A separate `doorHardware: DoorHardwareEntry[]` field with a distinct shape is mandatory.

The recommended approach is a strict bottom-up build order: types and seed data first, then calc engine, then state hooks, then UI. Every layer above depends on the layer below being correct. This order also matches the pitfall prevention strategy: the two highest-risk pitfalls (wrong data model and schema migration data loss) must be addressed in the first phase before any other work begins. The calc pipeline must be verified via tests and the existing `verify-calc.ts` script before UI work begins, ensuring the calculation invariant `lineTotal = materialCost + laborCost + equipmentCost` (C-033) is preserved.

The main risks are: (1) contaminating the existing `hardwareIds` model with door hardware IDs, producing silently wrong costs; (2) a careless schema migration that overwrites user-customized settings; (3) aggressive auto-population of hardware defaults that overwrites estimator customizations. All three are architectural decisions that must be locked in during Phase 1 and tested before proceeding. The feature set for this milestone is well-scoped and achievable without new dependencies.

## Key Findings

### Recommended Stack

This is a brownfield enhancement — no new dependencies are required. The existing stack (React 19, TypeScript 5 strict mode, Vite 6, Tailwind CSS v4, Vitest 4, localStorage) handles everything needed. Five new files are created, seven existing files are modified, all following established patterns in `src/data/`, `src/calc/`, `src/hooks/`, and `src/components/`.

**Core technologies:**
- **React 19 + TypeScript 5 (strict mode):** Existing framework — `noUncheckedIndexedAccess: true` means migration must initialize all new fields to avoid runtime errors
- **Vitest 4:** Test-first approach is mandatory; the calc function must have red-then-green tests before UI work begins
- **localStorage with schema versioning:** Schema bumps from v2 to v3; migration must merge new seed data rather than replace existing user settings
- **uuid (already in dependencies):** Used only for custom one-off hardware item IDs; seed data uses deterministic IDs (`dhw-001` through `dhw-012`)

### Expected Features

**Must have (table stakes) — v1 this milestone:**
- Door hardware seed data (12 items: hinges, closers, handles, locks, panic devices, thresholds, weatherstrip, sweeps, pivots, auto-operators) — foundation for all other features
- Per-item quantity model on `LineItem` (`doorHardware: DoorHardwareEntry[]`) — the core data model change that enables correct math
- Default hardware sets per door system type (Swing: sys-009, Sliding: sys-008, Revolving: sys-007) — saves estimators 2-3 minutes per door
- Add/remove items from defaults — estimators must be able to customize; defaults are a starting point, not locked
- Custom one-off hardware items (name + unit cost + qty) — covers unusual specs without bloating seed data
- Hardware cost integrated into `calcMaterialCost` — must flow through materialCost into lineTotal (C-033)
- Sub-row UI for door line items in TakeoffView — collapsible, visible only for door system types
- Hardware cost visible in line item detail panel — estimator must be able to verify the number

**Should have (differentiators) — v1.x after validation:**
- Smart hinge quantity suggestion by door height (industry standard: 2 hinges up to 60", 3 for 61-90", 4 for 91-120")
- Hardware set templates (save/apply custom sets; replicates WinBidPro assembly concept)
- Duplicate door line item copies hardware selections (deep copy, not reference)
- Hardware cost summary in project totals sidebar

**Defer (v2+):**
- Bulk hardware override (requires multi-select UI that does not exist)
- Hardware grade/tier selection (Grade 1/2/3 pricing tiers)
- Manufacturer catalog integration (requires backend infrastructure)
- Fire rating / code compliance validation (legal liability, jurisdiction-specific rules)

### Architecture Approach

The feature adds one new calc module (`door-hardware-calc.ts`), one new hook (`use-door-hardware.ts`), two new components (`DoorHardwareSubRow.tsx`, `DoorHardwareEditor.tsx`), and two new data files (`seed-door-hardware.ts`, `door-defaults.ts`). All integrate into existing layers without changing the overall architecture. Door hardware cost flows into `materialCost` inside `calcFullLineItem()` — downstream consumers (running totals, SOV, summary) automatically include it with zero changes required in `summary-calc.ts`.

**Major components:**
1. `door-hardware-calc.ts` — Pure function `calcDoorHardwareCost(entries, customItems, catalog, doorQty)` computing `sum(unitCost * itemQty * doorQuantity)`; called from `calcFullLineItem()`
2. `use-door-hardware.ts` — Hook with `toggleItem`, `setItemQty`, `addCustomItem`, `removeCustomItem`; delegates state writes through `useLineItems.updateLineItem()`
3. `DoorHardwareSubRow.tsx` — Compact display below door-type line items; renders only when `isDoorSystemType(systemTypeId)` is true
4. `DoorHardwareEditor.tsx` — Full edit panel with checkboxes, per-item qty spinners, custom item form, and "Reset to Defaults" button
5. `door-defaults.ts` — Static `Record<string, DoorHardwareEntry[]>` mapping door system IDs to default sets; also exports `isDoorSystemType()` helper used by hook, view, and calc

### Critical Pitfalls

1. **`hardwareIds` collision** — Door hardware IDs stuffed into the existing `hardwareIds: string[]` field silently produce wrong costs because the existing calc multiplies by `lineItem.quantity` only, missing the per-item `qtyPerDoor` factor. Prevention: create a distinct `doorHardware: DoorHardwareEntry[]` field and `DoorHardwareItem` type. The TypeScript compiler enforces the separation.

2. **Schema migration overwrites user data** — The v1-to-v2 migration replaced settings wholesale; copying that pattern for v2-to-v3 destroys user-customized glass/frame prices. Prevention: the v2-to-v3 migration must add `settings.doorHardware` as a new property while leaving `settings.hardware` untouched, and must add `doorHardware: []` to all existing line items. Write a migration test using a v2 snapshot fixture.

3. **Door hardware cost double-counted or missing** — Adding `calcDoorHardwareCost()` result in the wrong place (inside `calcMaterialCost` signature AND as a separate addition in `calcFullLineItem`) double-counts; forgetting to wire it in at all produces silent zero cost. Prevention: add to `materialCost` in `calcFullLineItem()` exactly once; test that `lineTotal = materialCost + laborCost + equipmentCost` holds (C-033) and that `materialCost` increases when hardware is selected.

4. **Auto-populate overwrites manual edits** — Always replacing `doorHardware[]` with defaults on system type change destroys estimator customizations. Prevention: auto-populate only when `doorHardware` array is empty (first selection of a door type). Provide a "Reset to Defaults" button for explicit re-population. Never auto-overwrite a non-empty array.

5. **Per-item quantity math formula wrong** — The three-factor multiplication `unitCost * itemQty * lineQuantity` is easy to get wrong (forgetting `itemQty`, or rounding per-item rather than on the final sum). Prevention: write the test first (`3 hinges @ $15 * 2 doors = $90`), round once at the end of the sum, add assertion to `verify-calc.ts`.

## Implications for Roadmap

Based on research, the build order is dictated by hard technical dependencies. No phase can safely begin until the previous phase is complete and tested.

### Phase 1: Data Model and Migration

**Rationale:** Every other phase depends on types existing and the schema migration being correct. This must be done first, tested first, and locked before any calc or UI work begins. The two highest-risk pitfalls (hardwareIds collision, schema migration data loss) are both prevented here.

**Delivers:** TypeScript types (`DoorHardwareItem`, `DoorHardwareEntry`, `CustomDoorHardware`); extended `LineItem` and `AppSettings` interfaces; 12-item seed data file; default sets for 3 door types; `isDoorSystemType()` helper; v2-to-v3 schema migration with merge (not replace) behavior; `door-defaults.ts` config file.

**Features addressed:** Door hardware seed data, per-item quantity model foundation, default hardware sets data.

**Pitfalls avoided:** Pitfall 1 (hardwareIds collision), Pitfall 2 (schema migration data loss).

**Files changed:** `src/types/index.ts`, `src/data/seed-door-hardware.ts` (new), `src/data/door-defaults.ts` (new), `src/data/index.ts`, `src/storage/storage-service.ts`.

### Phase 2: Calculation Engine

**Rationale:** Calc must be correct and tested before any UI displays numbers. The calculation invariant C-033 must be verified to hold for door line items with hardware. This phase is pure functions and tests — no UI risk.

**Delivers:** `door-hardware-calc.ts` with `calcDoorHardwareCost()` pure function; updated `calcFullLineItem()` wiring; updated `verify-calc.ts` with door hardware assertions; unit tests covering the three-factor multiplication formula and edge cases (zero quantity, zero qtyPerDoor, decimal costs).

**Features addressed:** Hardware cost integrated into calc pipeline (C-033 preserved), hardware cost flows into materialCost.

**Pitfalls avoided:** Pitfall 3 (cost double-count or missing), Pitfall 5 (per-item quantity math wrong).

**Files changed:** `src/calc/door-hardware-calc.ts` (new), `src/calc/line-total-calc.ts`, `src/calc/index.ts`, `scripts/verify-calc.ts`.

### Phase 3: State Management

**Rationale:** Hook logic must be correct before UI can use it. The auto-populate behavior (when to fire, when to skip) is a behavioral decision that should be tested in isolation from the UI. The duplicate-carries-hardware requirement is also a hook concern.

**Delivers:** `use-door-hardware.ts` hook with full CRUD operations; `use-line-items.ts` updated to auto-populate defaults on door system type selection (empty array only); deep-copy behavior in `duplicateLineItem()` for `doorHardware` and `customDoorHardware` arrays.

**Features addressed:** Default hardware sets per door type (runtime behavior), add/remove from defaults, custom one-off hardware items, duplicate door copies hardware.

**Pitfalls avoided:** Pitfall 4 (auto-populate overwrites manual edits); integration gotcha (duplicate shared reference).

**Files changed:** `src/hooks/use-door-hardware.ts` (new), `src/hooks/use-line-items.ts`.

### Phase 4: UI Components

**Rationale:** UI is the last layer to build because it depends on all lower layers being correct. Building display first (read-only sub-row), then editing (editor panel), then wiring into TakeoffView reduces risk of UI-driven regressions into the calc or hook layers.

**Delivers:** `DoorHardwareSubRow.tsx` (compact display, React.memo, conditional on door system type); `DoorHardwareEditor.tsx` (checkboxes with qty spinners, custom item form, "Reset to Defaults" button); updated `TakeoffView.tsx` conditionally rendering sub-row for door-type line items.

**Features addressed:** Sub-row UI for door line items, add/remove items from defaults (UI), custom one-off hardware items (UI), hardware cost visible in detail panel, "Reset to Defaults" explicit recovery.

**Pitfalls avoided:** UX pitfall (door hardware shown on non-door items), UX pitfall (no reset capability), performance trap (rendering all checkboxes even when collapsed).

**Files changed:** `src/components/DoorHardwareSubRow.tsx` (new), `src/components/DoorHardwareEditor.tsx` (new), `src/views/TakeoffView.tsx`.

### Phase Ordering Rationale

- Types must precede everything: TypeScript strict mode with `noUncheckedIndexedAccess: true` means undefined field access crashes at compile time, so schema migration must initialize all fields before calc or UI can reference them.
- Calc precedes UI: the sub-row displays a hardware cost subtotal — that number must be correct before it appears in the UI.
- Hooks precede UI: the editor calls hook functions; the hook must exist and be tested before the editor can be implemented.
- The dependency chain is linear: Data Model -> Calc Engine -> State Hooks -> UI. No phase can be parallelized without risk.

### Research Flags

Phases with standard patterns (research not needed during planning):
- **Phase 1 (Data Model and Migration):** Established patterns in existing codebase. `seed-hardware.ts`, `storage-service.ts`, and `types/index.ts` all provide clear precedents. Migration merge vs. replace pattern is explicitly documented.
- **Phase 2 (Calc Engine):** Pure function pattern is well-established across 8 existing calc modules. TDD approach is already standard in the project. No novel algorithms.
- **Phase 3 (State Hooks):** Hook delegation pattern (`useDoorHardware` calls `useLineItems`) mirrors existing `use-ve-alternates` and `use-line-items` relationship. Auto-populate rule (empty array only) is clearly specified.
- **Phase 4 (UI Components):** Component structure follows existing `LineItemRow` expansion pattern. Tailwind CSS v4 is already in use throughout. No new UI patterns required.

No phases require deeper research. All patterns are directly observable in the existing codebase.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Brownfield — stack is locked, no new dependencies needed, all patterns are in the existing codebase |
| Features | MEDIUM | Feature list derived from competitor analysis (WinBidPro, BidUnity, On-Screen Takeoff) and industry standards; no direct user interviews. Core v1 scope is well-justified; v1.x features are educated guesses about demand. |
| Architecture | HIGH | Direct codebase analysis. All integration points are based on reading the actual source files, not inference. Data flow is fully traced through existing code. |
| Pitfalls | HIGH | Pitfalls 1-3 are based on direct analysis of the existing calc pipeline code and documented constraint violations. Pitfalls 4-5 are based on established patterns in the codebase (C-039 frame clearing behavior) and the per-item quantity formula logic. |

**Overall confidence:** HIGH

### Gaps to Address

- **Entrance System (sys-006) default hardware set:** The feature research mentions sys-006 (Entrance System) as needing a default hardware set, but ARCHITECTURE.md's `DOOR_HARDWARE_DEFAULTS` example only covers sys-007, sys-008, sys-009. The implementation must decide whether sys-006 is a door type and what its defaults are. Recommend treating it as a door type with a simplified default set (handle + lock + closer).

- **Hardware visible in detail panel vs. sub-row:** The research describes two UI locations — a sub-row below the line item AND cost visible in the expanded detail panel. The exact layout (how these two interact, which triggers which) needs UI design before implementation. The sub-row is display; the editor is in the expanded panel or a modal — the team should decide before Phase 4.

- **Hinge quantity suggestion timing:** The smart hinge-by-height feature is deferred to v1.x, but the Phase 1 default of 3 hinges for all Swing doors may frustrate estimators with 6'-8" interior doors (industry standard: 2 hinges). Consider whether to default to 2 (safer, less precise) or 3 (commercial standard, more opinionated). Research recommends 3 as ClearEstimate targets commercial glazing contractors.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/types/index.ts`, `src/calc/material-calc.ts`, `src/calc/line-total-calc.ts`, `src/hooks/use-line-items.ts`, `src/data/seed-hardware.ts`, `src/data/seed-systems.ts`, `src/storage/storage-service.ts`, `src/views/TakeoffView.tsx`
- `CONSTRAINTS.md` — C-002, C-016, C-033, C-039, B-005, B-007
- `CLAUDE.md` — project architecture, patterns, and known pitfalls
- `.planning/PROJECT.md` — door hardware feature requirements

### Secondary (MEDIUM confidence)
- [WinBidPro v16 Documentation](https://docs.winbidpro.com/docs/intro/) — assembly/catalog model and parts list
- [BidUnity](https://bidunity.com/) — system configuration and proposal generation
- [On Center Software / On-Screen Takeoff](https://www.oncenter.com/sub-contractor/doors-hardware/) — pre-built assemblies, door hardware counting
- [Construction Specifier: Door Hardware 101](https://www.constructionspecifier.com/door-hardware-101-the-basics-of-door-hardware-specifications/) — hinge quantities by door height, hardware set composition
- [Door Controls USA: Estimating for Contract Hardware](https://www.doorcontrolsusa.com/contract-hardware) — 5-10 hardware pieces per door opening
- [Park Avenue Locks: How to Estimate Door Hardware Costs](https://www.parkavenuelocks.com/blog/post/how-to-estimate-door-hardware-costs) — typical hardware package costs

### Tertiary (LOW confidence)
- [Ferguson: Commercial Door Hardware Guide](https://www.fergusonhome.com/commercial-door-hardware-guide/a24120) — hardware types and grading
- [Capital Build: Door/Frame/Hardware Schedule Guide](https://capitalbuildcon.com/door-frame-hardware-schedule-free-template/) — Div 08 schedule structure (used to confirm anti-feature exclusion)

---
*Research completed: 2026-03-02*
*Ready for roadmap: yes*
