# Waste applied project-level to material subtotal only

- Status: accepted
- Date: 2026-02-25
- Tags: module-boundary, calc-engine, state-model
- Refs: SPEC.md §2.2/§2.5, D-02, D-11, C-028, C-029

## Context and Problem Statement

The Phase 1 calc engine had no waste factor. In real glazing estimates, material waste (cutting loss, breakage, spare inventory) is a standard cost adder.

The question is: at what granularity should waste be applied?

- Per material type (glass waste differs from frame waste)?
- Per line item?
- Per project (single % across all materials)?

And should waste apply to labor and equipment too?

## Decision

Waste is a **single project-level percentage** (`project.wastePct`, default 5%) applied to the **material subtotal only**, not to individual line items and not to labor or equipment.

```
wasteAmount = round2(materialSubtotal × wastePct)
```

This means `lineItem.materialCost` is the raw cost without waste. Waste appears as a separate line in the project-level cost breakdown, between the cost subtotals and contingency.

The `wastePct` field lives on `Project`, not on `LineItem`.

## Considered Alternatives

### A. Per-material-type waste rates
Different rates for glass (e.g., 3% breakage), frames (e.g., 7% cutting waste), and hardware (0%). Rejected because the user confirmed they use a single waste percentage applied to total materials. Per-type granularity adds complexity without matching their actual workflow.

### B. Per-line-item waste
Each line item carries its own waste factor. Rejected because waste is a project-level estimation assumption, not a per-opening decision. The user adjusts waste once per project based on project conditions.

### C. Waste on everything (materials + labor + equipment)
Apply waste to the total direct cost. Rejected because waste is a material concept — you don't waste labor hours or equipment days. Labor inefficiency is captured by the productivity factor and indirect time.

## Consequences

### Positive
- Matches the user's actual estimating workflow (single % for the project)
- Clean separation: waste = materials, productivity factor = labor, contingency = everything
- Simple to implement — one multiplication at the project summary level
- `lineItem.materialCost` stays clean (no embedded waste), making per-item comparisons meaningful

### Negative
- Cannot model different waste rates for glass vs. frames (acceptable per user interview)
- Waste amount is only visible at project level, not per line item
- If a future user needs per-material waste, requires a data model change on `Project` or a new `WasteConfig` type
