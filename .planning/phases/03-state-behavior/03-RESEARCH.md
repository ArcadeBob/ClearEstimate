# Phase 3: State & Behavior - Research

**Researched:** 2026-03-03
**Domain:** React hook state management, door hardware auto-populate and CRUD
**Confidence:** HIGH

## Summary

Phase 3 delivers the state management layer for door hardware on line items. The work is entirely within the existing React Context + useState architecture -- no new libraries or patterns are needed. The phase has two deliverables: (1) auto-populate logic that fires when a door system type is selected on a line item with an empty `doorHardware` array, and (2) a `useDoorHardware` hook exposing add/remove/update-quantity operations.

The codebase already has every building block in place. `DOOR_HARDWARE_DEFAULTS` provides the default hardware sets for all 4 door types. `isDoorSystemType()` identifies door system IDs. `suggestHingeCount()` provides height-based hinge counts. `calcFullLineItem()` already computes `doorHardwareCost` from the `doorHardware` array. The existing `updateLineItem` in `use-line-items.ts` is where auto-populate logic will be injected (detecting `systemTypeId` changes). The new `useDoorHardware` hook follows established patterns from `use-ve-alternates.ts` and `use-settings.ts`.

**Primary recommendation:** Add auto-populate detection inside `updateLineItem` (comparing old vs new `systemTypeId`), create a pure `getDefaultDoorHardware()` helper for testability, and build `useDoorHardware` hook following the `useVEAlternates` pattern (same project, same `useAppStore()` access, `useCallback` for memoization).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Door-to-door change** (e.g., Swing to Sliding): Replace existing doorHardware with new door type's defaults. Customizations are lost -- predictable behavior.
- **Door-to-non-door change** (e.g., Swing to Curtain Wall): Clear the doorHardware array entirely. Non-door systems should not carry door hardware.
- **Non-door-to-door change** (e.g., Curtain Wall to Swing): Auto-populate with defaults. General rule: auto-populate fires whenever doorHardware array is empty AND a door type is selected (UI-01).
- **First selection of a door type**: Auto-populate with defaults (doorHardware is empty by default on new line items).
- **Smart hinge integration**: Apply `suggestHingeCount()` during auto-populate only -- not on every height change. When height is 0 or not yet entered, fall back to the static default hinge quantity (3) from DOOR_HARDWARE_DEFAULTS. Once auto-populated, user can manually change hinge quantity -- it won't be auto-corrected on height changes. suggestHingeCount() is called with the line item's current heightInches; if it returns null (out of range or non-door), use the default quantity from DOOR_HARDWARE_DEFAULTS.
- **Add**: User can add any of the 12 door hardware items from settings.doorHardware catalog, not limited to the default set for their door type.
- **Remove**: User can remove any hardware item from their selection.
- **Quantity update**: Changing per-door quantity persists. Setting quantity to 0 removes the entry from the doorHardware array (no zero-quantity ghost entries).
- **No duplicates**: Each hardwareId appears at most once in a line item's doorHardware[]. Adding an already-present item is a no-op or updates its quantity.
- **Hook API**: New `useDoorHardware(projectId, lineItemId)` hook with: `addDoorHardware`, `removeDoorHardware`, `updateDoorHardwareQty`.
- **Auto-populate trigger**: Fires inside `updateLineItem` when systemTypeId changes -- detects door type change and applies defaults automatically.
- **Recalculation**: Every door hardware mutation (add/remove/update qty) triggers `calcFullLineItem` recalculation -- user always sees accurate cost totals.
- **Hook pattern**: Follows existing pattern: `useAppStore()` for state, `useCallback` for memoized operations.

### Claude's Discretion
- Internal helper function structure (e.g., a pure `getDefaultDoorHardware()` function)
- Whether auto-populate logic is a standalone helper or inline in updateLineItem
- Test file organization (single test file vs per-function)
- Edge case handling for missing/invalid hardwareIds in add operations

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UI-01 | Default hardware auto-populates when door system type is first selected (only when doorHardware is empty) | Auto-populate logic in `updateLineItem` detects systemTypeId change, uses `DOOR_HARDWARE_DEFAULTS` and `isDoorSystemType()`. Also fires on door-to-door changes (replaces defaults) and non-door-to-door (populates). `suggestHingeCount()` adjusts hinge qty at populate time. |
| UI-02 | Estimator can add/remove individual hardware items from the pre-filled defaults | `useDoorHardware` hook with `addDoorHardware`, `removeDoorHardware`, `updateDoorHardwareQty` operating on the `doorHardware[]` array within a specific line item, with `calcFullLineItem` recalculation after every mutation. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.x | Component framework + hooks | Already in project |
| TypeScript | 5.x (strict) | Type safety | Already in project, `noUncheckedIndexedAccess: true` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| uuid | v4 | N/A for this phase | Not needed -- no new entity creation with UUIDs in this phase |
| vitest | 4.x | Testing pure helpers + hook logic | All test files |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Modifying `updateLineItem` | Separate `useEffect` watcher | Effect would re-trigger on renders; inline detection is deterministic and matches existing VE cascade pattern |

