import { calcFullLineItem } from './line-total-calc'
import { DEFAULT_SETTINGS } from '@/data'
import type { LineItem } from '@/types'

function baseLineItem(overrides: Partial<LineItem> = {}): LineItem {
  return {
    id: 'test-li', systemTypeId: 'sys-001', glassTypeId: 'glass-001',
    frameSystemId: 'frame-001', description: '', quantity: 1,
    widthInches: 48, heightInches: 96, sqft: 0, perimeter: 0,
    materialCost: 0, laborCost: 0, equipmentCost: 0,
    lineTotal: 0, conditionIds: [], crewDays: 0,
    equipmentIds: [], hardwareIds: [],
    ...overrides,
  }
}

describe('calcFullLineItem', () => {
  it('computes the $879.83 target line item', () => {
    const result = calcFullLineItem(baseLineItem(), DEFAULT_SETTINGS, false)
    expect(result.sqft).toBe(32)
    expect(result.perimeter).toBe(24)
    expect(result.materialCost).toBe(716.4)
    expect(result.crewDays).toBe(0.375)
    expect(result.laborCost).toBeCloseTo(163.43, 1)
    expect(result.equipmentCost).toBe(0)
    expect(result.lineTotal).toBeCloseTo(879.83, 0)
  })

  it('scales correctly with quantity=2 and hardware', () => {
    const li = baseLineItem({ quantity: 2, hardwareIds: ['hw-001', 'hw-003'] })
    const result = calcFullLineItem(li, DEFAULT_SETTINGS, false)
    expect(result.sqft).toBe(64)
    expect(result.perimeter).toBe(48)
    expect(result.materialCost).toBe(1453.8)
    expect(result.crewDays).toBe(0.75)
    expect(result.laborCost).toBeCloseTo(326.85, 1)
  })

  it('uses PW rate when prevailingWage=true', () => {
    const result = calcFullLineItem(baseLineItem(), DEFAULT_SETTINGS, true, 55, 15)
    // PW rate = 55 * 1.35 + 15 = 89.25
    // labor = 0.375 * 8 * 89.25 = 267.75
    expect(result.laborCost).toBe(267.75)
  })

  it('falls back to standard rate when PW rates are missing', () => {
    const result = calcFullLineItem(baseLineItem(), DEFAULT_SETTINGS, true)
    // Should use standard rate since pwBaseRate/pwFringeRate undefined
    expect(result.laborCost).toBeCloseTo(163.43, 1)
  })

  it('returns input unchanged when glass type not found', () => {
    const li = baseLineItem({ glassTypeId: 'nonexistent' })
    const result = calcFullLineItem(li, DEFAULT_SETTINGS, false)
    expect(result.lineTotal).toBe(0) // unchanged from input
  })

  it('returns input unchanged when frame system not found', () => {
    const li = baseLineItem({ frameSystemId: 'nonexistent' })
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

  it('includes condition adjustments', () => {
    // cond-001 = High Wind (+0.5 crew days)
    const li = baseLineItem({ conditionIds: ['cond-001'] })
    const result = calcFullLineItem(li, DEFAULT_SETTINGS, false)
    expect(result.crewDays).toBeGreaterThan(0.375) // 0.375 + 0.5 = 0.875
  })

  it('rounds crewDays to 4 decimals (C-042)', () => {
    const result = calcFullLineItem(baseLineItem(), DEFAULT_SETTINGS, false)
    const decimalDigits = result.crewDays.toString().split('.')[1]?.length ?? 0
    expect(decimalDigits).toBeLessThanOrEqual(4)
  })
})
