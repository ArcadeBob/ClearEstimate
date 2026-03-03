# Phase 2: Calculation Engine - Research

**Researched:** 2026-03-02
**Domain:** Pure calculation functions for door hardware cost and smart hinge suggestion
**Confidence:** HIGH

## Summary

Phase 2 adds two pure calculation functions to the existing calc engine: (1) a door hardware cost function that computes `SUM(unitCost x qtyPerDoor x lineItem.quantity)` and rolls it into `materialCost`, and (2) a smart hinge count suggestion based on door height thresholds. Both integrate into the existing `calcFullLineItem()` orchestrator in `line-total-calc.ts`.

The codebase is well-structured for this change. All data model work (types, seed data, migration) was completed in Phase 1. The `LineItem` type already has `doorHardware: DoorHardwareEntry[]`, `AppSettings` already has `doorHardware: Hardware[]` catalog, and `isDoorSystemType()` utility exists. The remaining work is purely computational: a new calc function, orchestrator integration, a suggestion function, a new derived field on `LineItem`, and verification assertions.

**Primary recommendation:** Create a new `door-hardware-calc.ts` module (following the existing one-module-per-concern pattern), wire it into `calcFullLineItem()`, add `doorHardwareCost` derived field to `LineItem`, and extend `verify-calc.ts` with door hardware assertions.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Pure function: `suggestHingeCount(heightInches: number): number | null` — returns null for non-door system types
- Thresholds: 2 for <=60", 3 for 61-90", 4 for 91-120", cap at 4 for >120"
- Raw number input — accepts height in inches, not a LineItem object
- Pure suggestion only — no validation role
- Add `doorHardwareCost` as a derived field on LineItem type
- Computed by calcFullLineItem, stored alongside materialCost, laborCost, equipmentCost
- doorHardwareCost is separate from generic hardware cost — both roll into materialCost
- materialCost = glassCost + frameCost + genericHardwareCost + doorHardwareCost
- Always recomputed by calcFullLineItem — no migration needed
- Only adding doorHardwareCost — not breaking out glassCost/frameCost/genericHardwareCost
- doorHardwareCost = SUM(unitCost x qtyPerDoor x lineItem.quantity) for each DoorHardwareEntry
- Look up unitCost from settings.doorHardware by hardwareId
- Skip entries where hardwareId is not found in settings
- Always compute doorHardware cost regardless of system type — if doorHardware entries exist, include the cost
- No isDoorSystemType gate on the cost calc
- Missing hardware IDs: skip the entry (filter out), contributes $0

### Claude's Discretion
- Exact function signature for suggestHingeCount (whether systemTypeId is a parameter or separate concern)
- Whether door hardware cost is a new calc module (door-hardware-calc.ts) or added to material-calc.ts
- How to integrate into calcFullLineItem orchestrator (parameter additions, lookup logic)
- verify-calc.ts assertion design and test scenarios
- Rounding approach for doorHardwareCost (follow existing pattern: round to 2 decimal places)

