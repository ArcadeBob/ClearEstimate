# Contract value formula with explicit order of operations

- Status: accepted
- Date: 2026-02-25
- Tags: api-contract, calc-engine, module-boundary
- Refs: SPEC.md §2.5, D-10, D-11, C-028-C-032, C-044, C-045

## Context and Problem Statement

The Phase 1 contract value formula was:
```
contractValue = adjustedSubtotal * (1 + OH%) * (1 + profit%)
```
where `adjustedSubtotal = subtotal - veSavings`. This was missing waste and contingency, and the order of operations (what gets included before O&P is applied) was implicit.

Sprint 1 adds three new cost components — material waste, contingency, and indirect labor time — that must be integrated into the formula. The order in which these are applied significantly affects the final number. For example, should O&P markup apply to the contingency amount? Should VE savings reduce the base before or after contingency is calculated?

These questions don't have universally "correct" answers — they're contractual decisions that affect bid pricing.

## Decision

Establish an explicit, documented order of operations for the project-level contract value calculation:

```
Step 1. materialSubtotal    = sum(lineItem.materialCost)
Step 2. laborSubtotal       = sum(lineItem.laborCost)
Step 3. equipmentSubtotal   = sum(lineItem.equipmentCost)
Step 4. wasteAmount         = round2(materialSubtotal * wastePct)
Step 5. subtotal            = materialSubtotal + laborSubtotal + equipmentSubtotal + wasteAmount
Step 6. contingencyAmount   = round2(subtotal * contingencyPct)
Step 7. veSavings           = sum(veAlternate.savings)
Step 8. adjustedSubtotal    = subtotal + contingencyAmount - veSavings
Step 9. contractValue       = round2(adjustedSubtotal * (1 + OH%) * (1 + profit%))
```

Key design decisions embedded in this order:
- **Waste is added to subtotal before contingency** — contingency covers the risk on the full cost including waste
- **Contingency is calculated before VE deductions** — VE is a voluntary cost reduction; contingency protects the full scope
- **VE is deducted after contingency, before O&P** — O&P is earned on the net amount the contractor will actually build
- **O&P is multiplicative** (unchanged from Phase 1): `* (1 + OH) * (1 + profit)`, not `* (1 + OH + profit)`
- **Indirect labor time is per-line-item**, baked into `totalManHours` before costing — it's not a project-level adder

The `lineTotal = materialCost + laborCost + equipmentCost` formula explicitly excludes waste, contingency, and O&P. These are project-level concerns only.

## Considered Alternatives

### A. VE deducted before contingency
`adjustedSubtotal = (subtotal - veSavings) + contingency`. This means contingency is calculated on the reduced scope. Rejected because VE alternates are optional deductions offered to the owner — the contractor needs contingency on the full scope in case VE items are rejected.

### B. Contingency after O&P
Apply contingency as a final markup on the contract value. Rejected because contingency is a cost buffer, not a fee — it should be inside the O&P calculation so the contractor earns margin on it.

### C. Waste per line item (embedded in materialCost)
Apply waste inside `calcMaterialCost()` per line. Rejected per the waste ADR. This would also mean `lineTotal` includes waste, making per-item costs harder to compare.

### D. Additive O&P: `* (1 + OH + profit)`
Single multiplication instead of two. Rejected because the multiplicative model `* (1 + OH) * (1 + profit)` means profit is earned on the overhead (standard industry practice for glazing contractors). The difference is small but matches the user's existing spreadsheet formula.

## Consequences

### Positive
- Explicit, auditable formula — anyone reading `summary-calc.ts` knows exactly what happens and in what order
- Constraint C-044 documents the order; verification script tests the exact numbers
- Each component (waste, contingency, VE) is a visible, separate line in the UI cost breakdown
- Matches the user's mental model from their spreadsheet workflow

### Negative
- The formula is opaque to end users who don't read the breakdown — the final contract value is a function of 6+ inputs
- Changing the order of operations (e.g., for a different contract type) requires code changes, not configuration
- The SOV contingency row calculation differs based on `showContingencyInSov` toggle — when hidden, contingency is distributed proportionally across rows, adding complexity to `summary-calc.ts`
- Penny rounding discrepancies are possible between the sum of SOV rows and the grand total (accepted per C-018)
