---
phase: 07-template-crud-in-settings
plan: 01
subsystem: ui
tags: [react, hooks, crud, settings, templates, hardware]

# Dependency graph
requires:
  - phase: 06-template-data-persistence
    provides: HardwareSetTemplate type, seed data, storage migration v4
provides:
  - useHardwareTemplates hook with full CRUD (add, rename, delete, toggle items, update quantities)
  - Templates tab in Settings with expand/collapse editing UI
  - Checkbox-based hardware selection with quantity inputs
affects: [08-template-application-to-line-items]

# Tech tracking
tech-stack:
  added: []
  patterns: [pure-function-mutation-testing, expand-collapse-list-pattern]

key-files:
  created:
    - src/hooks/use-hardware-templates.ts
    - src/hooks/use-hardware-templates.test.ts
  modified:
    - src/views/SettingsView.tsx

key-decisions:
  - "Followed pure mutation function pattern from use-door-hardware for testability without renderHook"
  - "Templates tab uses expand/collapse list pattern (not table) for nested hardware editing"
  - "Auto-incrementing name for new templates when 'New Template' already exists"

patterns-established:
  - "Expand/collapse list pattern: single expandedId state, click-to-toggle, inline editing in expanded area"
  - "Template CRUD via pure functions: applyAddTemplate, applyRenameTemplate, etc. exported for direct testing"

requirements-completed: [TMPL-01, TMPL-02, TMPL-03, TMPL-04]

# Metrics
duration: 3min
completed: 2026-03-04
---

# Phase 7 Plan 1: Template CRUD in Settings Summary

**useHardwareTemplates hook with name validation and TemplatesTab with expand/collapse checkbox editing of door hardware items**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-05T04:04:16Z
- **Completed:** 2026-03-05T04:07:55Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- useHardwareTemplates hook with 6 CRUD operations: addTemplate, renameTemplate, deleteTemplate, toggleTemplateItem, updateTemplateItemQuantity, plus templates getter
- 26 unit tests covering all mutation functions including validation edge cases (empty names, duplicates, quantity bounds)
- Templates tab in Settings (last position after Equipment) with expand/collapse pattern for inline editing
- Checkbox list of all 12 door hardware catalog items per template with quantity inputs

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Failing tests for useHardwareTemplates** - `b802d32` (test)
2. **Task 1 (GREEN): Implement useHardwareTemplates hook** - `c19c392` (feat)
3. **Task 2: Add Templates tab to SettingsView** - `b87854d` (feat)

## Files Created/Modified
- `src/hooks/use-hardware-templates.ts` - Hook with CRUD operations and pure mutation functions
- `src/hooks/use-hardware-templates.test.ts` - 26 tests for all mutation functions
- `src/views/SettingsView.tsx` - Added Templates tab with TemplatesTab component

## Decisions Made
- Followed existing pure function mutation pattern from use-door-hardware.ts for testability -- export applyX functions tested directly without needing renderHook or @testing-library/react
- TemplatesTab uses expand/collapse list (not table rows) since templates have nested hardware items that need a different layout than flat settings tables
- Auto-incrementing name handles the edge case where "New Template" already exists by trying "New Template (2)", (3), etc.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Templates tab fully functional with CRUD operations
- Ready for Phase 8: template application to line items (applying template hardware sets to door line items in Takeoff view)
- useHardwareTemplates hook API is stable and ready for consumption by template application UI

## Self-Check: PASSED

All files verified present. All commits verified in git log.

---
*Phase: 07-template-crud-in-settings*
*Completed: 2026-03-04*
