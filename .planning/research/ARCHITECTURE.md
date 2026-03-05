# Architecture Patterns

**Domain:** Glazing estimation SPA - v1.2 custom hardware, deep-copy, bulk template apply
**Researched:** 2026-03-04
**Confidence:** HIGH (all findings from direct codebase analysis)

## Recommended Architecture

Three features integrate into the existing architecture with minimal structural change. The codebase already has well-established patterns (pure mutation functions, hook-based state, calc orchestration) that each feature follows rather than inventing new ones.

### Feature 1: Project-Level Custom Hardware Items

**Data Model Change:**

Add `customHardware: Hardware[]` to the `Project` interface. These are project-scoped items that supplement the global `settings.doorHardware` catalog.

```typescript
// In src/types/index.ts - ADD to Project interface
export interface Project {
  // ... existing fields ...
  customHardware: Hardware[]  // Project-specific hardware items
}
```

**Why project-level, not settings-level:** Custom hardware is project-specific (a specialty closer for one job, not all jobs). Keeping it on `Project` avoids polluting the global catalog and matches the domain intent: "this project needs an unusual item."

**ID prefix convention:** Use `chw-` prefix (custom hardware) to distinguish from global `dhw-` IDs. This prevents collisions and makes debugging easier. Generate with `uuidv4()` like all other IDs.

**Merged catalog pattern:** When the DoorHardwarePanel needs the full list of available hardware, merge at the point of use:

```typescript
// Pure function - testable, no hook dependency
export function getMergedHardwareCatalog(
  globalCatalog: Hardware[],
  customHardware: Hardware[],
): Hardware[] {
  return [...globalCatalog, ...customHardware]
}
```

This merged list is passed to:
- `DoorHardwarePanel` (for checkbox list rendering)
- `calcDoorHardwareCost` (for price lookup)
- `applyTemplate` (for stale ref filtering)
- `applyAddDoorHardware` (for catalog validation)

**Calc integration:** `calcDoorHardwareCost` already takes `doorHardwareCatalog: Hardware[]` as a parameter. Pass the merged catalog instead of just `settings.doorHardware`. No changes to the calc function itself.

**calcFullLineItem change:** The orchestrator currently hardcodes `settings.doorHardware` on line 52. It needs the project's `customHardware` too. Add `customHardware: Hardware[] = []` as an optional parameter:

```typescript
export function calcFullLineItem(
  lineItem: LineItem,
  settings: AppSettings,
  prevailingWage: boolean,
  pwBaseRate?: number,
  pwFringeRate?: number,
  customHardware: Hardware[] = [],  // NEW - project-level custom items
): LineItem {
  // ... existing code ...
  const doorHardwareCatalog = [...settings.doorHardware, ...customHardware]
  const doorHardwareCost = calcDoorHardwareCost(
    lineItem.doorHardware, doorHardwareCatalog, lineItem.quantity,
  )
  // ... rest unchanged ...
}
```

This is a pure additive change -- existing callers pass nothing and behavior is unchanged.

**Hook for CRUD:** New `useCustomHardware(projectId)` hook following the exact pattern of `useDoorHardware`:

```typescript
// Pure mutation functions (exported for testing)
export function applyAddCustomHardware(
  customHardware: Hardware[], name: string, unitCost: number
): { items: Hardware[]; newId: string } | null

export function applyUpdateCustomHardware(
  customHardware: Hardware[], id: string, updates: Partial<Hardware>
): Hardware[] | null

export function applyDeleteCustomHardware(
  customHardware: Hardware[], id: string
): Hardware[]
```

**Delete cascade:** When a custom hardware item is deleted, any `DoorHardwareEntry` in the project's line items referencing that ID becomes orphaned. Use active cleanup (strip references from all line items and recalculate) because:
- It matches the existing VE alternate delete cascade pattern
- `calcDoorHardwareCost` already skips missing IDs (passive safety), but leaving invisible orphan entries in doorHardware arrays is confusing if inspected
- The UI would show a broken checkbox entry otherwise

**UI location:** New "Custom Hardware" `Section` in `ProjectSetupView`, after Overhead & Profit. Simple add/edit/delete list matching the existing `Section`/`Field` component pattern. No new components needed.

**Schema migration:** v4 -> v5. Additive: add `customHardware: []` to each project. Sequential pattern continues.

### Feature 2: Deep-Copy on Line Item Duplication

**Current behavior:** `duplicateLineItem` in `use-line-items.ts` line 129 does `{ ...item, id: uuidv4() }`. The spread is shallow -- `doorHardware`, `conditionIds`, `equipmentIds`, and `hardwareIds` arrays are shared by reference.

