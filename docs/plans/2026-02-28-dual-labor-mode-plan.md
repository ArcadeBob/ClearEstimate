# Dual Labor Mode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace single `laborHoursPerUnit` on FrameSystem with dual labor mode (area/unit) on SystemType, matching industry-standard glazing estimation.

**Architecture:** SystemType gains a `laborMode: 'area' | 'unit'` discriminant. Area-mode systems use `sqft / sfPerManHour` for labor; unit-mode systems use `hoursPerUnit × quantity`. FrameSystem becomes material-only (cost/LF). Schema migration v1→v2 replaces all settings with new seed data.

**Tech Stack:** React 19, TypeScript 5 (strict), Vitest 4, Vite 6, Tailwind CSS v4

---

### Task 1: Update TypeScript interfaces

**Files:**
- Modify: `src/types/index.ts`

**Step 1: Update SystemType interface**

In `src/types/index.ts`, replace the `SystemType` interface (lines 78-83):

```ts
export interface SystemType {
  id: string
  name: string
  benchmarkLow: number
  benchmarkHigh: number
  laborMode: 'area' | 'unit'
  sfPerManHour?: number
  hoursPerUnit?: number
}
```

**Step 2: Update FrameSystem interface**

Replace the `FrameSystem` interface (lines 71-76):

```ts
export interface FrameSystem {
  id: string
  name: string
  costPerLinFt: number
}
```

**Step 3: Add manHours to LineItem**

Add `manHours: number` after `crewDays: number` on line 44 of the `LineItem` interface:

```ts
  crewDays: number
  manHours: number
```

**Step 4: Run type-check to see expected errors**

Run: `npm run lint 2>&1 | head -50`

Expected: TypeScript errors in seed data, calc, hooks, views, and tests referencing `laborHoursPerUnit` or missing `manHours`. This confirms all downstream files that need updating.

**Step 5: Commit**

```
feat: update types for dual labor mode (C-020)

Add laborMode/sfPerManHour/hoursPerUnit to SystemType, remove
laborHoursPerUnit from FrameSystem, add manHours to LineItem.
```

---

### Task 2: Update seed data

**Files:**
- Modify: `src/data/seed-systems.ts`
- Modify: `src/data/seed-frames.ts`
- Modify: `src/data/index.ts` (spot-check comment only)

**Step 1: Rewrite seed-systems.ts**

Replace the entire `SEED_SYSTEM_TYPES` array. Each entry now has `laborMode` plus `sfPerManHour` or `hoursPerUnit`:

```ts
import type { SystemType } from '@/types'

export const SEED_SYSTEM_TYPES: SystemType[] = [
  // Area mode — sfPerManHour
  { id: 'sys-001', name: 'Curtain Wall',       benchmarkLow: 45,  benchmarkHigh: 75,  laborMode: 'area', sfPerManHour: 6.0 },
  { id: 'sys-002', name: 'Storefront',         benchmarkLow: 25,  benchmarkHigh: 45,  laborMode: 'area', sfPerManHour: 10.0 },
  { id: 'sys-003', name: 'Window Wall',        benchmarkLow: 35,  benchmarkHigh: 60,  laborMode: 'area', sfPerManHour: 7.0 },
  { id: 'sys-004', name: 'Ribbon Window',      benchmarkLow: 30,  benchmarkHigh: 55,  laborMode: 'area', sfPerManHour: 8.0 },
  { id: 'sys-005', name: 'Punched Opening',    benchmarkLow: 20,  benchmarkHigh: 40,  laborMode: 'area', sfPerManHour: 12.0 },
  { id: 'sys-010', name: 'Skylight',           benchmarkLow: 50,  benchmarkHigh: 85,  laborMode: 'area', sfPerManHour: 5.0 },
  { id: 'sys-011', name: 'Sloped Glazing',     benchmarkLow: 55,  benchmarkHigh: 90,  laborMode: 'area', sfPerManHour: 4.5 },
  { id: 'sys-014', name: 'Blast Resistant',    benchmarkLow: 70,  benchmarkHigh: 120, laborMode: 'area', sfPerManHour: 4.0 },
  { id: 'sys-015', name: 'Hurricane Rated',    benchmarkLow: 55,  benchmarkHigh: 95,  laborMode: 'area', sfPerManHour: 5.5 },
  { id: 'sys-016', name: 'Fire Rated',         benchmarkLow: 60,  benchmarkHigh: 100, laborMode: 'area', sfPerManHour: 5.0 },
  { id: 'sys-017', name: 'Bullet Resistant',   benchmarkLow: 90,  benchmarkHigh: 160, laborMode: 'area', sfPerManHour: 3.5 },
  { id: 'sys-018', name: 'Shower Enclosure',   benchmarkLow: 30,  benchmarkHigh: 55,  laborMode: 'area', sfPerManHour: 12.0 },
  { id: 'sys-019', name: 'Interior Partition', benchmarkLow: 25,  benchmarkHigh: 45,  laborMode: 'area', sfPerManHour: 14.0 },
  { id: 'sys-020', name: 'Mirror Wall',        benchmarkLow: 20,  benchmarkHigh: 35,  laborMode: 'area', sfPerManHour: 16.0 },
  { id: 'sys-021', name: 'Glass Floor',        benchmarkLow: 100, benchmarkHigh: 180, laborMode: 'area', sfPerManHour: 3.0 },
  // Unit mode — hoursPerUnit
  { id: 'sys-006', name: 'Entrance System',    benchmarkLow: 55,  benchmarkHigh: 90,  laborMode: 'unit', hoursPerUnit: 8.0 },
  { id: 'sys-007', name: 'Revolving Door',     benchmarkLow: 80,  benchmarkHigh: 150, laborMode: 'unit', hoursPerUnit: 24.0 },
  { id: 'sys-008', name: 'Sliding Door',       benchmarkLow: 40,  benchmarkHigh: 70,  laborMode: 'unit', hoursPerUnit: 6.0 },
  { id: 'sys-009', name: 'Swing Door',         benchmarkLow: 35,  benchmarkHigh: 65,  laborMode: 'unit', hoursPerUnit: 4.0 },
  { id: 'sys-012', name: 'Glass Railing',      benchmarkLow: 60,  benchmarkHigh: 100, laborMode: 'unit', hoursPerUnit: 3.0 },
  { id: 'sys-013', name: 'Glass Canopy',       benchmarkLow: 65,  benchmarkHigh: 110, laborMode: 'unit', hoursPerUnit: 10.0 },
]
```

