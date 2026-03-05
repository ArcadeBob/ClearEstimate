# Feature Landscape

**Domain:** Glazing estimation tool — v1.2 custom hardware items, deep-copy duplication, bulk template application
**Researched:** 2026-03-04
**Confidence:** HIGH (features defined by codebase analysis of existing implementation gaps)

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Project-level custom hardware list (CRUD) | Estimators encounter specialty hardware on nearly every job — specific ADA operators, decorative pulls at quoted prices, project-specified closers. The 12-item seed catalog cannot cover all real projects. | Low | Add `customHardware: Hardware[]` to `Project` interface. CRUD in ProjectSetupView new section. Follows existing Settings hardware editing pattern. |
| Custom hardware selectable in door hardware panel | If custom items exist but are not selectable alongside catalog items, the feature is invisible at the point of use. Estimators should not navigate away from takeoff to handle costs manually. | Low | Merge `settings.doorHardware` + `project.customHardware` into combined catalog for the door hardware add-item dropdown and for cost resolution in `calcFullLineItem`. |
| Deep-copy doorHardware on line item duplication | Current `duplicateLineItem` does `{ ...item, id: uuidv4() }` — shallow copies `doorHardware` array. Editing hardware on the duplicate mutates the original's array entries via shared object references. This is a data integrity bug, not a feature request. | Low | Replace spread with `doorHardware: item.doorHardware.map(e => ({ ...e }))`. Same fix needed in `duplicateProject`. One-line change per location + regression tests. |
| Bulk template apply to multiple selected doors | Estimators commonly have 10-30 identical doors on a project. Applying templates one-by-one is the primary UX pain point with the current template system. This is the natural completion of the template workflow. | Med | Requires: (1) multi-select UI for door line items, (2) template selection action, (3) batch recalc. No new calc logic — reuses existing `applyTemplate()` pure function. |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Bulk apply confirmation dialog | Before applying template to N doors, show "Apply 'Entrance System' to 5 doors? This replaces existing hardware." Prevents accidental overwrite of customized hardware on 20 doors. | Low | Simple confirm dialog. High trust value for a destructive batch operation. |
| Select all / select none toggle | In bulk mode, quickly toggle all door-type line items. Non-door items excluded automatically via `isDoorSystemType()`. | Low | Filter `lineItems`, toggle all matching IDs. Saves clicks on projects with many doors. |
| Custom hardware in saved templates | When a template is saved from Settings, it can reference custom hardware IDs. When applied in the same project, custom items carry forward. Cross-project, stale custom refs are silently filtered (same as existing stale catalog ref filtering). | Low | No new filtering logic needed — `applyTemplate` already filters by catalog. Just ensure merged catalog is passed. |
| Custom hardware cost validation hint | Yellow border when custom hardware `unitCost` is 0 or suspiciously high (> $5,000). Not blocking — just a visual hint to catch typos. | Low | CSS-only visual treatment on the cost input. No validation logic beyond display. |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Global custom hardware catalog | Custom hardware is project-specific by nature. A "Specialty ADA Operator" on one job has a different price on the next. Global catalog creates stale pricing and false confidence. | Project-level `customHardware` only. If users want to reuse items, they duplicate the project (existing feature). |
| Custom hardware IDs in global templates cross-project | Templates live in `settings.hardwareTemplates` (global). Custom hardware is project-scoped. A template referencing `chw-abc123` is meaningless in another project where that ID does not exist. | Templates can contain custom hardware entries within the originating project, but on apply in a different project context, missing custom IDs are silently filtered by existing `applyTemplate` stale-ref logic. |
| Drag-and-drop reordering for bulk select | Over-engineered interaction for a checkbox list. Adds complexity, accessibility issues, no real value for "select then apply." | Simple checkboxes next to each door line item. Selection order does not matter for template application. |
| Inline hardware editing during bulk apply | Applying a template to 15 doors should be uniform. Per-door modifications during bulk apply defeats the purpose and creates confusing UX. | Apply template in bulk, then edit individual doors that need tweaks. Two-step workflow is clearer. |
| Custom hardware import/export | File I/O infrastructure does not exist. localStorage-only architecture (C-012). Would require file handling, format parsing, error handling for marginal value. | Manual entry. Custom hardware lists are typically 1-5 items per project. |

## Feature Dependencies

```
Project-level custom hardware CRUD (ProjectSetupView)
    |
    +--> Custom hardware in door hardware panel dropdown (TakeoffView)
    |
    +--> Custom hardware resolved in calcFullLineItem cost calc (calc pipeline)
    |
    +--> Schema migration v4 -> v5 (storage-service.ts)

Deep-copy fix (INDEPENDENT — no dependencies on other features)
    |
    +--> Fix in use-line-items.ts duplicateLineItem
    |
    +--> Fix in use-projects.ts duplicateProject

Multi-select UI for door line items (TakeoffView)
    |
    +--> Bulk template apply action (reuses applyTemplate pure function)
    |
    +--> Bulk apply confirmation dialog (optional, adds safety)
```

**Key dependency insight:** All three feature tracks are independent of each other. Deep-copy is a standalone bug fix. Custom hardware and bulk apply have zero mutual dependencies. All three can be developed in parallel or sequenced in any order.

**Ordering recommendation:** Deep-copy first (bug fix, smallest scope), then custom hardware (data model change, schema migration), then bulk apply (UI-heavy, benefits from stable data model).

## Detailed Feature Analysis