**In practice this is not currently a bug** because the hooks always create new arrays via immutable update patterns. But it is semantically wrong and fragile -- a future optimization or direct state manipulation would break silently.

**Fix:** Extract `deepCopyLineItem` as a testable pure function:

```typescript
export function deepCopyLineItem(source: LineItem): LineItem {
  return {
    ...source,
    id: uuidv4(),
    doorHardware: source.doorHardware.map(e => ({ ...e })),
    conditionIds: [...source.conditionIds],
    equipmentIds: [...source.equipmentIds],
    hardwareIds: [...source.hardwareIds],
  }
}
```

**Why copy all arrays, not just doorHardware:** Consistency. All array fields should be independent copies. The cost is trivial (a few small arrays) and it eliminates an entire class of potential bugs.

**No schema migration needed.** This is a behavior fix, not a data model change.

### Feature 3: Bulk Template Application

**Selection state:** Local `useState<Set<string>>` in `TakeoffView`. Not persisted -- selection is transient UI state.

```typescript
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
```

**Filtering:** Only door-type line items are selectable. Non-door items show no checkbox. Use existing `isDoorSystemType()` filter.

**Batch apply pure function:**

```typescript
// In src/calc/template-apply.ts
export function applyTemplateBulk(
  lineItems: LineItem[],
  selectedIds: Set<string>,
  template: HardwareSetTemplate,
  catalog: Hardware[],
): LineItem[] {
  const validEntries = applyTemplate(template, catalog)
  return lineItems.map(li =>
    selectedIds.has(li.id)
      ? { ...li, doorHardware: validEntries.map(e => ({ ...e })) }
      : li
  )
}
```

Each selected line item gets an independent copy of the template entries (not shared references).

**Hook integration:** Add `bulkApplyTemplate` to `useLineItems`:

```typescript
const bulkApplyTemplate = useCallback(
  (selectedIds: Set<string>, templateId: string) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(p => {
        if (p.id !== projectId) return p
        const template = prev.settings.hardwareTemplates.find(t => t.id === templateId)
        if (!template) return p
        const catalog = [...prev.settings.doorHardware, ...(p.customHardware ?? [])]
        const newLineItems = applyTemplateBulk(p.lineItems, selectedIds, template, catalog)
          .map(li => {
            if (!selectedIds.has(li.id)) return li
            if (validateLineItem(li).isValid) {
              return calcFullLineItem(li, prev.settings, p.prevailingWage,
                p.pwBaseRate, p.pwFringeRate, p.customHardware)
            }
            return li
          })
        return {
          ...p,
          lineItems: newLineItems,
          veAlternates: cascadeVEAlternates(p.veAlternates, newLineItems),
          timestamps: touchTimestamp(p.timestamps),
        }
      }),
    }))
  },
  [projectId, setState],
)
```

**UI components:**

1. **Selection checkbox** -- Added to `LineItemRow` collapsed view, only for door items. Controlled by parent via `isSelected` and `onSelectToggle` props.
2. **Bulk action bar** -- Appears above the line item list when `selectedIds.size > 0`. Contains template dropdown + "Apply" button + "Clear Selection" link. Conditionally rendered in `TakeoffView`.
3. **Select All Doors** -- Convenience toggle in the bulk action bar.

**Performance:** `LineItemRow` is already `memo`-wrapped. Adding `isSelected: boolean` as a prop means only toggled rows re-render. The bulk apply triggers recalc only for selected items.

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `ProjectSetupView` (modified) | Custom hardware CRUD UI via new Section | `useCustomHardware` hook |
| `useCustomHardware` (new) | Project-level hardware state mutations | `useAppStore` (setState) |
| `TakeoffView` (modified) | Selection state, bulk action bar rendering | `useLineItems.bulkApplyTemplate` |
| `LineItemRow` (modified) | Selection checkbox prop, receives merged catalog | `DoorHardwarePanel` via props |
| `DoorHardwarePanel` (modified) | Shows merged catalog (global + custom) in checklist | Receives merged catalog via props |
| `calcFullLineItem` (modified) | Accepts optional customHardware param | `calcDoorHardwareCost` with merged catalog |
| `applyTemplateBulk` (new) | Batch template application pure function | `applyTemplate` (existing) |
| `deepCopyLineItem` (new) | Safe line item duplication pure function | Called by `useLineItems.duplicateLineItem` |
| `getMergedHardwareCatalog` (new) | Merge global + project catalogs pure function | Called at hook/component boundary |
| `storage-service` (modified) | v4->v5 migration | Adds `customHardware: []` to projects |

### Data Flow

**Custom hardware creation flow:**
```
ProjectSetupView
  -> useCustomHardware.addCustomHardware(name, unitCost)
    -> setState: project.customHardware = [...prev, newItem]
      -> auto-persist (500ms debounce)
```

