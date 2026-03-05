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

## Milestone: v1.1 — Hardware Set Templates

**Shipped:** 2026-03-04
**Phases:** 3 | **Plans:** 3 | **Tasks:** 6

### What Was Built
- HardwareSetTemplate type with 4 seed templates and v3→v4 additive storage migration
- useHardwareTemplates hook with full CRUD (add, rename, delete, toggle items, update quantities)
- Templates tab in Settings with expand/collapse inline hardware editing
- Template picker dropdown in DoorHardwarePanel with stale-reference filtering
- 42 new tests (10 seed data + 26 CRUD + 6 template apply)

### What Worked
- Pure function mutation pattern (established in v1.0) made all CRUD operations testable without React rendering — carried forward perfectly
- Additive-only migration strategy kept v3→v4 upgrade trivial
- Milestone audit showed 100% coverage (8/8 requirements, 3/3 E2E flows) before completion
- All 3 plans executed exactly as written — zero deviations

### What Was Inefficient
- Nothing notable — this was a clean, well-scoped milestone with zero rework

### Patterns Established
- Expand/collapse list pattern for nested item editing (template → hardware items)
- Stateless select reset pattern: `value=""` always resets dropdown after action
- Stale-reference filtering via Set lookup for O(1) catalog validation
- Auto-incrementing name collision avoidance ("New Template (2)", "(3)", etc.)

### Key Lessons
1. Small, focused milestones (3 phases) ship faster with zero friction — scope discipline pays off
2. Reusing patterns from previous milestone (pure function mutations, TDD) eliminates learning curves
3. Seed data derived from existing constants (DOOR_HARDWARE_DEFAULTS) keeps templates in sync without duplication

### Cost Observations
- Model mix: 100% opus (quality profile)
- Sessions: ~3 (one per phase execution + audit + completion)
- Notable: 8 minutes total execution for 3 plans — sub-3-minute average

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 5 | 6 | Established layer-dependency phase ordering and mid-milestone audit pattern |
| v1.1 | 3 | 3 | Reused v1.0 patterns (pure functions, TDD) for zero-friction execution |

### Cumulative Quality

| Milestone | Tests | Verify Assertions | TypeScript Errors |
|-----------|-------|-------------------|-------------------|
| v1.0 | 182 | 46 | 0 |
| v1.1 | 224 | 46 | 0 |

### Top Lessons (Verified Across Milestones)

1. Layer-dependency phase ordering (types -> calc -> state -> UI) prevents cascading integration failures
2. Mid-milestone audit catches gaps before they become blockers
3. Pure function mutation pattern enables comprehensive testing across milestones — reuse over reinvent
4. Small, focused milestones (3 phases) execute cleanly with zero rework
