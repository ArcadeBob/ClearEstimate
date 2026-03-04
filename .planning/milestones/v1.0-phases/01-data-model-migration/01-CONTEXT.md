# Phase 1: Data Model & Migration - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

All door hardware data structures, seed data, default hardware sets, schema migration logic, and isDoorSystemType() utility. The app can store and load door hardware selections without data loss. No calc logic, no state hooks, no UI — those are later phases.

</domain>

<decisions>
## Implementation Decisions

### Default hardware sets per door type
- **Swing Door (sys-009):** Hinges (3), Closer (1), Handle/Pull (1), Lock/Cylinder (1), Threshold (1), Weatherstrip (1)
- **Sliding Door (sys-008):** Handle/Pull (2), Lock/Cylinder (1), Threshold (1), Weatherstrip (1) — no hinges or closer, sliders use track hardware
- **Revolving Door (sys-007):** Handle/Pull (2), Lock/Cylinder (1), Threshold (1), Weatherstrip (1), Sweep (1), Auto-Operator (1)
- **Entrance System (sys-006):** Hinges (3), Closer (1), Handle/Pull (2), Lock/Cylinder (1), Threshold (1), Weatherstrip (1), Pivot (2) — heavy commercial set
- Default hinge quantity is static at 3 — smart hinge suggestion (CALC-03) is a Phase 2 concern

### Entrance System classification
- sys-006 (Entrance System) IS a door type — isDoorSystemType() returns true for sys-006, sys-007, sys-008, sys-009 (4 types, not 3)
- Entrance System gets its own distinct default hardware set (see above)
- Roadmap success criteria to be updated to reflect 4 door types

### Hardware item pricing
- Use reasonable industry defaults for per-unit costs on all 12 items — estimators can customize prices in Settings
- Fixed seed catalog of 12 items — prices are editable in Settings, but adding/removing items from the master list is deferred to v2 (ENH-01)

### Settings organization
- Door hardware appears as its own separate section in Settings, distinct from existing generic glazing hardware
- The two hardware systems (glazing consumables vs door-specific) are fundamentally different and should not be mixed in one list

### Claude's Discretion
- Exact per-unit pricing for the 12 seed items (reasonable industry defaults)
- DoorHardwareEntry interface structure (must support item ID + per-door quantity at minimum)
- Schema migration implementation details (v2→v3)
- Data file organization (new seed file vs extending existing)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Hardware` type (`{id, name, unitCost}`) in `src/types/index.ts` — same shape works for door hardware items in the seed catalog
- `SEED_HARDWARE` pattern in `src/data/seed-hardware.ts` — follow this for door hardware seed data
- `seed-systems.ts` — door system IDs (sys-006 through sys-009) already defined with `laborMode: 'unit'`

### Established Patterns
- Seed data: typed arrays exported from `src/data/seed-*.ts`, aggregated in `src/data/index.ts` via `DEFAULT_SETTINGS`
- Schema versioning: `CURRENT_SCHEMA_VERSION` constant in `storage-service.ts`, `migrateState()` handles upgrades
- ID convention: `hw-xxx` for hardware, `sys-xxx` for systems — door hardware should follow similar pattern (e.g., `dhw-001`)
- `AppSettings` holds all reference data arrays — new `doorHardware` array goes here
- `LineItem` holds per-item selections — new `doorHardware` field goes here (different structure from `hardwareIds: string[]`)

### Integration Points
- `AppSettings` in `src/types/index.ts` — add `doorHardware` array for the catalog
- `LineItem` in `src/types/index.ts` — add `doorHardware` array for per-line-item selections
- `createDefaultAppState()` in `src/data/index.ts` — include door hardware seed data
- `migrateState()` in `src/storage/storage-service.ts` — v2→v3 migration adds door hardware fields
- `AppState.schemaVersion` bumps from 2 to 3

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Follow existing seed data patterns in the codebase.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-data-model-migration*
*Context gathered: 2026-03-02*
