---
phase: 02-calculation-engine
plan: 01
subsystem: calc
tags: [door-hardware, hinge-suggestion, material-cost, tdd, pure-functions]

# Dependency graph
requires:
  - phase: 01-data-model-migration
    provides: DoorHardwareEntry type, doorHardware array on LineItem, doorHardware catalog on AppSettings, isDoorSystemType utility
provides:
  - calcDoorHardwareCost pure function computing SUM(unitCost x qtyPerDoor x quantity)
  - suggestHingeCount pure function returning hinge count by door height thresholds
  - doorHardwareCost derived field on LineItem
  - Door hardware cost integrated into materialCost via calcFullLineItem orchestrator
affects: [03-hooks-integration, 04-ui-components]

# Tech tracking
tech-stack:
  added: []
  patterns: [orchestrator-integration, derived-field-addition]

key-files:
  created:
    - src/calc/door-hardware-calc.ts
    - src/calc/door-hardware-calc.test.ts
  modified:
    - src/types/index.ts
    - src/calc/line-total-calc.ts
    - src/calc/line-total-calc.test.ts
    - src/calc/index.ts
    - src/calc/summary-calc.test.ts
    - src/hooks/validate-line-item.test.ts
    - src/hooks/use-line-items.ts
    - scripts/verify-calc.ts

key-decisions:
  - "Door hardware cost added in orchestrator (not calcMaterialCost) to preserve separation of concerns"
  - "materialCost = baseMaterialCost + doorHardwareCost, keeping C-033 lineTotal formula unchanged"

patterns-established:
  - "Orchestrator integration: new cost components are computed separately then combined in calcFullLineItem"
  - "Derived field pattern: doorHardwareCost stored on LineItem for visibility, included in materialCost for totaling"

requirements-completed: [CALC-01, CALC-03]

# Metrics
duration: 4min
completed: 2026-03-03
---

# Phase 02 Plan 01: Door Hardware Calc Summary

**calcDoorHardwareCost and suggestHingeCount pure functions with orchestrator integration, preserving C-033 lineTotal invariant**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-03T14:16:58Z
- **Completed:** 2026-03-03T14:21:14Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- calcDoorHardwareCost correctly computes SUM(unitCost x qtyPerDoor x quantity) with missing-ID skip
- suggestHingeCount returns 2/3/4 hinges by height thresholds, null for non-door types
- calcFullLineItem orchestrator includes doorHardwareCost in materialCost
- C-033 preserved: lineTotal = materialCost + laborCost + equipmentCost
- 157 tests pass (14 test files), 46 verify-calc assertions pass (9 new)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create door-hardware-calc module** - `2dd6f53` (feat)
2. **Task 2: Wire into orchestrator, fix fixtures, extend verify-calc** - `9a03f82` (feat)

**Plan metadata:** (pending final commit)

_Note: TDD tasks with RED/GREEN phases committed as single feat commits per task._

## Files Created/Modified
- `src/calc/door-hardware-calc.ts` - calcDoorHardwareCost and suggestHingeCount pure functions
- `src/calc/door-hardware-calc.test.ts` - 18 unit tests for CALC-01 and CALC-03
- `src/types/index.ts` - Added doorHardwareCost field to LineItem interface
- `src/calc/line-total-calc.ts` - Integrated door hardware cost into orchestrator
- `src/calc/line-total-calc.test.ts` - 3 new orchestrator integration tests (14 total)
- `src/calc/index.ts` - Barrel re-export of calcDoorHardwareCost, suggestHingeCount
- `src/calc/summary-calc.test.ts` - Fixed LineItem factory with doorHardwareCost field
- `src/hooks/validate-line-item.test.ts` - Fixed LineItem factory with doorHardwareCost field
- `src/hooks/use-line-items.ts` - Added doorHardwareCost: 0 to new line item defaults
- `scripts/verify-calc.ts` - Added 9 door hardware + hinge suggestion assertions

## Decisions Made
- Door hardware cost is added in the orchestrator (calcFullLineItem), not in calcMaterialCost, preserving separation of concerns and avoiding changes to the existing material-calc module
- materialCost in the return includes door hardware cost (totalMaterialCost = baseMaterialCost + doorHardwareCost) so C-033 lineTotal formula remains unchanged

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added doorHardwareCost to use-line-items.ts new item default**
- **Found during:** Task 2 (TypeScript lint check)
- **Issue:** TypeScript error TS2741 -- doorHardwareCost missing from new LineItem object in addLineItem hook
- **Fix:** Added `doorHardwareCost: 0` to the default LineItem object in use-line-items.ts
- **Files modified:** src/hooks/use-line-items.ts
- **Verification:** npm run lint compiles clean
- **Committed in:** 9a03f82 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential fix for TypeScript compilation. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- calcDoorHardwareCost and suggestHingeCount exported and ready for Phase 3 hook integration
- doorHardwareCost field available on LineItem for Phase 4 UI display
- All existing tests and assertions remain green -- no regressions

## Self-Check: PASSED

All 11 files verified present. Both task commits (2dd6f53, 9a03f82) confirmed in git log.

---
*Phase: 02-calculation-engine*
*Completed: 2026-03-03*