**Step 2: Rewrite seed-frames.ts**

Remove `laborHoursPerUnit` from every frame. Update the spot-check comment:

```ts
import type { FrameSystem } from '@/types'

/**
 * 5 frame systems — material pricing only (cost per linear foot).
 * Labor is now driven by SystemType (C-020).
 */
export const SEED_FRAME_SYSTEMS: FrameSystem[] = [
  { id: 'frame-001', name: 'Kawneer Trifab 451T', costPerLinFt: 9.85 },
  { id: 'frame-002', name: 'YKK AP YCW 750 OG',   costPerLinFt: 11.50 },
  { id: 'frame-003', name: 'Oldcastle Reliance SS', costPerLinFt: 8.25 },
  { id: 'frame-004', name: 'EFCO 5600',            costPerLinFt: 10.75 },
  { id: 'frame-005', name: 'Vitro Architectural',  costPerLinFt: 12.00 },
]
```

**Step 3: Update spot-check comment in src/data/index.ts**

Replace the spot-check comment block (lines 28-46) to reflect the new labor calc:

```ts
/**
 * SPOT-CHECK VERIFICATION (48"×96" qty 1, Clear Tempered + Kawneer, Curtain Wall system):
 *
 * sqft       = (48 × 96) / 144 × 1     = 32.00 SF
 * perimeter  = 2 × (48 + 96) / 12 × 1  = 24.00 LF
 *
 * Glass cost = 32.00 × $15.00           = $480.00
 * Frame cost = 24.00 × $9.85            = $236.40
 * Material   = $480.00 + $236.40         = $716.40
 *
 * Loaded rate = $38.50 × 1.35 + $2.50   = $54.475/hr
 * Man-hours   = 32.00 SF / 6.0 SF/MH    = 5.3333 MH  (area mode, Curtain Wall)
 * Labor cost  = 5.3333 × $54.475        = $290.53
 * Crew days   = 5.3333 / 8              = 0.6667
 *
 * LINE TOTAL  = $716.40 + $290.53        = $1,006.93
 */
```

**Step 4: Commit**

```
feat: update seed data for dual labor mode (C-020)

Add laborMode/sfPerManHour/hoursPerUnit to system types. Remove
laborHoursPerUnit from frame systems — frames are now material-only.
```

---

### Task 3: Rewrite labor-calc.ts

**Files:**
- Modify: `src/calc/labor-calc.ts`
- Modify: `src/calc/index.ts` (barrel export)

**Step 1: Rewrite labor-calc.ts**

Replace the entire file:

```ts
/**
 * Standard loaded rate: base × (1 + burden) + health — C-001
 */
export function calcLoadedRate(baseRate: number, burdenPercent: number, healthHourly: number): number {
  return baseRate * (1 + burdenPercent) + healthHourly
}

/**
 * Prevailing wage loaded rate: pwBase × (1 + burden) + pwFringe — C-004
 */
export function calcPWLoadedRate(pwBaseRate: number, burdenPercent: number, pwFringeRate: number): number {
  return pwBaseRate * (1 + burdenPercent) + pwFringeRate
}

/**
 * Area-based labor: baseManHours = sqft / sfPerManHour — C-021
 * Division-by-zero guard: returns 0 if sfPerManHour <= 0 — C-043
 */
export function calcBaseManHoursArea(sqft: number, sfPerManHour: number): number {
  if (sfPerManHour <= 0) return 0
  return sqft / sfPerManHour
}

/**
 * Unit-based labor: baseManHours = hoursPerUnit × quantity — C-022
 */
export function calcBaseManHoursUnit(hoursPerUnit: number, quantity: number): number {
  return hoursPerUnit * quantity
}

/**
 * Labor cost from man-hours: round2(manHours × loadedRate) — C-026
 */
export function calcLaborCost(manHours: number, loadedRate: number): number {
  return Math.round(manHours * loadedRate * 100) / 100
}
```

**Step 2: Update barrel export in src/calc/index.ts**

Replace line 2:

Old: `export { calcLoadedRate, calcPWLoadedRate, calcCrewDays, calcLaborCost } from './labor-calc'`

New: `export { calcLoadedRate, calcPWLoadedRate, calcBaseManHoursArea, calcBaseManHoursUnit, calcLaborCost } from './labor-calc'`

**Step 3: Commit**

```
feat: rewrite labor-calc for dual mode (C-021, C-022, C-026)

Replace calcCrewDays with calcBaseManHoursArea and calcBaseManHoursUnit.
calcLaborCost now takes manHours directly instead of crewDays.
```

---

### Task 4: Update line-total-calc.ts orchestrator

**Files:**
- Modify: `src/calc/line-total-calc.ts`

**Step 1: Rewrite line-total-calc.ts**

Replace the entire file:

```ts
import type { AppSettings, LineItem } from '@/types'
import { calcSqft, calcPerimeter, calcMaterialCost } from './material-calc'
import { calcLoadedRate, calcPWLoadedRate, calcBaseManHoursArea, calcBaseManHoursUnit, calcLaborCost } from './labor-calc'
import { calcEquipmentCost } from './equipment-calc'

/**
 * Orchestrator: recalculates all derived fields on a line item.
 * Uses primary Glazier labor rate (C-001).
 * Branches on SystemType.laborMode for labor calc (C-020).
 */
export function calcFullLineItem(
  lineItem: LineItem,
  settings: AppSettings,
  prevailingWage: boolean,
  pwBaseRate?: number,
  pwFringeRate?: number,
): LineItem {
  const glass = settings.glassTypes.find(g => g.id === lineItem.glassTypeId)
  const frame = settings.frameSystems.find(f => f.id === lineItem.frameSystemId)
  const systemType = settings.systemTypes.find(s => s.id === lineItem.systemTypeId)
  const glazier = settings.laborRates.find(l => l.role === 'Glazier') ?? settings.laborRates[0]

  if (!glass || !frame || !systemType || !glazier) return lineItem

  const selectedHardware = settings.hardware.filter(h => lineItem.hardwareIds.includes(h.id))
  const selectedEquipment = settings.equipment.filter(e => lineItem.equipmentIds.includes(e.id))

  // Material
  const sqft = calcSqft(lineItem.widthInches, lineItem.heightInches, lineItem.quantity)
  const perimeter = calcPerimeter(lineItem.widthInches, lineItem.heightInches, lineItem.quantity)
  const materialCost = calcMaterialCost(
    sqft, perimeter, glass.costPerSqft, frame.costPerLinFt, selectedHardware, lineItem.quantity,
  )

  // Labor — branch on system type labor mode (C-020)
  const loadedRate = prevailingWage && pwBaseRate != null && pwFringeRate != null
    ? calcPWLoadedRate(pwBaseRate, glazier.burdenPercent, pwFringeRate)
    : calcLoadedRate(glazier.baseRate, glazier.burdenPercent, glazier.healthHourly)

  const manHours = systemType.laborMode === 'area'
    ? calcBaseManHoursArea(sqft, systemType.sfPerManHour ?? 0)
    : calcBaseManHoursUnit(systemType.hoursPerUnit ?? 0, lineItem.quantity)

  const crewDays = manHours / 8 // C-027
  const laborCost = calcLaborCost(manHours, loadedRate)

  // Equipment
  const equipmentCost = calcEquipmentCost(selectedEquipment, crewDays)

  // Total (C-033)
  const lineTotal = Math.round((materialCost + laborCost + equipmentCost) * 100) / 100

  return {
    ...lineItem,
    sqft: Math.round(sqft * 100) / 100,
    perimeter: Math.round(perimeter * 100) / 100,
    materialCost,
    laborCost,
    equipmentCost,
    lineTotal,
    manHours: Math.round(manHours * 10000) / 10000,
    crewDays: Math.round(crewDays * 10000) / 10000,
  }
}
```

