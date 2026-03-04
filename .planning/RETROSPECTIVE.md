# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — Door Hardware Selection

**Shipped:** 2026-03-04
**Phases:** 5 | **Plans:** 6 | **Tasks:** 15

### What Was Built
- Door hardware data model with 12 seed items, 4 default sets, and v2-to-v3 schema migration
- Calculation engine: `calcDoorHardwareCost`, `suggestHingeCount`, orchestrator integration
- State hooks: auto-populate on door type selection, add/remove/updateQty CRUD operations
- UI: compact sub-row with hardware chips, editing panel with checkboxes, cost breakdown sub-lines, Reset to Defaults
- Integration fixes: barrel exports and migration completeness for doorHardwareCost

### What Worked
- Strict layer dependency ordering (types -> calc -> state -> UI) prevented integration issues
- Pure function extraction for auto-populate and mutation logic enabled comprehensive unit testing without React rendering
- Milestone audit after Phase 2 caught integration gaps (barrel export, migration field) before they blocked Phase 3
- TDD approach with failing tests first ensured complete coverage

### What Was Inefficient
- ROADMAP.md progress table was not updated for Phases 3 and 4 during execution (still showed "Not started" at milestone completion)
- Phase 5 (Integration Fixes) was a gap-closure phase that could have been avoided if Phase 1 had included barrel exports and complete migration fields from the start

### Patterns Established
- Sequential migration pattern: each version bump as an independent `if (version < N)` block
- `DoorHardwareEntry` model with `hardwareId + quantity` for per-item quantity tracking
- Direct file imports in helper modules to avoid circular dependency through barrel
- Shared `applyMutation` helper pattern for centralized recalc + VE cascade + timestamp
- Inline component pattern for small, tightly-coupled view components (DoorHardwareSubRow, DoorHardwarePanel)

### Key Lessons
1. Audit milestones after the infrastructure phases but before UI phases — this is the optimal time to catch integration gaps
2. Include barrel re-exports in the same phase that creates new data modules — don't defer to a separate integration phase
3. Per-item quantity models need distinct type patterns (entry with reference ID + quantity) vs flat selection arrays

### Cost Observations
- Model mix: 100% opus (quality profile)
- Sessions: ~5 (one per phase execution + audit + completion)
- Notable: 0.30 hours total execution time for 6 plans — sub-5-minute average per plan

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 5 | 6 | Established layer-dependency phase ordering and mid-milestone audit pattern |

### Cumulative Quality

| Milestone | Tests | Verify Assertions | TypeScript Errors |
|-----------|-------|-------------------|-------------------|
| v1.0 | 182 | 46 | 0 |

### Top Lessons (Verified Across Milestones)

1. Layer-dependency phase ordering (types -> calc -> state -> UI) prevents cascading integration failures
2. Mid-milestone audit catches gaps before they become blockers