**Installation:**
```bash
# No new packages needed. All dependencies are already installed.
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── hooks/
│   ├── use-line-items.ts          # MODIFY: add auto-populate in updateLineItem
│   ├── use-door-hardware.ts       # NEW: CRUD hook for door hardware entries
│   └── use-door-hardware.test.ts  # NEW: tests for CRUD operations
├── calc/
│   ├── door-hardware-calc.ts      # EXISTS: calcDoorHardwareCost, suggestHingeCount
│   ├── door-system-util.ts        # EXISTS: isDoorSystemType
│   └── door-hardware-helpers.ts   # NEW (optional): pure getDefaultDoorHardware() helper
└── data/
    └── seed-door-hardware.ts      # EXISTS: DOOR_HARDWARE_DEFAULTS
```

### Pattern 1: Auto-Populate on System Type Change (inside updateLineItem)
**What:** Detect when `systemTypeId` changes inside `updateLineItem`, then apply door hardware defaults based on the transition type (door-to-door, door-to-non-door, non-door-to-door).
**When to use:** Every time `updateLineItem` is called with a `systemTypeId` in the updates.
**Example:**
```typescript
// Inside updateLineItem, after merging updates but before calcFullLineItem
const updateLineItem = useCallback(
  (itemId: string, updates: Partial<LineItem>) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(p => {
        if (p.id !== projectId) return p

        const newLineItems = p.lineItems.map(li => {
          if (li.id !== itemId) return li
          const merged = { ...li, ...updates }

          // Auto-populate door hardware when systemTypeId changes
          if (updates.systemTypeId !== undefined && updates.systemTypeId !== li.systemTypeId) {
            merged.doorHardware = getDefaultDoorHardware(
              updates.systemTypeId,
              merged.heightInches,
            )
          }

          if (validateLineItem(merged).isValid) {
            return calcFullLineItem(merged, prev.settings, p.prevailingWage, p.pwBaseRate, p.pwFringeRate)
          }
          return merged
        })

        // VE cascade (existing C-015 logic)
        // ...
      }),
    }))
  },
  [projectId, setState],
)
```

### Pattern 2: Pure Helper for Default Hardware
**What:** A pure, testable function that resolves defaults based on system type, applying `suggestHingeCount()` for hinge quantity.
**When to use:** Called by auto-populate logic and potentially by a future "Reset to Defaults" feature (UI-05, Phase 4).
**Example:**
```typescript
// Source: project codebase patterns
import { isDoorSystemType } from '@/calc'
import { suggestHingeCount } from '@/calc'
import { DOOR_HARDWARE_DEFAULTS } from '@/data'
import type { DoorHardwareEntry } from '@/types'

const HINGE_HARDWARE_ID = 'dhw-001'

/**
 * Returns the default door hardware entries for a system type.
 * Returns empty array for non-door types.
 * Applies suggestHingeCount() to hinge entry when height is available.
 */
export function getDefaultDoorHardware(
  systemTypeId: string,
  heightInches: number,
): DoorHardwareEntry[] {
  if (!isDoorSystemType(systemTypeId)) return []

  const defaults = DOOR_HARDWARE_DEFAULTS[systemTypeId]
  if (!defaults) return []

  // Deep copy to avoid mutating seed data
  return defaults.map(entry => {
    if (entry.hardwareId === HINGE_HARDWARE_ID) {
      const suggested = suggestHingeCount(heightInches, systemTypeId)
      return {
        hardwareId: entry.hardwareId,
        quantity: suggested ?? entry.quantity, // fallback to default (3) when height=0
      }
    }
    return { ...entry }
  })
}
```

