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
    equipmentIds: [], hardwareIds: [], doorHardware: [],
    ...overrides,
  }
}

describe('calcFullLineItem', () => {
  it('computes area-mode line item (Curtain Wall, 48x96)', () => {
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
    const li = baseLineItem({ systemTypeId: 'sys-006' })
    const result = calcFullLineItem(li, DEFAULT_SETTINGS, false)
    expect(result.manHours).toBe(8.0)
    expect(result.crewDays).toBe(1.0)
    expect(result.laborCost).toBeCloseTo(435.80, 0)
  })

  it('scales area mode with quantity=2 and hardware', () => {
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
    const li = baseLineItem({ systemTypeId: 'sys-006', quantity: 3 })
    const result = calcFullLineItem(li, DEFAULT_SETTINGS, false)
    expect(result.manHours).toBe(24)
    expect(result.crewDays).toBe(3)
  })

  it('uses PW rate when prevailingWage=true', () => {
    const result = calcFullLineItem(baseLineItem(), DEFAULT_SETTINGS, true, 55, 15)
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