**Step 2: Commit**

```
feat: update calcFullLineItem for dual labor mode (C-020)

Look up SystemType to branch on laborMode. Area systems use
sqft/sfPerManHour; unit systems use hoursPerUnit*quantity.
No longer reads frame.laborHoursPerUnit.
```

---

### Task 5: Rewrite labor-calc tests

**Files:**
- Modify: `src/calc/labor-calc.test.ts`

**Step 1: Rewrite labor-calc.test.ts**

Replace the entire file:

```ts
import { calcLoadedRate, calcPWLoadedRate, calcBaseManHoursArea, calcBaseManHoursUnit, calcLaborCost } from './labor-calc'

describe('calcLoadedRate', () => {
  it('computes standard loaded rate: base * (1 + burden) + health', () => {
    expect(calcLoadedRate(38.50, 0.35, 2.50)).toBeCloseTo(54.475, 3)
  })

  it('returns base rate when burden and health are 0', () => {
    expect(calcLoadedRate(40, 0, 0)).toBe(40)
  })

  it('handles high burden percent', () => {
    expect(calcLoadedRate(50, 1.0, 5)).toBe(105)
  })
})

describe('calcPWLoadedRate', () => {
  it('computes PW loaded rate: pwBase * (1 + burden) + pwFringe (C-004)', () => {
    expect(calcPWLoadedRate(55.0, 0.35, 15.0)).toBeCloseTo(89.25, 2)
  })

  it('returns pwBase + fringe when burden is 0', () => {
    expect(calcPWLoadedRate(60, 0, 10)).toBe(70)
  })
})

describe('calcBaseManHoursArea', () => {
  it('computes man-hours: sqft / sfPerManHour (C-021)', () => {
    // 32 SF / 6.0 SF/MH = 5.3333 MH
    expect(calcBaseManHoursArea(32, 6.0)).toBeCloseTo(5.3333, 4)
  })

  it('scales with larger area', () => {
    // 64 SF / 6.0 SF/MH = 10.6667 MH
    expect(calcBaseManHoursArea(64, 6.0)).toBeCloseTo(10.6667, 4)
  })

  it('returns 0 when sfPerManHour is 0 (C-043 div-by-zero guard)', () => {
    expect(calcBaseManHoursArea(32, 0)).toBe(0)
  })

  it('returns 0 when sfPerManHour is negative (C-043)', () => {
    expect(calcBaseManHoursArea(32, -5)).toBe(0)
  })

  it('returns 0 when sqft is 0', () => {
    expect(calcBaseManHoursArea(0, 6.0)).toBe(0)
  })
})

describe('calcBaseManHoursUnit', () => {
  it('computes man-hours: hoursPerUnit * quantity (C-022)', () => {
    expect(calcBaseManHoursUnit(8.0, 1)).toBe(8.0)
  })

  it('scales with quantity', () => {
    expect(calcBaseManHoursUnit(8.0, 3)).toBe(24.0)
  })

  it('returns 0 for zero quantity', () => {
    expect(calcBaseManHoursUnit(8.0, 0)).toBe(0)
  })

  it('returns 0 for zero hoursPerUnit', () => {
    expect(calcBaseManHoursUnit(0, 5)).toBe(0)
  })
})

describe('calcLaborCost', () => {
  it('computes labor cost: manHours * loadedRate (C-026)', () => {
    // 5.3333 MH * $54.475/hr = $290.53
    expect(calcLaborCost(5.3333, 54.475)).toBeCloseTo(290.53, 1)
  })

  it('returns 0 for zero man-hours', () => {
    expect(calcLaborCost(0, 54.475)).toBe(0)
  })

  it('rounds to 2 decimals (C-042)', () => {
    expect(calcLaborCost(1.0, 33.333)).toBe(33.33)
  })

  it('computes PW labor cost correctly', () => {
    // 5.3333 MH * $89.25/hr = $476.00
    expect(calcLaborCost(5.3333, 89.25)).toBeCloseTo(476.00, 0)
  })
})
```

