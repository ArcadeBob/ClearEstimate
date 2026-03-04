# Phase 3: State & Behavior - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Hook logic for auto-populating default door hardware when a door system type is selected, plus CRUD operations (add/remove/update quantity) for customizing hardware selections. No UI components — those are Phase 4. This phase delivers the state management layer that Phase 4's UI will call.

</domain>

<decisions>
## Implementation Decisions

### System type change behavior
- **Door-to-door change** (e.g., Swing → Sliding): Replace existing doorHardware with new door type's defaults. Customizations are lost — predictable behavior.
- **Door-to-non-door change** (e.g., Swing → Curtain Wall): Clear the doorHardware array entirely. Non-door systems shouldn't carry door hardware.
- **Non-door-to-door change** (e.g., Curtain Wall → Swing): Auto-populate with defaults. General rule: auto-populate fires whenever doorHardware array is empty AND a door type is selected (UI-01).
- **First selection of a door type**: Auto-populate with defaults (doorHardware is empty by default on new line items).

### Smart hinge integration
- Apply `suggestHingeCount()` during auto-populate only — not on every height change
- When height is 0 or not yet entered, fall back to the static default hinge quantity (3) from DOOR_HARDWARE_DEFAULTS
- Once auto-populated, user can manually change hinge quantity — it won't be auto-corrected on height changes
- suggestHingeCount() is called with the line item's current heightInches; if it returns null (out of range or non-door), use the default quantity from DOOR_HARDWARE_DEFAULTS

### CRUD operations
- **Add**: User can add any of the 12 door hardware items from settings.doorHardware catalog, not limited to the default set for their door type
- **Remove**: User can remove any hardware item from their selection
- **Quantity update**: Changing per-door quantity persists. Setting quantity to 0 removes the entry from the doorHardware array (no zero-quantity ghost entries)
- **No duplicates**: Each hardwareId appears at most once in a line item's doorHardware[]. Adding an already-present item is a no-op or updates its quantity

### Hook API shape
- New `useDoorHardware(projectId, lineItemId)` hook with: `addDoorHardware`, `removeDoorHardware`, `updateDoorHardwareQty`
- Auto-populate trigger fires inside `updateLineItem` when systemTypeId changes — detects door type change and applies defaults automatically
- Every door hardware mutation (add/remove/update qty) triggers `calcFullLineItem` recalculation — user always sees accurate cost totals
- Hook follows existing pattern: `useAppStore()` for state, `useCallback` for memoized operations

### Claude's Discretion
- Internal helper function structure (e.g., a pure `getDefaultDoorHardware()` function)
- Whether auto-populate logic is a standalone helper or inline in updateLineItem
- Test file organization (single test file vs per-function)
- Edge case handling for missing/invalid hardwareIds in add operations

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DOOR_HARDWARE_DEFAULTS` in `src/data/seed-door-hardware.ts` — Record<string, DoorHardwareEntry[]> with defaults for all 4 door types, exported from `@/data`
- `isDoorSystemType()` in `src/calc/door-system-util.ts` — O(1) lookup via ReadonlySet, exported from `@/calc`
- `suggestHingeCount()` in `src/calc/door-hardware-calc.ts` — pure function, returns number or null
- `calcFullLineItem()` in `src/calc/line-total-calc.ts` — orchestrator that computes all costs including doorHardwareCost
- `DoorHardwareEntry` type in `src/types/index.ts` — `{ hardwareId: string, quantity: number }`

### Established Patterns
- State management: `useAppStore()` provides `{ state, setState }`. Hooks call `setState(prev => ...)` with pure updater functions
- `updateLineItem` in `use-line-items.ts` merges updates, validates, then calls `calcFullLineItem` — auto-populate should follow same pattern
- VE cascade: `updateLineItem` already auto-updates VE alternate costs on every line item change (C-015)
- Settings CRUD: `use-settings.ts` has generic `addItem`/`updateItem`/`deleteItem` with referential integrity checks (C-008)
- New line items created with `doorHardware: []` and `doorHardwareCost: 0`

### Integration Points
- `updateLineItem` in `src/hooks/use-line-items.ts` — add auto-populate trigger when systemTypeId changes
- New `src/hooks/use-door-hardware.ts` — CRUD operations for door hardware entries
- `src/hooks/use-line-items.ts` — existing hook that new hook will complement (not extend)
- `src/calc/index.ts` — already exports isDoorSystemType and suggestHingeCount

</code_context>

<specifics>
## Specific Ideas

No specific requirements — follow existing hook patterns in the codebase. The behavior rules are fully defined in the decisions above.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-state-behavior*
*Context gathered: 2026-03-03*
