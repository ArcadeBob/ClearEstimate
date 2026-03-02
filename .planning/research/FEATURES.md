# Feature Research: Door Hardware in Glazing Estimation

**Domain:** Commercial glazing estimation -- door hardware selection and pricing
**Researched:** 2026-03-02
**Confidence:** MEDIUM (based on competitor product descriptions, industry hardware specification standards, and domain knowledge of existing ClearEstimate codebase; no direct hands-on access to competitor tools)

## Feature Landscape

### Table Stakes (Users Expect These)

Features estimators assume exist. Missing these = the door hardware feature is unusable.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Door hardware seed data by category | Estimators need a starting catalog of standard items (hinges, closers, handles, locks, panic devices, thresholds, weatherstrip, sweeps, pivots, auto-operators) -- without seed data, every door is manual entry | LOW | 12 items per PROJECT.md; follow existing `seed-hardware.ts` pattern. Each item needs: id, name, unitCost, category, defaultQtyPerDoor |
| Per-item quantity per door | Doors need 3 hinges but 1 closer -- the existing flat `hardwareIds[]` with 1:1 quantity model (C-016) does not work for doors | MEDIUM | New data structure: `{ hardwareItemId, qtyPerDoor }` on a door hardware selection. Multiplied by line item `quantity` for total cost. This is the core model change. |
| Default hardware sets per door type | When estimator selects Swing Door (sys-009), auto-populate hinges(3) + closer(1) + handle(1) + lock(1) + threshold(1) + weatherstrip(1). Different defaults for Sliding (sys-008) and Revolving (sys-007). Saves 2-3 minutes per door line item. | MEDIUM | Mapping from systemTypeId to array of `{ hardwareItemId, defaultQty }`. Entrance System (sys-006) also needs a default set. |
| Add/remove items from defaults | Estimator must be able to deselect defaulted items (e.g., remove lock from an interior door) or add items not in the default set (e.g., add card reader to an exterior door) | LOW | UI concern: checkboxes or add/remove buttons on the sub-row. Defaults are a starting point, not locked. |
| Hardware cost rolls into material cost | Consistent with existing calc pipeline (C-002, C-033). Door hardware cost = SUM(unitCost x qtyPerDoor x lineItem.quantity) added to materialCost. | LOW | Extend `calcMaterialCost()` in `material-calc.ts`. Must not break existing generic hardware path for non-door items. |
| Sub-row UI for door hardware | The main takeoff row cannot fit hardware detail without breaking print layout. A collapsible sub-row below door line items shows selected hardware in compact format. | MEDIUM | Existing expandable row pattern (I-001) can be extended. Only visible for door system types. Must render compactly for printability. |
| Custom one-off hardware items | Covers unusual specs (e.g., a specific mag-lock model or decorative pull at a quoted price) without bloating seed data. Estimator enters name + unit cost + quantity. | LOW | Stored on the line item, not in global settings. Simple name/cost/qty tuple. |
| Hardware cost visible in line item detail | Estimator needs to see hardware subtotal within the line item breakdown (separate from glass and frame costs) to verify the number makes sense | LOW | Display-only: show hardware cost line in the expandable detail panel alongside glass cost, frame cost, labor, equipment |

### Differentiators (Competitive Advantage)

