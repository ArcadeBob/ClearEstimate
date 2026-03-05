---
phase: 06-template-data-persistence
plan: 01
subsystem: database
tags: [typescript, localstorage, migration, seed-data, hardware-templates]

# Dependency graph
requires:
  - phase: 05-integration-fixes
    provides: "Door hardware model (DoorHardwareEntry, DOOR_HARDWARE_DEFAULTS) and AppSettings with doorHardware"
provides:
  - "HardwareSetTemplate type in src/types/index.ts"
  - "SEED_HARDWARE_TEMPLATES constant (4 templates) in src/data/seed-hardware-templates.ts"
  - "AppSettings.hardwareTemplates field"
  - "v3->v4 localStorage migration adding hardwareTemplates to existing users"
affects: [07-template-crud-settings, 08-template-application-edit-panel]

# Tech tracking
tech-stack:
  added: []
  patterns: [additive-schema-migration, seed-data-from-defaults]

key-files:
  created:
    - src/data/seed-hardware-templates.ts
    - src/data/seed-hardware-templates.test.ts
  modified:
    - src/types/index.ts
    - src/data/index.ts
    - src/storage/storage-service.ts
    - src/storage/storage-service.test.ts

key-decisions:
  - "Templates derive items from DOOR_HARDWARE_DEFAULTS to stay in sync with default hardware selections"
  - "v3->v4 migration is purely additive -- only adds hardwareTemplates, no project or line item changes needed"

patterns-established:
  - "Hardware template ID format: hst-NNN (e.g., hst-001)"
  - "Additive migration pattern: spread defaults into settings without replacing existing data"

requirements-completed: [TMPL-05]

# Metrics
duration: 3min
completed: 2026-03-04
---

# Phase 6 Plan 01: Template Types, Seed Data, Storage Migration Summary

**HardwareSetTemplate type with 4 seed templates derived from DOOR_HARDWARE_DEFAULTS, persisted via v3-to-v4 additive localStorage migration**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-05T03:02:39Z
- **Completed:** 2026-03-05T03:06:02Z
- **Tasks:** 2 (TDD: 4 commits total)
- **Files modified:** 6

## Accomplishments
- HardwareSetTemplate interface added to types with id, name, and items (DoorHardwareEntry[])
- 4 seed templates (Entrance System, Revolving Door, Sliding Door, Swing Door) derived from existing DOOR_HARDWARE_DEFAULTS
- v3->v4 storage migration adds hardwareTemplates to existing user settings without touching projects or line items
- Full test suite green: 192 tests pass, 46 verification assertions pass, TypeScript compiles cleanly

## Task Commits

Each task was committed atomically (TDD: test then feat):

1. **Task 1: Define HardwareSetTemplate type, seed data, and wire into defaults**
   - `879c897` (test) - Failing tests for seed template structure and defaults
   - `77262f0` (feat) - Seed templates and DEFAULT_SETTINGS wiring

2. **Task 2: Add v3-to-v4 storage migration with tests**
   - `3eddc0f` (test) - Failing tests for schema version 4 and migration
   - `d311ffc` (feat) - CURRENT_SCHEMA_VERSION bump and v3->v4 migration block

## Files Created/Modified
- `src/types/index.ts` - Added HardwareSetTemplate interface and hardwareTemplates to AppSettings
- `src/data/seed-hardware-templates.ts` - New file: 4 seed templates from DOOR_HARDWARE_DEFAULTS
- `src/data/seed-hardware-templates.test.ts` - New file: 8 tests for template structure and defaults
- `src/data/index.ts` - Import/export SEED_HARDWARE_TEMPLATES, add to DEFAULT_SETTINGS, bump schemaVersion to 4
- `src/storage/storage-service.ts` - CURRENT_SCHEMA_VERSION 3->4, v3->v4 migration block
- `src/storage/storage-service.test.ts` - Updated 6 existing tests to expect v4, added 2 new migration tests

## Decisions Made
- Templates derive items from DOOR_HARDWARE_DEFAULTS to stay in sync with default hardware selections per door system type
- v3->v4 migration is purely additive (only adds hardwareTemplates field to settings) -- no project or line item modifications needed since templates are a new concept stored only in settings

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- HardwareSetTemplate type and seed data ready for Phase 7 (Template CRUD in Settings)
- AppSettings.hardwareTemplates array available for hooks to manage (create, update, delete)
- No blockers or concerns

## Self-Check: PASSED

All 6 files verified present. All 4 commit hashes verified in git log.

---
*Phase: 06-template-data-persistence*
*Completed: 2026-03-04*
