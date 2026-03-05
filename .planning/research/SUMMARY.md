# Project Research Summary

**Project:** ClearEstimate v1.2 — Custom Hardware & Bulk Apply
**Domain:** Glazing contractor estimation SPA (brownfield, React + TypeScript)
**Researched:** 2026-03-04
**Confidence:** HIGH

## Executive Summary

ClearEstimate v1.2 delivers three independent features that extend the door hardware system shipped in v1.1: project-level custom hardware items, a deep-copy bug fix for line item duplication, and bulk template application to multiple doors. All three are data-model and state-logic changes within the existing React/TypeScript/Vite stack. No new dependencies are needed. The codebase has well-established patterns (pure mutation functions, hook-based state, calc orchestration, schema migration chains) that each feature follows directly.

The recommended approach is to build in dependency order: deep-copy fix first (standalone bug fix, smallest scope), then custom hardware data model and CRUD (schema migration + type change that other work depends on), then bulk template apply (most complex UI, benefits from stable data model and merged catalog). All three feature tracks are technically independent, but sequencing them this way minimizes risk and ensures the data model is solid before UI work begins.

The primary risks are shallow-copy bugs (an existing defect that must be fixed, plus the same pattern recurring when `customHardware` is added to `Project`), ID namespace collisions between global and custom hardware catalogs, and ensuring the calc pipeline receives a merged catalog at every call site. All risks have clear, tested mitigation strategies drawn from existing codebase patterns.

## Key Findings

### Recommended Stack

No changes to the technology stack. All v1.2 features are pure data-model and state-logic changes within the existing architecture. The current stack (React 19, TypeScript 5.7, Vite 6, Tailwind CSS 4, Vitest 4) handles everything needed.

**What NOT to add:**
- **lodash/immer** -- `DoorHardwareEntry` and `Hardware` are flat objects; spread suffices for deep copy
- **react-hook-form** -- custom hardware form is 2 fields; controlled inputs are simpler
- **@tanstack/react-table** -- adding a table library for a checkbox column is over-engineering
- **zustand/jotai** -- selection is ephemeral UI state; `useState<Set<string>>` is correct

### Expected Features

**Must have (table stakes):**
- Project-level custom hardware CRUD -- estimators encounter specialty hardware on nearly every job; the 12-item seed catalog cannot cover real projects
- Custom hardware selectable in door hardware panel -- items must be visible at the point of use, not just in project setup
- Deep-copy on line item duplication -- existing shallow-copy is a data integrity bug causing silent cost corruption
- Bulk template apply to multiple selected doors -- applying templates one-by-one is the primary UX pain point with 10-30 identical doors

**Should have (differentiators):**
- Bulk apply confirmation dialog -- prevents accidental overwrite of customized hardware across many doors
- Select all / select none toggle -- saves clicks on projects with many doors
- Custom hardware in saved templates (within same project) -- natural extension, uses existing stale-ref filtering

**Defer (v2+):**
- Global custom hardware catalog -- project-specific pricing makes global catalog unreliable
- Custom hardware import/export -- no file I/O infrastructure exists (C-012)
- Drag-and-drop reordering for bulk select -- over-engineered for a checkbox list
- Inline hardware editing during bulk apply -- defeats the purpose of uniform template application

### Architecture Approach

All three features integrate into the existing architecture with minimal structural change. Two new files are needed (`use-custom-hardware.ts` hook, `merged-catalog.ts` utility), plus modifications to roughly 10 existing files. The key architectural decisions are: (1) custom hardware lives on `Project` not `AppSettings`, merged at point of use; (2) deep-copy is extracted as a testable pure function; (3) bulk apply reuses the existing `applyTemplate` pure function with a batch wrapper; (4) selection state is local `useState` in TakeoffView, not a new context.

**Major components:**
1. **`useCustomHardware` hook** -- CRUD for project-level hardware items, with pure mutation functions for testability
2. **`getMergedHardwareCatalog` utility** -- merges global catalog + project custom items at point of use (never stored merged)
3. **`applyTemplateBulk` pure function** -- batch template application with independent deep copies per line item
4. **`deepCopyLineItem` pure function** -- safe duplication with all nested arrays independently copied
5. **Schema migration v4->v5** -- additive migration adding `customHardware: []` to all existing projects

### Critical Pitfalls

1. **Shallow copy on duplication (EXISTING BUG)** -- `duplicateLineItem` shares `doorHardware` objects by reference. Fix: deep-copy all nested arrays. Test mutation isolation explicitly.
2. **Custom hardware ID collision with global catalog** -- Use `chw-` prefix (distinct from `dhw-`). Pass merged catalog to `calcDoorHardwareCost` at every call site. Test that custom items resolve to correct prices.
3. **Shallow copy in `duplicateProject` for new fields** -- When adding `customHardware` to `Project`, update `duplicateProject` in the same phase. Do not defer.
4. **Bulk apply skips recalculation** -- Must run `calcFullLineItem` on each updated item within the same `setState` call, then cascade VE alternates.
5. **Custom hardware deletion orphans references** -- Replicate C-008 deletion protection pattern: prevent deletion when referenced by line items.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Deep-Copy Bug Fix
**Rationale:** Standalone bug fix with zero dependencies. Smallest scope. Fixes existing data corruption risk before any new features add complexity.
**Delivers:** `deepCopyLineItem` pure function; fixed `duplicateLineItem` and `duplicateProject`; regression tests proving mutation isolation.
**Addresses:** Table stakes -- deep-copy on duplication (FEATURES); Pitfall 1 shallow copy bug (PITFALLS).
**Avoids:** Pitfall 1 (shallow copy), Pitfall 3 (project copy shares nested objects).