Features that set ClearEstimate apart from spreadsheet workflows. Not required, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Smart quantity suggestion by door height | Industry standard: 2 hinges for doors up to 60", 3 for 61-90", 4 for 91-120". Auto-suggest hinge quantity based on `heightInches` saves mental math and reduces errors. | LOW | Simple conditional logic on `heightInches`. Suggestion only -- estimator can override. Only applies to hinges. |
| Hardware set templates (saveable) | Let estimators save custom hardware sets (e.g., "Standard Interior Swing", "Secure Exterior with Card Reader") and apply them to future doors. Replicates the "assembly" concept from WinBidPro and On-Screen Takeoff. | MEDIUM | Stored in AppSettings alongside system types. A template is a named array of `{ hardwareItemId, qtyPerDoor }`. Different from defaults per door type -- these are user-created. |
| Hardware cost summary in project totals | Show total door hardware cost as a distinct line in the running totals sidebar (I-006). Helps estimators validate that hardware is a reasonable percentage of material cost (industry rule of thumb: 15-25% of door slab cost). | LOW | Derived value from summing door hardware across all line items. Display-only in summary. |
| Duplicate door line item copies hardware | When duplicating a door line item, the hardware selections (including custom items and overridden quantities) copy over. Saves re-entry for similar doors. | LOW | Extend existing duplicate logic. Deep-copy the door hardware array. |
| Bulk hardware override | Select multiple door line items and apply a hardware change to all (e.g., "add card reader to all exterior swing doors"). Saves time on large projects with many similar doors. | HIGH | Multi-select UI + batch update logic. Powerful but complex. Defer to v2. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems for ClearEstimate's scope and simplicity.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Manufacturer catalog integration | WinBidPro has real-time cloud catalogs with vendor pricing. Seems like a natural next step. | Massive scope: requires catalog ingestion, vendor API integration, pricing update infrastructure, and ongoing maintenance. ClearEstimate is a Phase 1 SPA with localStorage -- no backend. Vendor catalogs need server infrastructure. | Seed data with editable unit costs in Settings. Estimators update prices manually when they get new vendor quotes. This matches the existing pattern for glass types and frame systems. |
| Hardware specification sheets / submittals | Estimators sometimes want to attach spec sheets to hardware selections for submittals. | Turns the estimation tool into a document management system. File storage needs a backend (not localStorage). Completely different product concern. | Note field on custom hardware items. Link to external spec sheets via description text. |
| Hardware supplier/vendor tracking | Track which vendor supplies each hardware item, with purchase order generation. | This is procurement, not estimation. Different workflow, different users, different timing. Over-scoping a Phase 1 estimation tool. | Out of scope per PROJECT.md. Estimator just needs cost, not supply chain. |
| Fire rating / code compliance validation | Auto-validate that selected hardware meets fire rating requirements for the door's location. | Requires building code database, jurisdiction-specific rules, and legal liability concerns. No estimation tool does this well -- it is the architect's/spec writer's responsibility. | Descriptive note field. Estimator can annotate "fire-rated" on hardware items as a reminder. |
| Door handing (left/right swing) tracking | Track whether a door is left-hand or right-hand swing for hardware selection. | Handing affects installation, not estimation cost. A left-hand and right-hand closer cost the same. Adds complexity to the UI without affecting the bottom line. | Ignore for estimation purposes. Handing matters for ordering/scheduling, not cost estimation. |
| Automatic pricing updates from web | Auto-fetch current hardware prices from vendor websites. | Requires web scraping or API integration with each vendor. Fragile, vendor-specific, needs a backend. Pricing changes are infrequent enough that manual updates suffice. | Manual price editing in Settings, same as glass and frame costs. |
| Full door schedule report (Div 08 format) | Generate a CSI Division 08 formatted door/frame/hardware schedule. | This is a specification document, not an estimation output. Different format, different audience (architects vs. contractors), different level of detail. | Schedule of Values (SOV) already groups by system type. Hardware detail lives in the estimate, not a separate spec document. |

## Feature Dependencies

```
[Per-item quantity model]
    |
    +--requires--> [Door hardware seed data]
    |
    +--requires--> [Door hardware type on LineItem]
    |
    +--enables---> [Default hardware sets per door type]
    |                  |
    |                  +--enables---> [Add/remove from defaults]
    |                  |
    |                  +--enables---> [Smart qty suggestion by height]
    |
    +--enables---> [Custom one-off items]
    |
    +--enables---> [Hardware cost rolls into material cost]
                       |
                       +--enables---> [Hardware cost visible in detail]
                       |
                       +--enables---> [Hardware cost summary in totals]

[Sub-row UI]
    +--requires--> [Per-item quantity model]
    +--requires--> [Existing expandable row (I-001)]

[Hardware set templates]
    +--requires--> [Default hardware sets per door type]
    +--requires--> [Per-item quantity model]

[Duplicate door copies hardware]
    +--requires--> [Per-item quantity model]

[Bulk hardware override]
    +--requires--> [Per-item quantity model]
    +--requires--> [Multi-select UI (does not exist yet)]
```