**Step 2: Run tests to verify they pass**

Run: `npx vitest run src/calc/labor-calc.test.ts`

Expected: All tests pass.

**Step 3: Commit**

```
test: rewrite labor-calc tests for dual mode (C-021, C-022)

Replace calcCrewDays tests with calcBaseManHoursArea and
calcBaseManHoursUnit. Update calcLaborCost tests for manHours input.
```

---

### Task 6: Rewrite line-total-calc tests

**Files:**
- Modify: `src/calc/line-total-calc.test.ts`

**Step 1: Rewrite line-total-calc.test.ts**

Replace the entire file. Key change: `baseLineItem` factory adds `manHours: 0`, and all labor assertions use new formulas. `sys-001` (Curtain Wall) is area mode with `sfPerManHour: 6.0`, so for 32 SF: `manHours = 32/6 = 5.3333`, `crewDays = 5.3333/8 = 0.6667`.

```ts
import { calcFullLineItem } from './line-total-calc'
import { DEFAULT_SETTINGS } from '@/data'
import type { LineItem } from '@/types'

function baseLineItem(overrides: Partial<LineItem> = {}): LineItem {
  return {
    id: 'test-li', systemTypeId: 'sys-001', glassTypeId: 'glass-001',
    frameSystemId: 'frame-001', description: '', quantity: 1,
    widthInches: 48, heightInches: 96, sqft: 0, perimeter: 0,
    materialCost: 0, laborCost: 0, equipmentCost: 0,
    lineTotal: 0, conditionIds: [], crewDays: 0, manHours: 0,
    equipmentIds: [], hardwareIds: [],
    ...overrides,
  }
}

describe('calcFullLineItem', () => {
  it('computes area-mode line item (Curtain Wall, 48x96)', () => {
    // sys-001 Curtain Wall: area mode, sfPerManHour=6.0
    // sqft=32, manHours=32/6=5.3333, loadedRate=54.475
    // laborCost=5.3333*54.475=290.53, material=716.40
    const result = calcFullLineItem(baseLineItem(), DEFAULT_SETTINGS, false)
    expect(result.sqft).toBe(32)
    expect(result.perimeter).toBe(24)
    expect(result.materialCost).toBe(716.4)
    expect(result.manHours).toBeCloseTo(5.3333, 3)
    expect(result.crewDays).toBeCloseTo(0.6667, 3)
    expect(result.laborCost).toBeCloseTo(290.53, 0)
    expect(result.equipmentCost).toBe(0)
    expect(result.lineTotal).toBeCloseTo(1006.93, 0)
  })

  it('computes unit-mode line item (Entrance System)', () => {
    // sys-006 Entrance System: unit mode, hoursPerUnit=8.0
    // qty=1, manHours=8*1=8, laborCost=8*54.475=435.80
    const li = baseLineItem({ systemTypeId: 'sys-006' })
    const result = calcFullLineItem(li, DEFAULT_SETTINGS, false)
    expect(result.manHours).toBe(8.0)
    expect(result.crewDays).toBe(1.0)
    expect(result.laborCost).toBeCloseTo(435.80, 0)
  })

  it('scales area mode with quantity=2 and hardware', () => {
    // sqft=64, manHours=64/6=10.6667
    const li = baseLineItem({ quantity: 2, hardwareIds: ['hw-001', 'hw-003'] })
    const result = calcFullLineItem(li, DEFAULT_SETTINGS, false)
    expect(result.sqft).toBe(64)
    expect(result.perimeter).toBe(48)
    expect(result.materialCost).toBe(1453.8)
    expect(result.manHours).toBeCloseTo(10.6667, 3)
    expect(result.crewDays).toBeCloseTo(1.3333, 3)
    expect(result.laborCost).toBeCloseTo(581.07, 0)
  })

  it('scales unit mode with quantity', () => {
    // sys-006: hoursPerUnit=8, qty=3, manHours=24
    const li = baseLineItem({ systemTypeId: 'sys-006', quantity: 3 })
    const result = calcFullLineItem(li, DEFAULT_SETTINGS, false)
    expect(result.manHours).toBe(24)
    expect(result.crewDays).toBe(3)
  })

  it('uses PW rate when prevailingWage=true', () => {
    const result = calcFullLineItem(baseLineItem(), DEFAULT_SETTINGS, true, 55, 15)
    // PW rate = 55 * 1.35 + 15 = 89.25
    // manHours = 32/6 = 5.3333, labor = 5.3333 * 89.25 = 476.00
    expect(result.laborCost).toBeCloseTo(476.00, 0)
  })

  it('falls back to standard rate when PW rates are missing', () => {
    const result = calcFullLineItem(baseLineItem(), DEFAULT_SETTINGS, true)
    expect(result.laborCost).toBeCloseTo(290.53, 0)
  })

  it('returns input unchanged when glass type not found', () => {
    const li = baseLineItem({ glassTypeId: 'nonexistent' })
    const result = calcFullLineItem(li, DEFAULT_SETTINGS, false)
    expect(result.lineTotal).toBe(0)
  })

  it('returns input unchanged when frame system not found', () => {
    const li = baseLineItem({ frameSystemId: 'nonexistent' })
    const result = calcFullLineItem(li, DEFAULT_SETTINGS, false)
    expect(result.lineTotal).toBe(0)
  })

  it('returns input unchanged when system type not found', () => {
    const li = baseLineItem({ systemTypeId: 'nonexistent' })
    const result = calcFullLineItem(li, DEFAULT_SETTINGS, false)
    expect(result.lineTotal).toBe(0)
  })

  it('lineTotal = materialCost + laborCost + equipmentCost (C-033)', () => {
    const li = baseLineItem({ equipmentIds: ['equip-001'] })
    const result = calcFullLineItem(li, DEFAULT_SETTINGS, false)
    expect(result.lineTotal).toBeCloseTo(
      result.materialCost + result.laborCost + result.equipmentCost, 2
    )
  })

  it('rounds manHours and crewDays to 4 decimals (C-042)', () => {
    const result = calcFullLineItem(baseLineItem(), DEFAULT_SETTINGS, false)
    const mhDecimals = result.manHours.toString().split('.')[1]?.length ?? 0
    const cdDecimals = result.crewDays.toString().split('.')[1]?.length ?? 0
    expect(mhDecimals).toBeLessThanOrEqual(4)
    expect(cdDecimals).toBeLessThanOrEqual(4)
  })
})
```

