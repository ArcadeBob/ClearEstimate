# Milestones

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

