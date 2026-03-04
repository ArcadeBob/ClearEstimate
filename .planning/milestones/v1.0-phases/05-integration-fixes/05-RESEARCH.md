# Phase 5: Integration Fixes - Research

**Researched:** 2026-03-03
**Domain:** Integration gap closure (barrel exports, schema migration, documentation accuracy)
**Confidence:** HIGH

## Summary

Phase 5 addresses three discrete integration gaps identified by the v1.0 milestone audit. All three gaps are well-understood, small in scope, and have clear fixes. The gaps are: (1) `DOOR_HARDWARE_DEFAULTS` is exported from `src/data/seed-door-hardware.ts` but not re-exported from the `src/data/index.ts` barrel, blocking Phase 3 auto-populate; (2) the v2->v3 migration initializes `doorHardware: []` on migrated line items but omits `doorHardwareCost: 0`, creating a data integrity inconsistency for DATA-04; and (3) ROADMAP.md progress table has stale data (Phase 2 previously showed "Not started" -- now corrected in the roadmap but the overall progress percentages and narrative may need verification).

This phase is a prerequisite for Phases 3 and 4. All three fixes are one-line or near-one-line changes to existing files. The primary risk is not the code changes themselves but ensuring the existing 157 tests continue to pass and that the migration fix is covered by a new or updated test assertion.

**Primary recommendation:** Fix all three gaps in a single plan with three tasks: barrel export addition, migration field initialization, and ROADMAP.md accuracy verification. Add one test assertion for the migration fix.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-04 | Schema migration (v2->v3) adds door hardware fields to LineItem and settings while preserving all existing user data | Migration currently initializes `doorHardware: []` but omits `doorHardwareCost: 0`. Fix requires adding `doorHardwareCost: li.doorHardwareCost ?? 0` to the v2->v3 migration block in `src/storage/storage-service.ts` line 55. Existing test at `storage-service.test.ts:76` ("migrates v2 data to v3") should gain an assertion for `doorHardwareCost === 0`. |
</phase_requirements>

## Standard Stack

No new libraries needed. All changes use existing project infrastructure.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.x (strict) | Type checking | Already configured with `noUncheckedIndexedAccess: true` |
| Vitest | 4.x | Test runner | Already configured with `globals: true` |

### Supporting
None required -- this phase modifies existing files only.

### Alternatives Considered
None -- this is a gap-closure phase, not a technology choice phase.

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Files Requiring Modification

```
src/
  data/
    index.ts              # Add DOOR_HARDWARE_DEFAULTS re-export
  storage/
    storage-service.ts    # Add doorHardwareCost: 0 to v2->v3 migration
    storage-service.test.ts  # Add assertion for doorHardwareCost in migration test
.planning/
  ROADMAP.md              # Verify/update progress accuracy
```

### Pattern 1: Barrel Export Convention
**What:** The `src/data/index.ts` file serves as the barrel export for all data modules. It imports from individual seed files and re-exports either the raw arrays or a composed `DEFAULT_SETTINGS` object. Named constants like `DOOR_HARDWARE_DEFAULTS` that are consumed by multiple downstream modules (Phase 3 hooks, Phase 4 UI) must be included in this barrel.
**When to use:** Any time a data module export needs to be accessed via `@/data`.
**Current state:** `SEED_DOOR_HARDWARE` is imported from `./seed-door-hardware` and used in `DEFAULT_SETTINGS`, but `DOOR_HARDWARE_DEFAULTS` (the per-system-type default hardware sets) is not re-exported.
**Fix:**
```typescript
// In src/data/index.ts, add to the import from seed-door-hardware:
import { SEED_DOOR_HARDWARE, DOOR_HARDWARE_DEFAULTS } from './seed-door-hardware'

// Add a named re-export (following project convention of named exports):
export { DOOR_HARDWARE_DEFAULTS }
```

