# Phase 4: UI Components - Research

**Researched:** 2026-03-03
**Domain:** React UI components -- Takeoff view door hardware sub-row, editing panel, cost breakdown, reset button
**Confidence:** HIGH

## Summary

Phase 4 is a pure UI phase. All data model (Phase 1), calculation (Phase 2), and state/behavior hooks (Phase 3) are complete. The work is entirely within `TakeoffView.tsx`, modifying the existing `LineItemRow` component to conditionally render door hardware UI for door system types (sys-006, sys-007, sys-008, sys-009).

The existing codebase provides all the building blocks: `isDoorSystemType()` for conditional rendering, `useDoorHardware()` hook for CRUD operations, `formatCurrency()` for display, `DOOR_HARDWARE_DEFAULTS` for reset logic, and the `LineItem.doorHardware` / `LineItem.doorHardwareCost` fields for data access. The implementation is a matter of wiring these existing pieces into new JSX within the established component patterns.

**Primary recommendation:** Extract two sub-components (`DoorHardwareSubRow` and `DoorHardwarePanel`) as local components within `TakeoffView.tsx` to keep the `LineItemRow` render function manageable, following the existing pattern where `TotalRow` is already a local helper component in the same file.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Sub-row layout: Inline chips format showing hardware name x quantity, hardware subtotal at end of row
- Always visible for door line items (no toggle/collapse)
- Chips wrap to second line when many items
- Subtle indent + muted color: left-indented, text-gray-500, text-xs, thin top border separator
- Sub-row does NOT appear for non-door line items
- All editing in expanded detail panel only -- sub-row is read-only display
- Checkbox + quantity input pattern: all 12 door hardware items listed, checked = in selection, unchecked = available
- Quantity input appears next to checked items; unchecked show just unit cost
- Door hardware section replaces generic hardware section for door line items
- Non-door line items continue to show existing generic hardware checkboxes
- When checking a new item, default quantity is 1
- Door hardware cost shown as indented sub-line under Material in expanded cost breakdown
- Two sub-lines for door items: "Glass + Frame" and "Door Hardware" under Material total
- Sub-line breakdown only for door items -- non-door keep simple "Material" line
- Sub-row chips show name + quantity only (no per-item cost), hardware subtotal at right end
- Reset button in expanded panel, below door hardware checkbox list
- No confirmation dialog -- immediate reset on click
- Button always enabled (even when already at defaults)

### Claude's Discretion
- Exact chip styling (border radius, padding, colors)
- How to extract LineItemRow sub-components (DoorHardwareSubRow, DoorHardwarePanel) vs inline
- Whether to create new component files or keep everything in TakeoffView.tsx
- Exact layout of checkbox + qty input grid in expanded panel
- How to wire useDoorHardware hook into existing LineItemRow component

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UI-03 | Compact sub-row appears below door line items showing selected hardware with quantities and subtotal | `isDoorSystemType()` for conditional render, `item.doorHardware` array for chip data, `item.doorHardwareCost` for subtotal, `settings.doorHardware` catalog for name lookup |
| UI-04 | Door hardware cost visible as a separate line in the expanded line item detail breakdown | `item.doorHardwareCost` (derived field), `item.materialCost` (includes door hardware), compute glass+frame as `materialCost - doorHardwareCost` for sub-line |
| UI-05 | "Reset to Defaults" button restores the default hardware set for current door type | `getDefaultDoorHardware(systemTypeId, heightInches)` returns correct defaults, `useDoorHardware` hook's mutation functions can replace entire array |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19 | Component rendering | Already in use, project framework |
| TypeScript | 5 (strict) | Type safety | Already in use with `noUncheckedIndexedAccess` |
| Tailwind CSS | v4 | Styling (CSS-first, no config) | Already in use, utility classes |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@/calc` barrel | n/a | `isDoorSystemType`, `formatCurrency`, `getDefaultDoorHardware` | All conditional logic and display |
| `@/hooks/use-door-hardware` | n/a | `addDoorHardware`, `removeDoorHardware`, `updateDoorHardwareQty` | Hardware editing in expanded panel |

No new libraries needed. This phase uses only existing project dependencies.

## Architecture Patterns

### Component Structure (within TakeoffView.tsx)

```
TakeoffView.tsx
├── TakeoffView()              # Main view (existing)
│   └── <LineItemRow />        # Memo'd component (existing, modified)
│       ├── Collapsed Row      # (existing, unchanged)
│       ├── Validation Errors  # (existing, unchanged)
│       ├── DoorHardwareSubRow # NEW: chips between collapsed row and expanded panel
│       └── Expanded Panel     # (existing, modified)
│           ├── Description    # (existing)
│           ├── Conditions     # (existing)
│           ├── Hardware OR DoorHardwarePanel  # CONDITIONAL
│           ├── Equipment      # (existing)
│           └── Cost Breakdown # (existing, modified for door sub-lines)
├── DoorHardwareSubRow()       # NEW: local component
├── DoorHardwarePanel()        # NEW: local component
└── TotalRow()                 # (existing helper)
```

### Pattern 1: Conditional Door vs Non-Door Rendering

**What:** Use `isDoorSystemType(item.systemTypeId)` to branch between door-specific and generic UI elements within the same component.
**When to use:** Every place where door hardware UI appears (sub-row, hardware section, cost breakdown).
**Example:**
```typescript
// Source: existing pattern in use-line-items.ts line 80
import { isDoorSystemType } from '@/calc'

