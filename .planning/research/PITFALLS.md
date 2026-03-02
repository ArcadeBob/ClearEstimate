# Pitfalls Research

**Domain:** Door hardware selection for glazing estimation SPA (ClearEstimate)
**Researched:** 2026-03-02
**Confidence:** HIGH (based on direct codebase analysis + domain research)

## Critical Pitfalls

### Pitfall 1: Two Hardware Models on One Field — `hardwareIds` Collision

**What goes wrong:**
The existing `LineItem.hardwareIds: string[]` stores references to glazing consumables (setting blocks, glazing tape, corner keys) using a flat 1:1 model where `unitCost * lineItem.quantity` produces the cost. Door hardware requires a per-item quantity model (3 hinges per door, 1 closer per door). If door hardware IDs are stuffed into the same `hardwareIds` array, the calc engine cannot distinguish "1 setting block per unit" from "3 hinges per unit" — it will multiply all hardware by `lineItem.quantity` with no per-item multiplier.

**Why it happens:**
It is tempting to reuse the existing `hardwareIds` field and the existing `Hardware` type (which already has `id`, `name`, `unitCost`) rather than creating a separate data structure. The existing hardware calc path in `material-calc.ts` line 22 (`hw.unitCost * quantity`) works for glazing consumables but silently produces wrong numbers for door hardware with per-item quantities.

**How to avoid:**
Create a separate `doorHardware` field on `LineItem` with a different shape, such as `doorHardwareSelections: Array<{ doorHardwareId: string, qtyPerDoor: number }>`. Keep `hardwareIds` for glazing consumables untouched. Add a separate `DoorHardware` type in `src/types/index.ts` distinct from the existing `Hardware` type. The `calcMaterialCost` function receives both hardware sets independently.

**Warning signs:**
- Unit tests for 3-hinge doors produce cost of 1 hinge instead of 3
- Existing glazing hardware line items (setting blocks, etc.) suddenly get per-item quantity fields they should not have
- The `Hardware` interface gains fields that only make sense for doors (e.g., `qtyPerDoor`)

**Phase to address:**
Type system and data model phase (first phase) — the data shape must be decided before any calc, UI, or migration work begins.

---

### Pitfall 2: Schema Migration Destroys Existing User Data

**What goes wrong:**
Adding new fields to `LineItem` (e.g., `doorHardwareSelections`) requires a schema version bump in `storage-service.ts`. The existing v1-to-v2 migration (`migrateState`) replaces all settings wholesale and adds fields to line items. A naive v2-to-v3 migration could follow the same "replace everything" pattern, which would overwrite user-customized settings (they may have edited hardware prices, added custom glass types) or fail to initialize new fields on existing line items, causing runtime `undefined` access errors under `noUncheckedIndexedAccess`.

**Why it happens:**
The v1-to-v2 migration set the precedent of full settings replacement (`settings: defaults.settings`). Developers copy this pattern for v2-to-v3 without realizing that users now have meaningful customized data. Additionally, the schema migration function only runs on `loadAppState()` — if a migration bug corrupts the state, the corrupted JSON persists to localStorage and the app falls back to `createDefaultAppState()`, erasing all projects.

**How to avoid:**
1. The v2-to-v3 migration must merge new seed data (door hardware items) into existing settings, not replace them. Use `settings.doorHardware = [...SEED_DOOR_HARDWARE]` as a new property while preserving `settings.hardware` as-is.
2. Add `doorHardwareSelections: []` to every existing `LineItem` during migration (empty array is the safe default — no hardware selected).
3. Write a migration test that loads a v2 state snapshot with customized settings and verifies they survive the v2-to-v3 migration.
4. Keep the `try/catch` fallback to `createDefaultAppState()` but add console.error logging so migration failures are diagnosable.

**Warning signs:**
- Existing projects lose custom glass/frame prices after app update
- Line items render with "undefined" or crash when accessing `doorHardwareSelections` on old data
- The schema version increments but no migration function handles the gap

**Phase to address:**
Data model and migration phase — must be implemented and tested before any UI or calc changes depend on the new fields.

