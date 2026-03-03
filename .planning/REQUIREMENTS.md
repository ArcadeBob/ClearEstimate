# Requirements: ClearEstimate — Door Hardware Selection

**Defined:** 2026-03-02
**Core Value:** Estimators can accurately price door hardware per line item without bloating the takeoff layout

## v1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Data Model

- [x] **DATA-01**: App includes 12 door hardware seed items (hinges, closer, handle/pull, lock/cylinder, panic device, pivots, threshold, weatherstrip, sweep, auto-operator, card reader, exit device) with per-unit pricing
- [x] **DATA-02**: Each door hardware selection stores per-item quantity (e.g., hinges=3, closer=1) separate from line item quantity
- [x] **DATA-03**: Each door system type (Swing, Sliding, Revolving) has a default hardware set that auto-populates on selection
- [x] **DATA-04**: Schema migration (v2->v3) adds door hardware fields to LineItem and settings while preserving all existing user data

### Calculation

- [ ] **CALC-01**: Door hardware cost = SUM(unitCost x qtyPerDoor x lineItem.quantity), rolled into materialCost
- [x] **CALC-02**: `isDoorSystemType()` utility correctly identifies door system types (sys-007, sys-008, sys-009)
- [ ] **CALC-03**: Smart hinge count suggestion based on door height (2 for <=60", 3 for 61-90", 4 for 91-120")

### User Interface

- [ ] **UI-01**: Default hardware auto-populates when door system type is first selected (only when doorHardware is empty)
- [ ] **UI-02**: Estimator can add/remove individual hardware items from the pre-filled defaults
- [ ] **UI-03**: Compact sub-row appears below door line items showing selected hardware with quantities and subtotal
- [ ] **UI-04**: Door hardware cost visible as a separate line in the expanded line item detail breakdown
- [ ] **UI-05**: "Reset to Defaults" button restores the default hardware set for the current door type

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhancements

- **ENH-01**: Custom one-off hardware items (name + cost + qty) for unusual spec requirements
- **ENH-02**: Hardware set templates -- save custom hardware sets and apply to future doors
- **ENH-03**: Duplicate door line item copies hardware selections (deep copy)
- **ENH-04**: Door hardware cost summary line in project running totals
- **ENH-05**: Bulk hardware override across multiple door line items

## Out of Scope

| Feature | Reason |
|---------|--------|
| Manufacturer catalog integration | Requires backend infrastructure; ClearEstimate is a localStorage SPA |
| Hardware specification sheets/submittals | Document management is a different product concern |
| Hardware supplier/vendor tracking | Procurement, not estimation -- different workflow |
| Fire rating/code compliance validation | Architect's responsibility; requires building code database |
| Door handing (left/right swing) | Affects installation, not estimation cost |
| Automatic pricing updates from web | Requires web scraping/API infrastructure |
| Full door schedule report (Div 08) | Specification document, not estimation output |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 1 | Complete |
| DATA-02 | Phase 1 | Complete |
| DATA-03 | Phase 1 | Complete |
| DATA-04 | Phase 1 | Complete |
| CALC-01 | Phase 2 | Pending |
| CALC-02 | Phase 1 | Complete |
| CALC-03 | Phase 2 | Pending |
| UI-01 | Phase 3 | Pending |
| UI-02 | Phase 3 | Pending |
| UI-03 | Phase 4 | Pending |
| UI-04 | Phase 4 | Pending |
| UI-05 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0

---
*Requirements defined: 2026-03-02*
*Last updated: 2026-03-02 after roadmap creation*