### Pattern 3: CRUD Hook Following useVEAlternates Pattern
**What:** A new hook `useDoorHardware(projectId, lineItemId)` that provides add/remove/update-qty operations on a specific line item's `doorHardware[]` array.
**When to use:** Phase 4 UI components will call this hook.
**Example:**
```typescript
// Source: follows use-ve-alternates.ts pattern
import { useCallback } from 'react'
import type { DoorHardwareEntry } from '@/types'
import { useAppStore } from './use-app-store'
import { calcFullLineItem } from '@/calc'

export function useDoorHardware(projectId: string, lineItemId: string) {
  const { state, setState } = useAppStore()

  const project = state.projects.find(p => p.id === projectId)
  const lineItem = project?.lineItems.find(li => li.id === lineItemId)
  const doorHardware = lineItem?.doorHardware ?? []

  const addDoorHardware = useCallback(
    (hardwareId: string, quantity: number = 1) => {
      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => {
          if (p.id !== projectId) return p
          const newLineItems = p.lineItems.map(li => {
            if (li.id !== lineItemId) return li
            // No duplicates: skip if already present
            if (li.doorHardware.some(e => e.hardwareId === hardwareId)) return li
            const updated = {
              ...li,
              doorHardware: [...li.doorHardware, { hardwareId, quantity }],
            }
            return calcFullLineItem(updated, prev.settings, p.prevailingWage, p.pwBaseRate, p.pwFringeRate)
          })
          return { ...p, lineItems: newLineItems, /* VE cascade + timestamp */ }
        }),
      }))
    },
    [projectId, lineItemId, setState],
  )

  // removeDoorHardware, updateDoorHardwareQty follow same pattern...

  return { doorHardware, addDoorHardware, removeDoorHardware, updateDoorHardwareQty }
}
```

### Anti-Patterns to Avoid
- **useEffect for system type change detection:** Do NOT use a `useEffect` watching `systemTypeId` to trigger auto-populate. This creates race conditions and double-renders. The existing pattern detects changes inline within `setState` updater functions.
- **Mutating DOOR_HARDWARE_DEFAULTS:** Always spread/copy entries from the defaults record. The seed data arrays must remain immutable.
- **Skipping calcFullLineItem after mutations:** Every door hardware change must flow through `calcFullLineItem` to update `doorHardwareCost` and `materialCost`. This is not optional.
- **Storing doorHardware outside LineItem:** The `doorHardware[]` array lives on LineItem. Do not create a parallel data structure. This is consistent with how `hardwareIds`, `equipmentIds`, and `conditionIds` work.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Door type identification | Custom string matching on system names | `isDoorSystemType()` from `@/calc` | Already exists, uses O(1) Set lookup, single source of truth |
| Default hardware sets | Hard-coded arrays in hook | `DOOR_HARDWARE_DEFAULTS` from `@/data` | Already exists with correct data for all 4 door types |
| Hinge count suggestion | If/else in auto-populate | `suggestHingeCount()` from `@/calc` | Already exists, handles edge cases and non-door types |
| Cost recalculation | Manual doorHardwareCost math | `calcFullLineItem()` from `@/calc` | Already wires `calcDoorHardwareCost` into the orchestrator |
| State management plumbing | New context or zustand | `useAppStore()` from existing hooks | Project uses single Context + useState, all hooks follow this |

**Key insight:** Phase 1 and 2 already built all the data and calculation infrastructure. Phase 3 is purely wiring -- connecting existing building blocks through hook logic.

## Common Pitfalls

### Pitfall 1: Forgetting to Deep Copy Default Entries
**What goes wrong:** Auto-populate assigns `DOOR_HARDWARE_DEFAULTS[systemTypeId]` directly, and a later mutation (e.g., quantity update) modifies the shared seed data array, corrupting defaults for all future auto-populates.
**Why it happens:** JavaScript arrays and objects are reference types. `const entries = defaults` creates a reference, not a copy.
**How to avoid:** Always `.map(entry => ({ ...entry }))` when reading from `DOOR_HARDWARE_DEFAULTS`.
**Warning signs:** Defaults change after user modifies quantities; different line items share the same doorHardware array reference.

### Pitfall 2: Not Detecting "Same System Type" No-Op
**What goes wrong:** User re-selects the same system type from a dropdown (onChange fires with same value), and auto-populate replaces their customized hardware with defaults.
**Why it happens:** The `updates.systemTypeId !== undefined` check passes even when the value hasn't changed.
**How to avoid:** Compare `updates.systemTypeId !== li.systemTypeId` -- only act when the value actually differs.
**Warning signs:** User loses hardware customizations when interacting with the system type dropdown without changing it.

