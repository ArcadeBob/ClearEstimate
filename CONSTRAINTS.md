# Constraints Registry

This file is the permanent source of truth for all project constraints and invariants.

Specs are temporary; this file is forever.

## Active Constraints

| ID | Type | Short Name | Enforced At | Verified By |
|----|------|-----------|-------------|-------------|
| C-001 | Core | Glazier labor rate for all line items | `use-line-items.ts` — `recalculateLineItem()` | Spot-check: 48"x96" = ~$879 |
| C-002 | Core | Hardware cost = Σ(unitCost × lineItem.quantity) | `material-calc.ts` | Spot-check |
| C-003 | Core | Equipment suggestion when heightInches > 0 | `equipment-calc.ts`, `TakeoffView.tsx` | SUCCESS.md acceptance criteria |
| C-004 | Core | PW loaded rate = pwBaseRate × (1 + burden) + pwFringeRate | `labor-calc.ts` | Unit calc verification |
| C-005 | Core | VE savings = originalCost - alternateCost | `use-ve-alternates.ts` | Running totals verification |
| C-006 | Core | Scope template: "Furnish and install {systemType}..." | `summary-calc.ts` | Summary view visual check |
| C-007 | Core | activeProjectId derived from URL :id, not stored | `App.tsx` routes, `use-projects.ts` | Navigation test |
| C-008 | Core | Prevent deletion of referenced settings items | `use-settings.ts` | Delete attempt on used glass type |
| C-009 | Core | Scope description shape: { systemTypeId, text } | `src/types/index.ts` | TypeScript compiler |
| C-010 | Core | Timestamps: { createdAt, updatedAt } ISO strings | `use-projects.ts` | localStorage round-trip |
| C-011 | Core | SOV per-row = rowDirectCost × (1 + OH) × (1 + profit) | `summary-calc.ts` | Summary view totals |
| C-012 | Core | Auto-persist via hooks; no draft state in Phase 1 | `use-app-store.ts` | localStorage round-trip |
| C-013 | Core | Input validation at hook layer | `use-line-items.ts` | Invalid input edge cases |
| C-014 | Core | Scope descriptions: no auto-overwrite of user edits | `SummaryView.tsx` | Edit, add line item, verify text preserved |
| C-015 | Core | VE originalCost auto-updates on line item recalc | `use-ve-alternates.ts` | Change dimension → verify VE savings update |
| C-016 | Core | Hardware qty = lineItem.quantity (Phase 1 simplification) | `material-calc.ts` | Documented known limitation |
| C-017 | Core | Currency display: $1,234.56 via formatCurrency() | `src/calc/index.ts` | Visual check across all views |
| C-018 | Core | SOV penny discrepancy accepted in Phase 1 | `summary-calc.ts` | Documented known limitation |
| C-019 | Core | duplicateProject() remaps VE lineItemId via oldId→newId map | `use-projects.ts` | Duplicate project with VE items test |
| I-001 | Interface | Expandable row / detail panel for Takeoff density | `TakeoffView.tsx` | UX review |
| I-002 | Interface | Inline validation errors on invalid line items | `TakeoffView.tsx` | Invalid input visual check |
| I-003 | Interface | Condition adjustment units = crew-days (not per-unit) | `seed-conditions.ts`, `labor-calc.ts` | Seed data comments |
| B-001 | Build | React 19.x required (React Router 7 use() hook) | `package.json` | `npm run build` |
| B-002 | Build | Manual project scaffold (no npm create vite in non-empty dir) | Task 1 process | N/A — one-time setup |
| B-003 | Build | react-is@^19 required (Recharts peer dep) | `package.json` | `npm install` — no peer dep warnings |
| B-004 | Build | React Router imports from "react-router" not "react-router-dom" | All routing files | `npm run build` — no import errors |
| B-005 | Build | localStorage schema versioning | `storage-service.ts` | Schema migration on version mismatch |

## Active Invariants

| ID | Type | Short Name | Enforced At | Verified By |
|----|------|-----------|-------------|-------------|
| C-013-INV | Invariant | Line items with invalid inputs excluded from running totals | `use-line-items.ts` | Zero-quantity and negative-dimension tests |
| C-008-INV | Invariant | Referenced settings items cannot be deleted | `use-settings.ts` | Attempted delete shows "Used by N items" error |
| C-019-INV | Invariant | No orphaned VE alternates after project duplicate | `use-projects.ts` | VE lineItemId points to cloned item, not original |

## Retired

| ID | Retired Date | Reason | Superseded By |
|----|-------------|--------|---------------|
| (none yet) | | | |