### Pattern 2: Additive Migration with Nullish Coalescing
**What:** The v2->v3 migration block uses additive field initialization with `??` to provide defaults for fields that don't exist on older line items. This preserves any existing value while adding sensible defaults for new fields.
**When to use:** Every field added to `LineItem` in a schema migration.
**Current state:** Line 55-56 of `storage-service.ts` initializes `doorHardware` but not `doorHardwareCost`:
```typescript
// Current (incomplete):
doorHardware: li.doorHardware ?? [],

// Should be:
doorHardware: li.doorHardware ?? [],
doorHardwareCost: li.doorHardwareCost ?? 0,
```
**Why this matters:** Without `doorHardwareCost: 0`, migrated line items will have `doorHardwareCost: undefined` until the next `calcFullLineItem()` call recalculates them. While the calc engine will overwrite this on next edit, the field being `undefined` instead of `0` is a type violation against the `LineItem` interface (which declares `doorHardwareCost: number`, not `number | undefined`). This is a data integrity issue that could cause display bugs (e.g., `formatCurrency(undefined)` producing "NaN").

### Pattern 3: ROADMAP.md as Living Document
**What:** The ROADMAP.md progress table must reflect actual phase completion status. The audit noted this was stale.
**Current state:** ROADMAP.md has already been partially updated (Phase 2 now shows "Complete" with date 2026-03-02, Phase 5 is listed in execution order). Need to verify all rows are accurate.
**After reviewing:** The current ROADMAP.md appears accurate as of the last update. The progress table shows Phase 1 and 2 as complete, Phase 5 as not started, and Phases 3-4 as not started. This matches reality. The tech debt item from the audit (Phase 2 row showing "Not started") appears to have been fixed when Phase 5 was added to the roadmap. Verify during implementation that no further discrepancies exist.

### Anti-Patterns to Avoid
- **Modifying migration logic flow:** Do NOT restructure the migration. Add the single missing field initialization. The sequential migration pattern (`if (version < N)`) is intentional and documented.
- **Adding fields to the wrong migration block:** `doorHardwareCost` must go in the v2->v3 block (not v1->v2) since it was added alongside `doorHardware` in the same schema version.
- **Re-exporting everything:** Only re-export `DOOR_HARDWARE_DEFAULTS`. Do not re-export `SEED_DOOR_HARDWARE` as a standalone (it is already consumed internally by `DEFAULT_SETTINGS`).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Testing migration | Custom migration test harness | Existing `storage-service.test.ts` pattern | Tests already cover v1->v3 and v2->v3 paths; add assertion to existing test |
| Barrel export patterns | Dynamic re-export or glob | Explicit named imports/exports | TypeScript tree-shaking works best with explicit re-exports; matches existing `index.ts` style |

## Common Pitfalls

### Pitfall 1: Forgetting to Update the Import Statement
**What goes wrong:** Adding `export { DOOR_HARDWARE_DEFAULTS }` to `index.ts` without importing it first.
**Why it happens:** The existing import only brings in `SEED_DOOR_HARDWARE`. The constant `DOOR_HARDWARE_DEFAULTS` is a separate export from the same file.
**How to avoid:** Update the import statement to include both: `import { SEED_DOOR_HARDWARE, DOOR_HARDWARE_DEFAULTS } from './seed-door-hardware'`
**Warning signs:** TypeScript compile error -- `DOOR_HARDWARE_DEFAULTS is not defined`.

### Pitfall 2: Using `?? 0` vs `|| 0` for Migration
**What goes wrong:** Using `|| 0` would also coerce `0` to `0`, which is fine for this case, but `??` is the project convention (only coerces `null`/`undefined`).
**Why it happens:** Both work for numeric fields. But `??` is semantically correct -- it means "use this default if the field doesn't exist" rather than "use this if falsy."
**How to avoid:** Use `li.doorHardwareCost ?? 0` to match the existing `li.doorHardware ?? []` pattern on the adjacent line.

### Pitfall 3: Migration Test Not Checking doorHardwareCost
**What goes wrong:** Fixing the migration code but not adding a test assertion means future regressions are undetected.
**Why it happens:** The existing v2->v3 test checks `doorHardware` but not `doorHardwareCost`. Easy to assume existing coverage is sufficient.
**How to avoid:** Add `expect(li.doorHardwareCost).toBe(0)` to the existing "migrates v2 data to v3" test and optionally to the v1->v3 sequential test.

### Pitfall 4: ROADMAP.md Staleness Not Actually Fixed
**What goes wrong:** Assuming the ROADMAP.md is already correct without verifying.
**Why it happens:** The audit flagged it, and Phase 5 was added to the roadmap, but the progress table could have other inaccuracies.
**How to avoid:** During implementation, read ROADMAP.md and verify every row against actual phase completion status. The current content appears correct, but verify at execution time.

