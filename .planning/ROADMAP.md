# Roadmap: ClearEstimate

## Milestones

- ✅ **v1.0 Door Hardware Selection** — Phases 1-5 (shipped 2026-03-04)
- 🚧 **v1.1 Hardware Set Templates** — Phases 6-8 (in progress)

## Phases

<details>
<summary>✅ v1.0 Door Hardware Selection (Phases 1-5) — SHIPPED 2026-03-04</summary>

- [x] Phase 1: Data Model & Migration (2/2 plans) — completed 2026-03-02
- [x] Phase 2: Calculation Engine (1/1 plans) — completed 2026-03-02
- [x] Phase 5: Integration Fixes (1/1 plans) — completed 2026-03-03
- [x] Phase 3: State & Behavior (1/1 plans) — completed 2026-03-03
- [x] Phase 4: UI Components (1/1 plans) — completed 2026-03-04

</details>

### 🚧 v1.1 Hardware Set Templates (In Progress)

**Milestone Goal:** Estimators can define a hardware set once and apply it to any door line item instantly

- [x] **Phase 6: Template Data & Persistence** - Type definitions, storage schema, and persistence plumbing for hardware set templates
- [ ] **Phase 7: Template CRUD in Settings** - Create, rename, edit, and delete hardware templates in the Settings view
- [ ] **Phase 8: Template Application in Edit Panel** - Dropdown picker to apply templates to door line items in the hardware editing panel

## Phase Details

### Phase 6: Template Data & Persistence
**Goal**: Hardware set template data model exists and persists across sessions
**Depends on**: Phase 5 (v1.0 complete — existing door hardware model and AppSettings in place)
**Requirements**: TMPL-05
**Success Criteria** (what must be TRUE):
  1. A HardwareSetTemplate type exists with name, hardware items, and quantities
  2. Templates are stored in AppSettings and survive browser refresh (localStorage)
  3. Schema migration preserves existing user data when upgrading to the new schema version
**Plans:** 1 plan

Plans:
- [x] 06-01-PLAN.md — Template types, seed data, storage migration v3->v4

### Phase 7: Template CRUD in Settings
**Goal**: Users can fully manage hardware set templates from the Settings view
**Depends on**: Phase 6
**Requirements**: TMPL-01, TMPL-02, TMPL-03, TMPL-04
**Success Criteria** (what must be TRUE):
  1. User can create a new template by naming it and selecting hardware items with quantities
  2. User can rename an existing template
  3. User can edit which hardware items and quantities are in an existing template
  4. User can delete a template
  5. All template changes persist immediately (visible after page reload)
**Plans:** 1 plan

Plans:
- [ ] 07-01-PLAN.md — Template CRUD hook and Settings Templates tab UI

### Phase 8: Template Application in Edit Panel
**Goal**: Users can apply a saved template to any door line item from the hardware editing panel
**Depends on**: Phase 7
**Requirements**: APPL-01, APPL-02, APPL-03
**Success Criteria** (what must be TRUE):
  1. A dropdown listing all saved templates appears in the door hardware editing panel
  2. Selecting a template replaces the line item's current hardware selection with the template's items and quantities
  3. User can modify individual hardware items after applying a template (template is a starting point, not locked)
  4. Material cost recalculates correctly after template application
**Plans**: TBD

Plans:
- [ ] 08-01: Template picker dropdown and apply behavior

## Progress

**Execution Order:**
Phases execute in numeric order: 6 → 7 → 8

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Data Model & Migration | v1.0 | 2/2 | Complete | 2026-03-02 |
| 2. Calculation Engine | v1.0 | 1/1 | Complete | 2026-03-02 |
| 5. Integration Fixes | v1.0 | 1/1 | Complete | 2026-03-03 |
| 3. State & Behavior | v1.0 | 1/1 | Complete | 2026-03-03 |
| 4. UI Components | v1.0 | 1/1 | Complete | 2026-03-04 |
| 6. Template Data & Persistence | v1.1 | 1/1 | Complete | 2026-03-04 |
| 7. Template CRUD in Settings | v1.1 | 0/1 | Not started | - |
| 8. Template Application in Edit Panel | v1.1 | 0/1 | Not started | - |
