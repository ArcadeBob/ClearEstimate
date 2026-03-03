# Phase 1: Data Model & Migration - Research

**Researched:** 2026-03-02
**Domain:** TypeScript data modeling, seed data patterns, localStorage schema migration
**Confidence:** HIGH

## Summary

Phase 1 is a pure data layer change with no UI, no calc logic, and no state hooks. It adds door hardware types, seed data, default hardware sets per door system type, a `DoorHardwareEntry` interface on `LineItem`, a v2-to-v3 schema migration, and an `isDoorSystemType()` utility function. All changes follow patterns already established in the codebase (seed arrays, typed interfaces, migration in `storage-service.ts`).

The existing codebase provides clear blueprints for every aspect of this phase. The `Hardware` type (`{id, name, unitCost}`) is the exact shape needed for door hardware catalog items. The `SEED_HARDWARE` array in `src/data/seed-hardware.ts` is the template for the new `SEED_DOOR_HARDWARE` array. The v1-to-v2 migration in `storage-service.ts` shows the exact pattern for the v2-to-v3 migration. The `LineItem` interface already has `hardwareIds: string[]` for glazing hardware -- the new `doorHardware` field needs a different structure (item ID + per-door quantity) to satisfy DATA-02.

**Primary recommendation:** Follow existing codebase patterns exactly. Reuse the `Hardware` type for the door hardware catalog. Create a new `DoorHardwareEntry` interface for per-line-item selections. Add a new seed file, extend `AppSettings`, extend `LineItem`, bump schema version, and add migration logic. All changes are type-safe and verifiable through existing test infrastructure.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Swing Door (sys-009):** Hinges (3), Closer (1), Handle/Pull (1), Lock/Cylinder (1), Threshold (1), Weatherstrip (1)
- **Sliding Door (sys-008):** Handle/Pull (2), Lock/Cylinder (1), Threshold (1), Weatherstrip (1) -- no hinges or closer, sliders use track hardware
- **Revolving Door (sys-007):** Handle/Pull (2), Lock/Cylinder (1), Threshold (1), Weatherstrip (1), Sweep (1), Auto-Operator (1)
- **Entrance System (sys-006):** Hinges (3), Closer (1), Handle/Pull (2), Lock/Cylinder (1), Threshold (1), Weatherstrip (1), Pivot (2) -- heavy commercial set
- Default hinge quantity is static at 3 -- smart hinge suggestion (CALC-03) is a Phase 2 concern
- sys-006 (Entrance System) IS a door type -- isDoorSystemType() returns true for sys-006, sys-007, sys-008, sys-009 (4 types, not 3)
- Entrance System gets its own distinct default hardware set
- Roadmap success criteria to be updated to reflect 4 door types
- Use reasonable industry defaults for per-unit costs on all 12 items -- estimators can customize prices in Settings
- Fixed seed catalog of 12 items -- prices are editable in Settings, but adding/removing items from the master list is deferred to v2 (ENH-01)
- Door hardware appears as its own separate section in Settings, distinct from existing generic glazing hardware
- The two hardware systems (glazing consumables vs door-specific) are fundamentally different and should not be mixed in one list

### Claude's Discretion
- Exact per-unit pricing for the 12 seed items (reasonable industry defaults)
- DoorHardwareEntry interface structure (must support item ID + per-door quantity at minimum)
- Schema migration implementation details (v2 to v3)
- Data file organization (new seed file vs extending existing)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | App includes 12 door hardware seed items (hinges, closer, handle/pull, lock/cylinder, panic device, pivots, threshold, weatherstrip, sweep, auto-operator, card reader, exit device) with per-unit pricing | Reuse existing `Hardware` type; new `SEED_DOOR_HARDWARE` array in `src/data/seed-door-hardware.ts`; add `doorHardware` field to `AppSettings` |
| DATA-02 | Each door hardware selection stores per-item quantity (e.g., hinges=3, closer=1) separate from line item quantity | New `DoorHardwareEntry` interface with `hardwareId` + `quantity` fields; added as `doorHardware: DoorHardwareEntry[]` on `LineItem` |
| DATA-03 | Each door system type (Swing, Sliding, Revolving, Entrance) has a default hardware set that auto-populates on selection | `DOOR_HARDWARE_DEFAULTS` map keyed by system type ID, each value is a `DoorHardwareEntry[]`; stored in seed data file |
| DATA-04 | Schema migration v2->v3 adds door hardware fields to LineItem and settings while preserving all existing user data | Extend `migrateState()` in `storage-service.ts`; line items gain `doorHardware: []`; settings gain `doorHardware` catalog from seed data |
| CALC-02 | `isDoorSystemType()` utility correctly identifies door system types (sys-006, sys-007, sys-008, sys-009) | Pure function in `src/calc/` or `src/data/`; returns boolean based on system type ID set membership |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.x (strict mode) | Type definitions for new interfaces | Already configured with `noUncheckedIndexedAccess: true` |
| Vitest | 4.x | Testing seed data, migration, utility function | Already configured with `globals: true` in `vite.config.ts` |