**Custom hardware in calc flow:**
```
useLineItems.updateLineItem / useDoorHardware.applyMutation
  -> calcFullLineItem(li, settings, pw, pwBase, pwFringe, project.customHardware)
    -> mergedCatalog = [...settings.doorHardware, ...customHardware]
    -> calcDoorHardwareCost(li.doorHardware, mergedCatalog, li.quantity)
```

**Bulk apply flow:**
```
TakeoffView: user selects door items via checkboxes
  -> selects template from bulk action bar dropdown
  -> calls bulkApplyTemplate(selectedIds, templateId)
    -> applyTemplateBulk creates new doorHardware for each selected item
    -> calcFullLineItem recalculates each modified item
    -> cascadeVEAlternates updates linked VEs
    -> selectedIds cleared after apply
```

**Duplicate flow (fixed):**
```
LineItemRow "Dup" button
  -> useLineItems.duplicateLineItem(itemId)
    -> deepCopyLineItem(item) produces independent copy with new id
    -> new item appended to project.lineItems
```

## Patterns to Follow

### Pattern 1: Pure Mutation Function + Hook Wrapper
**What:** Extract state mutation logic as exported pure functions. Hook wraps with setState.
**When:** Any new state operation (custom hardware CRUD, bulk apply).
**Why:** Enables unit testing without renderHook. Every existing hook in this codebase follows this pattern.

```typescript
// Pure function (testable)
export function applyAddCustomHardware(
  customHardware: Hardware[], name: string, unitCost: number
): { items: Hardware[]; newId: string } | null { ... }

// Hook wraps it
const addCustomHardware = useCallback((name: string, unitCost: number) => {
  setState(prev => {
    const project = prev.projects.find(p => p.id === projectId)
    if (!project) return prev
    const result = applyAddCustomHardware(project.customHardware, name, unitCost)
    if (!result) return prev
    return { ...prev, projects: prev.projects.map(p =>
      p.id === projectId ? { ...p, customHardware: result.items, timestamps: touchTimestamp(p.timestamps) } : p
    )}
  })
}, [projectId, setState])
```

### Pattern 2: Merged Catalog at Point of Use
**What:** Combine global + project catalogs only where needed, never store merged.
**When:** Rendering DoorHardwarePanel, calculating costs, validating hardware IDs.
**Why:** Single source of truth stays clean. Merge is cheap (12 + ~5 items). Avoids sync bugs from duplicated state.

### Pattern 3: Prop-Driven Selection (No Shared Context)
**What:** Selection state lives in TakeoffView as local useState, passed to LineItemRow as boolean prop.
**When:** Bulk operations UI.
**Why:** Selection is transient. No reason to put it in AppState or a new context. Memo still works because boolean prop comparison is cheap.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing Merged Catalog
**What:** Creating a `mergedDoorHardware` field on AppSettings or Project.
**Why bad:** Two sources of truth. Must sync on every custom hardware change. Bugs when they drift.
**Instead:** Merge at point of use with `getMergedHardwareCatalog()`.

### Anti-Pattern 2: New React Context for Selection
**What:** Creating a SelectionContext for bulk selection state.
**Why bad:** Overkill for a single-view feature. Would cause unnecessary re-renders across the tree.
**Instead:** `useState` in TakeoffView, pass `isSelected` boolean prop to each `LineItemRow`.

### Anti-Pattern 3: Modifying `settings.doorHardware` for Custom Items
**What:** Pushing custom items into the global door hardware catalog.
**Why bad:** Custom items are project-scoped. Putting them in global settings makes them visible to all projects and requires cleanup on project delete.
**Instead:** `project.customHardware` with merge at use.

### Anti-Pattern 4: Shared Array References in Duplicate
**What:** Relying on immutable update patterns to protect shared arrays from `{ ...item }` spread.
**Why bad:** Fragile. Any future direct manipulation breaks silently. Structural sharing is an optimization, not a correctness guarantee.
**Instead:** Always deep-copy mutable fields in `deepCopyLineItem`.

### Anti-Pattern 5: Separate Bulk Apply Hook
**What:** Creating `useBulkTemplate` as a new hook.
**Why bad:** It needs the same setState/recalc/cascade pattern as `useLineItems`. Duplicating that wiring creates maintenance burden.
**Instead:** Add `bulkApplyTemplate` method to existing `useLineItems` hook.

## Integration Points Summary

### New Files

| File | Purpose |
|------|---------|
| `src/hooks/use-custom-hardware.ts` | Custom hardware CRUD hook + pure mutation functions |
| `src/calc/merged-catalog.ts` | `getMergedHardwareCatalog` utility function |