const isDoor = isDoorSystemType(item.systemTypeId)

// Sub-row: only for doors
{isDoor && item.doorHardware.length > 0 && (
  <DoorHardwareSubRow item={item} settings={settings} />
)}

// Hardware section: swap entire section
{isDoor ? (
  <DoorHardwarePanel item={item} settings={settings} projectId={projectId} />
) : (
  /* existing generic hardware checkboxes */
)}
```

### Pattern 2: Hook Wiring in Memo'd Component

**What:** The `LineItemRow` is `memo`'d. The `useDoorHardware` hook needs `projectId` and `lineItemId`. Since hooks must be called unconditionally, call it at the top of `LineItemRow` regardless of door status.
**When to use:** Wiring `useDoorHardware` into the existing `LineItemRow`.
**Critical detail:** `LineItemRowProps` must gain a `projectId` prop. The `TakeoffView` already has `id` from `useParams` -- pass it as `projectId={id!}` to each `<LineItemRow />`.
**Example:**
```typescript
interface LineItemRowProps {
  item: LineItem
  settings: AppSettings
  projectId: string           // NEW: needed for useDoorHardware
  isExpanded: boolean
  onToggle: (id: string) => void
  onUpdate: (id: string, updates: Partial<LineItem>) => void
  onDuplicate: (id: string) => void | string | null
  onDelete: (id: string) => void
}

