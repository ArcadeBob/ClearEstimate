# Requirements: ClearEstimate

**Defined:** 2026-03-04
**Core Value:** Accurate, fast glazing estimates that replace spreadsheet-based workflows

## v1.2 Requirements

Requirements for Custom Hardware & Bulk Apply milestone. Each maps to roadmap phases.

### Deep Copy

- [ ] **COPY-01**: Duplicating a door line item deep-copies its doorHardware entries (no shared references)
- [ ] **COPY-02**: Duplicating a project deep-copies doorHardware entries on all line items

### Custom Hardware Data

- [ ] **CHW-01**: Project interface includes customHardware field (Hardware[] with chw- prefix IDs)
- [ ] **CHW-02**: Schema migration v4→v5 adds customHardware: [] to each existing project
- [ ] **CHW-03**: User can add a custom hardware item (name + unit cost) in Project Setup view
- [ ] **CHW-04**: User can edit a custom hardware item's name and unit cost
- [ ] **CHW-05**: User can delete a custom hardware item not referenced by any line item
- [ ] **CHW-06**: Deleting a custom hardware item referenced by a line item shows an error with usage count

### Custom Hardware Integration

- [ ] **CHW-07**: Custom hardware items appear alongside catalog items in the door hardware panel add dropdown
- [ ] **CHW-08**: calcDoorHardwareCost resolves custom hardware unit costs via merged catalog (settings.doorHardware + project.customHardware)
- [ ] **CHW-09**: Templates can reference custom hardware IDs; stale/missing custom refs are silently filtered on apply (existing applyTemplate behavior)

### Bulk Template Application

- [ ] **BULK-01**: User can enter bulk-apply mode showing checkboxes next to door line items
- [ ] **BULK-02**: Non-door line items are excluded from bulk selection (isDoorSystemType filter)
- [ ] **BULK-03**: User can select a template and apply it to all selected door line items
- [ ] **BULK-04**: Bulk apply uses single setState call with batch recalculation (not N individual updates)

## Future Requirements

### Running Totals

- **TOT-01**: Door hardware cost summary line in project running totals

## Out of Scope

| Feature | Reason |
|---------|--------|
| Global custom hardware catalog | Custom hardware is project-specific; prices vary per job |
| Custom hardware import/export | No file I/O infrastructure (localStorage-only) |
| Drag-and-drop reordering in bulk select | Over-engineered for checkbox selection |
| Inline hardware editing during bulk apply | Defeats purpose of uniform application; edit individually after |
| Bulk apply confirmation dialog | Deferred; can add as polish if users request |
| Select all/none toggle | Deferred; not required for initial bulk apply |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| COPY-01 | — | Pending |
| COPY-02 | — | Pending |
| CHW-01 | — | Pending |
| CHW-02 | — | Pending |
| CHW-03 | — | Pending |
| CHW-04 | — | Pending |
| CHW-05 | — | Pending |
| CHW-06 | — | Pending |
| CHW-07 | — | Pending |
| CHW-08 | — | Pending |
| CHW-09 | — | Pending |
| BULK-01 | — | Pending |
| BULK-02 | — | Pending |
| BULK-03 | — | Pending |
| BULK-04 | — | Pending |

**Coverage:**
- v1.2 requirements: 15 total
- Mapped to phases: 0
- Unmapped: 15

---
*Requirements defined: 2026-03-04*
*Last updated: 2026-03-04 after initial definition*
