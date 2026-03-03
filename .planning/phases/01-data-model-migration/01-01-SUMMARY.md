---
phase: 01-data-model-migration
plan: 01
subsystem: database
tags: [typescript, types, seed-data, door-hardware]

# Dependency graph
requires:
  - phase: none
    provides: first plan in milestone
provides:
  - DoorHardwareEntry interface for per-item quantity tracking
  - LineItem.doorHardware and AppSettings.doorHardware type fields
  - 12 door hardware seed items (SEED_DOOR_HARDWARE)
  - 4 default hardware sets (DOOR_HARDWARE_DEFAULTS)
  - isDoorSystemType() utility and DOOR_SYSTEM_IDS constant
affects: [01-02, 02-calc-engine, 03-state-behavior, 04-ui-components]

# Tech tracking
tech-stack:
  added: []
  patterns: [door hardware dhw-xxx ID prefix, DoorHardwareEntry quantity-per-door pattern, ReadonlySet for constant ID lookup]

key-files:
  created:
    - src/data/seed-door-hardware.ts
    - src/data/seed-door-hardware.test.ts
    - src/calc/door-system-util.ts
    - src/calc/door-system-util.test.ts
  modified:
    - src/types/index.ts
    - src/calc/index.ts

key-decisions:
  - "DoorHardwareEntry uses hardwareId + quantity (not embedded Hardware object) to reference settings catalog"
  - "DOOR_SYSTEM_IDS is a ReadonlySet for O(1) lookup and immutability"

patterns-established:
  - "Door hardware IDs use dhw-xxx prefix (dhw-001 through dhw-012)"
  - "Default hardware sets keyed by system type ID in DOOR_HARDWARE_DEFAULTS record"
  - "isDoorSystemType() is the single source of truth for door type identification"

requirements-completed: [DATA-01, DATA-02, DATA-03, CALC-02]

# Metrics
duration: 2min
completed: 2026-03-02
---

# Plan 01-01: Types, Seed Data, and Door System Utility Summary

**DoorHardwareEntry interface, 12 seed hardware items with pricing, 4 default hardware sets per door type, and isDoorSystemType() utility with ReadonlySet lookup**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-03T04:58:28Z
- **Completed:** 2026-03-03T05:00:46Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Added DoorHardwareEntry interface and extended LineItem and AppSettings with doorHardware fields
- Created 12 door hardware seed items with commercial glazing contractor pricing defaults
- Defined 4 default hardware sets matching user-specified compositions for Swing, Sliding, Revolving, and Entrance door types
- Implemented isDoorSystemType() utility with DOOR_SYSTEM_IDS constant as single source of truth
- 20 new tests all passing across both test files

## Task Commits

Each task was committed atomically:

1. **Task 1: Add DoorHardwareEntry interface and extend types** - `26664e1` (feat)
2. **Task 2: Create door hardware seed data with 12 items and 4 defaults** - `64d9945` (feat)
3. **Task 3: Create isDoorSystemType() utility with tests** - `573b1c5` (feat)

## Files Created/Modified
- `src/types/index.ts` - Added DoorHardwareEntry interface, doorHardware fields on LineItem and AppSettings
- `src/data/seed-door-hardware.ts` - 12 seed hardware items and 4 default hardware sets
- `src/data/seed-door-hardware.test.ts` - 10 tests for seed data validation
- `src/calc/door-system-util.ts` - isDoorSystemType() and DOOR_SYSTEM_IDS constant
- `src/calc/door-system-util.test.ts` - 10 tests for door system type identification
- `src/calc/index.ts` - Added barrel export for isDoorSystemType and DOOR_SYSTEM_IDS

## Decisions Made
- DoorHardwareEntry references hardware by ID (not embedded) to allow catalog customization in Settings
- DOOR_SYSTEM_IDS uses ReadonlySet<string> for O(1) lookup and compile-time immutability

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Type interfaces ready for Plan 01-02 (schema migration, data wiring, existing code fixes)
- Seed data and defaults ready for Phase 3 hooks to auto-populate on door type selection
- isDoorSystemType() ready for Phase 2 calc engine and Phase 3 hook logic
- Expected type errors in existing files (missing doorHardware field) will be resolved in Plan 01-02

## Self-Check: PASSED

All 7 files verified present. All 3 task commits verified in git log. 20/20 tests passing.

---
*Phase: 01-data-model-migration*
*Completed: 2026-03-02*
