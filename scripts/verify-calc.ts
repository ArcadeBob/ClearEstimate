/**
 * Calculation Engine Verification Script
 *
 * Covers 7 formula paths to catch formula errors early:
 * 1. Standard wage spot-check (area mode, $1007 target)
 * 2. Prevailing wage loaded rate
 * 3. Dual labor mode (area + unit + div-by-zero guard)
 * 4. Equipment cost with crew days
 * 5. Running totals with VE savings + multiplicative O&P
 * 6. Hardware cost aggregation
 * 9. Door hardware cost + hinge suggestion (CALC-01, CALC-03)
 *
 * Run: npm run verify
 */

import { calcSqft, calcPerimeter, calcMaterialCost } from '../src/calc/material-calc'
import { calcLoadedRate, calcPWLoadedRate, calcBaseManHoursArea, calcBaseManHoursUnit, calcLaborCost } from '../src/calc/labor-calc'
import { calcEquipmentCost } from '../src/calc/equipment-calc'
import { calcFullLineItem } from '../src/calc/line-total-calc'
import { calcRunningTotals } from '../src/calc/summary-calc'
import { suggestOPPercents } from '../src/calc/op-suggest'
import { calcBenchmark } from '../src/calc/benchmark-calc'
import { calcWinRate } from '../src/calc/win-rate-calc'
import { calcDoorHardwareCost, suggestHingeCount } from '../src/calc/door-hardware-calc'
import { DEFAULT_SETTINGS } from '../src/data'
import type { LineItem, Project } from '../src/types'

let passed = 0
let failed = 0

function assert(label: string, actual: number, expected: number, tolerance = 0.01) {
  const diff = Math.abs(actual - expected)
  if (diff <= tolerance) {
    console.log(`  PASS: ${label} = ${actual} (expected ${expected})`)
    passed++
  } else {
    console.error(`  FAIL: ${label} = ${actual} (expected ${expected}, diff ${diff})`)
    failed++
  }
}

function assertExact<T>(label: string, actual: T, expected: T) {
  if (actual === expected) {
    console.log(`  PASS: ${label} = ${String(actual)}`)
    passed++
  } else {
    console.error(`  FAIL: ${label} = ${String(actual)} (expected ${String(expected)})`)
    failed++
  }
}

// ── Test 1: Standard Wage Spot-Check (48"×96" Clear Tempered + Kawneer) ──
console.log('\n1. Standard Wage Spot-Check')
{
  const sqft = calcSqft(48, 96, 1)
  assert('sqft', sqft, 32.0)

  const perim = calcPerimeter(48, 96, 1)
  assert('perimeter', perim, 24.0)

  const matCost = calcMaterialCost(sqft, perim, 15.00, 9.85, [], 1)
  assert('materialCost', matCost, 716.40)

  const loadedRate = calcLoadedRate(38.50, 0.35, 2.50)
  assert('loadedRate', loadedRate, 54.475)

  const manHours = calcBaseManHoursArea(32, 6.0) // Curtain Wall: 32 SF / 6.0 SF/MH
  assert('manHours', manHours, 5.3333, 0.001)

  const laborCost = calcLaborCost(manHours, loadedRate)
  assert('laborCost', laborCost, 290.53, 0.01)

  const total = matCost + laborCost
  assert('lineTotal', total, 1006.93, 0.50)
}

// ── Test 2: Prevailing Wage Path ──
console.log('\n2. Prevailing Wage Loaded Rate')
{
  // PW: pwBase * (1 + burden) + pwFringe
  const pwRate = calcPWLoadedRate(55.00, 0.35, 15.00)
  assert('pwLoadedRate', pwRate, 89.25) // 55 * 1.35 + 15

  const laborCost = calcLaborCost(5.3333, pwRate) // same manHours, PW rate
  assert('pwLaborCost', laborCost, 476.00, 0.50)
}

// ── Test 3: Dual Labor Mode ──
console.log('\n3. Dual Labor Mode')
{
  // Area mode: 64 SF / 6.0 SF/MH = 10.6667 MH
  const areaHours = calcBaseManHoursArea(64, 6.0)
  assert('area manHours', areaHours, 10.6667, 0.001)

  // Unit mode: 8.0 hrs/unit × 3 qty = 24 MH
  const unitHours = calcBaseManHoursUnit(8.0, 3)
  assert('unit manHours', unitHours, 24.0)

  // Division-by-zero guard (C-043)
  const zeroGuard = calcBaseManHoursArea(32, 0)
  assert('div-by-zero guard', zeroGuard, 0)
}

