# Technology Stack

**Project:** ClearEstimate v1.2 — Custom Hardware & Bulk Apply
**Researched:** 2026-03-04
**Confidence:** HIGH (brownfield — stack is established, all features are data-model changes)

## Recommendation: No New Dependencies

All three v1.2 features are pure data-model and state-logic changes. The existing stack handles everything needed. Adding libraries would be over-engineering for the scope involved.

## Existing Stack (Unchanged)

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| React | ^19.0.0 | UI framework | No change |
| TypeScript | ~5.7.0 | Type safety (strict + noUncheckedIndexedAccess) | No change |
| Vite | ^6.0.0 | Build tool | No change |
| Tailwind CSS | ^4.0.0 | Styling (CSS-first) | No change |
| Vitest | ^4.0.18 | Testing | No change |
| uuid | ^11.0.0 | ID generation | No change |
| React Router | ^7.0.0 | Routing | No change |

## Feature-Specific Stack Decisions

### 1. Project-Level Custom Hardware

**Data model change:** Add `customHardware: Hardware[]` to `Project` interface.

**Why project-level, not settings-level:** Custom hardware is project-specific (e.g., a specialty closer for one job). Global `settings.doorHardware` holds the catalog; projects hold project-specific additions. This matches how `prevailingWage` and `pwBaseRate` are project-level overrides of labor config.

**Why reuse `Hardware` type:** The existing `Hardware` interface (`{ id: string; name: string; unitCost: number }`) is exactly what custom hardware needs. No new type required. Custom hardware items live on the project instead of in global settings.

**ID generation:** Use `uuid` (already a dependency) with a `chw-` prefix convention to distinguish custom hardware IDs from catalog `dhw-` IDs. This prevents ID collisions when merging catalog + custom hardware lists in the door hardware panel.

**Schema migration v4 to v5:** Additive — add `customHardware: []` to each project. Follows the exact pattern of v2->v3 (added doorHardware to line items) and v3->v4 (added hardwareTemplates to settings).

```typescript
// v4->v5 migration in storage-service.ts:
if (version < 5) {
  projects = projects.map(p => ({
    ...p,
    customHardware: (p as any).customHardware ?? [],
  }))
  version = 5
}
```

**No form library needed:** The custom hardware form is 2 fields (name + unitCost). Existing controlled-input pattern used throughout ProjectSetupView and SettingsView is sufficient.

### 2. Deep-Copy on Line Item Duplication

**Current bug:** `duplicateLineItem` in `use-line-items.ts` line 129 does `{ ...item, id: uuidv4() }`. This shallow-copies the `doorHardware` array — both original and duplicate share the same `DoorHardwareEntry` objects. Editing hardware on one could silently affect the other through shared references.

**Fix approach — spread over each entry:**
```typescript
const newItem: LineItem = {
  ...item,
  id: uuidv4(),
  doorHardware: item.doorHardware.map(entry => ({ ...entry })),
}
```

**Why not `structuredClone`:** `DoorHardwareEntry` is `{ hardwareId: string; quantity: number }` — a flat two-property object. Spread is clearer, faster, and preserves TypeScript inference. `structuredClone` is designed for complex nested/circular structures and would be overkill here.

**Why not lodash `cloneDeep`:** Adding a dependency for cloning flat two-property objects is not justified. The codebase has zero lodash usage and should stay that way.

**Also fix `duplicateProject`:** The project-level duplication at `use-projects.ts` line 64 has the same shallow-copy pattern: `{ ...li, id: newId }`. Both functions need the `doorHardware.map(e => ({ ...e }))` treatment. Additionally, once `customHardware` is added to `Project`, the project duplication needs to deep-copy that array too: `customHardware: original.customHardware.map(hw => ({ ...hw }))`.

### 3. Bulk Template Application

**Selection state:** A `Set<string>` of selected line item IDs, managed via `useState` in `TakeoffView`. This is transient UI state — not persisted, not shared across components.

**Why `Set<string>`:** O(1) lookup for toggle/has/delete operations. Create a new `Set` on each state update for React change detection.

**Batch update pattern:** A new pure function (e.g., `applyTemplateBulk`) that takes line items + selected IDs + template items + catalog and returns updated line items. This matches the existing pure-function pattern used by `applyDoorHardwareAutoPopulate` and the template apply logic in `use-door-hardware.ts`.

