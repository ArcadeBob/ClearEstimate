# Architecture Research

**Domain:** Door hardware selection for glazing estimation SPA
**Researched:** 2026-03-02
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
EXISTING (unchanged)                         NEW (door hardware additions)
===========================                  ===========================

Presentation Layer                           Presentation Layer
┌──────────────┐                             ┌───────────────────────┐
│ TakeoffView  │                             │ DoorHardwareSubRow    │
│ LineItemRow  │──renders below door items──>│  (compact sub-row)    │
│  (expanded)  │                             │ DoorHardwareEditor    │
│  Hardware[]  │                             │  (add/remove/custom)  │
└──────┬───────┘                             └───────────┬───────────┘
       │ calls                                           │ calls
State Layer                                  State Layer
┌──────────────┐                             ┌───────────────────────┐
│ useLineItems │                             │ useDoorHardware       │
│  updateItem  │<───delegates persistence───>│  (add/remove/toggle   │
│  addItem     │                             │   custom items, auto- │
└──────┬───────┘                             │   populate defaults)  │
       │ calls                               └───────────┬───────────┘
Calc Layer                                               │ calls
┌──────────────┐                             ┌───────────────────────┐
│ line-total-  │──calls──>                   │ door-hardware-calc.ts │
│  calc.ts     │                             │  calcDoorHardwareCost │
│ material-    │<──returns number──           │  getDoorDefaults      │
│  calc.ts     │                             └───────────────────────┘
└──────┬───────┘
       │ reads
Data Layer
┌──────────────────────────────────────────────────────────┐
│ types/index.ts  ← DoorHardwareItem, DoorHardwareEntry   │
│ data/seed-door-hardware.ts  ← 12 door hardware items    │
│ data/door-defaults.ts  ← default sets per door type     │
│ storage-service.ts  ← schema v2→v3 migration            │
└──────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| `DoorHardwareSubRow` | Renders compact hardware summary below door line items; shows item names, quantities, and subtotal | `LineItemRow` (parent), `useDoorHardware` (state) |
| `DoorHardwareEditor` | Full editing UI for door hardware: toggle items, adjust per-item qty, add custom items | `DoorHardwareSubRow` (parent), `useDoorHardware` (state) |
| `useDoorHardware` hook | CRUD for door hardware entries on a line item; auto-populate defaults on system type change; custom item management | `useLineItems` (delegates state writes), `door-hardware-calc` (cost computation) |
| `door-hardware-calc.ts` | Pure function: `calcDoorHardwareCost(entries, doorQty)` returns total door hardware cost | Called by `calcFullLineItem` via `material-calc` |
| `seed-door-hardware.ts` | 12 door hardware items with id, name, unitCost, defaultQtyPerDoor | Read by `useDoorHardware` for catalog |
| `door-defaults.ts` | Maps door system type IDs to default hardware item sets | Read by `useDoorHardware` on system type selection |

## Recommended Project Structure

```
src/
├── types/
│   └── index.ts               # ADD: DoorHardwareItem, DoorHardwareEntry
├── data/
│   ├── seed-hardware.ts        # UNCHANGED: existing glazing hardware (8 items)
│   ├── seed-door-hardware.ts   # NEW: 12 door-specific hardware items
│   ├── door-defaults.ts        # NEW: default hardware sets per door type
│   └── index.ts                # ADD: exports for new seed data
├── calc/
│   ├── material-calc.ts        # MODIFY: accept door hardware cost
│   ├── door-hardware-calc.ts   # NEW: calcDoorHardwareCost()
│   ├── line-total-calc.ts      # MODIFY: pass door hardware into material calc
│   └── index.ts                # ADD: export door-hardware-calc
├── hooks/
│   ├── use-line-items.ts       # MODIFY: auto-populate defaults on door system select
│   └── use-door-hardware.ts    # NEW: door hardware CRUD operations
├── components/
│   ├── DoorHardwareSubRow.tsx   # NEW: compact sub-row display
│   └── DoorHardwareEditor.tsx   # NEW: editing modal/panel
├── views/
│   └── TakeoffView.tsx          # MODIFY: render sub-row below door line items
└── storage/
    └── storage-service.ts       # MODIFY: v2→v3 migration
```

