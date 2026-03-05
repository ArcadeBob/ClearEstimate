---
phase: 08-template-application-in-edit-panel
plan: 01
subsystem: ui
tags: [react, templates, dropdown, door-hardware, pure-function]

requires:
  - phase: 07-template-crud-in-settings
    provides: useHardwareTemplates hook and HardwareSetTemplate type
provides:
  - applyTemplate pure function for filtering stale hardware references
  - Template picker dropdown in DoorHardwarePanel for door line items
affects: []

tech-stack:
  added: []
  patterns: [pure-function stale-reference filtering, stateless select reset pattern]

key-files:
  created:
    - src/calc/template-apply.ts
    - src/calc/template-apply.test.ts
  modified:
    - src/calc/index.ts
    - src/views/TakeoffView.tsx

key-decisions:
  - "Stateless select (value='') resets to placeholder after each template application"
  - "Stale hardware references silently filtered rather than showing error"
  - "Template dropdown hidden entirely when no templates exist (not disabled)"

patterns-established:
  - "applyTemplate pure function: filter template items against catalog Set for O(1) lookup"

requirements-completed: [APPL-01, APPL-02, APPL-03]

duration: 2min
completed: 2026-03-04
---

# Phase 8 Plan 1: Template Application in Edit Panel Summary

**Template picker dropdown in DoorHardwarePanel with stale-reference filtering via applyTemplate pure function**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-05T04:57:55Z
- **Completed:** 2026-03-05T05:00:05Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created `applyTemplate` pure function that filters template items against the hardware catalog, silently dropping stale references
- Added template picker dropdown to DoorHardwarePanel that appears only when templates exist
- Selecting a template replaces doorHardware and triggers automatic cost recalculation via existing calcFullLineItem pipeline
- Full TDD coverage with 6 tests for all edge cases (valid, stale, empty, mixed)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create applyTemplate pure function with tests** - `9b949c7` (test)
2. **Task 2: Add template picker dropdown to DoorHardwarePanel** - `bb0dda4` (feat)

## Files Created/Modified
- `src/calc/template-apply.ts` - Pure function: applyTemplate(template, catalog) filters stale hardware refs
- `src/calc/template-apply.test.ts` - 6 tests covering valid, stale, empty, mixed scenarios
- `src/calc/index.ts` - Added applyTemplate barrel export
- `src/views/TakeoffView.tsx` - Template picker dropdown in DoorHardwarePanel, wired via useHardwareTemplates

## Decisions Made
- Stateless select pattern (value="" always) ensures dropdown resets to "Apply Template..." after each selection without needing React state
- Stale hardware references are silently filtered rather than showing user-facing errors, since catalog changes are rare and the result is still correct
- Dropdown is hidden entirely (not rendered) when no templates exist, keeping the UI clean for users who haven't created templates yet

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- v1.1 Hardware Set Templates milestone is complete
- All 8 requirements (TMPL-01 through TMPL-05, APPL-01 through APPL-03) are fulfilled
- Template management in Settings + template application in Takeoff are fully wired end-to-end

## Self-Check: PASSED

All files exist, all commits verified.

---
*Phase: 08-template-application-in-edit-panel*
*Completed: 2026-03-04*