### Phase 2: Custom Hardware Data Model & Migration
**Rationale:** Type foundation required by all subsequent phases. Schema migration must land before any UI or calc changes.
**Delivers:** `customHardware: Hardware[]` on `Project` type; v4->v5 schema migration; updated default project factory; `duplicateProject` deep-copies `customHardware`.
**Addresses:** Data model prerequisite for custom hardware features (ARCHITECTURE).
**Avoids:** Pitfall 4 (migration loses references), Pitfall 2 (ID collision via `chw-` prefix convention).

### Phase 3: Custom Hardware CRUD & Calc Integration
**Rationale:** State management and calc pipeline must work before UI renders custom items. Groups the hook + calc changes that are tightly coupled.
**Delivers:** `useCustomHardware` hook with pure mutation functions; `getMergedHardwareCatalog` utility; `calcFullLineItem` accepts optional `customHardware` param; deletion protection (C-008 pattern).
**Addresses:** Custom hardware CRUD (FEATURES); merged catalog pattern (ARCHITECTURE).
**Avoids:** Pitfall 7 (orphaned references on delete), Pitfall 2 (calc only searches global catalog).

### Phase 4: Custom Hardware UI
**Rationale:** Depends on hook (Phase 3) and calc integration (Phase 3). This is the user-visible surface.
**Delivers:** Custom Hardware section in ProjectSetupView; merged catalog in DoorHardwarePanel dropdown; `useDoorHardware` validates against merged catalog.
**Addresses:** Custom hardware selectable in panel (FEATURES table stakes).
**Avoids:** Pitfall 11 (validation edge cases -- enforce non-empty name, positive cost).

### Phase 5: Bulk Template Application
**Rationale:** Most complex UI change. Benefits from stable data model and merged catalog from earlier phases. Independent feature track but placed last for maximum stability.
**Delivers:** `applyTemplateBulk` pure function; `bulkApplyTemplate` in `useLineItems`; selection state + bulk action bar in TakeoffView; select all/none toggle; confirmation dialog.
**Addresses:** Bulk template apply (FEATURES table stakes); confirmation dialog (FEATURES differentiator).
**Avoids:** Pitfall 5 (skipped recalc), Pitfall 6 (selection leak across projects), Pitfall 12 (stale selection after delete), Pitfall 13 (apply to non-door items).

### Phase Ordering Rationale

- **Dependency chain:** Phase 2 (type change) must precede Phase 3 (hook/calc) which must precede Phase 4 (UI). Phase 1 is independent. Phase 5 is independent but benefits from merged catalog work in Phases 3-4.
- **Risk reduction:** Bug fix first removes existing data corruption. Schema migration second establishes the data foundation. Calc integration third ensures correctness before UI exposes features.
- **Grouping logic:** Phases 2-4 form the custom hardware feature track. Phases 3-4 are tightly coupled (hook changes + UI that calls them). Phase 5 is a separate feature track that reuses infrastructure from Phases 3-4.

### Research Flags

Phases with standard patterns (skip `/gsd:research-phase`):
- **Phase 1 (Deep-Copy):** Well-understood JavaScript semantics. One-line fix per location plus tests. No research needed.
- **Phase 2 (Data Model & Migration):** Follows established v2->v3->v4 migration pattern exactly. No research needed.
- **Phase 3 (CRUD & Calc):** Follows existing `useDoorHardware` hook pattern and `calcFullLineItem` parameterization. No research needed.
- **Phase 4 (Custom Hardware UI):** Follows existing ProjectSetupView Section pattern and DoorHardwarePanel props pattern. No research needed.
- **Phase 5 (Bulk Apply):** Follows existing `applyTemplate` pattern for the pure function. Multi-select UI is standard checkbox pattern. No research needed.

All phases follow well-documented patterns already established in the codebase. No phase requires deeper research.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Brownfield project; no new dependencies; all decisions from direct codebase analysis |
| Features | HIGH | Features defined by codebase gap analysis; dependencies mapped from actual import chains |
| Architecture | HIGH | All patterns derived from existing codebase conventions; no novel architecture needed |
| Pitfalls | HIGH | Pitfalls verified against actual source lines; shallow-copy bug confirmed by code inspection |

**Overall confidence:** HIGH

All research is based on direct codebase analysis of established patterns. No external APIs, no novel technology, no domain ambiguity. The v1.2 milestone is a straightforward extension of v1.1 patterns.

### Gaps to Address

- **Template editor scope:** Research recommends keeping templates global-catalog-only in v1.2 (no custom hardware in templates). This is a design decision that should be confirmed during spec writing for Phase 5.
- **Replace vs. merge behavior:** Bulk template apply replaces existing door hardware entirely. If users expect additive behavior, this needs a UX decision during Phase 5 planning. Research recommends replace with confirmation dialog.
- **Custom hardware cost validation:** Whether to enforce `unitCost > 0` or allow `>= 0` (free items) is a minor domain decision for Phase 4.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of `src/types/index.ts`, `src/hooks/use-line-items.ts`, `src/hooks/use-projects.ts`, `src/calc/line-total-calc.ts`, `src/calc/door-hardware-calc.ts`, `src/calc/template-apply.ts`, `src/storage/storage-service.ts`
- Existing constraint registry (`CONSTRAINTS.md`) for C-008, C-012, C-019, C-033 patterns
- Established migration chain (v1->v2->v3->v4) in `storage-service.ts`

---
*Research completed: 2026-03-04*
*Ready for roadmap: yes*