### Structure Rationale

- **`seed-door-hardware.ts` separate from `seed-hardware.ts`:** The existing 8 glazing hardware items (setting blocks, glazing tape, etc.) serve non-door line items. Door hardware is a fundamentally different catalog. Keeping them separate avoids polluting the existing hardware checklist for curtain wall, storefront, etc.
- **`door-defaults.ts` as its own file:** Default-set mappings are configuration, not calculation. Separating from calc keeps the calc module pure and the defaults easy to edit.
- **`use-door-hardware.ts` separate from `use-line-items.ts`:** Door hardware operations (toggle item, adjust per-item qty, add custom) are complex enough to warrant their own hook. The hook delegates state persistence through the existing `useLineItems.updateLineItem()` pattern.

## Architectural Patterns

### Pattern 1: Per-Item Quantity on Door Hardware

**What:** Each door hardware entry stores `itemQty` (e.g., 3 hinges per door). Total cost = `unitCost * itemQty * lineItem.quantity`.

**When to use:** Always for door hardware. This replaces the existing flat `hardwareIds: string[]` model (C-016) which assumes qty=1 per item per door.

**Trade-offs:** Adds complexity to the data model (array of objects vs. array of strings), but accurately models reality where a single door needs 3 hinges, 1 closer, 1 handle.

**Example:**
```typescript
// New type on LineItem
interface DoorHardwareEntry {
  doorHardwareId: string  // FK to DoorHardwareItem catalog
  itemQty: number         // e.g., 3 for hinges
}

// Custom one-off items (no catalog reference)
interface CustomDoorHardware {
  id: string              // generated UUID
  name: string
  unitCost: number
  itemQty: number
}

// On LineItem — new fields
interface LineItem {
  // ...existing fields...
  doorHardware: DoorHardwareEntry[]
  customDoorHardware: CustomDoorHardware[]
}

// Calculation
function calcDoorHardwareCost(
  entries: DoorHardwareEntry[],
  customItems: CustomDoorHardware[],
  catalog: DoorHardwareItem[],
  doorQuantity: number,
): number {
  const catalogCost = entries.reduce((sum, e) => {
    const item = catalog.find(c => c.id === e.doorHardwareId)
    if (!item) return sum
    return sum + item.unitCost * e.itemQty * doorQuantity
  }, 0)
  const customCost = customItems.reduce((sum, c) => {
    return sum + c.unitCost * c.itemQty * doorQuantity
  }, 0)
  return Math.round((catalogCost + customCost) * 100) / 100
}
```

### Pattern 2: Auto-Populate Defaults on System Type Change

**What:** When estimator selects a door system type (sys-007, sys-008, sys-009), the hook auto-populates `doorHardware[]` with the default set for that door type. Estimator can then add/remove items.

**When to use:** On system type change when the new type is a door type AND `doorHardware` is empty (first selection) or the system type category changed (e.g., Swing to Sliding).

**Trade-offs:** Auto-populate saves time (most doors need the same items), but must not overwrite manual edits if the estimator has already customized the set. The rule: only auto-populate when switching to a door type from a non-door type, or when doorHardware is empty.