## Code Examples

### Fix 1: Barrel Export Addition
```typescript
// src/data/index.ts -- updated import line
import { SEED_DOOR_HARDWARE, DOOR_HARDWARE_DEFAULTS } from './seed-door-hardware'

// Add after the createDefaultAppState function or with other exports:
export { DOOR_HARDWARE_DEFAULTS }
```

**Verification:** After the fix, this import must work from any `src/` file:
```typescript
import { DOOR_HARDWARE_DEFAULTS } from '@/data'
```

### Fix 2: Migration Field Initialization
```typescript
// src/storage/storage-service.ts -- v2->v3 migration block
// Add doorHardwareCost next to doorHardware initialization
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
      doorHardwareCost: li.doorHardwareCost ?? 0,   // <-- ADD THIS LINE
    })),
  }))
  version = 3
}
```

### Fix 3: Test Assertion Addition
```typescript
// src/storage/storage-service.test.ts
// In "migrates v2 data to v3" test, after existing doorHardware assertion:
expect(li.doorHardwareCost).toBe(0)

// In "migrates v1 data through v2 and v3 in sequence" test:
expect(li.doorHardwareCost).toBe(0)

// In "migrates old schema version to current" test:
expect(li.doorHardwareCost).toBe(0)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| v1->v2 replaces all settings | v2->v3 additive merge | Phase 1 (01-02) | Preserves user customizations |
| Single-step migration | Sequential version blocks | Phase 1 (01-02) | Each migration step independent |

**No deprecated approaches relevant to this phase.**

## Open Questions

1. **Does ROADMAP.md need any further updates beyond what's already there?**
   - What we know: The audit flagged Phase 2 progress as stale. The current ROADMAP.md appears to have been corrected when Phase 5 was added.
   - What's unclear: Whether there are other subtle inaccuracies.
   - Recommendation: Verify at implementation time. If accurate, the "fix" is a no-op and Success Criterion 3 is already met.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x with globals: true |
| Config file | vite.config.ts (vitest/config) |
| Quick run command | `npx vitest run src/storage/storage-service.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-04 | doorHardwareCost initialized to 0 on migrated line items | unit | `npx vitest run src/storage/storage-service.test.ts` | Exists, needs assertion addition |
| (SC-1) | DOOR_HARDWARE_DEFAULTS importable from @/data | compile-check | `npx tsc -b` (type check) | N/A -- barrel export only |
| (SC-3) | ROADMAP.md accuracy | manual | Visual inspection | N/A -- documentation |

### Sampling Rate
- **Per task commit:** `npx vitest run src/storage/storage-service.test.ts`
- **Per wave merge:** `npx vitest run && npx tsc -b`
- **Phase gate:** Full suite green before verification

### Wave 0 Gaps
- [ ] Add `expect(li.doorHardwareCost).toBe(0)` assertions to 3 existing migration tests in `src/storage/storage-service.test.ts`
- No new test files needed -- existing coverage infrastructure is sufficient.

## Sources

### Primary (HIGH confidence)
- `src/data/index.ts` -- verified barrel export contents (lines 1-47)
- `src/data/seed-door-hardware.ts` -- verified `DOOR_HARDWARE_DEFAULTS` export exists (lines 26-58)
- `src/storage/storage-service.ts` -- verified v2->v3 migration block missing `doorHardwareCost` (lines 47-59)
- `src/storage/storage-service.test.ts` -- verified existing migration tests lack `doorHardwareCost` assertions (lines 76-131)
- `src/types/index.ts` -- verified `LineItem.doorHardwareCost: number` type declaration (line 42)
- `.planning/v1.0-MILESTONE-AUDIT.md` -- authoritative gap identification document
- `src/hooks/use-line-items.ts` -- verified `addLineItem` already initializes `doorHardwareCost: 0` (line 45)

### Secondary (MEDIUM confidence)
- `.planning/ROADMAP.md` -- appears current as of Phase 5 addition, but should be verified at implementation time

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, all changes in existing files
- Architecture: HIGH -- patterns are already established (barrel exports, sequential migration, inline test assertions)
- Pitfalls: HIGH -- all four pitfalls are directly observable from reading the source code

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (stable -- no external dependencies or fast-moving APIs)