---

### Pitfall 3: Door Hardware Cost Double-Counted or Missing from Material Total

**What goes wrong:**
Door hardware cost could either (a) get added inside `calcMaterialCost` AND separately in `calcFullLineItem`, double-counting it, or (b) be computed in a new function but never wired into the `materialCost` field that feeds into `lineTotal`. The existing calc pipeline is tightly orchestrated in `calcFullLineItem()` (line-total-calc.ts) — any new cost component must flow through exactly one path.

**Why it happens:**
The calc engine is split across 8 modules. `calcMaterialCost()` already includes `hardwareCost` for glazing consumables. A developer might add door hardware cost inside `calcMaterialCost`, not realizing that the function signature will need to change (it currently takes `selectedHardware: Hardware[]` — a different type than door hardware selections). Alternatively, they might add a separate `calcDoorHardwareCost()` but forget to add its result to `materialCost` in `calcFullLineItem`.

**How to avoid:**
1. Add a new pure function `calcDoorHardwareCost(selections, doorHardwareSeed, lineQuantity)` in `material-calc.ts`.
2. In `calcFullLineItem()`, compute `doorHardwareCost` and add it to `materialCost` before computing `lineTotal`. The formula becomes: `materialCost = glassCost + frameCost + glazingHardwareCost + doorHardwareCost`.
3. Add a test assertion that `lineTotal = materialCost + laborCost + equipmentCost` still holds (constraint C-033), and that `materialCost` includes door hardware cost.
4. Update the verify-calc script to cover a door line item with hardware.

**Warning signs:**
- A door with $500 in hardware shows the same `lineTotal` as one with no hardware
- Running totals `materialTotal` does not increase when door hardware is checked on
- The `lineTotal = materialCost + laborCost + equipmentCost` invariant (C-033) breaks because door hardware cost is added to `lineTotal` but not to `materialCost`

**Phase to address:**
Calculation engine phase — after the data model is settled, before UI work begins.

---

### Pitfall 4: Auto-Populate Defaults Overwrite Manual Edits on System Type Change

**What goes wrong:**
When an estimator selects "Swing Door" as the system type, the app should auto-populate default door hardware (hinges + closer + handle + lock + threshold + weatherstrip). But if the estimator manually edits hardware, then changes the system type from "Swing Door" to "Sliding Door" and back to "Swing Door", the auto-populate fires again and wipes their manual edits. Similarly, changing from one door type to another should replace defaults, but if the estimator has already customized the set, an aggressive auto-populate destroys their work.

**Why it happens:**
The existing codebase already has this pattern with frames: `C-039` clears incompatible frame selection on system type change. Developers naturally extend this pattern to "clear and re-populate hardware defaults on system type change." But frames are a single selection (one dropdown), while hardware is a multi-item set with per-item quantities that the user invests time customizing.

**How to avoid:**
1. Only auto-populate door hardware defaults when `doorHardwareSelections` is empty (i.e., first time selecting a door system type). If the array already has entries, do not overwrite.
2. When changing between door types (e.g., Swing to Sliding), prompt the user or leave existing selections alone. The estimator can manually clear and re-add.
3. Store a `doorHardwareAutoPopulated: boolean` flag (or use array length) to distinguish "never populated" from "user cleared everything."
4. Add a "Reset to Defaults" button in the door hardware sub-row UI so users can explicitly request re-population.

**Warning signs:**
- Estimator complains that their hardware selections keep resetting
- Test: select Swing, customize hardware, change to Sliding, change back to Swing — hardware reverts to defaults instead of preserving edits
- No way for users to get defaults back after clearing them

**Phase to address:**
Hook/state management phase — the `useLineItems` `updateLineItem` logic must handle this before the UI is built.

---

### Pitfall 5: Per-Item Quantity Math Produces Wrong Totals

**What goes wrong:**
Door hardware cost must be `sum(item.unitCost * item.qtyPerDoor * lineItem.quantity)` for each selected item. Missing any multiplier produces silently wrong costs: forgetting `lineItem.quantity` means 3 doors get priced as 1 door's hardware; forgetting `qtyPerDoor` means 3 hinges get priced as 1. The rounding convention (C-042: round monetary values only) must also be applied correctly — rounding per-item before summing vs. rounding the sum produces different results.