### 1. Project-Level Custom Hardware

**Data model change:**
```typescript
// Add to Project interface
customHardware: Hardware[]
// e.g., [{ id: 'chw-{uuid}', name: 'ADA Operator (Besam)', unitCost: 1500.00 }]
```

**Schema migration:** v4 to v5. Additive only — add `customHardware: []` to each existing project. Follows established sequential migration pattern (v1->v2->v3->v4->v5).

**CRUD location:** ProjectSetupView, new "Custom Hardware" section. Pattern: name input + cost input + add button, list with edit/delete. Matches existing Settings hardware editing UX patterns.

**Catalog merging at point of use:** When the door hardware panel renders its "Add Hardware" dropdown or when `calcFullLineItem` resolves hardware costs, merge `settings.doorHardware` (12 catalog items, `dhw-` prefix) with `project.customHardware` (0-N custom items, `chw-` prefix). The merge is read-only at point of use. No deduplication needed since ID prefixes differ.

**Deletion constraint:** Follows C-008 pattern — cannot delete a custom hardware item referenced by any line item's `doorHardware` array in the same project. Show "Used by N line items" error.

**Calc impact:** Zero changes to formulas. Hardware cost is still `SUM(unitCost x perDoorQty x lineItem.quantity)` per C-002. The only change is where `unitCost` is looked up — merged catalog instead of `settings.doorHardware` alone.

### 2. Deep-Copy on Line Item Duplication

**Current bug in `use-line-items.ts` line 129:**
```typescript
const newItem: LineItem = { ...item, id: uuidv4() }
```
The `doorHardware` array contains objects (`{ hardwareId, quantity }`). Spread creates a new array reference but shares the inner objects. Mutating `newItem.doorHardware[0].quantity` changes the original.

**Same bug in `use-projects.ts` line 67:**
```typescript
return { ...li, id: newId }
```
Project duplication has identical shallow-copy issue for every line item's `doorHardware`.

**Note:** `conditionIds`, `equipmentIds`, and `hardwareIds` are `string[]` — safe with shallow copy since strings are primitives. Only `doorHardware` (array of objects) needs deep copy.

**Fix pattern:**
```typescript
doorHardware: item.doorHardware.map(e => ({ ...e }))
```

**Scope:** Two locations, one-line fix each, two unit tests proving mutation isolation.

### 3. Bulk Template Application

**Multi-select mechanism:** Add a "Bulk Apply" mode to TakeoffView. When activated:
- Checkboxes appear next to each door-type line item (non-door items excluded via `isDoorSystemType()`)
- A floating action bar shows: template dropdown + "Apply to N Selected" button
- Selecting a template and confirming applies to all selected line items

**Selection state:** Ephemeral UI state (`useState<Set<string>>` in TakeoffView), not persisted to localStorage. Cleared on mode exit.

**Apply logic:** Reuse existing `applyTemplate()` pure function from `src/calc/template-apply.ts`. For each selected line item:
1. `applyTemplate(template, mergedCatalog)` returns new `DoorHardwareEntry[]`
2. Update line item's `doorHardware` field
3. Recalculate via `calcFullLineItem`
4. Cascade VE alternates

**Batch update pattern:** Single `setState` call that maps over all line items, updating those in the selection set. Avoids N separate state updates and N re-renders. Pattern already established by `recalculateAll` in `use-line-items.ts`.

**Edge cases handled by existing code:**
- Template with stale catalog refs: filtered by `applyTemplate` (existing behavior)
- Template with custom hardware refs from another project: filtered (custom ID not in merged catalog)
- Empty template: allowed, effectively clears hardware from selected doors (intentional workflow)

## MVP Recommendation

Prioritize:
1. **Deep-copy fix** — Bug fix with zero UX change. Prevents data corruption when duplicating doors. Ship first, smallest scope.
2. **Project-level custom hardware** — Unlocks real-world estimation. Without this, every non-standard door requires manual cost workarounds outside the tool.
3. **Bulk template apply** — Quality-of-life feature that compounds the value of the template system shipped in v1.1.

Defer:
- **Bulk apply confirmation dialog** — Add after core bulk apply works. Can be a polish follow-up.
- **Custom hardware cost validation** — Low priority. Estimators know their prices. Typos are rare and self-correcting when totals look wrong.
- **Select all/none toggle** — Nice but not required for initial bulk apply. Can be added if users request it.

## Sources

- Codebase analysis: `src/hooks/use-line-items.ts` lines 125-145 (shallow-copy duplication bug)
- Codebase analysis: `src/hooks/use-projects.ts` lines 57-90 (same shallow-copy issue in project duplication)
- Codebase analysis: `src/calc/template-apply.ts` (stale ref filtering pattern reusable for custom hardware)
- Codebase analysis: `src/hooks/use-door-hardware.ts` (pure mutation function pattern for CRUD)
- Codebase analysis: `src/types/index.ts` (`DoorHardwareEntry` reference semantics, `Project` and `AppSettings` interfaces)
- Codebase analysis: `src/data/seed-door-hardware.ts` (12-item catalog, `dhw-` ID prefix convention)
- Codebase analysis: `src/views/TakeoffView.tsx` (no existing multi-select UI, checkbox pattern for conditions/equipment)
- Existing patterns: Schema migration v1-v4 chain, Settings CRUD, C-008 deletion guard

---
*Feature research for: v1.2 Custom Hardware & Bulk Apply milestone*
*Researched: 2026-03-04*