// ── Test 4: Equipment Cost with Adjusted Crew Days ──
console.log('\n4. Equipment Cost')
{
  const boomLift = DEFAULT_SETTINGS.equipment.find(e => e.id === 'equip-001')!
  const scissorLift = DEFAULT_SETTINGS.equipment.find(e => e.id === 'equip-003')!
  const crewDays = 2.0

  // Single equipment: 350 * 2 = 700
  const cost1 = calcEquipmentCost([boomLift], crewDays)
  assert('equipCost (single)', cost1, 700.00)

  // Multiple equipment: (350 + 225) * 2 = 1150
  const cost2 = calcEquipmentCost([boomLift, scissorLift], crewDays)
  assert('equipCost (multiple)', cost2, 1150.00)

  // Zero crew days = zero cost
  const cost3 = calcEquipmentCost([boomLift], 0)
  assert('equipCost (zero days)', cost3, 0)
}

// ── Test 5: Running Totals with VE + Multiplicative O&P ──
console.log('\n5. Running Totals + VE + O&P')
{
  const mockProject: Project = {
    id: 'test',
    name: 'Test',
    clientName: '',
    bidDate: '',
    status: 'Bidding',
    address: '',
    projectManager: '',
    estimator: '',
    prevailingWage: false,
    overheadPercent: 10,
    profitPercent: 10,
    lineItems: [
      {
        id: 'li-1', systemTypeId: 'sys-001', glassTypeId: 'glass-001',
        frameSystemId: 'frame-001', description: '', quantity: 1,
        widthInches: 48, heightInches: 96, sqft: 32, perimeter: 24,
        materialCost: 716.40, laborCost: 290.53, equipmentCost: 0, doorHardwareCost: 0,
        lineTotal: 1006.93, conditionIds: [], crewDays: 0.6667,
        manHours: 5.3333, equipmentIds: [], hardwareIds: [],
        doorHardware: [],
      },
    ],
    veAlternates: [
      {
        id: 've-1', lineItemId: 'li-1', description: 'VE option',
        originalCost: 1006.93, alternateCost: 600.00, savings: 406.93,
      },
    ],
    scopeDescriptions: [],
    timestamps: { createdAt: '', updatedAt: '' },
  }

  const totals = calcRunningTotals(mockProject)
  assert('subtotal', totals.subtotal, 1006.93)
  assert('veSavings', totals.veSavings, 406.93)
  assert('adjustedSubtotal', totals.adjustedSubtotal, 600.00)

  // Multiplicative: 600 * 1.10 = 660 (after OH)
  assert('overheadAmount', totals.overheadAmount, 60.00)
  // Profit on (600 + 60) = 660 * 0.10 = 66
  assert('profitAmount', totals.profitAmount, 66.00)
  // Contract = 660 + 66 = 726
  assert('contractValue', totals.contractValue, 726.00)
}

// ── Test 6: Hardware Cost + Full Line Item Orchestrator ──
console.log('\n6. Hardware + calcFullLineItem')
{
  const li: LineItem = {
    id: 'test-li', systemTypeId: 'sys-001', glassTypeId: 'glass-001',
    frameSystemId: 'frame-001', description: '', quantity: 2,
    widthInches: 48, heightInches: 96, sqft: 0, perimeter: 0,
    materialCost: 0, laborCost: 0, equipmentCost: 0, doorHardwareCost: 0,
    lineTotal: 0, conditionIds: [], crewDays: 0,
    manHours: 0, equipmentIds: [], hardwareIds: ['hw-001', 'hw-003'],
    doorHardware: [],
  }

  const result = calcFullLineItem(li, DEFAULT_SETTINGS, false)

  // sqft = (48*96/144) * 2 = 64
  assert('sqft (qty 2)', result.sqft, 64.0)
  // perimeter = 2*(48+96)/12 * 2 = 48
  assert('perimeter (qty 2)', result.perimeter, 48.0)
  // glass = 64 * 15 = 960, frame = 48 * 9.85 = 472.80
  // hardware = (2.50 + 8.00) * 2 = 21.00
  // material = 960 + 472.80 + 21.00 = 1453.80
  assert('materialCost (with hw)', result.materialCost, 1453.80)
  // manHours = 64 / 6.0 = 10.6667, crewDays = 10.6667 / 8 = 1.3333
  assert('crewDays (qty 2)', result.crewDays, 1.3333, 0.001)
  // labor = 10.6667 * 54.475 = 581.07
  assert('laborCost (qty 2)', result.laborCost, 581.07, 0.50)
}