**Why it happens:**
Three-factor multiplication is easy to get wrong, especially since the existing hardware calc uses only two factors (`unitCost * quantity`). Developers may copy the existing pattern and miss the `qtyPerDoor` multiplier. Or they may round each item cost individually (accumulating rounding errors across 12 hardware items) rather than rounding the final sum.

**How to avoid:**
1. Write the test first: `3 hinges @ $15 each * 2 doors = $90 total hardware cost`. Make the test red before writing the function.
2. The formula in the pure function: `totalDoorHardwareCost = round2(sum(sel.unitCost * sel.qtyPerDoor * lineQuantity))` — round once at the end, not per-item.
3. Add this scenario to the verify-calc script as a new assertion.
4. Test edge cases: zero quantity doors (should be $0), zero qtyPerDoor items (should be $0), decimal unitCost values.

**Warning signs:**
- Door hardware cost for qty=2 is exactly the same as qty=1
- Door hardware cost for 3 hinges equals cost for 1 hinge
- Penny discrepancies between door hardware cost and expected value (rounding at wrong level)

**Phase to address:**
Calculation engine phase — test-driven development with red-green-refactor.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Reuse `hardwareIds` for door hardware instead of separate field | No type changes, no migration | Cannot support per-item quantities; calc logic becomes conditional on "is this a door hardware ID?"; fragile lookups | Never — the quantity model is fundamentally different |
| Skip schema migration, require users to reset localStorage | No migration code needed | All existing project data lost on update; users lose hours of estimation work | Never for shipped product; acceptable only during early dev with no real users |
| Hard-code default hardware sets in the `useLineItems` hook | Quick to implement, no new data file | Default sets cannot be customized in Settings; changing defaults requires code changes | Only for first iteration if Settings UI for door hardware defaults is deferred |
| Store door hardware seed data in the same `settings.hardware[]` array with a `category` flag | One array to manage, simple lookup | Every hardware lookup must filter by category; existing code that iterates `settings.hardware` (Takeoff view, calc engine) must be audited; accidental display of door hardware in non-door line items | Never — two semantically different item types should be separate arrays |
| Skip custom hardware items (name + cost), only allow seed data selection | Simpler UI and data model | Estimators cannot add unusual spec items (magnetic locks, access control panels, specialty thresholds); they must edit seed data in Settings or work around by adjusting costs elsewhere | Acceptable for first iteration if clearly documented as known limitation with follow-up ticket |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `calcFullLineItem()` orchestrator | Adding door hardware cost after `lineTotal` is computed, so it does not flow into `lineTotal` | Add door hardware cost into `materialCost` before `lineTotal = materialCost + laborCost + equipmentCost` |
| `calcRunningTotals()` in summary-calc | Creating a separate "Door Hardware" subtotal line that does not exist in the current `RunningTotals` interface | Door hardware cost is already inside `materialCost` per line item, so `materialTotal` in running totals automatically includes it — no changes to `summary-calc.ts` needed |
| `useLineItems.duplicateLineItem()` | Cloning `doorHardwareSelections` by reference instead of deep copy | Ensure `doorHardwareSelections` is cloned as a new array with new objects (spread each selection object) |
| `validateLineItem()` | Not validating `qtyPerDoor > 0` for each door hardware selection, allowing zero-quantity items that confuse estimators | Add validation: every entry in `doorHardwareSelections` must have `qtyPerDoor >= 1` |
| VE Alternate cascade (C-015) | Forgetting that door hardware cost changes should trigger VE `originalCost` updates | Already handled — VE cascade uses `linkedItem.lineTotal`, and door hardware cost flows through `materialCost` into `lineTotal`. No additional cascade code needed as long as the calc pipeline is correct. |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Rendering all door hardware checkboxes for every line item even when collapsed | Sluggish UI with 20+ line items, each rendering 12 door hardware checkboxes | Only render door hardware sub-row when the line item is expanded AND is a door system type; use the existing `isExpanded` pattern | 15+ door line items on a single project |
| Recalculating all line items when door hardware seed data changes in Settings | Multi-second freeze when editing a door hardware unit cost in Settings | The existing `recalculateAll()` in `useLineItems` already handles this; ensure door hardware seed data changes trigger recalc only for projects with door line items | Not a real concern at localStorage scale — but avoid O(n*m) lookups in seed data |
| Storing full door hardware objects on each LineItem instead of ID references | localStorage bloat — 12 hardware items * 20 line items * full object = significant JSON size | Store only `{ doorHardwareId: string, qtyPerDoor: number }` on LineItem; resolve to full objects at render/calc time via seed data lookup | 50+ line items with hardware (unlikely to hit localStorage 5MB limit, but wasteful) |

