# Replace all settings on schema migration v1 to v2

- Status: accepted
- Date: 2026-02-25
- Tags: storage-model, migration
- Refs: SPEC.md §5, D-16, B-005, B-007

## Context and Problem Statement

Sprint 1 changes the shape of three settings entities:
- **SystemType:** gains `laborMode`, `sfPerManHour`, `hoursPerUnit`; loses benchmark fields
- **FrameSystem:** gains `systemTypeId`; loses `laborHoursPerUnit`
- **Condition:** gains `category`, `factor`; loses `adjustmentDays`

The localStorage schema (keyed `cgi_estimating_app_v1`) contains user-editable settings arrays for all three. When the user loads the app after the Sprint 1 update, the stored data has the old shape.

Two migration strategies are possible: (A) field-by-field migration of existing data, or (B) wholesale replacement with new seed data.

## Decision

**Replace all settings arrays (systemTypes, frameSystems, conditions) with new seed data on migration.** Also clear all `conditionIds` from all line items across all projects, and add default values for new project fields.

Migration steps:
1. Detect `schemaVersion < 2` on load
2. Replace `systemTypes` with new seed data (21 types with laborMode, sfPerManHour/hoursPerUnit)
3. Replace `frameSystems` with new seed data (frames with systemTypeId, no laborHoursPerUnit)
4. Replace `conditions` with new seed data (12 factor-based conditions with categories)
5. Clear `conditionIds: []` on all line items in all projects
6. Add `wastePct: 0.05`, `indirectTimePct: 0.25`, `contingencyPct: 0.05`, `showContingencyInSov: true` to all projects
7. Add `manHours: 0` to all line items (will be recalculated)
8. Remove benchmark-related fields from stored data
9. Bump `schemaVersion` to 2
10. Recalculate all line items with new formulas

## Considered Alternatives

### A. Field-by-field migration
Add new fields to existing records, map old values to new ones where possible (e.g., infer `laborMode` from system type name, map `adjustmentDays` to approximate factors). Preserves any user customizations to pricing.

Rejected because:
- Phase 1 hasn't been used on real bids — there are no meaningful user customizations to preserve
- Mapping old `adjustmentDays` (additive) to new `factor` (multiplicative) is lossy and error-prone
- Inferring `systemTypeId` for existing frames requires fuzzy name matching
- The testing burden for field-by-field migration is high (many edge cases)

### B. Prompt user to reset
Show a modal on first load explaining the changes and asking the user to confirm data reset. Rejected as unnecessary ceremony — the user knows the tool is being rebuilt and expects breaking changes.

### C. Dual storage (keep v1 data alongside v2)
Store both old and new data, allowing rollback. Rejected as over-engineering for a localStorage SPA with no real production data.

## Consequences

### Positive
- Clean, predictable migration — no edge cases from partial data transformation
- Simpler migration code (replace, don't transform)
- New seed data is guaranteed to be internally consistent (all FKs valid, all rates populated)
- Lower testing burden — verify the seed data is correct once, not N migration paths

### Negative
- **Destroys any user customizations** to system types, frame systems, conditions, and pricing data. Acceptable because Phase 1 hasn't been used on real bids.
- If a user has created custom system types or conditions, they are lost with no recovery path
- This approach won't work for future migrations (v2 to v3) once the tool has real data. A field-by-field strategy will be needed then.
- Clearing `conditionIds` means all line items lose their condition selections — users must re-select conditions after updating