// ── Test 7: O&P Suggestion Tiers ──
console.log('\n7. O&P Suggestion Tiers')
{
  const t1 = suggestOPPercents(50_000)
  assertExact('tier1 OH', t1.overhead, 10)
  assertExact('tier1 profit', t1.profit, 10)

  const t2 = suggestOPPercents(250_000)
  assertExact('tier2 OH', t2.overhead, 8)
  assertExact('tier2 profit', t2.profit, 8)

  const t3 = suggestOPPercents(500_000)
  assertExact('tier3 OH', t3.overhead, 5)
  assertExact('tier3 profit', t3.profit, 5)
}

// ── Test 8: Benchmark + Win Rate ──
console.log('\n8. Benchmark + Win Rate')
{
  const sys = DEFAULT_SETTINGS.systemTypes.find(s => s.id === 'sys-001')! // Curtain Wall: 45-75
  assertExact('benchmark green', calcBenchmark(1000, 32, sys), 'green')   // 31.25 $/SF
  assertExact('benchmark amber', calcBenchmark(2000, 32, sys), 'amber')   // 62.50 $/SF
  assertExact('benchmark red', calcBenchmark(3000, 32, sys), 'red')       // 93.75 $/SF

  const winRate = calcWinRate([
    { status: 'Awarded' } as any,
    { status: 'Awarded' } as any,
    { status: 'Lost' } as any,
    { status: 'Bidding' } as any,
  ])
  assert('winRate', winRate!, 0.6667, 0.001)

  assertExact('winRate null', calcWinRate([]), null)
}

// ── Test 9: Door Hardware Cost + Hinge Suggestion ──
console.log('\n9. Door Hardware Cost + Hinge Suggestion')
{
  // Door hardware cost: 3 hinges at $15 + 1 closer at $85 on 2 doors
  const dhwCost = calcDoorHardwareCost(
    [
      { hardwareId: 'dhw-001', quantity: 3 },
      { hardwareId: 'dhw-002', quantity: 1 },
    ],
    DEFAULT_SETTINGS.doorHardware,
    2,
  )
  assert('doorHardwareCost', dhwCost, 260.00)

  // Missing hardware ID contributes $0
  const dhwMissing = calcDoorHardwareCost(
    [{ hardwareId: 'nonexistent', quantity: 5 }],
    DEFAULT_SETTINGS.doorHardware,
    1,
  )
  assert('doorHardwareCost (missing)', dhwMissing, 0)

  // Full line item with door hardware — doorHardwareCost in materialCost
  const doorLi: LineItem = {
    id: 'door-li', systemTypeId: 'sys-009', glassTypeId: 'glass-001',
    frameSystemId: 'frame-001', description: '', quantity: 2,
    widthInches: 48, heightInches: 96, sqft: 0, perimeter: 0,
    materialCost: 0, laborCost: 0, equipmentCost: 0,
    doorHardwareCost: 0,
    lineTotal: 0, conditionIds: [], crewDays: 0,
    manHours: 0, equipmentIds: [], hardwareIds: [],
    doorHardware: [
      { hardwareId: 'dhw-001', quantity: 3 },
      { hardwareId: 'dhw-002', quantity: 1 },
    ],
  }
  const doorResult = calcFullLineItem(doorLi, DEFAULT_SETTINGS, false)
  assert('door materialCost includes dhw', doorResult.doorHardwareCost, 260.00)
  // C-033: lineTotal = materialCost + laborCost + equipmentCost
  assert('door C-033', doorResult.lineTotal, doorResult.materialCost + doorResult.laborCost + doorResult.equipmentCost, 0.01)

  // Hinge suggestions
  assertExact('hinge 48"', suggestHingeCount(48, 'sys-009'), 2)
  assertExact('hinge 72"', suggestHingeCount(72, 'sys-009'), 3)
  assertExact('hinge 96"', suggestHingeCount(96, 'sys-009'), 4)
  assertExact('hinge 130"', suggestHingeCount(130, 'sys-009'), 4)
  assertExact('hinge non-door', suggestHingeCount(72, 'sys-001'), null)
}

// ── Summary ──
console.log(`\n${'='.repeat(50)}`)
console.log(`Results: ${passed} passed, ${failed} failed`)
if (failed > 0) {
  console.error('VERIFICATION FAILED')
  process.exit(1)
} else {
  console.log('ALL CHECKS PASSED')
}