## Security Mistakes

Not applicable for this milestone. ClearEstimate Phase 1 is a single-user localStorage SPA with no authentication, no network requests, and no shared state. Door hardware data is local-only reference pricing with no security implications.

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing door hardware section for non-door line items (Curtain Wall, Storefront, etc.) | Estimators confused by irrelevant options; accidentally add door hardware to a window system | Conditionally render door hardware sub-row only when `systemType.id` is `sys-007`, `sys-008`, or `sys-009` (the three door types); use a `isDoorSystem(systemTypeId)` helper |
| No visual distinction between glazing hardware and door hardware | Estimator selects glazing tape for a door, or adds a door closer to a curtain wall | Glazing hardware stays in the existing expanded panel section; door hardware appears in its own sub-row below the line item. The two sections should never show simultaneously (doors get door hardware only, non-doors get glazing hardware only) |
| Auto-populated defaults with no "undo" or "reset" capability | Estimator accidentally clears all hardware, cannot restore defaults without remembering what was pre-filled | Provide a "Reset to Defaults" button next to the door hardware section. Also display which items were auto-populated vs. manually added (subtle styling difference or "(default)" label) |
| Custom hardware items (one-offs) with no way to reuse them across line items | Estimator adds "Magnetic Lock $350" to one door, must re-type it for every other door | For v1, accept this limitation but consider: (a) duplicating a line item carries its custom hardware, (b) a "copy hardware from..." dropdown could be added later |
| Per-item quantity defaults that do not match door height | A 7'-0" commercial door needs 3 hinges but the default is 2; estimator does not notice the under-count | Default to 3 hinges (industry standard for commercial doors, which is ClearEstimate's target market). Include a note or tooltip: "Standard: 3 hinges for doors up to 7'-6\". Add 1 hinge per additional 30\" of height." |

## "Looks Done But Isn't" Checklist

