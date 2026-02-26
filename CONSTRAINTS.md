# Constraints Registry

This file is the permanent source of truth for all project constraints and invariants.

Specs are temporary; this file is forever.

## Active Constraints

| ID | Type | Short Name | Enforced At | Verified By |
|----|------|-----------|-------------|-------------|
| C-002 | Core | Hardware cost = Σ(unitCost × lineItem.quantity) | `material-calc.ts` | verify-calc.ts |
| C-003 | Core | Equipment suggestion when heightInches > 0 | `equipment-calc.ts`, `TakeoffView.tsx` | Manual test |
| C-004 | Core | PW loaded rate = pwBaseRate × (1 + burden) + pwFringeRate | `labor-calc.ts` | verify-calc.ts |
| C-005 | Core | VE savings = originalCost − alternateCost | `use-ve-alternates.ts` | verify-calc.ts |
| C-006 | Core | Scope template: "Furnish and install {systemType}..." | `summary-calc.ts` | Summary view visual check |
| C-007 | Core | activeProjectId derived from URL :id, not stored | `App.tsx`, `use-projects.ts` | Navigation test |
| C-008 | Core | Prevent deletion of referenced settings items | `use-settings.ts` | Delete attempt on used item |
| C-009 | Core | Scope description shape: { systemTypeId, text } | `src/types/index.ts` | TypeScript compiler |
| C-010 | Core | Timestamps: { createdAt, updatedAt } ISO strings | `use-projects.ts` | localStorage round-trip |
| C-011 | Core | SOV per-row: `rowDirectCost × (1 + OH) × (1 + profit)`; contingency row shown/hidden/distributed | `summary-calc.ts` | verify-calc.ts |
| C-012 | Core | Auto-persist via hooks; no draft state | `use-app-store.ts` | localStorage round-trip |
| C-013 | Core | Input validation at hook layer | `use-line-items.ts` | Invalid input edge cases |
| C-014 | Core | Scope descriptions: no auto-overwrite of user edits | `SummaryView.tsx` | Edit + add line item test |
| C-015 | Core | VE originalCost auto-updates on line item recalc | `use-ve-alternates.ts` | Change dimension → verify |
| C-016 | Core | Hardware qty = lineItem.quantity (Sprint 1 simplification) | `material-calc.ts` | Documented limitation |
| C-017 | Core | Currency display: $1,234.56 via formatCurrency() | `src/calc/index.ts` | Visual check all views |
| C-018 | Core | SOV penny discrepancy accepted (per-row rounding) | `summary-calc.ts` | Documented limitation |
| C-019 | Core | duplicateProject() remaps VE lineItemId via oldId→newId map | `use-projects.ts` | Duplicate project test |
| C-020 | Core | Dual labor mode: SystemType.laborMode ('area'\|'unit') determines calc path | `labor-calc.ts`, `use-line-items.ts` | verify-calc.ts |
| C-021 | Core | Area labor: `baseManHours = sqft / sfPerManHour` | `labor-calc.ts` | verify-calc.ts |
| C-022 | Core | Unit labor: `baseManHours = hoursPerUnit × quantity` | `labor-calc.ts` | verify-calc.ts |
| C-023 | Core | Productivity factor = Π(condition.factor), default 1.0 when none selected | `labor-calc.ts` | verify-calc.ts |
| C-024 | Core | `adjustedManHours = baseManHours / productivityFactor` | `labor-calc.ts` | verify-calc.ts |
| C-025 | Core | `totalManHours = adjustedManHours × (1 + indirectTimePct)` — per line item | `labor-calc.ts` | verify-calc.ts |
| C-026 | Core | `laborCost = round2(totalManHours × loadedRate)` | `labor-calc.ts` | verify-calc.ts |
| C-027 | Core | `crewDays = totalManHours / 8` — derived for equipment calc | `labor-calc.ts` | verify-calc.ts |
| C-028 | Core | Waste applied project-level to material subtotal only (not per-line, not labor/equipment) | `summary-calc.ts` | verify-calc.ts |
| C-029 | Core | `wasteAmount = round2(materialSubtotal × wastePct)` | `summary-calc.ts` | verify-calc.ts |
| C-030 | Core | Contingency applied to subtotal (incl. waste) before O&P | `summary-calc.ts` | verify-calc.ts |
| C-031 | Core | `contingencyAmount = round2(subtotal × contingencyPct)` | `summary-calc.ts` | verify-calc.ts |
| C-032 | Core | `contractValue = round2(adjustedSubtotal × (1 + OH) × (1 + profit))` | `summary-calc.ts` | verify-calc.ts |
| C-033 | Core | `lineTotal = materialCost + laborCost + equipmentCost` — no waste/contingency/O&P | `line-total-calc.ts` | verify-calc.ts |
| C-034 | Core | Condition factor range: 0.01–1.00 (penalties only, no > 1.0) | `use-settings.ts`, Settings UI | verify-calc.ts |
| C-035 | Core | One condition per category per line item (mutual exclusivity) | `use-line-items.ts` | verify-calc.ts |
| C-036 | Core | Condition deletion cascades to all line items across all projects | `use-settings.ts` | Manual test |
| C-037 | Core | FrameSystem.systemTypeId FK — frames grouped by system type | `types/index.ts`, `seed-frames.ts` | TypeScript compiler |
| C-038 | Core | Frame dropdown filtered by selected system type | `TakeoffView.tsx` | Manual test |
| C-039 | Core | System type change clears incompatible frame selection | `use-line-items.ts` | Manual test |
| C-040 | Core | `sfPerManHour > 0` required when `laborMode === 'area'` | `use-settings.ts`, `labor-calc.ts` | verify-calc.ts |
| C-041 | Core | `hoursPerUnit > 0` required when `laborMode === 'unit'` | `use-settings.ts`, `labor-calc.ts` | verify-calc.ts |
| C-042 | Core | Round monetary values only — man-hours, sqft, crew-days keep full precision | All calc modules | verify-calc.ts |
| C-043 | Core | Division-by-zero guard: `if (sfPerManHour <= 0) return 0` | `labor-calc.ts` | verify-calc.ts |
| C-044 | Core | Order of operations: subtotals → waste → contingency → VE deduction → O&P | `summary-calc.ts` | verify-calc.ts |
| C-045 | Core | VE deducted after contingency, before O&P: `adjusted = subtotal + contingency − veSavings` | `summary-calc.ts` | verify-calc.ts |
| C-046 | Core | Project defaults: wastePct=0.05, indirectTimePct=0.25, contingencyPct=0.05 | `use-projects.ts`, `data/index.ts` | verify-calc.ts |
| C-047 | Core | conditionIds max 3 entries (one per category) | `use-line-items.ts` | verify-calc.ts |
| I-001 | Interface | Expandable row / detail panel for Takeoff density | `TakeoffView.tsx` | UX review |
| I-002 | Interface | Inline validation errors on invalid line items | `TakeoffView.tsx` | Invalid input visual check |
| I-003 | Interface | Conditions as radio buttons per category (not checkboxes) | `TakeoffView.tsx` | UX review |
| I-004 | Interface | System type must be selected first (gates frame dropdown + calc) | `TakeoffView.tsx` | Manual test |
| I-005 | Interface | Man-hours as primary labor metric display (not crew-days) | `TakeoffView.tsx` | Visual check |
| I-006 | Interface | Running totals sidebar: waste, contingency, VE as separate visible lines | `TakeoffView.tsx`, `SummaryView.tsx` | Visual check |
| I-007 | Interface | SOV contingency row: shown/hidden via showContingencyInSov toggle | `SummaryView.tsx`, `summary-calc.ts` | Manual test |
| B-001 | Build | React 19.x required (React Router 7 use() hook) | `package.json` | `npm run build` |
| B-002 | Build | Manual project scaffold (no npm create vite in non-empty dir) | N/A — one-time | N/A |
| B-004 | Build | React Router imports from "react-router" not "react-router-dom" | All routing files | `npm run build` |
| B-005 | Build | localStorage schema versioning | `storage-service.ts` | Schema migration test |
| B-006 | Build | Remove recharts + react-is dependencies | `package.json` | `npm install` — no recharts |
| B-007 | Build | Schema migration v1→v2: replace all settings with new seed data | `storage-service.ts` | Migration test |
| B-008 | Build | Remove op-suggest.ts, benchmark-calc.ts, BenchmarkBadge.tsx | File system | `npm run build` |