### Modified Files

| File | Change | Scope |
|------|--------|-------|
| `src/types/index.ts` | Add `customHardware: Hardware[]` to `Project` | 1 field |
| `src/calc/line-total-calc.ts` | Add optional `customHardware` param, merge catalog before calc | ~5 lines |
| `src/calc/template-apply.ts` | Add `applyTemplateBulk` export | ~10 lines |
| `src/calc/index.ts` | Export `getMergedHardwareCatalog`, `applyTemplateBulk`, `deepCopyLineItem` | 3 lines |
| `src/hooks/use-line-items.ts` | Fix `duplicateLineItem` with `deepCopyLineItem`, add `bulkApplyTemplate` | ~30 lines |
| `src/hooks/use-door-hardware.ts` | Pass merged catalog (including customHardware) to `applyAddDoorHardware` | ~5 lines |
| `src/views/ProjectSetupView.tsx` | Add Custom Hardware section with add/edit/delete list | ~50 lines |
| `src/views/TakeoffView.tsx` | Selection state, bulk action bar, checkbox props, pass merged catalog | ~60 lines |
| `src/storage/storage-service.ts` | v4->v5 migration adding `customHardware: []` to projects | ~10 lines |
| `src/data/index.ts` | Add `customHardware: []` to default project factory if exists | 1 line |

### Unchanged Files (verification)

| File | Why Unchanged |
|------|---------------|
| `src/calc/door-hardware-calc.ts` | Already parameterized -- takes catalog as argument |
| `src/calc/door-hardware-helpers.ts` | Auto-populate uses seed defaults, not custom items |
| `src/calc/summary-calc.ts` | Works on lineItem totals, hardware-agnostic |
| `src/hooks/use-hardware-templates.ts` | Templates are global, not project-scoped |
| `src/views/SettingsView.tsx` | Global template management, unchanged |

## Suggested Build Order

Build order follows dependency chains. Each phase is independently testable:

1. **Deep-copy fix** (standalone, no dependencies)
   - Extract `deepCopyLineItem` pure function
   - Fix `duplicateLineItem` in `useLineItems`
   - Tests: verify array independence after duplication
   - Rationale: simplest change, fixes existing technical debt, no type changes

2. **Custom hardware data model + migration** (type change + persistence)
   - Add `customHardware` to `Project` type
   - Schema migration v4->v5
   - Update default project factory
   - Tests: migration test with existing v4 data
   - Rationale: type foundation needed by all subsequent phases

3. **Custom hardware CRUD hook** (state management)
   - `useCustomHardware` hook with pure mutation functions
   - Include delete cascade logic (strip orphaned hardware refs from line items)
   - Tests: pure function unit tests for add/update/delete/cascade
   - Rationale: depends on type from phase 2, needed before UI

4. **Custom hardware in calc pipeline** (wires into existing calc)
   - Add `customHardware` param to `calcFullLineItem`
   - `getMergedHardwareCatalog` utility
   - Update all `calcFullLineItem` call sites to pass custom hardware
   - Tests: calc tests with mixed global + custom hardware items
   - Rationale: depends on type from phase 2, needed before UI display is correct

5. **Custom hardware UI** (visible to user)
   - Custom Hardware section in ProjectSetupView
   - Pass merged catalog to DoorHardwarePanel in TakeoffView
   - Update `useDoorHardware` to validate against merged catalog
   - Tests: manual verification (matching existing test approach for views)
   - Rationale: depends on hook (phase 3) and calc (phase 4)

6. **Bulk template application** (new feature, depends on merged catalog)
   - `applyTemplateBulk` pure function
   - `bulkApplyTemplate` in `useLineItems`
   - Selection state + bulk action bar in TakeoffView
   - Tests: pure function tests for batch apply, selection filtering
   - Rationale: most complex UI change, uses merged catalog from phase 5

## Scalability Considerations

| Concern | Current Scale | Notes |
|---------|--------------|-------|
| Merged catalog size | 12 global + ~5 custom = 17 items | O(n) merge is negligible even at 100 items |
| Bulk apply recalc | ~5 selected items typical | `calcFullLineItem` is fast; 50 items < 1ms total |
| Selection state | `Set<string>` in memory | Set operations are O(1), no concern |
| Custom hardware in localStorage | ~100 bytes per item | No concern until thousands of items |

## Sources

- Direct codebase analysis of all files listed above (HIGH confidence)
- Existing architectural patterns established in v1.0 and v1.1 (HIGH confidence)
- No external research needed -- all features are integration patterns within existing architecture

---
*Architecture research for: v1.2 custom hardware, deep-copy, bulk template apply*
*Researched: 2026-03-04*