### Supporting
No new libraries needed. This phase is pure TypeScript -- types, data arrays, and pure functions.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Reusing `Hardware` type for catalog | New `DoorHardware` type | Unnecessary since shape is identical (`{id, name, unitCost}`); reuse avoids type proliferation |
| New seed file `seed-door-hardware.ts` | Extending `seed-hardware.ts` | New file is correct -- the user explicitly decided these are separate systems that should not be mixed |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended File Structure
```
src/
├── types/
│   └── index.ts           # Add DoorHardwareEntry interface; extend LineItem and AppSettings
├── data/
│   ├── seed-door-hardware.ts  # NEW: 12 door hardware items + default sets per door type
│   └── index.ts               # Extend DEFAULT_SETTINGS with doorHardware; bump schemaVersion to 3
├── calc/
│   └── door-system-util.ts    # NEW: isDoorSystemType() pure function
└── storage/
    └── storage-service.ts     # Extend migrateState() for v2→v3; bump CURRENT_SCHEMA_VERSION to 3
```

### Pattern 1: Typed Seed Data Array
**What:** Export a typed array of objects from a dedicated seed file, imported by the data index barrel.
**When to use:** Any new reference data catalog.
**Example (existing pattern in codebase):**
```typescript
// src/data/seed-hardware.ts (existing pattern)
import type { Hardware } from '@/types'

export const SEED_HARDWARE: Hardware[] = [
  { id: 'hw-001', name: 'Setting Blocks', unitCost: 2.50 },
  // ...
]
```
New door hardware follows this exact pattern with `dhw-xxx` ID prefix.

### Pattern 2: Per-Line-Item Selections with Structured Entries
**What:** Instead of a flat `string[]` of IDs (like `hardwareIds`), use an array of objects that carry additional per-selection data.
**When to use:** When selections need per-item metadata (quantity, in this case).
**Example (new pattern for this phase):**
```typescript
// DoorHardwareEntry -- per-line-item door hardware selection
export interface DoorHardwareEntry {
  hardwareId: string   // References a Hardware item in settings.doorHardware
  quantity: number     // Per-door quantity (e.g., 3 hinges per door)
}

// On LineItem:
doorHardware: DoorHardwareEntry[]  // Empty for non-door systems
```
This is a deliberate departure from the existing `hardwareIds: string[]` pattern because DATA-02 requires per-item quantity tracking.

### Pattern 3: Schema Migration with Incremental Version Checks
**What:** The migration function checks schema version and applies each upgrade step in sequence.
**When to use:** Any breaking or additive schema change to localStorage data.
**Example (existing pattern in codebase):**
```typescript
// storage-service.ts (existing)
function migrateState(parsed: Partial<AppState>): AppState {
  const defaults = createDefaultAppState()
  // v1→v2: Replace all settings with new seed data
  const projects = (parsed.projects ?? []).map(p => ({
    ...p,
    lineItems: (p.lineItems ?? []).map((li: Partial<LineItem>) => ({
      ...li,
      manHours: 0,
      conditionIds: [],
    })),
  }))
  // ...
}
```
The v2-to-v3 migration follows this pattern: add `doorHardware: []` to each line item, merge `doorHardware` catalog into settings.