**UI approach:** Checkboxes on door line items in the takeoff table + a "Apply Template to Selected" action. Use existing `isDoorSystemType()` to filter which rows show checkboxes. No multi-select library, no virtualized list — the takeoff table rarely exceeds 50 rows.

## What NOT to Add

| Library | Why Considered | Why Reject |
|---------|---------------|------------|
| lodash / lodash-es | Deep cloning for duplication | `DoorHardwareEntry` and `Hardware` are flat objects; spread suffices |
| immer | Immutable state updates | Existing spread-based updaters work; 224 tests validate them; adding immer mid-project creates two competing patterns |
| react-hook-form / formik | Custom hardware form | 2-field form (name + cost); controlled inputs are simpler and consistent with existing views |
| @tanstack/react-table | Multi-select in takeoff table | Current hand-rolled table is adequate; adding a table library for a checkbox column is over-engineering |
| zustand / jotai | State management for selection | Selection is ephemeral UI state; `useState<Set<string>>` is the correct tool |
| nanoid | ID generation | `uuid` is already installed and used throughout |
| zod | Validation for custom hardware | Validating name (non-empty) and cost (positive number) with inline checks; schema validation library is overkill |

## Integration Points

### Files Requiring Modification

| File | Change | Reason |
|------|--------|--------|
| `src/types/index.ts` | Add `customHardware: Hardware[]` to `Project` | Data model for project-level custom hardware |
| `src/storage/storage-service.ts` | v4->v5 migration, bump `CURRENT_SCHEMA_VERSION` | Schema migration |
| `src/hooks/use-line-items.ts` | Deep-copy `doorHardware` in `duplicateLineItem` | Bug fix: shallow copy causes shared references |
| `src/hooks/use-projects.ts` | Deep-copy `doorHardware` in `duplicateProject`; deep-copy `customHardware` on project duplication | Bug fix + new field support |
| `src/views/ProjectSetupView.tsx` | Add custom hardware CRUD section (add/edit/delete items) | UI for managing project-specific hardware |
| `src/views/TakeoffView.tsx` | Merge catalog + custom hardware in panel; add checkbox selection + bulk apply button | Feature integration for custom hardware visibility and bulk apply |
| `src/hooks/use-door-hardware.ts` | Accept merged hardware catalog (catalog + custom) for validation | Custom hardware IDs need to pass the "exists in catalog" check |

### Files That Stay Unchanged

| File/Module | Why No Change |
|-------------|---------------|
| `src/calc/line-total-calc.ts` | `calcFullLineItem` already sums `doorHardwareCost` from entries; custom hardware entries flow through identically |
| `src/calc/material-calc.ts` | Does not touch door hardware |
| `src/calc/summary-calc.ts` | Aggregates `lineTotal` which already includes hardware cost |
| `src/data/door-hardware-seed.ts` | Catalog seed data is global; custom items are project-level |
| `src/hooks/use-hardware-templates.ts` | Templates reference `hardwareId`; custom hardware IDs (`chw-xxx`) work the same way |

## Key Patterns to Follow

1. **Reuse existing types:** `Hardware` for custom items, `DoorHardwareEntry` for references — no new types
2. **Pure calc functions:** Batch apply as a pure function, testable without React
3. **Hook-mediated state:** All mutations through hooks calling `setState(updater)`
4. **Schema migration chain:** v4->v5 additive, same pattern as v2->v3 and v3->v4
5. **ID prefix convention:** `chw-` for custom hardware (parallel to `dhw-` catalog, `hw-` generic, `eq-` equipment)
6. **Merged catalog pattern:** Combine `settings.doorHardware` + `project.customHardware` at the point of use (hardware panel), not stored as a merged list

## Installation

```bash
# No new packages to install
npm install  # already done — no changes to package.json
```

## Sources

- Codebase analysis: `src/types/index.ts`, `src/hooks/use-line-items.ts`, `src/hooks/use-projects.ts`, `src/storage/storage-service.ts`, `src/views/ProjectSetupView.tsx`, `src/calc/door-hardware-helpers.ts`
- Confidence: HIGH — all recommendations based on direct codebase inspection of established patterns
