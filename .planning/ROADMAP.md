# Roadmap: ClearEstimate — Door Hardware Selection

## Overview

This milestone adds door-specific hardware selection to the Takeoff view. The build follows the existing codebase's strict layer dependencies: types and seed data first, then pure calc functions, then state hooks, then UI components. Each phase delivers a complete, testable layer that the next phase builds on. The dependency chain is linear — no phase can safely begin until the previous phase is complete and verified.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Data Model & Migration** - Types, seed data, default hardware sets, schema migration, and door type utility
- [ ] **Phase 2: Calculation Engine** - Pure calc function for door hardware cost and smart hinge suggestion
- [ ] **Phase 3: State & Behavior** - Hook logic for auto-populating defaults and add/remove CRUD operations
- [ ] **Phase 4: UI Components** - Sub-row display, detail panel breakdown, and reset-to-defaults button

## Phase Details

### Phase 1: Data Model & Migration
**Goal**: All door hardware data structures, seed data, and migration logic exist so that the app can store and load door hardware selections without data loss
**Depends on**: Nothing (first phase)
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, CALC-02
**Success Criteria** (what must be TRUE):
  1. App loads with 12 door hardware items available in seed data, each with a name and per-unit price
  2. A LineItem can hold a doorHardware array where each entry tracks both which hardware item and a per-item quantity (e.g., hinges=3)
  3. Each door system type (Swing, Sliding, Revolving, Entrance) has a distinct default hardware set defined in data
  4. Existing user data saved under schema v2 migrates to v3 without loss -- existing line items gain an empty doorHardware array, existing settings are preserved intact
  5. isDoorSystemType() correctly returns true for sys-006, sys-007, sys-008, sys-009 and false for all other system types

Plans:
- [x] 01-01: Types, Seed Data, and Door System Utility
- [ ] 01-02: Schema Migration, Data Wiring, and Existing Code Fixes

### Phase 2: Calculation Engine
**Goal**: Door hardware cost is computed correctly and flows into materialCost, preserving the C-033 invariant (lineTotal = materialCost + laborCost + equipmentCost)
**Depends on**: Phase 1
**Requirements**: CALC-01, CALC-03
**Success Criteria** (what must be TRUE):
  1. Door hardware cost computes as SUM(unitCost x qtyPerDoor x lineItem.quantity) and is included in materialCost -- e.g., 3 hinges at $15 on 2 doors = $90
  2. calcFullLineItem() returns a lineTotal that equals materialCost + laborCost + equipmentCost for door line items with hardware selected (C-033 preserved)
  3. Smart hinge count suggestion returns 2 for doors up to 60", 3 for 61-90", and 4 for 91-120" based on door height
  4. verify-calc.ts passes with new door hardware assertions alongside all existing 37 assertions
**Plans**: TBD

Plans:
- [ ] 02-01: TBD

### Phase 3: State & Behavior
**Goal**: Estimators get correct default hardware when selecting a door type, and can customize selections through hook-driven CRUD operations
**Depends on**: Phase 2
**Requirements**: UI-01, UI-02
**Success Criteria** (what must be TRUE):
  1. When an estimator selects a door system type on a line item for the first time, the default hardware set for that door type auto-populates (only when doorHardware array is empty -- never overwrites existing selections)
  2. Estimator can add a hardware item not in the defaults and remove any hardware item from the current selection, with the change persisting through save/reload
  3. Changing a hardware item's per-door quantity updates correctly and the new quantity persists through save/reload
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

### Phase 4: UI Components
**Goal**: Estimators can see and interact with door hardware selections directly in the Takeoff view without leaving the line item context
**Depends on**: Phase 3
**Requirements**: UI-03, UI-04, UI-05
**Success Criteria** (what must be TRUE):
  1. A compact sub-row appears below each door line item in the Takeoff view showing selected hardware items, their quantities, and a hardware subtotal -- sub-row does not appear for non-door line items
  2. Door hardware cost is visible as a distinct line in the expanded line item detail breakdown, separate from glass/frame/generic hardware costs
  3. A "Reset to Defaults" button restores the default hardware set for the current door type, replacing any customizations the estimator has made
  4. The sub-row layout remains compact enough that the Takeoff view stays printable without breaking page layout
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Data Model & Migration | 0/2 | Not started | - |
| 2. Calculation Engine | 0/1 | Not started | - |
| 3. State & Behavior | 0/1 | Not started | - |
| 4. UI Components | 0/2 | Not started | - |
