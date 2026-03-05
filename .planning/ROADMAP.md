# Roadmap: ClearEstimate

## Milestones

- v1.0 Door Hardware Selection - Phases 1-5 (shipped 2026-03-04)
- v1.1 Hardware Set Templates - Phases 6-8 (shipped 2026-03-04)
- v1.2 Custom Hardware & Bulk Apply - Phases 9-13 (in progress)

## Phases

<details>
<summary>v1.0 Door Hardware Selection (Phases 1-5) - SHIPPED 2026-03-04</summary>

- [x] Phase 1: Data Model & Migration (2/2 plans) - completed 2026-03-02
- [x] Phase 2: Calculation Engine (1/1 plans) - completed 2026-03-02
- [x] Phase 5: Integration Fixes (1/1 plans) - completed 2026-03-03
- [x] Phase 3: State & Behavior (1/1 plans) - completed 2026-03-03
- [x] Phase 4: UI Components (1/1 plans) - completed 2026-03-04

</details>

<details>
<summary>v1.1 Hardware Set Templates (Phases 6-8) - SHIPPED 2026-03-04</summary>

- [x] Phase 6: Template Data & Persistence (1/1 plans) - completed 2026-03-04
- [x] Phase 7: Template CRUD in Settings (1/1 plans) - completed 2026-03-04
- [x] Phase 8: Template Application in Edit Panel (1/1 plans) - completed 2026-03-04

</details>

### v1.2 Custom Hardware & Bulk Apply (In Progress)

**Milestone Goal:** Let estimators add project-specific custom hardware items, deep-copy hardware on line item duplication, and bulk-apply templates to multiple doors at once.

- [ ] **Phase 9: Deep-Copy Fix** - Fix shallow-copy bug in line item and project duplication
- [ ] **Phase 10: Custom Hardware Data Model** - Type foundation and schema migration for project-level custom hardware
- [ ] **Phase 11: Custom Hardware CRUD & Calc** - Hook-based CRUD operations and calc pipeline integration
- [ ] **Phase 12: Custom Hardware UI** - User-visible custom hardware management and selection in door hardware panel
- [ ] **Phase 13: Bulk Template Application** - Multi-select door line items and apply templates in batch

## Phase Details

### Phase 9: Deep-Copy Fix
**Goal**: Duplicating door line items and projects produces fully independent copies with no shared references
**Depends on**: Nothing (standalone bug fix)
**Requirements**: COPY-01, COPY-02
**Success Criteria** (what must be TRUE):
  1. Duplicating a door line item produces a copy whose hardware entries can be modified without affecting the original
  2. Duplicating a project produces a copy where every door line item's hardware entries are independent from the source project
  3. Existing non-door line item duplication continues to work correctly
**Plans**: TBD

Plans:
- [ ] 09-01: TBD

### Phase 10: Custom Hardware Data Model
**Goal**: The data model supports project-level custom hardware items with safe schema migration from v4
**Depends on**: Phase 9
**Requirements**: CHW-01, CHW-02
**Success Criteria** (what must be TRUE):
  1. Project type includes a customHardware field that holds an array of Hardware items with chw- prefix IDs
  2. Opening the app with v4 schema data auto-migrates to v5 with an empty customHardware array on each project
  3. New projects are created with an empty customHardware array by default
**Plans**: TBD

Plans:
- [ ] 10-01: TBD

### Phase 11: Custom Hardware CRUD & Calc
**Goal**: Estimators can manage custom hardware items on a project and the calc pipeline resolves their costs correctly
**Depends on**: Phase 10
**Requirements**: CHW-03, CHW-04, CHW-05, CHW-06, CHW-08
**Success Criteria** (what must be TRUE):
  1. User can add a custom hardware item with a name and unit cost to a project
  2. User can edit the name and unit cost of an existing custom hardware item
  3. User can delete a custom hardware item that is not used by any line item
  4. Attempting to delete a custom hardware item referenced by a line item shows an error with the usage count
  5. calcDoorHardwareCost correctly resolves unit costs for custom hardware items via a merged catalog
**Plans**: TBD

Plans:
- [ ] 11-01: TBD

### Phase 12: Custom Hardware UI
**Goal**: Custom hardware items are visible and selectable alongside catalog items at the point of use in door hardware editing
**Depends on**: Phase 11
**Requirements**: CHW-07, CHW-09
**Success Criteria** (what must be TRUE):
  1. The door hardware panel's add dropdown shows custom hardware items alongside catalog items, visually distinguished
  2. Adding a custom hardware item to a door line item works identically to adding a catalog item (select, set quantity, see cost)
  3. Applying a template that references missing custom hardware IDs silently filters those entries without errors
**Plans**: TBD

Plans:
- [ ] 12-01: TBD

### Phase 13: Bulk Template Application
**Goal**: Estimators can select multiple door line items and apply a template to all of them in one action
**Depends on**: Phase 10
**Requirements**: BULK-01, BULK-02, BULK-03, BULK-04
**Success Criteria** (what must be TRUE):
  1. User can enter a bulk-apply mode that shows checkboxes next to door line items in the Takeoff view
  2. Non-door line items do not show checkboxes and cannot be selected
  3. User can select multiple door line items, choose a template, and apply it to all selected items at once
  4. After bulk apply, each affected line item has independently deep-copied hardware entries and correct recalculated costs
**Plans**: TBD

Plans:
- [ ] 13-01: TBD

## Progress

**Execution Order:** 9 -> 10 -> 11 -> 12 -> 13

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Data Model & Migration | v1.0 | 2/2 | Complete | 2026-03-02 |
| 2. Calculation Engine | v1.0 | 1/1 | Complete | 2026-03-02 |
| 5. Integration Fixes | v1.0 | 1/1 | Complete | 2026-03-03 |
| 3. State & Behavior | v1.0 | 1/1 | Complete | 2026-03-03 |
| 4. UI Components | v1.0 | 1/1 | Complete | 2026-03-04 |
| 6. Template Data & Persistence | v1.1 | 1/1 | Complete | 2026-03-04 |
| 7. Template CRUD in Settings | v1.1 | 1/1 | Complete | 2026-03-04 |
| 8. Template Application in Edit Panel | v1.1 | 1/1 | Complete | 2026-03-04 |
| 9. Deep-Copy Fix | v1.2 | 0/? | Not started | - |
| 10. Custom Hardware Data Model | v1.2 | 0/? | Not started | - |
| 11. Custom Hardware CRUD & Calc | v1.2 | 0/? | Not started | - |
| 12. Custom Hardware UI | v1.2 | 0/? | Not started | - |
| 13. Bulk Template Application | v1.2 | 0/? | Not started | - |

---
*Roadmap created: 2026-03-04*
*Last updated: 2026-03-04*