### Dependency Notes

- **Per-item quantity model requires door hardware seed data:** The model needs items to reference. Seed data must exist first.
- **Per-item quantity model requires a door hardware field on LineItem:** New TypeScript type needed on the `LineItem` interface (e.g., `doorHardware?: DoorHardwareSelection[]`). Triggers schema version bump (B-005).
- **Default hardware sets require per-item quantity model:** Defaults are expressed as arrays of `{ hardwareItemId, qtyPerDoor }` -- the same structure as manual selections.
- **Sub-row UI requires per-item quantity model:** The UI renders what the model holds. Build model first, then UI.
- **Hardware set templates require default sets first:** Templates extend the defaults concept. Ship defaults first, templates are an enhancement.
- **Bulk hardware override conflicts with Phase 1 scope:** Requires multi-select UI that does not exist. Defer entirely.

## MVP Definition

### Launch With (v1 -- this milestone)

Minimum viable door hardware feature -- what's needed so estimators can accurately price doors.

- [ ] **Door hardware seed data** (12 items across categories) -- foundation for everything else
- [ ] **Per-item quantity model** on LineItem (`doorHardware: DoorHardwareSelection[]`) -- the core data model change
- [ ] **Default hardware sets per door type** (Swing, Sliding, Revolving, Entrance) -- saves estimator time, biggest workflow improvement
- [ ] **Add/remove from defaults** -- estimators must be able to customize
- [ ] **Custom one-off hardware items** -- covers edge cases without seed data bloat
- [ ] **Hardware cost in calcMaterialCost** -- the calculation must be correct
- [ ] **Sub-row UI** for door line items -- hardware must be visible and editable
- [ ] **Hardware cost visible in detail panel** -- estimator needs to verify numbers

### Add After Validation (v1.x)

Features to add once core door hardware is working and estimators confirm the workflow.

- [ ] **Smart hinge quantity by door height** -- add when estimators report manually adjusting hinge counts frequently
- [ ] **Hardware set templates** -- add when estimators start creating similar custom sets across projects
- [ ] **Duplicate door copies hardware** -- add when estimators report re-entering hardware on similar doors
- [ ] **Hardware cost summary in project totals** -- add when estimators ask for hardware cost visibility at project level

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Bulk hardware override** -- needs multi-select UI; only valuable on large projects with 20+ doors
- [ ] **Hardware grade/tier selection** -- Grade 1/2/3 pricing tiers; adds complexity for marginal value in estimation

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Door hardware seed data | HIGH | LOW | P1 |
| Per-item quantity model | HIGH | MEDIUM | P1 |
| Default hardware sets per door type | HIGH | MEDIUM | P1 |
| Add/remove from defaults | HIGH | LOW | P1 |
| Custom one-off hardware items | MEDIUM | LOW | P1 |
| Hardware cost in calc pipeline | HIGH | LOW | P1 |
| Sub-row UI | HIGH | MEDIUM | P1 |
| Hardware cost in detail panel | MEDIUM | LOW | P1 |
| Smart hinge qty by door height | MEDIUM | LOW | P2 |
| Hardware set templates | MEDIUM | MEDIUM | P2 |
| Duplicate door copies hardware | MEDIUM | LOW | P2 |
| Hardware cost in project summary | LOW | LOW | P2 |
| Bulk hardware override | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for launch (this milestone)
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | WinBidPro (GDS) | BidUnity | On-Screen Takeoff | CRL Online | ClearEstimate Approach |
|---------|-----------------|----------|-------------------|------------|----------------------|
| Hardware catalog | Cloud vendor catalogs with real-time updates, discount multipliers per vendor | System configuration with pre-defined assemblies | Pre-built assemblies, reusable templates | Integrated CRL product catalog | Editable seed data in Settings. Manual price updates. Matches existing glass/frame pattern. |
| Per-item quantities | Yes, via assembly components with spacing-based auto-count | Yes, built into system configuration | Yes, via assemblies with count formulas | Yes, within design tool | Per-item qty on door hardware selections. `qtyPerDoor x lineItem.quantity`. |
| Default sets | Assembly templates per framing system | Pre-defined system rules | Typical Areas/Groups for reuse | Pre-configured for CRL products | Default hardware set per door system type (Swing/Sliding/Revolving/Entrance). |
| Custom items | Parts list allows manual additions | Scope identification allows additions | Manual additions to assemblies | Limited to CRL catalog | Custom one-off items: name + cost + qty. Not stored globally. |
| Hardware visibility | Parts list view, final parts report | Construction proposal includes hardware detail | Integrated into takeoff view | Quote package with hardware | Sub-row below door line items. Hardware cost in detail panel. |
| Price management | Vendor multipliers, catalog-level pricing | Built into system config | Linked to cost databases | CRL catalog pricing | Unit cost editable per item in seed data. Simple and transparent. |

