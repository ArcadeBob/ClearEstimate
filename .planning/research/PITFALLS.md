# Domain Pitfalls

**Domain:** Adding project-level custom hardware, deep-copy on duplication, and bulk template apply to an existing glazing estimation React SPA
**Researched:** 2026-03-04
**Milestone:** v1.2 Custom Hardware & Bulk Apply

## Critical Pitfalls

Mistakes that cause data corruption, incorrect estimates, or require rewrites.

### Pitfall 1: Shallow Copy on Line Item Duplication (EXISTING BUG)

**What goes wrong:** The current `duplicateLineItem` in `use-line-items.ts` (line 129) does `{ ...item, id: uuidv4() }`. The spread operator creates a shallow copy -- the `doorHardware` array is shared by reference between original and duplicate. Editing hardware on one line item silently mutates the other.

**Why it happens:** JavaScript spread only copies one level deep. `doorHardware: DoorHardwareEntry[]` is a nested array of objects. The array reference is copied, and each `{ hardwareId, quantity }` object inside is shared.

**Consequences:** Estimator duplicates a door line item, changes hinge count on the copy, and the original's hinge count changes too. Costs silently shift. The estimate is wrong and the user has no indication.

**Prevention:** Deep-copy all nested arrays and objects in `duplicateLineItem`:
```typescript
const newItem: LineItem = {
  ...item,
  id: uuidv4(),
  doorHardware: item.doorHardware.map(e => ({ ...e })),
  conditionIds: [...item.conditionIds],
  equipmentIds: [...item.equipmentIds],
  hardwareIds: [...item.hardwareIds],
}
```

**Detection:** Write a test: duplicate a line item, mutate `doorHardware[0].quantity` on the copy, assert the original is unchanged.

**Phase:** Must be fixed in the deep-copy phase. This is the core deliverable.

---

### Pitfall 2: Custom Hardware ID Collision with Global Catalog

**What goes wrong:** Project-level custom hardware items get IDs that could collide with global catalog IDs (e.g., `dhw-xxx`). The `calcDoorHardwareCost` function looks up `hardwareId` against `settings.doorHardware` catalog. If custom items use the same namespace, lookups resolve to the wrong item or the custom item shadows a catalog item.

**Why it happens:** The global door hardware catalog uses `dhw-001` through `dhw-012`. If custom hardware IDs use the same prefix or format, collisions are possible. Even with UUIDs, the lookup in `calcDoorHardwareCost` only searches `settings.doorHardware` -- it won't find project-level items at all.

**Consequences:** Custom hardware costs silently calculate as $0 (not found in catalog), or worse, resolve to a catalog item with a different price.

**Prevention:**
1. Use a distinct ID prefix for custom hardware (e.g., `chw-{uuid}`) to make the namespace visually distinct.
2. Modify `calcDoorHardwareCost` to accept a merged catalog: global `doorHardware` + project-level custom items. The merge must happen before the lookup, not after.
3. Project-level custom items must never overwrite or shadow global catalog entries. Use a "project-first, then global" lookup order, or better, enforce unique IDs across both pools.

**Detection:** Test: add a custom hardware item, assign it to a door, verify `calcDoorHardwareCost` returns the correct cost. Test: add a custom item with the same name as a catalog item, verify they remain distinct.

**Phase:** Must be addressed in the custom hardware data model phase, before the UI phase that allows selecting custom items.

---

### Pitfall 3: Catalog Merge Creates Phantom Items After Project Copy

**What goes wrong:** When `duplicateProject` clones a project, the custom hardware list is project-scoped. If the clone's custom hardware list is a shallow copy, editing custom hardware prices in the clone affects the original project.

