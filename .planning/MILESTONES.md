# Milestones

## v1.1 Hardware Set Templates (Shipped: 2026-03-04)

**Phases:** 3 | **Plans:** 3 | **Tasks:** 6
**Timeline:** 1 day (2026-03-04) | **Commits:** 12
**Files modified:** 13 (code) | **LOC:** 6,281 TypeScript (total)
**Code changes:** 936 insertions, 22 deletions
**Tests:** 224/224 passing | **Verify-calc:** 46/46 assertions
**Git range:** `feat(06-01)` to `feat(08-01)`

**Key accomplishments:**
1. HardwareSetTemplate type with 4 seed templates derived from existing door hardware defaults
2. v3→v4 additive storage migration preserving all user data
3. useHardwareTemplates hook with full CRUD (add, rename, delete, toggle items, update quantities)
4. Templates tab in Settings with expand/collapse hardware editing UI
5. Template picker dropdown in DoorHardwarePanel for instant template application
6. Stale-reference filtering via applyTemplate pure function

**Delivered:** Estimators can save custom door hardware configurations as reusable templates in Settings, then apply them to door line items via a dropdown picker — eliminating repetitive hardware selection across similar doors.

**Archives:**
- `milestones/v1.1-ROADMAP.md`
- `milestones/v1.1-REQUIREMENTS.md`
- `milestones/v1.1-MILESTONE-AUDIT.md`

---

## v1.0 Door Hardware Selection (Shipped: 2026-03-04)

**Phases:** 5 | **Plans:** 6 | **Tasks:** 15
**Timeline:** 10 days (2026-02-22 to 2026-03-04) | **Commits:** 44
**Files modified:** 49 | **LOC:** 5,344 TypeScript
**Tests:** 182/182 passing | **Verify-calc:** 46/46 assertions
**Git range:** `feat(01-01)` to `docs(phase-04)`

**Key accomplishments:**
1. Door hardware data model with 12 seed items, 4 default hardware sets per door type, and v2-to-v3 schema migration
2. Calculation engine with `calcDoorHardwareCost` and `suggestHingeCount` preserving C-033 lineTotal invariant
3. Integration fixes: barrel re-export of DOOR_HARDWARE_DEFAULTS and doorHardwareCost migration completeness
4. State hooks with auto-populate defaults on door type selection and CRUD operations (add/remove/updateQty)
5. UI components: compact sub-row with chips, editing panel with checkboxes, cost breakdown sub-lines, Reset to Defaults
6. All 12 requirements satisfied (DATA-01 through UI-05), verified by milestone audit

**Delivered:** Estimators can select a door system type, get auto-populated hardware defaults, customize selections, and see door hardware cost rolled into material cost with a compact sub-row display in the Takeoff view.

**Archives:**
- `milestones/v1.0-ROADMAP.md`
- `milestones/v1.0-REQUIREMENTS.md`
- `milestones/v1.0-MILESTONE-AUDIT.md`

---