- [ ] **Door hardware cost in material cost:** Verify that `lineItem.materialCost` increases when door hardware is selected — not just `lineTotal`. Check running totals sidebar reflects the change under "Materials."
- [ ] **Duplicate line item preserves door hardware:** Duplicate a door with 3 hinges and a custom closer. Verify the clone has its own independent copy, not a shared reference.
- [ ] **Schema migration on old data:** Load a v2 localStorage snapshot (pre-door-hardware). Verify the app does not crash and line items gain empty `doorHardwareSelections: []`.
- [ ] **System type change from door to non-door:** Select Swing Door, add hardware, then change system type to Curtain Wall. Verify door hardware sub-row disappears and door hardware cost is removed from material cost (selections should clear or be ignored in calc).
- [ ] **System type change from non-door to door:** Select Storefront (no door hardware), then change to Swing Door. Verify defaults auto-populate.
- [ ] **Custom hardware item persistence:** Add a custom one-off item, save, reload the page. Verify it survives localStorage round-trip.
- [ ] **Zero-quantity edge case:** Set door quantity to 0 or line item quantity to 0. Verify door hardware cost is $0, not NaN or negative.
- [ ] **VE alternate updates:** Add VE alternate linked to a door line item. Change door hardware. Verify VE `originalCost` updates to reflect new `lineTotal`.
- [ ] **Verify-calc script coverage:** Run `npm run verify` and confirm at least one assertion covers a door line item with hardware.
- [ ] **Print layout:** Expand a door line item with hardware sub-row. Verify the layout does not break page width or overflow in browser print preview.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| `hardwareIds` reused for door hardware (wrong data model) | HIGH | Requires new type, new field, migration of any data saved with the wrong model, rewrite of calc function, and UI changes. The longer this persists, the more data is saved in the wrong shape. |
| Schema migration drops user settings | MEDIUM | Add a "backup before migrate" step: `localStorage.setItem('cgi_backup_v2', raw)` before migration. If migration fails, users can manually restore. Recovery code can be added post-hoc. |
| Door hardware cost missing from lineTotal | LOW | Fix the calc pipeline wiring in `calcFullLineItem()`. All stored data is just `doorHardwareSelections` (IDs + quantities) — cost is recomputed on every load. Fix the function and all line items auto-correct. |
| Auto-populate overwrites user edits | MEDIUM | No data loss if defaults were re-applied — but user's manual work is gone. Add the guard condition (only populate when empty) and apologize. No migration needed since the auto-populate is a runtime behavior, not persisted logic. |
| Per-item quantity formula wrong (missing multiplier) | LOW | Fix the pure function. Since cost is computed (not stored), fixing the function and triggering `recalculateAll()` corrects all line items instantly. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| `hardwareIds` collision (Pitfall 1) | Phase 1: Data Model & Types | TypeScript compiler rejects mixed usage; `DoorHardware` and `Hardware` are distinct types with no overlap in field names |
| Schema migration data loss (Pitfall 2) | Phase 1: Data Model & Types | Migration test: load v2 snapshot, migrate to v3, assert user settings preserved and new fields initialized |
| Cost double-count or missing (Pitfall 3) | Phase 2: Calc Engine | Test assertion: `lineTotal === materialCost + laborCost + equipmentCost` for a door line item with hardware; verify `materialCost` includes door hardware |
| Auto-populate overwrites edits (Pitfall 4) | Phase 3: Hooks & State Logic | Test: select door type, customize hardware, change away and back, assert customizations preserved |
| Per-item quantity math wrong (Pitfall 5) | Phase 2: Calc Engine | Test: 3 hinges @ $15/ea * 2 doors = $90; verify with `npm run verify` |
| Door hardware shown on non-door items (UX) | Phase 4: UI Components | Visual check: select Curtain Wall, verify no door hardware section appears |
| No reset-to-defaults button (UX) | Phase 4: UI Components | Manual test: clear all door hardware, click reset, verify defaults restored |
| Duplicate line item shared reference (Integration) | Phase 3: Hooks & State Logic | Test: duplicate door, modify clone's hardware, assert original unchanged |

## Sources

- Direct codebase analysis: `src/types/index.ts`, `src/calc/material-calc.ts`, `src/calc/line-total-calc.ts`, `src/storage/storage-service.ts`, `src/hooks/use-line-items.ts`, `src/data/seed-hardware.ts`, `src/data/seed-systems.ts`, `src/views/TakeoffView.tsx`
- ClearEstimate project context: `.planning/PROJECT.md`, `.planning/codebase/ARCHITECTURE.md`, `CONSTRAINTS.md`
- [Hinge quantity standards by door height (SOSS)](https://www.soss.com/wp-content/uploads/2019/07/Hinge-Sizing-Chart-2018.pdf)
- [Door hardware cost estimation guide (Park Avenue Locks)](https://www.parkavenuelocks.com/blog/post/how-to-estimate-door-hardware-costs)
- [Schema migration for JavaScript objects (DEV Community)](https://dev.to/nas5w/an-approach-to-javascript-object-schema-migration-1a94)
- [Glass estimation software landscape (Glass Magazine)](https://www.glassmagazine.com/sites/default/files/2012/EstimatingChart_V2.pdf)

---
*Pitfalls research for: Door hardware selection in ClearEstimate glazing estimation SPA*
*Researched: 2026-03-02*