### Pattern 4: Default Hardware Sets as a Data Map
**What:** A mapping from system type ID to a default `DoorHardwareEntry[]`, used by Phase 3 hooks for auto-population.
**When to use:** When different entity types need different default configurations.
**Example (new for this phase):**
```typescript
export const DOOR_HARDWARE_DEFAULTS: Record<string, DoorHardwareEntry[]> = {
  'sys-006': [  // Entrance System
    { hardwareId: 'dhw-001', quantity: 3 },  // Hinges
    { hardwareId: 'dhw-002', quantity: 1 },  // Closer
    // ...
  ],
  'sys-007': [ /* Revolving Door */ ],
  'sys-008': [ /* Sliding Door */ ],
  'sys-009': [ /* Swing Door */ ],
}
```

### Anti-Patterns to Avoid
- **Mixing glazing hardware and door hardware in one array:** The user explicitly decided these are separate systems. Glazing hardware lives in `settings.hardware` (8 items, `hw-xxx` IDs). Door hardware lives in `settings.doorHardware` (12 items, `dhw-xxx` IDs).
- **Adding `quantity` to the `Hardware` type:** The quantity is per-selection (per line item), not per-catalog-item. The catalog `Hardware` type stays `{id, name, unitCost}`. The quantity lives in `DoorHardwareEntry`.
- **Destructive migration (replacing all settings):** The v1-to-v2 migration did a full settings replacement because the types were incompatible. The v2-to-v3 migration should be additive -- preserve all existing settings and add the new `doorHardware` catalog alongside them.
- **Hard-coding door system IDs in multiple places:** Define the set once (e.g., in the utility function or as a constant) and reference it everywhere.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UUID generation for seed data | Random ID generator | Static `dhw-xxx` IDs | Seed data has stable, predictable IDs; runtime uses `uuid` (already installed) |
| Schema version comparison | Custom version parsing | Simple integer comparison (`< CURRENT_SCHEMA_VERSION`) | Existing pattern, schema versions are monotonically increasing integers |
| JSON serialization | Custom serializer | `JSON.stringify`/`JSON.parse` (already used) | localStorage API handles this; existing pattern works fine |

**Key insight:** This phase introduces zero new complexity domains. Every pattern needed is already demonstrated in the existing codebase. The risk is not technical difficulty but rather introducing inconsistency with established patterns.

## Common Pitfalls

### Pitfall 1: Forgetting to Add doorHardware to createDefaultAppState()
**What goes wrong:** New installs get `AppState` without `doorHardware` in settings, causing runtime errors when Settings page tries to render the door hardware list.
**Why it happens:** The `createDefaultAppState()` function in `src/data/index.ts` builds `DEFAULT_SETTINGS` from seed imports. Easy to add the seed file but forget to wire it into the aggregate.
**How to avoid:** Update `DEFAULT_SETTINGS` in `src/data/index.ts` to include `doorHardware: SEED_DOOR_HARDWARE`. Update `AppSettings` interface to include `doorHardware: Hardware[]`.
**Warning signs:** TypeScript compiler will catch this if `AppSettings` is updated first (recommended order: types first, then data).

### Pitfall 2: Migration Not Handling Both v1->v3 and v2->v3 Paths
**What goes wrong:** A user with v1 data hits the migration. The current code only handles v1-to-v2. If the migration is refactored to only handle v2-to-v3, v1 users break.
**Why it happens:** The existing `migrateState()` function doesn't have incremental version checking -- it applies all upgrades in one pass.
**How to avoid:** Refactor `migrateState()` to apply upgrades sequentially: if `schemaVersion < 2`, apply v1-to-v2 upgrades; if `schemaVersion < 3`, apply v2-to-v3 upgrades. This handles any starting version gracefully.
**Warning signs:** Test with v1 data, v2 data, and v3 data to verify all paths.

### Pitfall 3: Settings Migration Replacing User Customizations
**What goes wrong:** The v2-to-v3 migration replaces ALL settings (including customized glass types, labor rates, etc.) with defaults, destroying user customizations.
**Why it happens:** The v1-to-v2 migration intentionally did a full replacement (`settings: defaults.settings`). Copying that pattern for v2-to-v3 would be destructive.
**How to avoid:** The v2-to-v3 migration must MERGE: keep all existing settings arrays and ADD the new `doorHardware` array from defaults. Spread existing settings, overlay only the new field.
**Warning signs:** Migration test should verify existing settings (glass types, labor rates, etc.) are preserved intact after upgrade.