**Example:**
```typescript
// door-defaults.ts
const DOOR_HARDWARE_DEFAULTS: Record<string, { doorHardwareId: string; itemQty: number }[]> = {
  'sys-009': [ // Swing Door
    { doorHardwareId: 'dhw-001', itemQty: 3 },  // Hinges (3 per door)
    { doorHardwareId: 'dhw-002', itemQty: 1 },  // Closer
    { doorHardwareId: 'dhw-003', itemQty: 1 },  // Handle/Pull
    { doorHardwareId: 'dhw-004', itemQty: 1 },  // Lock/Cylinder
    { doorHardwareId: 'dhw-007', itemQty: 1 },  // Threshold
    { doorHardwareId: 'dhw-008', itemQty: 1 },  // Weatherstrip
  ],
  'sys-008': [ // Sliding Door
    { doorHardwareId: 'dhw-003', itemQty: 1 },  // Handle/Pull
    { doorHardwareId: 'dhw-004', itemQty: 1 },  // Lock/Cylinder
    { doorHardwareId: 'dhw-007', itemQty: 1 },  // Threshold
    { doorHardwareId: 'dhw-010', itemQty: 1 },  // Auto-Operator
  ],
  'sys-007': [ // Revolving Door
    { doorHardwareId: 'dhw-006', itemQty: 4 },  // Pivots
    { doorHardwareId: 'dhw-009', itemQty: 1 },  // Sweep
    { doorHardwareId: 'dhw-010', itemQty: 1 },  // Auto-Operator
    { doorHardwareId: 'dhw-011', itemQty: 1 },  // Card Reader
  ],
}
```

### Pattern 3: Sub-Row Rendering for Print Layout

**What:** Door hardware appears as a visually distinct sub-row below the main line item row, not inside the expanded detail panel. This keeps the compact/collapsed line item row clean while showing hardware at a glance.

**When to use:** Only for line items whose `systemTypeId` is a door type (sys-007, sys-008, sys-009) AND the line item has door hardware entries.

**Trade-offs:** Requires the `LineItemRow` component to conditionally render a child row. The sub-row must be styled to clearly belong to the parent line item (indentation, lighter background) without breaking the list layout or print margins.

## Data Flow

### Door Hardware Calculation Flow

```
User selects "Swing Door" system type
    |
    v
useLineItems.updateLineItem({ systemTypeId: 'sys-009' })
    |
    ├──> Is door type? YES
    |    |
    |    v
    |    doorHardware is empty?
    |    |
    |    ├──> YES: auto-populate from DOOR_HARDWARE_DEFAULTS['sys-009']
    |    └──> NO: keep existing (user already customized)
    |
    v
calcFullLineItem() orchestrator
    |
    ├──> calcMaterialCost(sqft, perimeter, glass, frame, genericHardware, quantity)
    |        returns glassCost + frameCost + genericHardwareCost
    |
    ├──> calcDoorHardwareCost(doorHardware, customDoorHardware, catalog, quantity)
    |        returns doorHardwareCost
    |
    ├──> materialCost = glassCost + frameCost + genericHardwareCost + doorHardwareCost
    |
    ├──> calcLaborCost(manHours, loadedRate)
    ├──> calcEquipmentCost(equipment, crewDays)
    |
    v
lineTotal = materialCost + laborCost + equipmentCost  (C-033 preserved)
```

### State Management for Door Hardware

```
User toggles hinge checkbox in DoorHardwareEditor
    |
    v
useDoorHardware.toggleItem('dhw-001')
    |
    ├──> Compute updated doorHardware[] array
    |
    v
useLineItems.updateLineItem(itemId, { doorHardware: updatedArray })
    |
    v
Hook calls calcFullLineItem() (includes door hardware cost)
    |
    v
AppStoreProvider debounce → localStorage (500ms)
```

### Key Data Flows

1. **System type selection (door):** User picks door type -> hook checks if door type -> auto-populates defaults -> recalculates material cost with door hardware -> persists to localStorage.

2. **Hardware editing:** User toggles/edits items in DoorHardwareEditor -> `useDoorHardware` builds updated `doorHardware[]` -> delegates to `updateLineItem` -> `calcFullLineItem` recomputes material cost -> persists.

3. **Custom item addition:** User enters name + cost -> `useDoorHardware.addCustomItem()` appends to `customDoorHardware[]` -> same flow as above.