const LineItemRow = memo(function LineItemRow({
  item, settings, projectId, isExpanded, onToggle, onUpdate, onDuplicate, onDelete,
}: LineItemRowProps) {
  const { doorHardware, addDoorHardware, removeDoorHardware, updateDoorHardwareQty } =
    useDoorHardware(projectId, item.id)
  // ...
})
```

### Pattern 3: Reset to Defaults via Hook Mutation

**What:** Reset replaces the entire `doorHardware` array by removing all current items and adding defaults.
**When to use:** The "Reset to Defaults" button click handler.
**Critical detail:** The `useDoorHardware` hook does not have a bulk "replace" function. Two approaches:
  1. **Direct state update via `onUpdate`:** Call `onUpdate(item.id, { doorHardware: getDefaultDoorHardware(item.systemTypeId, item.heightInches) })` -- this uses the existing `updateLineItem` path which already handles recalc and VE cascade.
  2. **Hook-based:** Would need a new `resetDoorHardware` function added to the hook.

**Recommendation:** Use approach 1 (`onUpdate`) since it is zero new code in the hook and the `updateLineItem` callback already recalculates. The `getDefaultDoorHardware` function from `@/calc` provides the correct default set including height-based hinge adjustment.

### Pattern 4: Door Hardware Name Lookup

**What:** Map `hardwareId` from `DoorHardwareEntry` to display name using `settings.doorHardware` catalog.
**When to use:** Rendering chips in sub-row and labels in editing panel.
**Example:**
```typescript
const hwName = settings.doorHardware.find(h => h.id === entry.hardwareId)?.name ?? 'Unknown'
```

### Anti-Patterns to Avoid
- **Calling hooks conditionally:** Do NOT wrap `useDoorHardware` in an `if (isDoor)` check. Hooks must be called unconditionally per React rules. The hook gracefully handles non-door items (returns empty `doorHardware` array).
- **Breaking memo stability:** Do NOT create new object/function references inside `TakeoffView` render that get passed as props to `LineItemRow`. Use `useCallback` for handlers. The `projectId` string is stable (comes from URL params).
- **Duplicating calc logic:** Do NOT manually compute door hardware cost in the UI. Use the pre-computed `item.doorHardwareCost` field that `calcFullLineItem` already sets.
- **Computing glass+frame cost independently:** For the Material sub-line breakdown, compute `item.materialCost - item.doorHardwareCost` to get the glass+frame portion. Do NOT re-run `calcMaterialCost` -- this avoids coupling the UI to calc internals.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Door type detection | Custom systemTypeId checks | `isDoorSystemType()` from `@/calc` | Central source of truth, already handles all 4 door types |
| Default hardware sets | Hardcoded default arrays | `getDefaultDoorHardware(systemTypeId, heightInches)` | Handles hinge count suggestion based on height |
| Hardware cost display | Manual sum of unit costs | `item.doorHardwareCost` (pre-computed field) | `calcFullLineItem` already computes and stores this |
| Currency formatting | `toFixed(2)` or template literals | `formatCurrency()` from `@/calc` | C-017 constraint, handles locale/commas |
| Hardware name resolution | Inline string maps | `settings.doorHardware.find(h => h.id === id)` | Settings catalog is the source of truth |

**Key insight:** Every data access and computation this phase needs is already available as a pre-computed field or utility function. The UI code should be pure rendering with no business logic.

## Common Pitfalls

### Pitfall 1: Stale Props After Door Hardware Mutation
**What goes wrong:** After `addDoorHardware` or `removeDoorHardware` is called via the hook, the `item` prop in `LineItemRow` still holds the old value until React re-renders. If UI reads from both `doorHardware` (from hook) and `item.doorHardwareCost` (from prop), they can be temporarily out of sync.
**Why it happens:** The hook mutates state via `setState`, which triggers a re-render cycle. During the same render, the `item` prop reflects pre-mutation state.
**How to avoid:** Always read `doorHardware` from the hook return value (not from `item.doorHardware`) for the editing panel, since the hook reads from the latest state. For display purposes (sub-row, cost breakdown), use `item.doorHardware` and `item.doorHardwareCost` since they are from the same render cycle and are consistent with each other.
**Warning signs:** Chip count or subtotal flickering after adding/removing hardware.

### Pitfall 2: Quantity Input Allowing Zero or Negative
**What goes wrong:** User types "0" or clears the input, resulting in quantity 0 which the hook's `applyUpdateDoorHardwareQty` treats as a remove.
**Why it happens:** The `applyUpdateDoorHardwareQty` function removes entries when `quantity <= 0`.
**How to avoid:** Either clamp the input `min={1}` at the HTML level, or use `Math.max(1, qty)` before calling `updateDoorHardwareQty`. The existing quantity input for line items uses `min={1}` (line 370 of TakeoffView.tsx) -- follow the same pattern.
**Warning signs:** Hardware items disappearing when user tries to change quantity.

### Pitfall 3: Memo Invalidation from New Sub-Components
**What goes wrong:** Extracting sub-components inside the `memo` boundary or passing inline arrow functions defeats memoization.
**Why it happens:** New function references on every render cause `memo` shallow comparison to fail.
**How to avoid:** Define `DoorHardwareSubRow` and `DoorHardwarePanel` as separate components OUTSIDE the `memo` call. Pass stable callbacks. The `useDoorHardware` hook's returned functions are already wrapped in `useCallback` and are stable.
**Warning signs:** All line items re-rendering when any single line item's hardware changes.

### Pitfall 4: TypeScript `noUncheckedIndexedAccess` with find()
**What goes wrong:** `settings.doorHardware.find(h => h.id === id)` returns `Hardware | undefined`. Accessing `.name` without null check causes TS error.
**Why it happens:** Project uses `noUncheckedIndexedAccess: true` in tsconfig.
**How to avoid:** Always use optional chaining: `hw?.name ?? 'Unknown'`. Or use nullish coalescing for display values.
**Warning signs:** TypeScript compilation errors on property access.

### Pitfall 5: Print Layout Breaking with Long Chip Rows
**What goes wrong:** Door types with many hardware items (Entrance System has 7 items) could push the sub-row too tall, breaking print page layout.
**Why it happens:** Chips wrap to multiple lines and add vertical space.
**How to avoid:** Use `flex-wrap` with minimal vertical padding. The `text-xs` and compact chip styling keeps each chip small. For print, consider `print:text-[10px]` to further reduce size if needed. Test with Entrance System (7 items) as the worst case.
**Warning signs:** Chips pushing content to next print page.

## Code Examples

### Sub-Row Chip Rendering
```typescript
// Render inline chips for door hardware entries
function DoorHardwareSubRow({ item, settings }: { item: LineItem; settings: AppSettings }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-t border-gray-100 px-3 py-1.5 pl-8 text-xs text-gray-500">
      {item.doorHardware.map(entry => {
        const hw = settings.doorHardware.find(h => h.id === entry.hardwareId)
        if (!hw) return null
        return (
          <span
            key={entry.hardwareId}
            className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-gray-600"
          >
            {hw.name}{entry.quantity > 1 ? `\u00D7${entry.quantity}` : ''}
          </span>
        )
      })}
      <span className="ml-auto font-medium text-gray-700">
        {formatCurrency(item.doorHardwareCost)}
      </span>
    </div>
  )
}
```

### Door Hardware Editing Panel (Checkbox + Quantity Grid)
```typescript
// Replaces generic hardware section when isDoorSystemType
function DoorHardwarePanel({
  item,
  settings,
  onAdd,
  onRemove,
  onUpdateQty,
  onReset,
}: {
  item: LineItem
  settings: AppSettings
  onAdd: (hardwareId: string, quantity?: number) => void
  onRemove: (hardwareId: string) => void
  onUpdateQty: (hardwareId: string, quantity: number) => void
  onReset: () => void
}) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600">Door Hardware</label>
      <div className="mt-1 space-y-1">
        {settings.doorHardware.map(hw => {
          const entry = item.doorHardware.find(e => e.hardwareId === hw.id)
          const isSelected = !!entry
          return (
            <label key={hw.id} className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => isSelected ? onRemove(hw.id) : onAdd(hw.id)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
              />
              <span className={isSelected ? '' : 'text-gray-400'}>{hw.name}</span>
              {isSelected && entry ? (
                <input
                  type="number"
                  value={entry.quantity}
                  min={1}
                  onChange={e => onUpdateQty(hw.id, Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 rounded border border-gray-200 px-1 py-0.5 text-center text-xs"
                />
              ) : (
                <span className="text-gray-400">{formatCurrency(hw.unitCost)}/ea</span>
              )}
            </label>
          )
        })}
      </div>
      <button
        type="button"
        onClick={onReset}
        className="mt-2 rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
      >
        Reset to Defaults
      </button>
    </div>
  )
}
```

### Cost Breakdown with Door Hardware Sub-Lines
```typescript
// Inside expanded panel cost breakdown, conditional rendering for door items
{isDoor ? (
  <>
    <div className="flex justify-between">
      <span className="text-gray-500">Material</span>
      <span>{formatCurrency(item.materialCost)}</span>
    </div>
    <div className="flex justify-between pl-3">
      <span className="text-gray-400">Glass + Frame</span>
      <span className="text-gray-400">
        {formatCurrency(item.materialCost - item.doorHardwareCost)}
      </span>
    </div>
    <div className="flex justify-between pl-3">
      <span className="text-gray-400">Door Hardware</span>
      <span className="text-gray-400">
        {formatCurrency(item.doorHardwareCost)}
      </span>
    </div>
  </>
) : (
  <div className="flex justify-between">
    <span className="text-gray-500">Material</span>
    <span>{formatCurrency(item.materialCost)}</span>
  </div>
)}
```

### Reset to Defaults Handler
```typescript
// Using onUpdate (existing updateLineItem path) for reset
import { getDefaultDoorHardware } from '@/calc'