## Active Invariants

| ID | Type | Short Name | Enforced At | Verified By |
|----|------|-----------|-------------|-------------|
| C-008-INV | Invariant | Referenced settings items cannot be deleted | `use-settings.ts` | Attempted delete shows "Used by N items" error |
| C-013-INV | Invariant | Line items with invalid inputs excluded from running totals | `use-line-items.ts` | Zero-quantity and negative-dimension tests |
| C-019-INV | Invariant | No orphaned VE alternates after project duplicate | `use-projects.ts` | VE lineItemId points to cloned item |
| C-035-INV | Invariant | Condition selection replaces existing in same category | `use-line-items.ts` | Select two from same category → only latest kept |
| C-036-INV | Invariant | No line item references a deleted condition ID | `use-settings.ts` | Delete condition → verify cleared from all items |
| C-039-INV | Invariant | No orphan frame FK after system type change | `use-line-items.ts` | Change system type → frame null or compatible |
| C-040-INV | Invariant | Area-mode system cannot be saved with sfPerManHour ≤ 0 | `use-settings.ts` | Attempt save → validation error |
| C-041-INV | Invariant | Unit-mode system cannot be saved with hoursPerUnit ≤ 0 | `use-settings.ts` | Attempt save → validation error |

## B-xxx Traceability

| B-xxx | Traces To |
|-------|-----------|
| B-001 | Foundation — React 19 required for app to function |
| B-002 | Foundation — one-time setup constraint |
| B-004 | Foundation — import convention for React Router 7 |
| B-005 | C-012 (auto-persist requires schema versioning) |
| B-006 | I-006 (running totals replaces pie chart) |
| B-007 | C-020, C-034, C-037, C-046 (new data model requires migration) |
| B-008 | C-020 (new calc model makes old modules invalid) |

## Retired

| ID | Retired Date | Reason | Superseded By |
|----|-------------|--------|---------------|
| C-001 | 2026-02-24 | Old labor model (hours-per-unit from FrameSystem) | C-020 through C-027 |
| I-003 (old) | 2026-02-24 | Crew-day condition adjustments replaced by multiplicative factors | C-023, C-034, C-035, I-003 (new) |
| B-003 | 2026-02-24 | react-is@^19 for Recharts — Recharts removed | B-006 |