4. **Schema migration (load):** App boots -> `loadAppState()` detects v2 -> `migrateState()` adds `doorHardware: []` and `customDoorHardware: []` to all existing line items -> saves as v3.

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `DoorHardwareSubRow` <-> `LineItemRow` | Props: doorHardware entries, catalog, onEdit callback | Sub-row is a child component of LineItemRow, rendered conditionally |
| `useDoorHardware` <-> `useLineItems` | `useDoorHardware` calls `updateLineItem(id, { doorHardware, customDoorHardware })` | Door hardware hook wraps line item hook — no separate state tree |
| `door-hardware-calc` <-> `line-total-calc` | `calcFullLineItem` calls `calcDoorHardwareCost()` and adds result to materialCost | Pure function composition, same pattern as existing equipment calc |
| `door-defaults.ts` <-> `use-line-items.ts` | Hook imports defaults map; reads on system type change | Static config, no runtime state |
| `seed-door-hardware.ts` <-> `AppSettings` | New `doorHardware` array added to AppSettings; loaded from seed data | Same pattern as existing `hardware`, `equipment` arrays |

### Modification Surface (Existing Files)

| File | Change | Scope |
|------|--------|-------|
| `src/types/index.ts` | Add `DoorHardwareItem`, `DoorHardwareEntry`, `CustomDoorHardware`; extend `LineItem` with two new fields; extend `AppSettings` with `doorHardware` catalog | Type definitions only |
| `src/calc/material-calc.ts` | `calcMaterialCost` signature gains optional `doorHardwareCost` param OR door hardware cost added externally in `line-total-calc` | Prefer external addition to minimize signature changes |
| `src/calc/line-total-calc.ts` | Call `calcDoorHardwareCost()` for door-type line items; add result to materialCost | 5-10 lines |
| `src/hooks/use-line-items.ts` | Auto-populate `doorHardware[]` when system type changes to door type | ~15 lines in updateLineItem |
| `src/views/TakeoffView.tsx` | Render `DoorHardwareSubRow` below door-type `LineItemRow` components | Conditional render block |
| `src/data/index.ts` | Export new seed data; include in `DEFAULT_SETTINGS` | 3-4 lines |
| `src/storage/storage-service.ts` | Bump schema version to 3; migrate existing LineItems to include empty door hardware arrays; add doorHardware to settings | ~15 lines in migrateState |

## Suggested Build Order

Dependencies between components dictate this sequence:

### Phase 1: Data Foundation (no UI, no calc changes)

1. **Types** — Add `DoorHardwareItem`, `DoorHardwareEntry`, `CustomDoorHardware` to `types/index.ts`; extend `LineItem` and `AppSettings`
2. **Seed data** — Create `seed-door-hardware.ts` (12 items) and `door-defaults.ts` (3 default sets)
3. **Data index** — Wire into `data/index.ts` and `DEFAULT_SETTINGS`
4. **Schema migration** — v2->v3 in `storage-service.ts`

*Rationale: Everything else depends on types and data existing. Schema migration must land with the type changes so existing users' data does not break.*

### Phase 2: Calculation Engine

5. **`door-hardware-calc.ts`** — Pure function: `calcDoorHardwareCost(entries, customItems, catalog, doorQty)`. Unit-testable in isolation.
6. **`line-total-calc.ts` modification** — Call `calcDoorHardwareCost` for door-type items, add to materialCost.
7. **Tests** — Unit tests for `door-hardware-calc.ts`; update `verify-calc.ts` with door hardware assertions.

*Rationale: Calc must work before UI can display correct numbers. Tests prove the calc pipeline is correct before wiring UI.*

### Phase 3: State Management

8. **`use-door-hardware.ts`** — Hook with `toggleItem`, `setItemQty`, `addCustomItem`, `removeCustomItem`, `removeItem`
9. **`use-line-items.ts` modification** — Auto-populate defaults on door system type selection

*Rationale: Hook wraps calc and state. Depends on types, seed data, and calc all existing.*

### Phase 4: UI Components

10. **`DoorHardwareSubRow.tsx`** — Compact display: item names, quantities, subtotal
11. **`DoorHardwareEditor.tsx`** — Full edit panel: checkboxes with qty spinners, custom item form
12. **`TakeoffView.tsx` modification** — Render sub-row below door line items, wire editor into expanded panel

*Rationale: UI depends on all lower layers. Build display component first (read-only), then editor (read-write).*