### Pitfall 4: Missing doorHardware on Existing Line Items
**What goes wrong:** Existing line items from v2 data don't have the `doorHardware` field. Code that accesses `lineItem.doorHardware` crashes or returns `undefined`.
**Why it happens:** TypeScript interfaces describe the ideal shape, but localStorage data may not match until migrated.
**How to avoid:** Migration must add `doorHardware: []` to every existing line item. TypeScript's `noUncheckedIndexedAccess` won't catch this since it's a top-level field, not an array index.
**Warning signs:** Test accessing `lineItem.doorHardware` on migrated data.

### Pitfall 5: isDoorSystemType() Using Magic Strings Instead of a Set
**What goes wrong:** The utility checks individual IDs with `||` chains. When a new door type is added (or one is reclassified), it's easy to miss an update.
**Why it happens:** Quick implementation without thinking about maintainability.
**How to avoid:** Define a `DOOR_SYSTEM_IDS` constant (Set or array) and check membership. This also serves as the single source of truth for the defaults map.
**Warning signs:** More than one place in the codebase checking if a system type is a door type.

### Pitfall 6: Forgetting to Update use-settings.ts Usage Count Check
**What goes wrong:** The `getUsageCount()` function in `use-settings.ts` checks each settings table for line item references (C-008). If `doorHardware` is added to settings but `getUsageCount` doesn't check it, users can delete door hardware items that are in use.
**Why it happens:** The switch statement in `getUsageCount` is exhaustive for current tables but won't auto-include new ones.
**How to avoid:** This is a Phase 3 concern (hooks), but worth flagging now. The planner should note this as a downstream dependency.
**Warning signs:** Not a Phase 1 issue, but the interface change in `AppSettings` will affect the `SettingsTableName` type.

## Code Examples

Verified patterns from the existing codebase:

### New Type Interface (DoorHardwareEntry)
```typescript
// src/types/index.ts -- new interface
export interface DoorHardwareEntry {
  hardwareId: string  // References Hardware.id in settings.doorHardware
  quantity: number    // Per-door quantity (e.g., 3 hinges per door)
}
```

### Extended LineItem
```typescript
// src/types/index.ts -- add to LineItem
export interface LineItem {
  // ... existing fields ...
  hardwareIds: string[]         // Existing glazing hardware
  doorHardware: DoorHardwareEntry[]  // NEW: door-specific hardware with quantities
}
```

### Extended AppSettings
```typescript
// src/types/index.ts -- add to AppSettings
export interface AppSettings {
  // ... existing fields ...
  hardware: Hardware[]          // Existing glazing hardware catalog (8 items)
  doorHardware: Hardware[]      // NEW: door hardware catalog (12 items)
  equipment: Equipment[]
  systemTypes: SystemType[]
}
```

