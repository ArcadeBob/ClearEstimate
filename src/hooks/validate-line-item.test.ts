import { validateLineItem } from './use-line-items'
import type { LineItem } from '@/types'

function validItem(overrides: Partial<LineItem> = {}): LineItem {
  return {
    id: 'li-1', systemTypeId: 'sys-001', glassTypeId: 'glass-001',
    frameSystemId: 'frame-001', description: '', quantity: 1,
    widthInches: 48, heightInches: 96, sqft: 0, perimeter: 0,
    materialCost: 0, laborCost: 0, equipmentCost: 0,
    lineTotal: 0, conditionIds: [], crewDays: 0, manHours: 0,
    equipmentIds: [], hardwareIds: [], doorHardware: [],
    ...overrides,
  }
}

describe('validateLineItem (C-013)', () => {
  it('returns valid for a complete line item', () => {
    const result = validateLineItem(validItem())
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('requires systemTypeId', () => {
    const result = validateLineItem(validItem({ systemTypeId: '' }))
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('System type required')
  })

  it('requires glassTypeId', () => {
    const result = validateLineItem(validItem({ glassTypeId: '' }))
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Glass type required')
  })

  it('requires frameSystemId', () => {
    const result = validateLineItem(validItem({ frameSystemId: '' }))
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Frame system required')
  })

  it('requires quantity >= 1', () => {
    const result = validateLineItem(validItem({ quantity: 0 }))
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Quantity must be at least 1')
  })

  it('requires positive width', () => {
    const result = validateLineItem(validItem({ widthInches: 0 }))
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Width must be positive')
  })

  it('requires positive height', () => {
    const result = validateLineItem(validItem({ heightInches: 0 }))
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Height must be positive')
  })

  it('accumulates multiple errors', () => {
    const result = validateLineItem(validItem({
      systemTypeId: '', glassTypeId: '', quantity: 0,
    }))
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThanOrEqual(3)
  })
})
