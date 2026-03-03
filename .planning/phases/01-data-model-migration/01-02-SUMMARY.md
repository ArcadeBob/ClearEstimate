---
phase: 01-data-model-migration
plan: 02
subsystem: database
tags: [schema-migration, localStorage, seed-data, door-hardware]

# Dependency graph
requires:
  - phase: 01-data-model-migration/01
    provides: DoorHardwareEntry type, AppSettings.doorHardware, LineItem.doorHardware, SEED_DOOR_HARDWARE, isDoorSystemType
provides:
  - v3 schema migration (v1->v2->v3 sequential)
  - DEFAULT_SETTINGS wired with 12-item door hardware catalog
  - All test factories updated with doorHardware field
  - getUsageCount handles doorHardware referential integrity (C-008)
affects: [02-calc-engine, 03-hooks-behavior, 04-ui-components]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Sequential version migration (if version < N) pattern in migrateState()
    - Additive migration preserving existing user settings

key-files:
  created: []
  modified:
    - src/data/index.ts
    - src/storage/storage-service.ts
    - src/storage/storage-service.test.ts
    - src/calc/line-total-calc.test.ts
    - src/calc/summary-calc.test.ts
    - src/hooks/validate-line-item.test.ts
    - src/hooks/use-line-items.ts
    - src/hooks/use-settings.ts
    - src/data/seed-door-hardware.test.ts
    - scripts/verify-calc.ts

key-decisions:
  - "v2->v3 migration is additive: spread existing settings, overlay only doorHardware catalog"
  - "Migration uses any type for untyped localStorage JSON instead of Partial<LineItem>"
  - "Sequential migration pattern: each version step mutates local variables, final assignment at end"

patterns-established:
  - "Sequential migration: each version bump is an independent if (version < N) block, composable for future v4+"
  - "Additive migration: new settings fields merge into existing, never replace user-customized catalogs"

requirements-completed: [DATA-01, DATA-02, DATA-03, DATA-04, CALC-02]

# Metrics
duration: 4min
completed: 2026-03-02
---

# Plan 01-02: Schema Migration, Data Wiring, and Existing Code Fixes Summary

**v2-to-v3 additive schema migration wiring SEED_DOOR_HARDWARE into DEFAULT_SETTINGS with sequential upgrade path and all 136 tests passing**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-03T05:03:08Z
- **Completed:** 2026-03-03T05:07:44Z
- **Tasks:** 4
- **Files modified:** 10

## Accomplishments
- Wired 12-item door hardware catalog into DEFAULT_SETTINGS and bumped schema to v3
- Implemented sequential v1->v2->v3 migration preserving existing user settings (additive for v2->v3)
- Fixed all test factories across 5 files and the 37-assertion verify-calc script to include doorHardware field
- Added doorHardware referential integrity check in getUsageCount (C-008)

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire seed data into DEFAULT_SETTINGS and bump schema version** - `7b6d954` (feat)
2. **Task 2: Implement v2-to-v3 schema migration with tests** - `cbffc07` (feat)
3. **Task 3: Fix existing test factories and verify-calc script** - `d1dbc9a` (fix)
4. **Task 4: Add doorHardware case to getUsageCount** - `66f4aaf` (feat)

## Files Created/Modified
- `src/data/index.ts` - Import SEED_DOOR_HARDWARE, add to DEFAULT_SETTINGS, bump schemaVersion to 3
- `src/storage/storage-service.ts` - Sequential migrateState() with v2->v3 step, CURRENT_SCHEMA_VERSION=3
- `src/storage/storage-service.test.ts` - 3 new tests (v2->v3, v1->v3 sequential, empty default), updated existing to v3
- `src/calc/line-total-calc.test.ts` - Added doorHardware: [] to baseLineItem factory
- `src/calc/summary-calc.test.ts` - Added doorHardware: [] to lineItem factory
- `src/hooks/validate-line-item.test.ts` - Added doorHardware: [] to validItem factory
- `src/hooks/use-line-items.ts` - Added doorHardware: [] to addLineItem default
- `src/hooks/use-settings.ts` - Added doorHardware case to getUsageCount switch
- `src/data/seed-door-hardware.test.ts` - Fixed unused variable (prefixed with _)
- `scripts/verify-calc.ts` - Added doorHardware: [] to both LineItem objects

## Decisions Made
- v2->v3 migration uses spread to preserve existing settings and only overlays doorHardware -- matching the user decision that migration is ADDITIVE
- Changed migration line item type from `Partial<LineItem>` to `any` for untyped localStorage JSON to avoid TypeScript errors with the new required doorHardware field
- Sequential migration pattern with independent version checks allows future v4+ steps without refactoring

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed summary-calc.test.ts factory missing doorHardware**
- **Found during:** Task 3 (compile check)
- **Issue:** `src/calc/summary-calc.test.ts` lineItem factory was missing doorHardware, causing TS2322
- **Fix:** Added `doorHardware: []` to the factory
- **Files modified:** src/calc/summary-calc.test.ts
- **Verification:** TypeScript compiles clean
- **Committed in:** d1dbc9a (Task 3 commit)

**2. [Rule 3 - Blocking] Fixed use-line-items.ts addLineItem missing doorHardware**
- **Found during:** Task 3 (compile check)
- **Issue:** `src/hooks/use-line-items.ts` addLineItem was missing doorHardware property, causing TS2741
- **Fix:** Added `doorHardware: []` to the new LineItem default
- **Files modified:** src/hooks/use-line-items.ts
- **Verification:** TypeScript compiles clean
- **Committed in:** d1dbc9a (Task 3 commit)

**3. [Rule 1 - Bug] Fixed unused variable in seed-door-hardware.test.ts**
- **Found during:** Task 3 (compile check)
- **Issue:** `systemId` declared in destructuring but never read (TS6133)
- **Fix:** Prefixed with underscore: `_systemId`
- **Files modified:** src/data/seed-door-hardware.test.ts
- **Verification:** TypeScript compiles clean
- **Committed in:** d1dbc9a (Task 3 commit)

**4. [Rule 3 - Blocking] Fixed migration type incompatibility**
- **Found during:** Task 3 (compile check)
- **Issue:** `Partial<LineItem>` in v1->v2 migration block produced type error since doorHardware is now required
- **Fix:** Changed to `any` type (matching v2->v3 block pattern) and removed unused LineItem import
- **Files modified:** src/storage/storage-service.ts
- **Verification:** TypeScript compiles clean
- **Committed in:** d1dbc9a (Task 3 commit)

---

**Total deviations:** 4 auto-fixed (1 bug, 3 blocking)
**Impact on plan:** All auto-fixes necessary for TypeScript compilation. No scope creep. Two files (summary-calc.test.ts, use-line-items.ts) were not listed in the plan but needed doorHardware field for compile.

## Issues Encountered
None - all issues were straightforward type errors resolved by adding the doorHardware field.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 1 (Data Model & Migration) is complete
- All door hardware data structures, seed data, and migration logic exist
- The app can store and load door hardware selections without data loss
- Phase 2 (Calc Engine) can now implement door hardware cost calculations using DoorHardwareEntry and isDoorSystemType
- Phase 3 (Hooks Behavior) can implement auto-populate and add/remove logic

## Self-Check: PASSED

- FOUND: 01-02-SUMMARY.md
- FOUND: 7b6d954 (Task 1)
- FOUND: cbffc07 (Task 2)
- FOUND: d1dbc9a (Task 3)
- FOUND: 66f4aaf (Task 4)

---
*Phase: 01-data-model-migration*
*Completed: 2026-03-02*
