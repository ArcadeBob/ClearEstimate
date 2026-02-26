import { calcEquipmentCost, shouldSuggestEquipment } from './equipment-calc'
import type { Equipment } from '@/types'

describe('calcEquipmentCost', () => {
  const boomLift: Equipment = { id: 'equip-001', name: '40ft Boom Lift', dailyRate: 350 }
  const scissorLift: Equipment = { id: 'equip-003', name: 'Scissor Lift', dailyRate: 225 }

  it('computes single equipment cost: dailyRate x crewDays', () => {
    // 350 * 2 = 700
    expect(calcEquipmentCost([boomLift], 2.0)).toBe(700)
  })

  it('stacks multiple equipment costs', () => {
    // (350 + 225) * 2 = 1150
    expect(calcEquipmentCost([boomLift, scissorLift], 2.0)).toBe(1150)
  })

  it('returns 0 with zero crew days', () => {
    expect(calcEquipmentCost([boomLift], 0)).toBe(0)
  })

  it('returns 0 with empty equipment array', () => {
    expect(calcEquipmentCost([], 5.0)).toBe(0)
  })

  it('rounds to 2 decimals (C-042)', () => {
    const oddRate: Equipment = { id: 'eq-x', name: 'Test', dailyRate: 33.33 }
    // 33.33 * 3 = 99.99
    expect(calcEquipmentCost([oddRate], 3)).toBe(99.99)
  })
})

describe('shouldSuggestEquipment', () => {
  it('suggests equipment when height > 0 (C-003)', () => {
    expect(shouldSuggestEquipment(96)).toBe(true)
    expect(shouldSuggestEquipment(1)).toBe(true)
  })

  it('does not suggest equipment when height is 0', () => {
    expect(shouldSuggestEquipment(0)).toBe(false)
  })

  it('does not suggest equipment when height is negative', () => {
    expect(shouldSuggestEquipment(-1)).toBe(false)
  })
})