**Step 2: Run tests to verify they pass**

Run: `npx vitest run src/calc/line-total-calc.test.ts`

Expected: All tests pass.

**Step 3: Commit**

```
test: rewrite line-total-calc tests for dual labor mode

Test both area mode (Curtain Wall) and unit mode (Entrance System).
Update all labor assertions for new man-hours-based formulas.
```

---

### Task 7: Update hooks (use-line-items)

**Files:**
- Modify: `src/hooks/use-line-items.ts`

**Step 1: Add manHours to new line item factory**

In `src/hooks/use-line-items.ts`, add `manHours: 0` after `crewDays: 0` on line 47:

```ts
      crewDays: 0,
      manHours: 0,
```

**Step 2: Run type-check**

Run: `npm run lint`

Expected: Clean (no errors related to hooks).

**Step 3: Commit**

```
feat: add manHours to line item factory in use-line-items
```

---

### Task 8: Update schema migration (storage-service)

**Files:**
- Modify: `src/storage/storage-service.ts`
- Modify: `src/data/index.ts` (bump schema version in `createDefaultAppState`)

**Step 1: Bump schema version in data/index.ts**

In `src/data/index.ts`, change line 22 from `schemaVersion: 1` to `schemaVersion: 2`.

**Step 2: Rewrite storage-service.ts migration logic**

Replace the entire file:

```ts
import type { AppState, LineItem } from '@/types'
import { createDefaultAppState } from '@/data'

const STORAGE_KEY = 'cgi_estimating_app_v1'
const CURRENT_SCHEMA_VERSION = 2

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultAppState()

    const parsed = JSON.parse(raw) as Partial<AppState>

    if (!parsed.schemaVersion || parsed.schemaVersion < CURRENT_SCHEMA_VERSION) {
      return migrateState(parsed)
    }

    return parsed as AppState
  } catch {
    return createDefaultAppState()
  }
}

function migrateState(parsed: Partial<AppState>): AppState {
  const defaults = createDefaultAppState()

  // v1→v2: Replace all settings with new seed data (B-007).
  // Settings are incompatible: SystemType gained laborMode, FrameSystem lost laborHoursPerUnit.
  const projects = (parsed.projects ?? []).map(p => ({
    ...p,
    lineItems: (p.lineItems ?? []).map((li: Partial<LineItem>) => ({
      ...li,
      manHours: 0,          // new field, will be recalculated
      conditionIds: [],     // clear — condition model will change in next slice
    })),
  }))

  const migrated: AppState = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    settings: defaults.settings,  // full replacement, not merge
    projects: projects as AppState['projects'],
  }

  saveAppState(migrated)
  return migrated
}

export function saveAppState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function resetAppState(): AppState {
  const state = createDefaultAppState()
  saveAppState(state)
  return state
}
```