## Anti-Patterns

### Anti-Pattern 1: Mixing Door Hardware into Existing Hardware Arrays

**What people do:** Add door hardware items to the existing `SEED_HARDWARE` array and reuse `hardwareIds: string[]` on LineItem.
**Why it's wrong:** The existing hardware model is 1:1 (one item per unit). Door hardware needs per-item quantities (3 hinges per door). Mixing them creates ambiguity about which items have per-item qty and which do not. It also pollutes the hardware checklist for non-door line items with irrelevant door items.
**Do this instead:** Separate `DoorHardwareItem` catalog and `doorHardware: DoorHardwareEntry[]` array on LineItem. Keep existing `hardware`/`hardwareIds` untouched.

### Anti-Pattern 2: Storing Door Hardware Cost as a Separate Field on LineItem

**What people do:** Add `doorHardwareCost: number` as a top-level computed field on LineItem alongside `materialCost`, `laborCost`, `equipmentCost`.
**Why it's wrong:** Breaks C-033 (`lineTotal = materialCost + laborCost + equipmentCost`). Every downstream consumer (running totals, SOV, summary) would need updating. Door hardware is material — it should roll into `materialCost`.
**Do this instead:** Add door hardware cost to `materialCost` inside `calcFullLineItem`. Downstream code sees a higher materialCost with zero awareness of door hardware specifics.

### Anti-Pattern 3: Auto-Overwriting User Edits on System Type Change

**What people do:** Always replace `doorHardware[]` with defaults when system type changes, even if the estimator has already customized the list.
**Why it's wrong:** Destroys user work. An estimator who added a panic device and removed weatherstrip loses those edits.
**Do this instead:** Only auto-populate when: (a) switching from a non-door type to a door type, or (b) `doorHardware` array is empty. If switching between door types (e.g., Swing to Sliding), prompt or preserve existing entries.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (single user, localStorage) | No changes needed. 12 door hardware items + 3 default sets fit comfortably in memory and localStorage. |
| Multi-user (future Supabase backend) | `DoorHardwareItem` catalog becomes a database table. `doorHardware` entries on LineItem become a junction table with FK to catalog. Migration is straightforward because the data model already separates catalog from entries. |
| Large projects (100+ line items) | Door hardware sub-row rendering is conditional (only door types). Performance impact is proportional to door count, not total line item count. Memo on sub-row component prevents re-renders. |

### Scaling Priorities

1. **First bottleneck:** localStorage size limit (5MB). Each door line item adds ~200 bytes for hardware entries. At 1000 door line items, that is ~200KB — well within limits. Not a concern for Phase 1.
2. **Second bottleneck:** Re-render performance with many expanded door hardware editors. Solved by `memo()` on sub-row and editor components, same pattern as existing `LineItemRow`.

## Door Type Detection

A utility function is needed to determine if a system type is a door type. This is used by the hook (auto-populate), the view (sub-row rendering), and the calc (door hardware cost).

```typescript
const DOOR_SYSTEM_IDS = new Set(['sys-007', 'sys-008', 'sys-009'])

export function isDoorSystemType(systemTypeId: string): boolean {
  return DOOR_SYSTEM_IDS.has(systemTypeId)
}
```

This should live in `src/data/door-defaults.ts` alongside the default hardware sets, since the set of door system IDs is configuration, not calculation.

## Sources

- Existing codebase analysis: `src/types/index.ts`, `src/calc/line-total-calc.ts`, `src/calc/material-calc.ts`, `src/hooks/use-line-items.ts`, `src/data/seed-hardware.ts`, `src/data/seed-systems.ts`, `src/views/TakeoffView.tsx`, `src/storage/storage-service.ts`
- Project requirements: `.planning/PROJECT.md` (door hardware selection requirements)
- Existing architecture: `.planning/codebase/ARCHITECTURE.md` (current system patterns)
- Constraint registry: `CONSTRAINTS.md` (C-002, C-016, C-033 particularly relevant)

---
*Architecture research for: door hardware in glazing estimation*
*Researched: 2026-03-02*
