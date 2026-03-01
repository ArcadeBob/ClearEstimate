# Dual Labor Mode — Design Document

- Date: 2026-02-28
- ADR: `docs/adr/20260225-dual-labor-mode-area-and-unit-based-calculation.md`
- Constraints: C-020 through C-027, C-040, C-041, C-043
- Deferred: C-025 (indirect time), C-023/C-024 (multiplicative conditions)

## Summary

Replace the single `laborHoursPerUnit` field on `FrameSystem` with a dual labor mode on `SystemType`. Panel systems (curtain wall, storefront, etc.) use area-based labor (`sqft / sfPerManHour`). Discrete items (doors, railings) use unit-based labor (`hoursPerUnit × quantity`). This matches industry-standard glazing estimation practice.

Scope: data model + calc engine + seed data + schema migration + UI updates. Full end-to-end slice.

## 1. Data Model Changes

### SystemType — add labor fields

```ts
export interface SystemType {
  id: string
  name: string
  benchmarkLow: number
  benchmarkHigh: number
  laborMode: 'area' | 'unit'     // C-020: discriminant
  sfPerManHour?: number           // C-021: area mode only
  hoursPerUnit?: number           // C-022: unit mode only
}
```

### FrameSystem — remove laborHoursPerUnit

```ts
export interface FrameSystem {
  id: string
  name: string
  costPerLinFt: number
  // laborHoursPerUnit removed — labor is now on SystemType
}
```

### LineItem — add manHours

```ts
// Add to LineItem:
manHours: number  // base man-hours (before indirect time, which is deferred)
```

`crewDays` stays as a derived field (`manHours / 8`).

### No changes to

- `Project` (indirectTimePct deferred)
- `Condition` (multiplicative factors is a separate slice)
- `RunningTotals`

## 2. Calc Engine Changes

### labor-calc.ts — new pipeline

Remove `calcCrewDays`. Add:

- `calcBaseManHoursArea(sqft, sfPerManHour)` → `sqft / sfPerManHour` (C-021)
  - Division-by-zero guard: return 0 if `sfPerManHour <= 0` (C-043)
- `calcBaseManHoursUnit(hoursPerUnit, quantity)` → `hoursPerUnit × quantity` (C-022)

Keep unchanged:
- `calcLoadedRate(baseRate, burdenPercent, healthHourly)` (C-001)
- `calcPWLoadedRate(pwBaseRate, burdenPercent, pwFringeRate)` (C-004)

Update:
- `calcLaborCost(manHours, loadedRate)` → `round2(manHours × loadedRate)` (C-026)
  - Input changes from `crewDays * 8` to `manHours` directly

### Pipeline for this slice (no indirect time, no condition factors)

```
baseManHours = area or unit calc
manHours = baseManHours  (adjustments deferred)
crewDays = manHours / 8  (C-027)
laborCost = round2(manHours × loadedRate)  (C-026)
```

### line-total-calc.ts — update calcFullLineItem

- Look up `SystemType` to get `laborMode`, `sfPerManHour`, `hoursPerUnit`
- Branch on `laborMode`:
  - `'area'`: `calcBaseManHoursArea(sqft, systemType.sfPerManHour)`
  - `'unit'`: `calcBaseManHoursUnit(systemType.hoursPerUnit, quantity)`
- No longer reads `frame.laborHoursPerUnit`
- Stores both `manHours` and `crewDays` on the returned `LineItem`
- Condition adjustments still applied additively to crewDays for now (will be replaced in the conditions slice)

## 3. Seed Data

### System types — 15 area mode, 6 unit mode

Area mode (sfPerManHour values):

| ID | Name | sfPerManHour |
|----|------|-------------|
| sys-001 | Curtain Wall | 6.0 |
| sys-002 | Storefront | 10.0 |
| sys-003 | Window Wall | 7.0 |
| sys-004 | Ribbon Window | 8.0 |
| sys-005 | Punched Opening | 12.0 |
| sys-010 | Skylight | 5.0 |
| sys-011 | Sloped Glazing | 4.5 |
| sys-014 | Blast Resistant | 4.0 |
| sys-015 | Hurricane Rated | 5.5 |
| sys-016 | Fire Rated | 5.0 |
| sys-017 | Bullet Resistant | 3.5 |
| sys-018 | Shower Enclosure | 12.0 |
| sys-019 | Interior Partition | 14.0 |
| sys-020 | Mirror Wall | 16.0 |
| sys-021 | Glass Floor | 3.0 |

Unit mode (hoursPerUnit values):

| ID | Name | hoursPerUnit |
|----|------|-------------|
| sys-006 | Entrance System | 8.0 |
| sys-007 | Revolving Door | 24.0 |
| sys-008 | Sliding Door | 6.0 |
| sys-009 | Swing Door | 4.0 |
| sys-012 | Glass Railing | 3.0 |
| sys-013 | Glass Canopy | 10.0 |

### Frame systems — remove laborHoursPerUnit

All 5 frames become material-only: `{ id, name, costPerLinFt }`.

## 4. Schema Migration (v1 → v2)

Per ADR `20260225-replace-all-settings-on-schema-migration-v1-to-v2.md`:

1. Detect `schemaVersion === 1` (or missing)
2. Replace **all** settings with new v2 seed data (glass, frames, systems, labor rates, conditions, hardware, equipment)
3. Keep existing projects and their line items
4. Clear `conditionIds` on all line items (condition model will change in next slice)
5. Set `manHours: 0` on all existing line items (will be recalculated)
6. Bump `schemaVersion` to 2
7. Line items recalculate naturally on next render (hooks call `calcFullLineItem` on update)

## 5. UI Changes

### Settings > System Types tab

- Add columns: `Labor Mode` (display "Area" or "Unit"), productivity value (`SF/MH` or `Hrs/Unit`)
- Edit form: radio toggle for labor mode, conditional input field
- Validation: `sfPerManHour > 0` for area (C-040-INV), `hoursPerUnit > 0` for unit (C-041-INV)

### Settings > Frame Systems tab

- Remove `Labor Hours/Unit` column and input (field no longer exists)

### Takeoff view — line item display

- Show labor info adapted to mode: "X SF/MH" for area systems, "X hrs/unit" for unit systems
- Man-hours as primary labor metric; crew-days as secondary/derived

### No change in this slice

- Conditions UI (still additive adjustments — multiplicative factor redesign is separate)
- Project Setup (no indirectTimePct field)
- Summary view (RunningTotals unchanged)

## 6. Test Updates

Existing tests for `labor-calc.ts`, `line-total-calc.ts` must be rewritten to test the new API:

- `calcBaseManHoursArea` and `calcBaseManHoursUnit` replace `calcCrewDays`
- `calcLaborCost` input changes from `crewDays * 8` to `manHours`
- `calcFullLineItem` tests need SystemType with `laborMode` in settings
- New tests for division-by-zero guard (C-043)

## Execution Strategy

Bottom-up: types → seed data → calc engine → migration → UI. Each layer testable before the next.