**Step 3: Update storage-service tests**

In `src/storage/storage-service.test.ts`, update the migration test to verify v1→v2 behavior:
- Settings are fully replaced (not merged)
- Projects are preserved
- Line items get `manHours: 0` and empty `conditionIds`
- Schema version is bumped to 2

The existing tests that create mock state with `schemaVersion: 1` should now trigger v2 migration. Update the test that checks migration to verify `settings` match defaults exactly (not a merge).

**Step 4: Run tests**

Run: `npx vitest run src/storage/storage-service.test.ts`

Expected: All tests pass.

**Step 5: Commit**

```
feat: add v1→v2 schema migration for dual labor mode (B-007)

Replace all settings with new seed data on migration. Existing
projects preserved; line items get manHours:0 and cleared conditionIds.
```

---

### Task 9: Update verify-calc.ts script

**Files:**
- Modify: `scripts/verify-calc.ts`

**Step 1: Update verify-calc.ts**

The script imports `calcCrewDays` which no longer exists. Update:

1. Change import on line 16: replace `calcCrewDays` with `calcBaseManHoursArea, calcBaseManHoursUnit`
2. Update Test 1 (Standard Wage Spot-Check): replace `calcCrewDays(3.0, 1, [])` with `calcBaseManHoursArea(32, 6.0)` and update expected values
3. Update Test 3 (Conditions): These tests use old `calcCrewDays` — replace with `calcBaseManHoursArea` and `calcBaseManHoursUnit` tests
4. Update Test 6 (Hardware + calcFullLineItem): update expected `crewDays` and `laborCost` values for the new formula
5. Update mock project in Test 5: add `manHours: 0` to the LineItem

All numeric expectations must match the new formulas.

**Step 2: Run verify script**

Run: `npm run verify`

Expected: All checks pass.

**Step 3: Commit**

```
test: update verify-calc script for dual labor mode

Replace calcCrewDays assertions with calcBaseManHoursArea/Unit.
Update expected values for new man-hours-based formulas.
```

---

### Task 10: Update SettingsView — Frame Systems tab

**Files:**
- Modify: `src/views/SettingsView.tsx`

**Step 1: Remove laborHoursPerUnit from Frame Systems tab**

In `src/views/SettingsView.tsx`, update the frames tab (lines 82-97):

1. Remove `'Labor Hrs / Unit'` from `columns` array on line 84
2. Remove the third cell object (line 90) that reads/writes `laborHoursPerUnit`
3. Remove `laborHoursPerUnit: 0` from the `onAdd` callback on line 93

The frames tab should only show Name and Cost/LF.

**Step 2: Run type-check and dev server**

Run: `npm run lint`

Expected: Clean.

**Step 3: Commit**

```
feat: remove laborHoursPerUnit from Frame Systems settings tab

Frame systems are now material-only — labor is driven by system type.
```

---

### Task 11: Add System Types tab to SettingsView

**Files:**
- Modify: `src/views/SettingsView.tsx`

**Step 1: Add 'systems' to TabName and TABS**

Change `TabName` to include `'systems'`:

```ts
type TabName = 'glass' | 'frames' | 'systems' | 'labor' | 'conditions' | 'hardware' | 'equipment'
```

Add to `TABS` array after `frames`:

```ts
  { key: 'systems', label: 'System Types' },
```

**Step 2: Add the systems tab content**

System types need a custom table component because the labor fields are conditional on `laborMode`. Add this after the frames tab block (after line 97):

```tsx
        {activeTab === 'systems' && (
          <SystemTypesTable
            systemTypes={settings.systemTypes}
            onUpdate={(id, updates) => updateItem('systemTypes', id, updates)}
            onAdd={() => addItem('systemTypes', { name: 'New System Type', benchmarkLow: 0, benchmarkHigh: 0, laborMode: 'area' as const, sfPerManHour: 10 })}
            onDelete={(id, name) => setDeleteTarget({ tableName: 'systemTypes', id, name })}
            getUsage={(id) => getUsageCount('systemTypes', id)}
          />
        )}
```

**Step 3: Create the SystemTypesTable component**

Add at the bottom of SettingsView.tsx, before the closing of the file:

```tsx
// ── System Types Table (conditional labor fields) ────────────────

interface SystemTypesTableProps {
  systemTypes: { id: string; name: string; benchmarkLow: number; benchmarkHigh: number; laborMode: 'area' | 'unit'; sfPerManHour?: number; hoursPerUnit?: number }[]
  onUpdate: (id: string, updates: Record<string, unknown>) => void
  onAdd: () => void
  onDelete: (id: string, name: string) => void
  getUsage: (id: string) => number
}

function SystemTypesTable({ systemTypes, onUpdate, onAdd, onDelete, getUsage }: SystemTypesTableProps) {
  return (
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-3 py-2 text-left font-medium text-gray-700">Name</th>
            <th className="px-3 py-2 text-left font-medium text-gray-700">Labor Mode</th>
            <th className="px-3 py-2 text-left font-medium text-gray-700">Productivity</th>
            <th className="w-20 px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {systemTypes.map(st => (
            <tr key={st.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-3 py-1.5">
                <input
                  type="text"
                  value={st.name}
                  onChange={e => onUpdate(st.id, { name: e.target.value })}
                  className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                />
              </td>
              <td className="px-3 py-1.5">
                <select
                  value={st.laborMode}
                  onChange={e => {
                    const mode = e.target.value as 'area' | 'unit'
                    onUpdate(st.id, {
                      laborMode: mode,
                      sfPerManHour: mode === 'area' ? (st.sfPerManHour ?? 10) : undefined,
                      hoursPerUnit: mode === 'unit' ? (st.hoursPerUnit ?? 4) : undefined,
                    })
                  }}
                  className="rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="area">Area (SF/MH)</option>
                  <option value="unit">Unit (Hrs/Unit)</option>
                </select>
              </td>
              <td className="px-3 py-1.5">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    value={st.laborMode === 'area' ? (st.sfPerManHour ?? 0) : (st.hoursPerUnit ?? 0)}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0
                      if (st.laborMode === 'area') {
                        onUpdate(st.id, { sfPerManHour: val })
                      } else {
                        onUpdate(st.id, { hoursPerUnit: val })
                      }
                    }}
                    className="w-24 rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-xs text-gray-400">
                    {st.laborMode === 'area' ? 'SF/MH' : 'hrs/unit'}
                  </span>
                </div>
              </td>
              <td className="px-3 py-1.5 text-right">
                <button
                  onClick={() => onDelete(st.id, st.name)}
                  className="text-xs text-red-600 hover:text-red-800"
                  title={`Used by ${getUsage(st.id)} line items`}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={onAdd}
        className="mt-3 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700"
      >
        + Add Row
      </button>
    </div>
  )
}
```

**Step 4: Run type-check and dev server**

Run: `npm run lint && npm run build`

Expected: Clean build.

**Step 5: Commit**

```
feat: add System Types tab to Settings view (C-020)

New tab shows labor mode (area/unit) with conditional productivity
input. Supports editing, adding, and deleting system types.
```

---

### Task 12: Update TakeoffView labor display

**Files:**
- Modify: `src/views/TakeoffView.tsx`

**Step 1: Add man-hours display**

Find the Crew Days display (around line 500-503) and add man-hours above it:

```tsx
                <div className="flex justify-between text-gray-400">
                  <span>Man-Hours</span>
                  <span>{item.manHours.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Crew Days</span>
                  <span>{item.crewDays.toFixed(2)}</span>
                </div>
```

**Step 2: Run type-check**

Run: `npm run lint`

Expected: Clean.

**Step 3: Commit**

```
feat: display man-hours in Takeoff line item details
```

---

### Task 13: Full verification pass

**Files:** None (verification only)

**Step 1: Run all tests**

Run: `npm test`

Expected: All 11 test files pass, ~100+ assertions.

**Step 2: Run verify script**

Run: `npm run verify`

Expected: All checks pass.

**Step 3: Run build**

Run: `npm run build`

Expected: Clean production build.

**Step 4: Run dev server and manually smoke-test**

Run: `npm run dev`

Verify in browser:
- Dashboard loads
- Create a project, navigate to Takeoff
- Add a line item with Curtain Wall (area mode) — verify man-hours and crew-days are shown
- Change system type to Entrance System (unit mode) — verify labor values update
- Navigate to Settings > System Types — verify the new tab shows all 21 system types with labor mode
- Settings > Frame Systems — verify no "Labor Hrs / Unit" column

**Step 5: Commit verification pass (if any fixups needed)**

```
fix: address issues found during verification pass
```

---

### Task 14: Final commit and summary

**Step 1: Verify git status is clean**

Run: `git status`

Expected: Clean working tree.

**Step 2: Push to feature branch**

The feature should be on a feature branch (e.g., `feat/dual-labor-mode`), ready for PR.