### Pitfall 3: VE Cascade After Door Hardware Changes
**What goes wrong:** Door hardware cost changes `materialCost` which changes `lineTotal`, but VE alternate `originalCost` doesn't update.
**Why it happens:** The `useDoorHardware` hook mutations modify line items directly but skip the VE cascade logic that exists in `updateLineItem`.
**How to avoid:** After calling `calcFullLineItem` in the CRUD hook, also apply VE cascade (same pattern as `updateLineItem` lines 86-91). Or, use a shared helper function that both hooks call.
**Warning signs:** VE savings show stale values after adding/removing door hardware.

### Pitfall 4: suggestHingeCount Returns Null for Height 0
**What goes wrong:** New line items have `heightInches: 0`. `suggestHingeCount(0, 'sys-009')` returns `2` (since 0 <= 60), but the CONTEXT.md says "When height is 0 or not yet entered, fall back to the static default hinge quantity (3)."
**Why it happens:** `suggestHingeCount` returns 2 for height=0 because 0 <= 60. But the business rule says use the default (3) from DOOR_HARDWARE_DEFAULTS when height is not yet entered.
**How to avoid:** Check `heightInches === 0` (or `heightInches <= 0`) BEFORE calling `suggestHingeCount()`. If height is zero/unset, use the default quantity from `DOOR_HARDWARE_DEFAULTS` without modification.
**Warning signs:** Auto-populated hinges show 2 on new line items instead of the expected 3.

### Pitfall 5: TypeScript noUncheckedIndexedAccess with DOOR_HARDWARE_DEFAULTS
**What goes wrong:** `DOOR_HARDWARE_DEFAULTS[systemTypeId]` returns `DoorHardwareEntry[] | undefined` due to `noUncheckedIndexedAccess: true`. Code that doesn't handle `undefined` gets type errors.
**Why it happens:** TypeScript strict mode treats index signatures as potentially undefined.
**How to avoid:** Always check for `undefined` after indexing: `const defaults = DOOR_HARDWARE_DEFAULTS[systemTypeId]; if (!defaults) return []`.
**Warning signs:** TypeScript compilation errors on `DOOR_HARDWARE_DEFAULTS` access.

### Pitfall 6: Missing Timestamp Update in CRUD Hook
**What goes wrong:** Door hardware mutations don't update `project.timestamps.updatedAt`, so localStorage persistence doesn't detect the change and the sort order in the dashboard doesn't update.
**Why it happens:** New hook forgets to include `timestamps: { ...p.timestamps, updatedAt: new Date().toISOString() }` in the project spread.
**How to avoid:** Follow existing pattern -- every project-modifying `setState` call includes the timestamp update.
**Warning signs:** Dashboard "recently updated" order doesn't reflect hardware changes.

## Code Examples

Verified patterns from project codebase:

### State Update Pattern (from use-ve-alternates.ts)
```typescript
// Source: src/hooks/use-ve-alternates.ts
setState(prev => ({
  ...prev,
  projects: prev.projects.map(p => {
    if (p.id !== projectId) return p
    return {
      ...p,
      // ... modify lineItems or veAlternates
      timestamps: { ...p.timestamps, updatedAt: new Date().toISOString() },
    }
  }),
}))
```

### Line Item Modification with Recalc (from use-line-items.ts)
```typescript
// Source: src/hooks/use-line-items.ts, updateLineItem
const newLineItems = p.lineItems.map(li => {
  if (li.id !== itemId) return li
  const merged = { ...li, ...updates }
  if (validateLineItem(merged).isValid) {
    return calcFullLineItem(merged, prev.settings, p.prevailingWage, p.pwBaseRate, p.pwFringeRate)
  }
  return merged
})

// VE cascade (C-015)
const newVeAlternates = p.veAlternates.map(ve => {
  const linkedItem = newLineItems.find(li => li.id === ve.lineItemId)
  if (!linkedItem) return ve
  const originalCost = linkedItem.lineTotal
  return { ...ve, originalCost, savings: originalCost - ve.alternateCost }
})
```