### Deferred Ideas (OUT OF SCOPE)
- System type change clearing doorHardware entries — Phase 3 hook behavior
- Hinge count validation/warnings — not needed, suggestion only
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CALC-01 | Door hardware cost = SUM(unitCost x qtyPerDoor x lineItem.quantity), rolled into materialCost | New `calcDoorHardwareCost()` function; orchestrator integration in `calcFullLineItem()` adds result to materialCost; `doorHardwareCost` derived field on LineItem |
| CALC-03 | Smart hinge count suggestion based on door height (2 for <=60", 3 for 61-90", 4 for 91-120") | New `suggestHingeCount()` pure function with height-based thresholds; returns null for non-door types |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.x (strict) | Type safety for calc functions | Already configured with `noUncheckedIndexedAccess: true` |
| Vitest | 4.x | Unit testing for calc modules | Already configured with `globals: true`, no imports needed |

### Supporting
No new libraries needed. This phase adds pure TypeScript functions with no external dependencies.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| New `door-hardware-calc.ts` module | Add to `material-calc.ts` | Separate module follows existing pattern (one concern per file: material-calc, labor-calc, equipment-calc). `material-calc.ts` already has glass+frame+hardware — adding door hardware there would mix two different hardware models (generic vs door-specific with per-item quantities). **Recommendation: new module.** |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/calc/
  door-hardware-calc.ts        # NEW: calcDoorHardwareCost, suggestHingeCount
  door-hardware-calc.test.ts   # NEW: unit tests
  line-total-calc.ts           # MODIFY: wire doorHardwareCost into orchestrator
  line-total-calc.test.ts      # MODIFY: add door hardware integration tests
  index.ts                     # MODIFY: re-export new functions
  door-system-util.ts          # EXISTING: isDoorSystemType (used by suggestHingeCount)
src/types/
  index.ts                     # MODIFY: add doorHardwareCost to LineItem
scripts/
  verify-calc.ts               # MODIFY: add door hardware assertions
```

### Pattern 1: Pure Calc Function (matches existing equipment-calc, material-calc)
**What:** A pure function that takes primitive/array params and returns a number.
**When to use:** All calc functions in this project follow this pattern.
**Example:**
```typescript
// Source: existing pattern in src/calc/equipment-calc.ts
export function calcDoorHardwareCost(
  doorHardwareEntries: DoorHardwareEntry[],
  doorHardwareCatalog: Hardware[],
  quantity: number,
): number {
  const total = doorHardwareEntries.reduce((sum, entry) => {
    const hw = doorHardwareCatalog.find(h => h.id === entry.hardwareId)
    if (!hw) return sum  // skip missing hardware IDs
    return sum + hw.unitCost * entry.quantity * quantity
  }, 0)
  return Math.round(total * 100) / 100
}
```

### Pattern 2: Orchestrator Integration (matches existing calcFullLineItem flow)
**What:** The orchestrator calls domain-specific calc functions and assembles the result.
**When to use:** `calcFullLineItem()` is the single point where all calcs are wired together.
**Example:**
```typescript
// Source: existing pattern in src/calc/line-total-calc.ts
// Door hardware cost lookup happens inside calcFullLineItem, similar to generic hardware:
// const selectedHardware = settings.hardware.filter(h => lineItem.hardwareIds.includes(h.id))
// Door hardware needs settings.doorHardware catalog passed to calcDoorHardwareCost
const doorHardwareCost = calcDoorHardwareCost(
  lineItem.doorHardware,
  settings.doorHardware,
  lineItem.quantity,
)
// materialCost now includes door hardware cost
const materialCost = calcMaterialCost(...) // existing glass+frame+generic hw
const totalMaterialCost = Math.round((materialCost + doorHardwareCost) * 100) / 100
```

### Pattern 3: Suggestion Function (matches existing suggestOPPercents, shouldSuggestEquipment)
**What:** A pure function that returns a suggested value, not a mandatory one. Callers decide whether to apply.
**When to use:** Smart defaults that can be overridden.
**Example:**
```typescript
// Source: existing pattern in src/calc/op-suggest.ts
export function suggestHingeCount(heightInches: number, systemTypeId: string): number | null {
  if (!isDoorSystemType(systemTypeId)) return null
  if (heightInches <= 60) return 2
  if (heightInches <= 90) return 3
  return 4  // 91-120" and above, cap at 4
}
```

### Anti-Patterns to Avoid
- **Mutating the LineItem:** All calc functions return new objects, never mutate inputs. The `{ ...lineItem, ...computed }` spread pattern in `calcFullLineItem` is correct.
- **Gating doorHardwareCost on system type:** Per user decision, always compute if entries exist. No `isDoorSystemType` check around cost calc.
- **Embedding lookup logic in the calc function:** The calc function should receive the catalog array, not the full settings object. Keeps it pure and testable.
- **Adding doorHardwareCost to lineTotal formula:** No. `doorHardwareCost` rolls into `materialCost`. The C-033 invariant (`lineTotal = materialCost + laborCost + equipmentCost`) remains unchanged because `materialCost` absorbs it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Currency rounding | Custom rounding logic | `Math.round(value * 100) / 100` pattern | Already used everywhere in the codebase. Consistent with C-042. |
| Door system type check | Inline string comparison | `isDoorSystemType()` from `door-system-util.ts` | Already exists, uses ReadonlySet for O(1) lookup |

**Key insight:** This phase is pure arithmetic and lookup logic. No complex algorithms, no external dependencies. The main risk is integration correctness (wiring into orchestrator, preserving C-033).

## Common Pitfalls

### Pitfall 1: Breaking the C-033 Invariant
**What goes wrong:** Adding `doorHardwareCost` as a separate term in `lineTotal` instead of folding it into `materialCost` would violate C-033 (`lineTotal = materialCost + laborCost + equipmentCost`).
**Why it happens:** Confusion about where door hardware cost lands in the formula hierarchy.
**How to avoid:** `doorHardwareCost` is added to the `materialCost` value, not to `lineTotal` directly. The `lineTotal` formula stays unchanged.
**Warning signs:** If a test expects `lineTotal = materialCost + laborCost + equipmentCost + doorHardwareCost`, something is wrong.

### Pitfall 2: Double-Counting Door Hardware Cost in materialCost
**What goes wrong:** If `calcMaterialCost()` is modified to also include door hardware, AND `calcFullLineItem()` adds `doorHardwareCost` separately, the cost is double-counted.
**Why it happens:** Unclear ownership of the door hardware computation.
**How to avoid:** `calcMaterialCost()` is NOT modified. Door hardware cost is computed separately by `calcDoorHardwareCost()` and added to `materialCost` in the orchestrator.
**Warning signs:** Seeing door hardware lookup logic in both `material-calc.ts` and `line-total-calc.ts`.

### Pitfall 3: Forgetting to Add doorHardwareCost to LineItem Type
**What goes wrong:** The derived field `doorHardwareCost: number` must be added to the `LineItem` interface. Without it, TypeScript won't allow the orchestrator to set it, and downstream consumers can't read it.
**Why it happens:** Easy to add the calc logic but forget the type change.
**How to avoid:** Add `doorHardwareCost: number` to the `LineItem` interface first, then implement the calc.
**Warning signs:** TypeScript errors in `calcFullLineItem` when trying to spread `doorHardwareCost` into the return object.

### Pitfall 4: Rounding Before Summation
**What goes wrong:** Rounding each hardware entry's cost before summing can produce different results than summing then rounding.
**Why it happens:** Defensive rounding at every step.
**How to avoid:** Sum all `unitCost * entry.quantity * quantity` values first, then round the final total once to 2 decimal places. This matches the existing `calcMaterialCost` pattern (single `Math.round()` at the end).
**Warning signs:** Penny discrepancies in tests with multiple hardware entries.

### Pitfall 5: noUncheckedIndexedAccess with .find()
**What goes wrong:** `doorHardwareCatalog.find(h => h.id === entry.hardwareId)` returns `Hardware | undefined` due to `noUncheckedIndexedAccess`. Forgetting to handle `undefined` causes TypeScript errors.
**Why it happens:** Strict TypeScript config.
**How to avoid:** The user decision already says "skip entries where hardwareId is not found." The `find()` result is checked, and missing entries contribute $0.
**Warning signs:** TypeScript error about possibly undefined value being used in arithmetic.

### Pitfall 6: Existing Test Fixtures Missing doorHardwareCost
**What goes wrong:** Existing test factories (`baseLineItem()` in `line-total-calc.test.ts`, inline `LineItem` objects in `verify-calc.ts`, `summary-calc.test.ts`) don't include `doorHardwareCost`. After adding it to the type, these fixtures need updating.
**Why it happens:** The new field is required on `LineItem`.
**How to avoid:** Add `doorHardwareCost: 0` to all existing test fixtures. It defaults to 0 for non-door items, so existing assertions remain unchanged.
**Warning signs:** TypeScript compile errors in test files about missing property `doorHardwareCost`.

## Code Examples

Verified patterns from the existing codebase:

### Door Hardware Cost Calculation
```typescript
// Recommended implementation — follows existing calc patterns
// File: src/calc/door-hardware-calc.ts

import type { DoorHardwareEntry, Hardware } from '@/types'
import { isDoorSystemType } from './door-system-util'

/**
 * Computes door hardware cost (CALC-01).
 * doorHardwareCost = SUM(unitCost x qtyPerDoor x lineItem.quantity)
 * Skips entries with missing hardware IDs (contributes $0).
 * No system type gate — if entries exist, include the cost.
 */
export function calcDoorHardwareCost(
  doorHardwareEntries: DoorHardwareEntry[],
  doorHardwareCatalog: Hardware[],
  quantity: number,
): number {
  const total = doorHardwareEntries.reduce((sum, entry) => {
    const hw = doorHardwareCatalog.find(h => h.id === entry.hardwareId)
    if (!hw) return sum
    return sum + hw.unitCost * entry.quantity * quantity
  }, 0)
  return Math.round(total * 100) / 100
}

/**
 * Smart hinge count suggestion based on door height (CALC-03).
 * Returns null for non-door system types.
 * Pure suggestion — Phase 3 hooks decide when/if to apply.
 */
export function suggestHingeCount(
  heightInches: number,
  systemTypeId: string,
): number | null {
  if (!isDoorSystemType(systemTypeId)) return null
  if (heightInches <= 60) return 2
  if (heightInches <= 90) return 3
  return 4  // 91-120" and above, capped at 4
}
```

### Orchestrator Integration
```typescript
// Modification to calcFullLineItem in src/calc/line-total-calc.ts
// Add after existing material calc, before lineTotal computation

import { calcDoorHardwareCost } from './door-hardware-calc'

// ... existing code ...

// Material (existing)
const sqft = calcSqft(lineItem.widthInches, lineItem.heightInches, lineItem.quantity)
const perimeter = calcPerimeter(lineItem.widthInches, lineItem.heightInches, lineItem.quantity)
const materialCost = calcMaterialCost(
  sqft, perimeter, glass.costPerSqft, frame.costPerLinFt, selectedHardware, lineItem.quantity,
)

// Door hardware (NEW)
const doorHardwareCost = calcDoorHardwareCost(
  lineItem.doorHardware,
  settings.doorHardware,
  lineItem.quantity,
)

// Total material cost includes door hardware
const totalMaterialCost = Math.round((materialCost + doorHardwareCost) * 100) / 100

// ... labor, equipment unchanged ...

// Total (C-033) — materialCost now includes doorHardwareCost
const lineTotal = Math.round((totalMaterialCost + laborCost + equipmentCost) * 100) / 100

return {
  ...lineItem,
  // ... existing fields ...
  materialCost: totalMaterialCost,  // now includes door hardware
  doorHardwareCost,                 // NEW derived field
  lineTotal,
}
```

### Type Addition
```typescript
// Addition to LineItem in src/types/index.ts
export interface LineItem {
  // ... existing fields ...
  doorHardwareCost: number     // NEW: derived by calcFullLineItem, included in materialCost
  doorHardware: DoorHardwareEntry[]
}
```

### Barrel Export
```typescript
// Addition to src/calc/index.ts
export { calcDoorHardwareCost, suggestHingeCount } from './door-hardware-calc'
```

### Verify-Calc Assertions Example
```typescript
// New section in scripts/verify-calc.ts

// Test: Door hardware cost with 3 hinges at $15 + 1 closer at $85 on 2 doors
// doorHardwareCost = (15 * 3 + 85 * 1) * 2 = (45 + 85) * 2 = 260.00
// This value rolls into materialCost in calcFullLineItem

// Test: suggestHingeCount thresholds
// 48" (<=60") -> 2
// 72" (61-90") -> 3
// 96" (91-120") -> 4
// 108" (91-120") -> 4
// Non-door system -> null
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Generic hardware: `unitCost x lineItem.quantity` | Door hardware: `unitCost x qtyPerDoor x lineItem.quantity` | Phase 2 (now) | Door hardware has per-item quantities (e.g., 3 hinges per door), unlike generic hardware which is 1-per-unit |

**Key distinction from generic hardware:** Generic hardware (`hw-xxx` IDs) uses `hardwareIds: string[]` and assumes quantity = 1 per hardware item per line item unit (C-016). Door hardware (`dhw-xxx` IDs) uses `doorHardware: DoorHardwareEntry[]` with explicit `quantity` per entry, allowing "3 hinges per door" vs "1 setting block per unit."

## Open Questions

1. **materialCost rounding: where to round?**
   - What we know: `calcMaterialCost()` rounds its return value. `calcDoorHardwareCost()` should also round its return value. The sum in the orchestrator is then `materialCost + doorHardwareCost`, which are both already rounded.
   - What's unclear: Should we round the combined `totalMaterialCost` again? Could introduce penny discrepancy.
   - Recommendation: Round `calcDoorHardwareCost()` output, then round the combined `totalMaterialCost`. This is safe because `round(a) + round(b)` can differ from `round(a + b)` by at most 1 cent, and `lineTotal` has its own final rounding. Follow the existing pattern where each calc function rounds independently.

2. **Test fixture updates across multiple files**
   - What we know: Adding `doorHardwareCost: number` to `LineItem` will require updating every inline `LineItem` object in test files and verify-calc.ts.
   - What's unclear: Exact count of fixtures to update.
   - Recommendation: Search for all `LineItem` object literals in tests and add `doorHardwareCost: 0`. Files affected: `line-total-calc.test.ts`, `summary-calc.test.ts`, `validate-line-item.test.ts`, `storage-service.test.ts`, `verify-calc.ts`.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x with `globals: true` |
| Config file | `vite.config.ts` (unified Vite+Vitest) |
| Quick run command | `npx vitest run src/calc/door-hardware-calc.test.ts` |
| Full suite command | `npm test && npm run verify` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CALC-01 | doorHardwareCost = SUM(unitCost x qtyPerDoor x quantity) | unit | `npx vitest run src/calc/door-hardware-calc.test.ts` | Wave 0 |
| CALC-01 | doorHardwareCost rolls into materialCost via calcFullLineItem | unit | `npx vitest run src/calc/line-total-calc.test.ts` | Exists (extend) |
| CALC-01 | C-033 preserved: lineTotal = materialCost + laborCost + equipmentCost | unit | `npx vitest run src/calc/line-total-calc.test.ts` | Exists (extend) |
| CALC-01 | Missing hardware ID entries skipped (contribute $0) | unit | `npx vitest run src/calc/door-hardware-calc.test.ts` | Wave 0 |
| CALC-01 | verify-calc.ts: door hardware cost scenario (e.g., 3 hinges at $15 on 2 doors = $90) | script | `npm run verify` | Exists (extend) |
| CALC-03 | suggestHingeCount returns 2 for <=60" | unit | `npx vitest run src/calc/door-hardware-calc.test.ts` | Wave 0 |
| CALC-03 | suggestHingeCount returns 3 for 61-90" | unit | `npx vitest run src/calc/door-hardware-calc.test.ts` | Wave 0 |
| CALC-03 | suggestHingeCount returns 4 for 91-120" | unit | `npx vitest run src/calc/door-hardware-calc.test.ts` | Wave 0 |
| CALC-03 | suggestHingeCount returns 4 for >120" (cap) | unit | `npx vitest run src/calc/door-hardware-calc.test.ts` | Wave 0 |
| CALC-03 | suggestHingeCount returns null for non-door system types | unit | `npx vitest run src/calc/door-hardware-calc.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/calc/door-hardware-calc.test.ts && npx vitest run src/calc/line-total-calc.test.ts`
- **Per wave merge:** `npm test && npm run verify`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/calc/door-hardware-calc.test.ts` -- covers CALC-01, CALC-03 (new file)
- [ ] `doorHardwareCost: 0` added to all existing test fixtures -- prevents TypeScript errors after type change

## Sources

### Primary (HIGH confidence)
- `src/calc/line-total-calc.ts` -- current orchestrator implementation, verified by reading source
- `src/calc/material-calc.ts` -- existing material cost calc pattern, verified by reading source
- `src/calc/equipment-calc.ts` -- existing calc module pattern (pure function, round at end)
- `src/calc/door-system-util.ts` -- isDoorSystemType implementation, verified by reading source
- `src/types/index.ts` -- current LineItem and AppSettings types, verified by reading source
- `src/data/seed-door-hardware.ts` -- door hardware catalog (12 items, dhw-xxx IDs), verified by reading source
- `scripts/verify-calc.ts` -- current 37 assertions, all passing (verified by running `npm run verify`)
- `src/calc/line-total-calc.test.ts` -- existing orchestrator tests (11 tests), all passing
- `CONSTRAINTS.md` -- C-033 definition, verified by reading source

### Secondary (MEDIUM confidence)
- None needed -- all findings derived from source code inspection

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, pure TypeScript functions
- Architecture: HIGH -- follows existing calc module pattern exactly, all integration points read from source
- Pitfalls: HIGH -- identified from code inspection and type system constraints

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (stable -- no external dependencies)
