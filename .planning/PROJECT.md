# ClearEstimate — Door Hardware Selection

## What This Is

An enhancement to ClearEstimate's Takeoff view that adds door-specific hardware selection when a door system type (Swing, Sliding, Revolving) is chosen. When an estimator selects a door, a compact sub-row appears below the main line item showing hardware items like closers, hinges, handles, and locks — keeping the layout printable while capturing the full door spec.

## Core Value

Estimators can accurately price door hardware per line item without bloating the takeoff layout — every door gets a complete, editable hardware breakdown that rolls into material cost.

## Requirements

### Validated

- ✓ Line item takeoff with system type, glass type, frame system, dimensions, quantity — existing
- ✓ Hardware checkbox selection with per-unit cost × line item quantity — existing (C-016)
- ✓ Material cost includes hardware cost — existing (C-002)
- ✓ Dual labor mode (area vs unit) for doors — existing (C-020)
- ✓ Calculation pipeline via calcFullLineItem() — existing
- ✓ localStorage persistence with debounce — existing

### Active

- [ ] Door hardware seed data (12 items: hinges, closer, handle/pull, lock/cylinder, panic device, pivots, threshold, weatherstrip, sweep, auto-operator, card reader, exit device)
- [ ] Per-item quantity on door hardware (e.g., hinges=3, closer=1) multiplied by door quantity
- [ ] Auto-populate default hardware set when door system type selected (Swing: hinges + closer + handle + lock + threshold + weatherstrip)
- [ ] Sub-row UI below door line items showing selected hardware in compact format
- [ ] Door hardware cost rolls into material cost (consistent with existing hardware calc)
- [ ] Estimators can add/remove items from pre-filled defaults
- [ ] Estimators can add custom one-off hardware items (name + cost)
- [ ] Different default hardware sets per door type (Swing vs Sliding vs Revolving)

### Out of Scope

- Replacing existing generic hardware system (setting blocks, glazing tape, etc.) — those remain for non-door line items
- Hardware supplier/vendor tracking — not needed for estimation
- Hardware spec sheets or catalog integration — manual entry is sufficient for v1
- Print/PDF layout changes — sub-row is already designed for printability

## Context

ClearEstimate is a glazing contractor estimation tool. The existing Takeoff view lets estimators build line items for glass/aluminum systems. Three door system types exist (sys-007 Revolving, sys-008 Sliding, sys-009 Swing) using unit-based labor mode. Generic hardware (8 items like setting blocks, corner keys) already exists but covers glazing consumables — not door-specific items like closers, hinges, or panic devices.

The existing hardware system uses `hardwareIds: string[]` on LineItem with a flat cost calc: `Σ(unitCost × lineItem.quantity)`. Door hardware needs per-item quantities (e.g., 3 hinges per door × 2 doors = 6 hinges), which is a different model than the existing 1:1 hardware approach.

The sub-row pattern is driven by print layout constraints — a single line item row can't fit both system/glass details AND a full hardware breakdown without breaking page layout.

## Constraints

- **Existing calc pipeline**: Door hardware cost must flow through `calcFullLineItem()` and roll into `materialCost` (C-033)
- **Type safety**: TypeScript strict mode with `noUncheckedIndexedAccess` — all new types must be fully typed
- **Seed data pattern**: Follow existing pattern in `src/data/` for door hardware seed data
- **Schema migration**: Adding new fields to LineItem requires a schema version bump in storage-service
- **UI framework**: Tailwind CSS v4 (CSS-first), no component library — match existing Takeoff styling

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Sub-row UI for door hardware | Keep line items compact and printable — hardware detail on a second row | — Pending |
| Per-item quantity model | Doors need 3 hinges but 1 closer — flat count doesn't work | — Pending |
| Pre-filled defaults per door type | Saves estimator time — most doors need the same set | — Pending |
| Custom one-off hardware items | Covers unusual spec requirements without bloating seed data | — Pending |
| Door hardware rolls into material cost | Consistent with existing hardware cost treatment (C-002) | — Pending |

---
*Last updated: 2026-03-02 after initialization*