### Test Factory Pattern (from line-total-calc.test.ts)
```typescript
// Source: src/calc/line-total-calc.test.ts
function baseLineItem(overrides: Partial<LineItem> = {}): LineItem {
  return {
    id: 'test-li', systemTypeId: 'sys-001', glassTypeId: 'glass-001',
    frameSystemId: 'frame-001', description: '', quantity: 1,
    widthInches: 48, heightInches: 96, sqft: 0, perimeter: 0,
    materialCost: 0, laborCost: 0, equipmentCost: 0, doorHardwareCost: 0,
    lineTotal: 0, conditionIds: [], crewDays: 0, manHours: 0,
    equipmentIds: [], hardwareIds: [], doorHardware: [],
    ...overrides,
  }
}
```

### Hook Test Pattern (pure function tests, no React rendering needed)
```typescript
// Source: src/hooks/validate-line-item.test.ts
// Hooks export pure functions that can be tested without React
import { validateLineItem } from './use-line-items'

describe('validateLineItem', () => {
  it('returns valid for a complete line item', () => {
    const result = validateLineItem(validItem())
    expect(result.isValid).toBe(true)
  })
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| N/A | This is new functionality | Phase 3 | First implementation of door hardware state management |

This phase does not replace any existing approach. It extends the existing hook pattern to a new domain (door hardware CRUD).

**Relevant existing decisions:**
- 02-01: Door hardware cost added in orchestrator (not calcMaterialCost) to preserve separation of concerns
- 02-01: materialCost = baseMaterialCost + doorHardwareCost, keeping C-033 lineTotal formula unchanged

## Open Questions

1. **Should addDoorHardware on an already-present item be a no-op or update its quantity?**
   - What we know: CONTEXT.md says "Adding an already-present item is a no-op or updates its quantity" (either is acceptable)
   - What's unclear: Which behavior the user prefers
   - Recommendation: No-op (simpler, avoids accidental quantity overwrite). If the user wants to change quantity, they use `updateDoorHardwareQty` explicitly. This is Claude's discretion per CONTEXT.md.

2. **Should the pure helper go in a new file or in door-hardware-calc.ts?**
   - What we know: `door-hardware-calc.ts` already has calc functions. The helper is behavioral, not strictly calculation.
   - What's unclear: File organization preference
   - Recommendation: New file `src/calc/door-hardware-helpers.ts` to keep calc files focused on math. This is Claude's discretion per CONTEXT.md.

3. **Should CRUD hook mutations include VE cascade?**
   - What we know: `updateLineItem` already handles VE cascade. Door hardware cost changes flow into `materialCost` and `lineTotal`.
   - What's unclear: Whether VE cascade should be duplicated in the CRUD hook
   - Recommendation: Yes, include VE cascade in the CRUD hook. Without it, VE savings values will be stale after hardware changes. Extract a shared helper function if needed to avoid duplication.

## Sources

### Primary (HIGH confidence)
- `src/hooks/use-line-items.ts` -- existing updateLineItem pattern with VE cascade
- `src/hooks/use-ve-alternates.ts` -- CRUD hook pattern to follow
- `src/hooks/use-settings.ts` -- settings CRUD pattern with referential integrity
- `src/hooks/use-app-store.tsx` -- Context + useState architecture
- `src/types/index.ts` -- LineItem.doorHardware, DoorHardwareEntry types
- `src/data/seed-door-hardware.ts` -- DOOR_HARDWARE_DEFAULTS with 4 door type defaults
- `src/calc/door-system-util.ts` -- isDoorSystemType() with DOOR_SYSTEM_IDS ReadonlySet
- `src/calc/door-hardware-calc.ts` -- calcDoorHardwareCost(), suggestHingeCount()
- `src/calc/line-total-calc.ts` -- calcFullLineItem() orchestrator with doorHardwareCost integration
- `src/calc/index.ts` -- barrel exports for all calc functions
- `.planning/phases/03-state-behavior/03-CONTEXT.md` -- locked user decisions

### Secondary (MEDIUM confidence)
- `CONSTRAINTS.md` -- constraint registry (C-015 VE cascade, C-033 lineTotal formula)
- `.planning/REQUIREMENTS.md` -- UI-01, UI-02 requirement definitions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, uses only existing project infrastructure
- Architecture: HIGH -- patterns directly observed in 5 existing hooks, code examples extracted from codebase
- Pitfalls: HIGH -- pitfalls identified through code analysis of actual types, strict mode config, and state management patterns

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (stable -- no external dependencies, all patterns are internal to project)
