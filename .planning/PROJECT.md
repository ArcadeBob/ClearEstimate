# ClearEstimate — Door Hardware Selection

## What This Is

An enhancement to ClearEstimate's Takeoff view that adds door-specific hardware selection with per-item quantities, auto-populated defaults, and a compact sub-row display when a door system type (Swing, Sliding, Revolving, Entrance) is chosen.

## Core Value

Estimators can accurately price door hardware per line item without bloating the takeoff layout — every door gets a complete, editable hardware breakdown that rolls into material cost.

## Requirements

### Validated

- ✓ Line item takeoff with system type, glass type, frame system, dimensions, quantity — existing
- ✓ Hardware checkbox selection with per-unit cost x line item quantity — existing (C-016)
- ✓ Material cost includes hardware cost — existing (C-002)
- ✓ Dual labor mode (area vs unit) for doors — existing (C-020)
- ✓ Calculation pipeline via calcFullLineItem() — existing
- ✓ localStorage persistence with debounce — existing
- ✓ 12 door hardware seed items with pricing — v1.0
- ✓ Per-item quantity on door hardware (hinges=3, closer=1) x door quantity — v1.0
- ✓ Auto-populate default hardware set on door type selection — v1.0
- ✓ Sub-row UI below door line items with compact hardware display — v1.0
- ✓ Door hardware cost rolls into materialCost (C-033) — v1.0
- ✓ Add/remove individual hardware items from defaults — v1.0
- ✓ Different default hardware sets per door type — v1.0
- ✓ Schema migration v2->v3 preserves user data — v1.0
- ✓ isDoorSystemType() utility for door type detection — v1.0
- ✓ Smart hinge count suggestion based on door height — v1.0
- ✓ Cost breakdown sub-lines for door hardware — v1.0
- ✓ Reset to Defaults button — v1.0

### Active

- [ ] Custom one-off hardware items (name + cost + qty) for unusual spec requirements
- [ ] Hardware set templates — save custom sets and apply to future doors
- [ ] Duplicate door line item copies hardware selections (deep copy)
- [ ] Door hardware cost summary line in project running totals
- [ ] Bulk hardware override across multiple door line items

### Out of Scope

- Replacing existing generic hardware system (setting blocks, glazing tape, etc.) — those remain for non-door line items
- Hardware supplier/vendor tracking — not needed for estimation
- Hardware spec sheets or catalog integration — manual entry is sufficient
- Manufacturer catalog integration — requires backend infrastructure
- Fire rating/code compliance validation — architect's responsibility
- Door handing (left/right swing) — affects installation, not estimation cost
- Automatic pricing updates from web — requires API infrastructure
- Full door schedule report (Div 08) — specification document, not estimation output

## Context

ClearEstimate is a glazing contractor estimation tool (React 19 + TypeScript 5 + Vite 6). Shipped v1.0 Door Hardware Selection with 5,344 LOC TypeScript across 49 modified files.

Tech stack: React 19, TypeScript 5 (strict), Vite 6, Tailwind CSS v4, React Router 7, localStorage persistence.

Test suite: 182 unit tests (Vitest), 46 verify-calc assertions, 0 TypeScript errors. Schema at v3 with sequential migration pattern.

Door hardware uses a per-item quantity model (`DoorHardwareEntry` with `hardwareId` + `quantity`) different from the existing flat hardware approach. Cost is computed in the orchestrator (`calcFullLineItem`) and added to `materialCost`, preserving the C-033 lineTotal invariant.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Sub-row UI for door hardware | Keep line items compact and printable | ✓ Good |
| Per-item quantity model | Doors need 3 hinges but 1 closer — flat count doesn't work | ✓ Good |
| Pre-filled defaults per door type | Saves estimator time — most doors need the same set | ✓ Good |
| Door hardware rolls into materialCost | Consistent with existing hardware cost treatment (C-002, C-033) | ✓ Good |
| isDoorSystemType as Phase 1 data utility | Needed by all subsequent phases, not just calc | ✓ Good |
| Hook behavior (Phase 3) separate from visual UI (Phase 4) | Clean separation of state logic and presentation | ✓ Good |
| Door hardware cost in orchestrator, not calcMaterialCost | Preserves separation of concerns | ✓ Good |
| Pure function extraction for auto-populate | Enables unit testing without React rendering | ✓ Good |
| Direct file imports to avoid circular barrel deps | door-hardware-helpers.ts imports directly from source files | ✓ Good |
| Components inline in TakeoffView.tsx | DoorHardwareSubRow and DoorHardwarePanel are small and tightly coupled to view | ✓ Good |
| Phase 5 inserted for integration gap closure | Audit found barrel export and migration completeness gaps before Phase 3 | ✓ Good |

## Constraints

- **Existing calc pipeline**: Door hardware cost flows through `calcFullLineItem()` and rolls into `materialCost` (C-033)
- **Type safety**: TypeScript strict mode with `noUncheckedIndexedAccess` — all types fully typed
- **Seed data pattern**: Follows existing pattern in `src/data/` for door hardware seed data
- **Schema migration**: v2->v3 additive migration, sequential version bump pattern
- **UI framework**: Tailwind CSS v4 (CSS-first), no component library — matches existing Takeoff styling

---
*Last updated: 2026-03-04 after v1.0 milestone*