## Implementation Considerations for ClearEstimate

### Existing Code Impact

1. **`src/types/index.ts`**: Add `DoorHardware` interface and `DoorHardwareSelection` type. Add optional `doorHardware?: DoorHardwareSelection[]` to `LineItem`. Add `DoorHardware[]` to `AppSettings`.
2. **`src/data/seed-hardware.ts`**: Rename or extend. Existing generic hardware (setting blocks, glazing tape, etc.) stays. New door-specific hardware seed file needed.
3. **`src/calc/material-calc.ts`**: Extend `calcMaterialCost()` to accept door hardware selections and compute `SUM(unitCost x qtyPerDoor x quantity)`. Existing generic hardware path unchanged.
4. **`src/calc/line-total-calc.ts`**: `calcFullLineItem()` must pass door hardware data through to material calc.
5. **`src/storage/storage-service.ts`**: Schema version bump (B-005) for new `doorHardware` field on LineItem and new settings array.
6. **`src/views/TakeoffView.tsx`**: Sub-row rendering for door line items. Conditional on system type being a door type (sys-007, sys-008, sys-009, sys-006).

### Constraint Interactions

- **C-002** (hardware cost formula): Door hardware uses a different formula (`unitCost x qtyPerDoor x quantity` vs existing `unitCost x quantity`). Both must coexist. New constraint needed.
- **C-016** (hardware qty = lineItem.quantity): This is explicitly called a "Sprint 1 simplification." Door hardware supersedes this for door system types only. Generic hardware keeps C-016 behavior.
- **C-033** (lineTotal = material + labor + equipment): Unchanged. Door hardware flows through materialCost.
- **B-005** (schema versioning): Required. New field on LineItem.
- **B-007** (schema migration): Migration must handle existing line items with door system types that lack doorHardware field (default to empty array).

## Sources

- [GDS Estimating / WinBidPro](https://www.gdsestimating.com) -- competitor analysis, assembly/catalog model
- [WinBidPro v16 Documentation](https://docs.winbidpro.com/docs/intro/) -- parts list, component assemblies
- [BidUnity](https://bidunity.com/) -- system configuration and proposal generation model
- [CR Laurence Online Estimating](https://www.crlaurence.com/storefront-designs-office-partitions-construction-estimating-software) -- integrated catalog approach
- [On Center Software / On-Screen Takeoff](https://www.oncenter.com/sub-contractor/doors-hardware/) -- pre-built assemblies, door hardware counting
- [Construction Specifier: Door Hardware 101](https://www.constructionspecifier.com/door-hardware-101-the-basics-of-door-hardware-specifications/) -- hinge quantities by door height, hardware set composition
- [Park Avenue Locks: How to Estimate Door Hardware Costs](https://www.parkavenuelocks.com/blog/post/how-to-estimate-door-hardware-costs) -- typical hardware package costs ($250-$1000+)
- [Capital Build: Door/Frame/Hardware Schedule Guide](https://capitalbuildcon.com/door-frame-hardware-schedule-free-template/) -- Div 08 schedule structure, hardware categories
- [Ferguson: Commercial Door Hardware Guide](https://www.fergusonhome.com/commercial-door-hardware-guide/a24120) -- hardware types, grading system
- [Door Controls USA: Estimating for Contract Hardware](https://www.doorcontrolsusa.com/contract-hardware) -- industry standard: 5-10 hardware pieces per door opening

---
*Feature research for: Door hardware selection in commercial glazing estimation*
*Researched: 2026-03-02*