**Why it happens:** Same shallow-copy issue as Pitfall 1, but at the project level. The existing `duplicateProject` in `use-projects.ts` does `{ ...original, id: uuidv4() }` with manual deep copies for `lineItems` and `veAlternates`, but does NOT deep-copy any project-level custom data (because it doesn't exist yet).

**Consequences:** Two projects share the same custom hardware objects. Price change in one silently changes the other. Submitted bids become inaccurate.

**Prevention:** When adding `customHardware` to the `Project` type, immediately update `duplicateProject` to deep-copy it:
```typescript
customHardware: (original.customHardware ?? []).map(h => ({ ...h })),
```

**Detection:** Test: duplicate project, change custom hardware price in clone, assert original price unchanged.

**Phase:** Must be addressed in the same phase as the Project type change. Do not defer.

---

### Pitfall 4: Schema Migration Loses Custom Hardware References

**What goes wrong:** The v4-to-v5 migration adds `customHardware: []` to existing projects, but existing line items that were duplicated (with shared references) or that somehow reference non-existent hardware IDs will silently produce $0 costs.

**Why it happens:** Migration is additive -- it adds the new field but doesn't validate existing data integrity. The `calcDoorHardwareCost` function silently skips unknown IDs (returns $0), so there's no error signal.

**Consequences:** Existing estimates remain correct (they don't use custom hardware yet), but if migration code is wrong, it could corrupt the schema version number or fail to initialize the new field, breaking the Settings UI.

**Prevention:**
1. Follow the existing additive migration pattern (v3->v4 is a good template).
2. Migration must initialize `customHardware: []` on every project, not just new ones.
3. Test the migration with a v4 state fixture that has projects with door hardware entries.
4. Keep it simple: the migration ONLY adds the empty array. No data transformation.

**Detection:** Migration test: load a v4 state, verify all projects get `customHardware: []`, verify existing `doorHardware` entries on line items are preserved exactly.

**Phase:** Must be the first thing built -- before any UI or calc changes.

## Moderate Pitfalls

### Pitfall 5: Bulk Template Apply Skips Recalculation

**What goes wrong:** Applying a template to 10 selected line items updates their `doorHardware` arrays but doesn't trigger `calcFullLineItem` on each. The displayed costs are stale until the user manually edits each line item.

**Why it happens:** The current `updateLineItem` hook recalculates on every call, but a bulk operation that directly sets `doorHardware` on multiple items might bypass the hook (e.g., using a batch `setState` that doesn't call `calcFullLineItem`).

**Consequences:** Line totals, material costs, and project running totals are wrong until the next edit triggers recalc. Estimator sees incorrect numbers after bulk apply.

**Prevention:** The bulk apply operation must:
1. Update `doorHardware` on all selected line items.
2. Run `calcFullLineItem` on each updated item within the same `setState` call.
3. Cascade VE alternates after all items are recalculated.

The cleanest approach: reuse the `recalculateAll` pattern already in `use-line-items.ts`, or build the bulk apply as a single `setState` updater that maps over all selected items.

**Detection:** Test: bulk apply template to 3 door line items, assert all 3 have updated `doorHardwareCost` and `lineTotal` values (not stale zeros or previous values).

**Phase:** Bulk apply implementation phase.

---

### Pitfall 6: Multi-Select State Leak Across Projects

**What goes wrong:** The multi-select checkbox state (which line items are selected for bulk operations) persists when navigating to a different project. Selected IDs from Project A match line item IDs in Project B (extremely unlikely with UUIDs, but the stale selection state causes UI confusion -- checkboxes appear checked for no reason, or the "Apply to Selected" button is enabled with 0 valid targets).

**Why it happens:** Selection state stored in React component state (`useState<Set<string>>`) survives if the component doesn't unmount on project navigation. With React Router, the `TakeoffView` component may remount (clearing state) or may not, depending on route structure.

**Consequences:** User sees "3 selected" badge in a project with no actual selection intent. Bulk apply operates on nothing (IDs don't match), which is harmless but confusing.

**Prevention:**
1. Clear selection state whenever `projectId` changes (use a `useEffect` keyed on `projectId`).
2. Before executing bulk apply, filter selected IDs against actual line item IDs in the current project.
3. Consider using `key={projectId}` on the component to force remount.

**Detection:** Test: select items in Project A, navigate to Project B, verify selection is empty.

**Phase:** Multi-select UI phase.

---

### Pitfall 7: Custom Hardware Deletion Orphans Line Item References

**What goes wrong:** Estimator creates a custom hardware item, assigns it to 5 door line items, then deletes the custom hardware item from Project Setup. The 5 line items still have `doorHardware` entries referencing the deleted ID. `calcDoorHardwareCost` silently skips it ($0), so costs drop without explanation.

**Why it happens:** The existing catalog hardware has deletion protection via C-008 (`use-settings.ts` prevents deleting referenced settings items). But project-level custom hardware is a new concept -- the same protection pattern must be replicated.

**Consequences:** Costs silently decrease. The estimator doesn't realize hardware was removed from the calculation. Bid could be too low.

**Prevention:** Two options (pick one):
1. **Prevention approach (recommended):** Before deleting a custom hardware item, check all project line items for references. Show "Used by N line items" error, same as C-008.
2. **Cascade approach:** Delete the custom hardware item AND remove all `doorHardware` entries referencing it from all line items, then recalculate. This is more complex and changes costs without warning.

Use option 1. It matches the existing pattern (C-008-INV) and is simpler.

**Detection:** Test: create custom hardware, assign to a line item, attempt delete, verify rejection with usage count.

**Phase:** Custom hardware CRUD phase (Project Setup UI).

---

### Pitfall 8: Template Apply Mixes Global and Custom Hardware References

**What goes wrong:** A hardware set template contains entries referencing global catalog IDs. When bulk-applying to a project that also has custom hardware, the template overwrites the entire `doorHardware` array -- custom items the user manually added are lost.

**Why it happens:** The current `applyTemplate` function returns a new `DoorHardwareEntry[]` that replaces the existing array entirely. This is correct for the current feature (templates replace all hardware), but users may expect "apply template + keep my custom additions."

**Consequences:** User adds project-specific custom hardware to a door, then applies a template, and the custom hardware disappears. This is technically "working as designed" but may surprise users.

**Prevention:**
1. **Accept the replace behavior** -- templates are meant to set the full hardware configuration. Document this in UI (e.g., "Applying a template replaces all current hardware").
2. Show a confirmation if the line item has custom hardware entries that would be removed.
3. Do NOT try to merge template + existing -- merge logic is complex and error-prone (duplicate entries, conflicting quantities).

**Detection:** UI review: verify the template apply dropdown shows a warning or the behavior is obvious.

**Phase:** Bulk template apply phase. Decision should be made during spec, not during implementation.

---

### Pitfall 9: applyTemplate Only Filters Against Global Catalog

**What goes wrong:** The current `applyTemplate` function in `template-apply.ts` filters template items against `catalog: Hardware[]` (the global `settings.doorHardware`). If a template contains a custom hardware ID (which it shouldn't in v1.1, but might in v1.2 if templates can reference custom items), the filter removes it as "stale."

**Why it happens:** Templates are global (stored in `settings.hardwareTemplates`), but custom hardware is project-scoped. A template created while looking at Project A's custom hardware would reference IDs that don't exist in Project B.

**Consequences:** Template silently drops custom hardware items when applied to a different project. The template appears to "lose" items.

**Prevention:**
1. **Keep templates global-only (recommended for v1.2):** Templates should only contain global catalog hardware IDs. Custom hardware is per-project and doesn't belong in reusable templates. This is the simplest approach and avoids cross-project reference issues entirely.
2. If templates must support custom hardware in the future, the template would need to store the full item definition (name + cost), not just a reference ID. This is a fundamentally different data model -- defer to a later milestone.

**Detection:** Ensure the template editor UI only shows global catalog items, not project-level custom hardware.

**Phase:** Design decision before implementation. Enforce in template editor UI.

## Minor Pitfalls

### Pitfall 10: Checkbox Performance with Large Line Item Lists

**What goes wrong:** Multi-select checkboxes on every line item row cause unnecessary re-renders. Each checkbox toggle re-renders the entire list if selection state is lifted to the parent.

**Why it happens:** React re-renders all children when parent state changes. With 50+ line items (common in commercial glazing), this causes visible lag.

**Prevention:** Use `React.memo` on the line item row component. Pass selection state as a `Set<string>` and check membership, not a boolean prop derived from the set. Or use `useCallback` for the toggle handler.

**Detection:** Manual test with 30+ line items, toggle checkboxes rapidly, check for lag.

**Phase:** Multi-select UI phase.

---

### Pitfall 11: Custom Hardware Name/Cost Validation Edge Cases

**What goes wrong:** Estimator enters a custom hardware name with only whitespace, or a cost of 0, or a negative cost. The item is created but produces unexpected results in calculations.

**Why it happens:** Missing input validation on custom hardware CRUD in Project Setup.

**Prevention:**
1. Trim and require non-empty name.
2. Require `unitCost > 0` (or `>= 0` if free items are valid -- they probably aren't for hardware).
3. Check for duplicate names within the project's custom hardware list.
4. Follow the same validation patterns used in `use-settings.ts` for global hardware.

**Detection:** Test: attempt to create custom hardware with empty name, zero cost, negative cost -- verify rejection.

**Phase:** Custom hardware CRUD phase.

---

### Pitfall 12: Stale Selection After Line Item Delete

**What goes wrong:** User selects 3 line items for bulk apply, then deletes one of them. The selection set still contains the deleted ID. The "3 selected" count is wrong (should be 2). Bulk apply tries to operate on a non-existent item.

**Why it happens:** Selection state and line item state are independent. Deleting a line item doesn't automatically clean up the selection set.

**Prevention:** Either:
1. Filter selection against current line item IDs before displaying count and before executing bulk operations.
2. Add a `useEffect` that cleans up selection when `lineItems` changes.

Option 1 is simpler and less error-prone (no effect timing issues).

**Detection:** Test: select 3, delete 1, verify selection count shows 2, verify bulk apply operates on 2.

**Phase:** Multi-select UI phase.

---

### Pitfall 13: Bulk Apply to Non-Door Line Items

**What goes wrong:** Multi-select includes non-door line items (Curtain Wall, Storefront). Bulk template apply sets `doorHardware` on these items. The hardware entries exist on the line item but are invisible (door hardware UI is hidden for non-door types). The cost still calculates via `calcDoorHardwareCost`, inflating material cost on items that shouldn't have door hardware.

**Why it happens:** The bulk apply operation iterates all selected IDs without checking `isDoorSystemType`.

**Consequences:** Costs are silently wrong on non-door line items. The user cannot see or remove the phantom door hardware because the UI hides it.

**Prevention:**
1. Filter bulk apply targets: only apply template to selected items where `isDoorSystemType(item.systemTypeId)` is true.
2. Show a count of "N items skipped (not door type)" after bulk apply.
3. Alternatively, only show multi-select checkboxes on door line items.

**Detection:** Test: select a mix of door and non-door items, bulk apply template, verify non-door items are unchanged.

**Phase:** Bulk apply implementation phase.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Schema migration (v4->v5) | Pitfall 4: Missing `customHardware` field on existing projects | Follow additive pattern from v3->v4; test with real v4 fixture |
| Project type change | Pitfall 3: Shallow copy in `duplicateProject` | Update `duplicateProject` in same PR as type change |
| Custom hardware data model | Pitfall 2: ID collision with global catalog | Use distinct prefix (`chw-`) and merge catalogs at calc time |
| Custom hardware CRUD | Pitfall 7: Orphaned references on delete | Replicate C-008 deletion protection pattern |
| Custom hardware CRUD | Pitfall 11: Missing validation | Follow `use-settings.ts` validation patterns |
| Deep-copy fix | Pitfall 1: Shallow spread in `duplicateLineItem` | Deep-copy all nested arrays; test mutation isolation |
| Calc integration | Pitfall 2: `calcDoorHardwareCost` only searches global catalog | Pass merged catalog (global + project custom) |
| Template apply design | Pitfall 9: Templates reference project-scoped custom items | Keep templates global-catalog-only in v1.2 |
| Bulk template apply | Pitfall 5: Missing recalculation after bulk update | Run `calcFullLineItem` on each item in same `setState` |
| Bulk template apply | Pitfall 8: Template replaces custom hardware silently | Accept replace behavior; show confirmation if custom items exist |
| Bulk template apply | Pitfall 13: Apply to non-door items | Filter by `isDoorSystemType` before applying |
| Multi-select UI | Pitfall 6: Selection state leaks across projects | Clear selection on `projectId` change |
| Multi-select UI | Pitfall 10: Re-render performance | `React.memo` on row component |
| Multi-select UI | Pitfall 12: Stale selection after delete | Filter selection against current IDs before use |

## Integration Risk Summary

The highest-risk integration point is **the calc pipeline**. Currently `calcDoorHardwareCost` takes `settings.doorHardware` (global catalog only). Adding project-level custom hardware means every call site that passes the catalog must be updated to merge global + custom. The call chain is:

```
updateLineItem (use-line-items.ts)
  -> calcFullLineItem (line-total-calc.ts)
    -> calcDoorHardwareCost (door-hardware-calc.ts)  <-- needs merged catalog
```

And for bulk apply:
```
bulkApplyTemplate (new function)
  -> applyTemplate (template-apply.ts)  <-- filter against merged catalog
  -> calcFullLineItem (line-total-calc.ts)
    -> calcDoorHardwareCost  <-- needs merged catalog
```

The merge must happen at the `calcFullLineItem` level (it already receives `settings`), but `settings.doorHardware` is global-only. The cleanest approach: pass the project's `customHardware` as an additional parameter to `calcFullLineItem`, and let it merge internally before passing to `calcDoorHardwareCost`.

## "Looks Done But Isn't" Checklist

- [ ] **Deep copy isolation:** Duplicate a door line item, change hardware qty on the copy, verify the original is unchanged
- [ ] **Custom hardware in calc:** Add custom hardware to a door, verify `materialCost` and `lineTotal` increase correctly
- [ ] **Custom hardware after project duplicate:** Clone project with custom hardware, change price in clone, verify original price unchanged
- [ ] **Migration on v4 data:** Load v4 localStorage, verify projects gain `customHardware: []` without losing existing data
- [ ] **Bulk apply recalc:** Apply template to 3 doors, verify all 3 have updated costs (not stale)
- [ ] **Bulk apply skips non-doors:** Select mixed door + non-door items, apply template, verify non-door items unchanged
- [ ] **Selection cleanup on navigate:** Select items in Project A, navigate to Project B, verify selection is empty
- [ ] **Custom hardware deletion protection:** Assign custom hardware to a line item, try to delete it, verify rejection
- [ ] **Template only shows global catalog:** Open template editor, verify custom hardware items do not appear
- [ ] **VE cascade after bulk apply:** Apply template to a door with VE alternate, verify VE `originalCost` updates

## Sources

- Direct codebase analysis: `src/hooks/use-line-items.ts` (line 129: shallow copy bug), `src/hooks/use-projects.ts` (line 64-67: shallow line item copy), `src/calc/line-total-calc.ts` (line 52-56: catalog lookup), `src/calc/door-hardware-calc.ts` (line 14: Map-based lookup), `src/calc/template-apply.ts` (line 14: global-only filter), `src/storage/storage-service.ts` (line 25-79: migration chain)
- Existing constraint registry (`CONSTRAINTS.md`) for C-008, C-019, C-033 patterns
- JavaScript shallow copy semantics (well-established language behavior, HIGH confidence)

---
*Pitfalls research for: v1.2 Custom Hardware & Bulk Apply in ClearEstimate*
*Researched: 2026-03-04*