### Door Hardware Seed Data
```typescript
// src/data/seed-door-hardware.ts
import type { Hardware } from '@/types'
import type { DoorHardwareEntry } from '@/types'

export const SEED_DOOR_HARDWARE: Hardware[] = [
  { id: 'dhw-001', name: 'Hinges',         unitCost: 15.00 },
  { id: 'dhw-002', name: 'Closer',         unitCost: 85.00 },
  { id: 'dhw-003', name: 'Handle/Pull',    unitCost: 45.00 },
  { id: 'dhw-004', name: 'Lock/Cylinder',  unitCost: 65.00 },
  { id: 'dhw-005', name: 'Panic Device',   unitCost: 250.00 },
  { id: 'dhw-006', name: 'Pivots',         unitCost: 120.00 },
  { id: 'dhw-007', name: 'Threshold',      unitCost: 35.00 },
  { id: 'dhw-008', name: 'Weatherstrip',   unitCost: 18.00 },
  { id: 'dhw-009', name: 'Sweep',          unitCost: 12.00 },
  { id: 'dhw-010', name: 'Auto-Operator',  unitCost: 1200.00 },
  { id: 'dhw-011', name: 'Card Reader',    unitCost: 350.00 },
  { id: 'dhw-012', name: 'Exit Device',    unitCost: 275.00 },
]

// Default hardware sets per door system type (DATA-03)
export const DOOR_HARDWARE_DEFAULTS: Record<string, DoorHardwareEntry[]> = {
  'sys-006': [  // Entrance System
    { hardwareId: 'dhw-001', quantity: 3 },  // Hinges
    { hardwareId: 'dhw-002', quantity: 1 },  // Closer
    { hardwareId: 'dhw-003', quantity: 2 },  // Handle/Pull
    { hardwareId: 'dhw-004', quantity: 1 },  // Lock/Cylinder
    { hardwareId: 'dhw-007', quantity: 1 },  // Threshold
    { hardwareId: 'dhw-008', quantity: 1 },  // Weatherstrip
    { hardwareId: 'dhw-006', quantity: 2 },  // Pivots
  ],
  'sys-007': [  // Revolving Door
    { hardwareId: 'dhw-003', quantity: 2 },  // Handle/Pull
    { hardwareId: 'dhw-004', quantity: 1 },  // Lock/Cylinder
    { hardwareId: 'dhw-007', quantity: 1 },  // Threshold
    { hardwareId: 'dhw-008', quantity: 1 },  // Weatherstrip
    { hardwareId: 'dhw-009', quantity: 1 },  // Sweep
    { hardwareId: 'dhw-010', quantity: 1 },  // Auto-Operator
  ],
  'sys-008': [  // Sliding Door
    { hardwareId: 'dhw-003', quantity: 2 },  // Handle/Pull
    { hardwareId: 'dhw-004', quantity: 1 },  // Lock/Cylinder
    { hardwareId: 'dhw-007', quantity: 1 },  // Threshold
    { hardwareId: 'dhw-008', quantity: 1 },  // Weatherstrip
  ],
  'sys-009': [  // Swing Door
    { hardwareId: 'dhw-001', quantity: 3 },  // Hinges
    { hardwareId: 'dhw-002', quantity: 1 },  // Closer
    { hardwareId: 'dhw-003', quantity: 1 },  // Handle/Pull
    { hardwareId: 'dhw-004', quantity: 1 },  // Lock/Cylinder
    { hardwareId: 'dhw-007', quantity: 1 },  // Threshold
    { hardwareId: 'dhw-008', quantity: 1 },  // Weatherstrip
  ],
}
```

### isDoorSystemType() Utility
```typescript
// src/calc/door-system-util.ts
const DOOR_SYSTEM_IDS: ReadonlySet<string> = new Set([
  'sys-006',  // Entrance System
  'sys-007',  // Revolving Door
  'sys-008',  // Sliding Door
  'sys-009',  // Swing Door
])

export function isDoorSystemType(systemTypeId: string): boolean {
  return DOOR_SYSTEM_IDS.has(systemTypeId)
}
```

### Schema Migration (v2 to v3)
```typescript
// storage-service.ts -- refactored migrateState
function migrateState(parsed: Partial<AppState>): AppState {
  const defaults = createDefaultAppState()
  let version = parsed.schemaVersion ?? 1
  let projects = parsed.projects ?? []
  let settings = parsed.settings ?? defaults.settings

  // v1→v2: Replace all settings with new seed data (B-007)
  if (version < 2) {
    settings = defaults.settings
    projects = projects.map(p => ({
      ...p,
      lineItems: (p.lineItems ?? []).map((li: Partial<LineItem>) => ({
        ...li,
        manHours: 0,
        conditionIds: [],
      })),
    }))
    version = 2
  }

  // v2→v3: Add door hardware (additive, preserves existing settings)
  if (version < 3) {
    settings = {
      ...settings,
      doorHardware: defaults.settings.doorHardware,
    }
    projects = projects.map(p => ({
      ...p,
      lineItems: (p.lineItems ?? []).map((li: any) => ({
        ...li,
        doorHardware: li.doorHardware ?? [],
      })),
    }))
    version = 3
  }

  const migrated: AppState = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    settings: settings as AppState['settings'],
    projects: projects as AppState['projects'],
  }

  saveAppState(migrated)
  return migrated
}
```

### Default App State Update
```typescript
// src/data/index.ts
import { SEED_DOOR_HARDWARE } from './seed-door-hardware'

export const DEFAULT_SETTINGS: AppSettings = {
  // ... existing fields ...
  doorHardware: SEED_DOOR_HARDWARE,
}

export function createDefaultAppState(): AppState {
  return {
    schemaVersion: 3,  // bumped from 2
    projects: [],
    settings: DEFAULT_SETTINGS,
  }
}
```

