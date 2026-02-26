# Multiplicative condition factors with category mutual exclusivity

- Status: accepted
- Date: 2026-02-25
- Tags: module-boundary, calc-engine, state-model
- Refs: SPEC.md §1.3/§2.1, D-03, D-23, C-023, C-034, C-035, C-047

## Context and Problem Statement

Phase 1 conditions used **additive crew-day adjustments** (+0.5 days, -0.75 days). This was wrong in two ways:

1. **Additive adjustments don't scale.** A +0.5 day penalty on a 1-day task is huge (50%); on a 100-day task it's negligible (0.5%). Real productivity impacts are proportional.

2. **No category enforcement.** Users could select contradictory conditions (e.g., "Ground floor" AND "Above 10th floor") because all conditions were in a flat list with checkboxes.

The user's "Commercial Glazing Cost Estimating Standards" reference document defines conditions as **productivity factors** (0.70-1.00) organized by **category** (Height, Site, Complexity).

## Decision

Conditions are **multiplicative factors** in the range 0.01-1.00, organized into three categories: `height`, `site`, `complexity`.

**Mutual exclusivity:** At most one condition per category per line item. Selecting a condition in a category replaces any existing condition in that category. UI uses radio buttons per category, not checkboxes.

**Combination:** Factors from different categories multiply:
```
productivityFactor = product(selectedCondition.factor)
```

**Division, not multiplication:** The factor represents productivity relative to baseline. A factor of 0.875 means "87.5% as productive as ideal," so more man-hours are needed:
```
adjustedManHours = baseManHours / productivityFactor
```

**Penalties only:** Factor <= 1.00 always. There is no "better than ideal" condition (baseline 1.00 is the best case).

**No conditions = 1.0:** When no conditions are selected, `productivityFactor` defaults to 1.0 (no adjustment).

## Considered Alternatives

### A. Keep additive crew-day adjustments
The existing model. Rejected because it doesn't scale with task size and doesn't match industry practice.

### B. Additive percentage adjustments (+15%, +25%)
Each condition adds a percentage penalty to labor hours. Rejected because combining them is ambiguous (do they add? compound?) and doesn't match the user's reference document which uses multiplicative factors.

### C. Multiplicative without categories (free selection)
Allow any number of factors to be selected and multiplied. Rejected because it permits contradictory selections (two height conditions) and the compounding of same-category factors produces unrealistic results.

### D. Weather/seasonal conditions
Add a fourth category for weather. Rejected per user interview — weather risk is captured in the contingency percentage, not in per-line productivity factors.

## Consequences

### Positive
- Matches the user's reference document exactly (same factors, same categories)
- Proportional impact — a 12.5% penalty is 12.5% regardless of task size
- Category mutual exclusivity prevents contradictory selections
- Radio button UI is simpler and less error-prone than checkboxes
- `conditionIds` array has a hard cap of 3 entries (one per category)

### Negative
- Existing condition data is incompatible — all `conditionIds` on existing line items must be cleared during migration
- Division by `productivityFactor` is slightly less intuitive than multiplication — must guard against division by zero (minimum factor 0.01 ensures this)
- Cannot model improvement conditions (factor > 1.0) — e.g., "experienced crew" bonus. Acceptable per user: baseline is the best case
- Three fixed categories may not cover future needs — adding a category requires a type change and UI update
