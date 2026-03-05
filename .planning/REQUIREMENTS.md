# Requirements: ClearEstimate — Hardware Set Templates

**Defined:** 2026-03-04
**Core Value:** Estimators can define a hardware set once and apply it to any door line item instantly

## v1.1 Requirements

Requirements for hardware set templates milestone. Each maps to roadmap phases.

### Template Management

- [ ] **TMPL-01**: User can create a new hardware template with a name and selected hardware items + quantities in Settings
- [ ] **TMPL-02**: User can rename an existing hardware template in Settings
- [ ] **TMPL-03**: User can edit hardware items and quantities on an existing template in Settings
- [ ] **TMPL-04**: User can delete a hardware template in Settings
- [ ] **TMPL-05**: Templates persist in AppSettings across sessions (localStorage)

### Template Application

- [ ] **APPL-01**: User can select a template from a dropdown in the door hardware editing panel
- [ ] **APPL-02**: Applying a template replaces the line item's current hardware selection with the template's items and quantities
- [ ] **APPL-03**: User can modify hardware after applying a template (template is a starting point, not locked)

## Future Requirements

Deferred to later milestones. Tracked but not in current roadmap.

### Custom Hardware
- **CUST-01**: User can add custom one-off hardware items (name + cost + qty) for unusual spec requirements

### Productivity
- **PROD-01**: Duplicate door line item deep copies hardware selections
- **PROD-02**: Door hardware cost summary line in project running totals
- **PROD-03**: Bulk hardware override across multiple door line items

## Out of Scope

| Feature | Reason |
|---------|--------|
| Save as template from line item | Simplicity — manage templates in Settings only for v1.1 |
| Template sharing across browsers | No backend — localStorage is per-browser |
| Template import/export | Future — no file I/O infrastructure |
| Template versioning/history | Over-engineering for current needs |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TMPL-01 | — | Pending |
| TMPL-02 | — | Pending |
| TMPL-03 | — | Pending |
| TMPL-04 | — | Pending |
| TMPL-05 | — | Pending |
| APPL-01 | — | Pending |
| APPL-02 | — | Pending |
| APPL-03 | — | Pending |

**Coverage:**
- v1.1 requirements: 8 total
- Mapped to phases: 0
- Unmapped: 8 (pending roadmap creation)

---
*Requirements defined: 2026-03-04*
*Last updated: 2026-03-04 after initial definition*