### LineItem Factory Update (for tests)
```typescript
// In test files that create LineItem objects, add doorHardware: []
function baseLineItem(overrides: Partial<LineItem> = {}): LineItem {
  return {
    // ... existing fields ...
    hardwareIds: [],
    doorHardware: [],  // NEW
    ...overrides,
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Flat ID arrays (`hardwareIds: string[]`) | Structured entry arrays (`DoorHardwareEntry[]`) | This phase | Per-item metadata (quantity) now possible |
| Single schema migration step | Sequential version-checked migration | This phase | Supports arbitrary version jumps (v1->v3, v2->v3) |

**Deprecated/outdated:**
- None. All existing patterns remain valid. Door hardware is additive.

## Open Questions

1. **Door hardware pricing accuracy**
   - What we know: User said "reasonable industry defaults" -- estimators will customize in Settings
   - What's unclear: Exact dollar amounts for all 12 items
   - Recommendation: Use common commercial glazing contractor pricing ranges. The prices in the Code Examples section above are reasonable: hinges $15, closer $85, handle/pull $45, lock/cylinder $65, panic device $250, pivots $120, threshold $35, weatherstrip $18, sweep $12, auto-operator $1200, card reader $350, exit device $275. These are Claude's discretion per CONTEXT.md.

2. **Where to place isDoorSystemType()**
   - What we know: It's a pure utility function. Could live in `src/calc/` (alongside other pure functions) or `src/data/` (alongside system type definitions).
   - What's unclear: Best organizational home.
   - Recommendation: Place in `src/calc/` since it's consumed by calc logic in Phase 2 and hook logic in Phase 3. Export from `src/calc/index.ts` barrel. File: `src/calc/door-system-util.ts`.

3. **Whether to export DOOR_HARDWARE_DEFAULTS from seed file or utility file**
   - What we know: The defaults map references `DoorHardwareEntry[]` values with door hardware IDs. It's seed data by nature but consumed by hooks in Phase 3.
   - What's unclear: Whether data and behavior co-locate well here.
   - Recommendation: Export from `src/data/seed-door-hardware.ts` alongside the seed catalog. It's data, not computation. Phase 3 hooks import from `@/data`.

4. **Updating existing test factory helpers**
   - What we know: Multiple test files define `baseLineItem()` factory helpers inline. Adding `doorHardware` to `LineItem` means all of these need updating.
   - What's unclear: Whether the TypeScript compiler will catch all of them or if some use `as any`.
   - Recommendation: TypeScript strict mode will flag any `baseLineItem()` factory missing the new required field. Update all factory helpers in test files. The affected test files are: `line-total-calc.test.ts`, `validate-line-item.test.ts`. Also update `verify-calc.ts` which creates `LineItem` objects directly.

## Sources

### Primary (HIGH confidence)
- **Existing codebase** -- All patterns, types, and conventions directly observed in source files:
  - `src/types/index.ts` -- Current `Hardware`, `LineItem`, `AppSettings`, `AppState` interfaces
  - `src/data/seed-hardware.ts` -- Seed data pattern (`SEED_HARDWARE: Hardware[]`)
  - `src/data/index.ts` -- `DEFAULT_SETTINGS` aggregation, `createDefaultAppState()` with schema version
  - `src/storage/storage-service.ts` -- `migrateState()`, `CURRENT_SCHEMA_VERSION`, `STORAGE_KEY`
  - `src/storage/storage-service.test.ts` -- Migration test pattern (jsdom environment, `localStorage.clear()`)
  - `src/calc/line-total-calc.ts` -- `calcFullLineItem()` orchestrator (downstream consumer of hardware data)
  - `src/data/seed-systems.ts` -- Door system type IDs (sys-006 through sys-009, all `laborMode: 'unit'`)
  - `CONSTRAINTS.md` -- Active constraints registry (C-002 through C-047)

### Secondary (MEDIUM confidence)
- **CONTEXT.md decisions** -- User-locked decisions on default hardware sets, entrance system classification, settings organization

### Tertiary (LOW confidence)
- **Door hardware pricing** -- Prices are Claude's estimate of reasonable commercial glazing contractor defaults. No external source consulted; user said to use reasonable industry defaults and marked pricing as Claude's discretion.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new libraries; pure TypeScript types and data
- Architecture: HIGH -- All patterns directly observed in existing codebase; zero novel patterns needed
- Pitfalls: HIGH -- All pitfalls derived from codebase analysis (migration behavior, type system, barrel exports)

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (stable -- no external dependency changes expected)