const handleResetDefaults = () => {
  onUpdate(item.id, {
    doorHardware: getDefaultDoorHardware(item.systemTypeId, item.heightInches),
  })
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Generic hardware only (hw-xxx) | Dual hardware: generic (hw-xxx) + door (dhw-xxx) | Phase 1-3 (this milestone) | Door items use dedicated catalog |
| materialCost = glass + frame + generic hardware | materialCost = glass + frame + generic hardware + doorHardwareCost | Phase 2 (calc engine) | doorHardwareCost is additive |
| No auto-populate | Auto-populate on system type change | Phase 3 (hooks) | doorHardware populated automatically for door types |

**Deprecated/outdated:**
- None in this phase. All infrastructure is current as of Phase 3 completion.

## Open Questions

1. **Should the sub-row render when doorHardware is empty for a door item?**
   - What we know: CONTEXT.md says "Always visible for door line items." But a new blank line item with a door system type starts with auto-populated hardware (UI-01), so empty doorHardware on a door item is unlikely in practice.
   - What's unclear: Edge case where user unchecks all hardware items -- should sub-row still show (with $0.00)?
   - Recommendation: Show the sub-row only when `doorHardware.length > 0` to avoid an empty row. If all hardware is unchecked, the sub-row disappears naturally. The "always visible" intent is that it doesn't require a toggle/collapse -- not that it shows when empty.

2. **How does memo interact with useDoorHardware inside LineItemRow?**
   - What we know: `LineItemRow` is wrapped in `memo`. Calling `useDoorHardware` inside it subscribes to the AppStore context. Context changes bypass memo (React re-renders context consumers regardless of memo).
   - What's unclear: Whether this causes unnecessary re-renders of all line items when any single item's hardware changes.
   - Recommendation: This is acceptable. The AppStore uses a single context so all consumers already re-render on any state change. The `memo` prevents re-renders only when the parent re-renders with same props. Since context changes trigger re-renders anyway, adding `useDoorHardware` inside `memo` does not make performance worse than the existing pattern.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis: `src/views/TakeoffView.tsx` (528 lines) -- complete LineItemRow structure, existing patterns
- Direct codebase analysis: `src/hooks/use-door-hardware.ts` (140 lines) -- hook API surface
- Direct codebase analysis: `src/types/index.ts` -- `DoorHardwareEntry`, `LineItem.doorHardware`, `LineItem.doorHardwareCost`
- Direct codebase analysis: `src/calc/door-hardware-helpers.ts` -- `getDefaultDoorHardware`, `applyDoorHardwareAutoPopulate`
- Direct codebase analysis: `src/calc/door-hardware-calc.ts` -- `calcDoorHardwareCost` formula
- Direct codebase analysis: `src/calc/line-total-calc.ts` -- how `doorHardwareCost` integrates into `materialCost`
- Direct codebase analysis: `src/data/seed-door-hardware.ts` -- 12 items, 4 default sets, max 7 items per set

### Secondary (MEDIUM confidence)
- React 19 `memo` behavior with context: standard React behavior, well-documented

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, all existing dependencies
- Architecture: HIGH -- patterns derived directly from reading the existing 528-line TakeoffView.tsx
- Pitfalls: HIGH -- identified from actual code analysis (hook behavior, TypeScript strict mode, memo semantics)
- Code examples: HIGH -- based on exact existing patterns in the codebase

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (stable -- no external dependencies, internal codebase only)
