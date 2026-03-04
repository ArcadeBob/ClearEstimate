# Phase 2: Calculation Engine - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Pure calc functions for door hardware cost and smart hinge suggestion. Door hardware cost flows into materialCost, preserving C-033 (lineTotal = materialCost + laborCost + equipmentCost). No hooks, no UI, no state changes — those are Phases 3 and 4.

</domain>

<decisions>
## Implementation Decisions

### Smart hinge suggestion (CALC-03)
- Pure function: `suggestHingeCount(heightInches: number): number | null`
- Returns null for non-door system types (function handles the isDoorSystemType check internally via a systemTypeId parameter, or caller pre-checks — Claude's discretion on exact signature as long as non-doors return null)
- Thresholds: 2 for ≤60", 3 for 61-90", 4 for 91-120", cap at 4 for >120"
- Raw number input — accepts height in inches, not a LineItem object
- Pure suggestion only — no validation role. Phase 3 hooks decide when/if to apply it

### Door hardware cost field
- Add `doorHardwareCost` as a derived field on LineItem type
- Computed by calcFullLineItem, stored alongside materialCost, laborCost, equipmentCost
- doorHardwareCost is separate from generic hardware cost — both roll into materialCost
- materialCost = glassCost + frameCost + genericHardwareCost + doorHardwareCost
- Always recomputed by calcFullLineItem — no migration needed, it's a derived value like lineTotal
- Only adding doorHardwareCost — not breaking out glassCost/frameCost/genericHardwareCost as separate stored fields (minimal change)

### Door hardware cost formula (CALC-01)
- `doorHardwareCost = SUM(unitCost × qtyPerDoor × lineItem.quantity)` for each DoorHardwareEntry
- Look up unitCost from settings.doorHardware by hardwareId
- Skip entries where hardwareId is not found in settings (consistent with existing missing-reference pattern)

### Edge case handling
- Always compute doorHardware cost regardless of system type — if doorHardware entries exist, include the cost
- No isDoorSystemType gate on the cost calc — avoids silent data loss if estimator changes system type
- System type change behavior (clear/preserve doorHardware array) deferred to Phase 3 hooks
- Missing hardware IDs: skip the entry (filter out), contributes $0

### Claude's Discretion
- Exact function signature for suggestHingeCount (whether systemTypeId is a parameter or separate concern)
- Whether door hardware cost is a new calc module (door-hardware-calc.ts) or added to material-calc.ts
- How to integrate into calcFullLineItem orchestrator (parameter additions, lookup logic)
- verify-calc.ts assertion design and test scenarios
- Rounding approach for doorHardwareCost (follow existing pattern: round to 2 decimal places)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `isDoorSystemType()` in `src/calc/door-system-util.ts` — O(1) lookup via ReadonlySet, already exported from calc barrel
- `DoorHardwareEntry` type in `src/types/index.ts` — `{ hardwareId: string, quantity: number }`
- `Hardware` type — same shape for both generic and door hardware catalogs
- `calcMaterialCost()` in `src/calc/material-calc.ts` — currently handles glass + frame + generic hardware
- Rounding pattern: `Math.round(value * 100) / 100` for monetary values

### Established Patterns
- Calc functions are pure, take primitive/array params, return numbers
- `calcFullLineItem()` orchestrates all domain calcs — material, labor, equipment → lineTotal
- Hardware lookup: `settings.hardware.filter(h => lineItem.hardwareIds.includes(h.id))` for generic
- Door hardware catalog: `settings.doorHardware: Hardware[]` with `dhw-xxx` IDs
- Line item selections: `lineItem.doorHardware: DoorHardwareEntry[]` with `{ hardwareId, quantity }`
- Barrel re-export: all calc functions exported through `src/calc/index.ts`

### Integration Points
- `calcFullLineItem()` in `src/calc/line-total-calc.ts` — must add doorHardwareCost to materialCost computation
- `LineItem` type in `src/types/index.ts` — add `doorHardwareCost: number` derived field
- `src/calc/index.ts` — re-export new functions (suggestHingeCount, door hardware calc)
- `scripts/verify-calc.ts` — add new assertions for door hardware cost scenarios

</code_context>

<specifics>
## Specific Ideas

No specific requirements — follow existing calc module patterns. The formula and thresholds are fully defined in requirements CALC-01 and CALC-03.

</specifics>

<deferred>
## Deferred Ideas

- System type change clearing doorHardware entries — Phase 3 hook behavior
- Hinge count validation/warnings — not needed, suggestion only

</deferred>

---

*Phase: 02-calculation-engine*
*Context gathered: 2026-03-02*
