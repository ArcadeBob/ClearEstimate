---
phase: 03-state-behavior
plan: 01
subsystem: state
tags: [react-hooks, door-hardware, auto-populate, crud, tdd]

# Dependency graph
requires:
  - phase: 01-data-model-migration
    provides: DoorHardwareEntry type, DOOR_HARDWARE_DEFAULTS seed data, isDoorSystemType utility
  - phase: 02-calculation-engine
    provides: calcDoorHardwareCost, suggestHingeCount, calcFullLineItem orchestrator
  - phase: 05-integration-fixes
    provides: barrel exports for door hardware in src/calc/index.ts and src/data/index.ts
provides:
  - getDefaultDoorHardware() pure helper for default hardware lookup with smart hinge count
  - applyDoorHardwareAutoPopulate() pure helper for system type transition logic
  - Auto-populate wired into updateLineItem (UI-01)
  - useDoorHardware hook with add/remove/updateQty CRUD operations (UI-02)
affects: [04-ui-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: [pure-function-extraction-for-testing, shared-applyMutation-helper]

key-files:
  created:
    - src/calc/door-hardware-helpers.ts
    - src/calc/door-hardware-helpers.test.ts
    - src/hooks/use-door-hardware.ts
    - src/hooks/use-door-hardware.test.ts
  modified:
    - src/calc/index.ts
    - src/hooks/use-line-items.ts

key-decisions:
  - "Pure function extraction: applyDoorHardwareAutoPopulate extracted as pure testable function, called inline in updateLineItem (not useEffect)"
  - "Pure mutation functions: applyAddDoorHardware, applyRemoveDoorHardware, applyUpdateDoorHardwareQty exported for testing, hook is thin wrapper"
  - "Shared applyMutation helper in useDoorHardware centralizes recalc + VE cascade + timestamp logic"
  - "Direct file imports in door-hardware-helpers.ts to avoid circular dependency through barrel"

patterns-established:
  - "Pure function extraction pattern: Extract state mutation logic as exported pure functions, test independently, use in hook as thin wrapper"
  - "Shared applyMutation pattern: Centralize recalc + VE cascade + timestamp update in one callback"

requirements-completed: [UI-01, UI-02]

# Metrics
duration: 3min
completed: 2026-03-03
---

# Phase 3 Plan 01: Door Hardware State & Behavior Summary

**Pure auto-populate helpers and useDoorHardware CRUD hook wiring door hardware defaults, system type transitions, and add/remove/updateQty operations with calcFullLineItem recalc and VE cascade**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-04T05:16:33Z
- **Completed:** 2026-03-04T05:19:49Z
- **Tasks:** 2 (TDD: 4 commits per task = test + feat)
- **Files modified:** 6

## Accomplishments
- `getDefaultDoorHardware()` returns correct defaults for all 4 door types with height-based hinge adjustment (fallback to static default when height=0)
- `applyDoorHardwareAutoPopulate()` handles all 5 system type transition scenarios as a pure function, wired into `updateLineItem`
- `useDoorHardware` hook provides add/remove/updateQty with calcFullLineItem recalc, VE cascade (C-015), and timestamp updates
- 25 new tests (14 helper tests + 11 hook tests), all 182 tests pass, TypeScript clean, 46 verify assertions pass

## Task Commits

Each task was committed atomically (TDD: RED then GREEN):

1. **Task 1 RED: door-hardware-helpers tests** - `95f80ce` (test)
2. **Task 1 GREEN: door-hardware-helpers + auto-populate in updateLineItem** - `6df8e92` (feat)
3. **Task 2 RED: useDoorHardware tests** - `906ae7c` (test)
4. **Task 2 GREEN: useDoorHardware CRUD hook** - `883d49a` (feat)

## Files Created/Modified
- `src/calc/door-hardware-helpers.ts` - Pure getDefaultDoorHardware and applyDoorHardwareAutoPopulate functions
- `src/calc/door-hardware-helpers.test.ts` - 14 tests covering defaults, hinge adjustment, deep copy, all transitions
- `src/hooks/use-door-hardware.ts` - useDoorHardware hook with add/remove/updateQty + pure mutation functions
- `src/hooks/use-door-hardware.test.ts` - 11 tests covering CRUD operations, no-ops, immutability
- `src/calc/index.ts` - Added barrel exports for getDefaultDoorHardware, applyDoorHardwareAutoPopulate
- `src/hooks/use-line-items.ts` - Wired applyDoorHardwareAutoPopulate into updateLineItem

## Decisions Made
- **Pure function extraction:** applyDoorHardwareAutoPopulate extracted as a pure testable function rather than inline logic in the hook. This follows the validateLineItem pattern and avoids useEffect anti-patterns identified in research.
- **Pure mutation functions for hook testing:** Exported applyAddDoorHardware, applyRemoveDoorHardware, applyUpdateDoorHardwareQty as pure functions to enable testing without React context. The hook is a thin wrapper.
- **Shared applyMutation helper:** Centralized the recalc + VE cascade + timestamp update pattern in a single useCallback to avoid code duplication across add/remove/updateQty.
- **Direct file imports:** door-hardware-helpers.ts imports from ./door-system-util and ./door-hardware-calc directly instead of through @/calc barrel to avoid circular dependencies.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Direct file imports to avoid circular dependency**
- **Found during:** Task 1 (door-hardware-helpers implementation)
- **Issue:** Plan specified importing from `@/calc` barrel, but door-hardware-helpers.ts is exported FROM that barrel, creating a circular import
- **Fix:** Used direct file imports: `./door-system-util` and `./door-hardware-calc`
- **Files modified:** src/calc/door-hardware-helpers.ts
- **Verification:** All tests pass, TypeScript compiles cleanly
- **Committed in:** 6df8e92

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Import path change necessary for correctness. No scope change.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All door hardware state management is complete and tested
- Phase 4 (UI Integration) can wire Takeoff view components directly to `useDoorHardware` hook and `useLineItems.updateLineItem` (which now auto-populates door hardware)
- No blockers or concerns

---
*Phase: 03-state-behavior*
*Completed: 2026-03-03*
