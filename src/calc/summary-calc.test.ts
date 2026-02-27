import {
  calcRunningTotals,
  calcScheduleOfValues,
  calcPieData,
  generateScopeDescription,
} from './summary-calc'
import type { Project, LineItem, RunningTotals } from '@/types'
import { DEFAULT_SETTINGS } from '@/data'

// Factory: minimal valid line item
function lineItem(overrides: Partial<LineItem> = {}): LineItem {
  return {
    id: 'li-1', systemTypeId: 'sys-001', glassTypeId: 'glass-001',
    frameSystemId: 'frame-001', description: '', quantity: 1,
    widthInches: 48, heightInches: 96, sqft: 32, perimeter: 24,
    materialCost: 716.40, laborCost: 163.43, equipmentCost: 0,
    lineTotal: 879.83, conditionIds: [], crewDays: 0.375,
    equipmentIds: [], hardwareIds: [],
    ...overrides,
  }
}

// Factory: minimal project
function project(overrides: Partial<Project> = {}): Project {
  return {
    id: 'test', name: 'Test', clientName: '', bidDate: '', status: 'Bidding',
    address: '', projectManager: '', estimator: '', prevailingWage: false,
    overheadPercent: 10, profitPercent: 10,
    lineItems: [lineItem()],
    veAlternates: [],
    scopeDescriptions: [],
    timestamps: { createdAt: '', updatedAt: '' },
    ...overrides,
  }
}

describe('calcRunningTotals', () => {
  it('computes subtotal from valid line items', () => {
    const totals = calcRunningTotals(project())
    expect(totals.subtotal).toBe(879.83)
    expect(totals.materialTotal).toBe(716.4)
    expect(totals.laborTotal).toBe(163.43)
    expect(totals.equipmentTotal).toBe(0)
  })

  it('excludes line items with lineTotal = 0', () => {
    const p = project({
      lineItems: [lineItem(), lineItem({ id: 'li-2', lineTotal: 0, materialCost: 0, laborCost: 0, equipmentCost: 0 })],
    })
    const totals = calcRunningTotals(p)
    expect(totals.subtotal).toBe(879.83)
  })

  it('computes VE savings deduction (C-005, C-045)', () => {
    const p = project({
      veAlternates: [
        { id: 've-1', lineItemId: 'li-1', description: 'VE', originalCost: 879.83, alternateCost: 600, savings: 279.83 },
      ],
    })
    const totals = calcRunningTotals(p)
    expect(totals.veSavings).toBe(279.83)
    expect(totals.adjustedSubtotal).toBe(600)
  })

  it('applies multiplicative O&P: profit AFTER overhead (C-011)', () => {
    const p = project({
      veAlternates: [
        { id: 've-1', lineItemId: 'li-1', description: 'VE', originalCost: 879.83, alternateCost: 600, savings: 279.83 },
      ],
    })
    const totals = calcRunningTotals(p)
    // adjusted=600, OH=600*0.10=60, afterOH=660, profit=660*0.10=66
    expect(totals.overheadAmount).toBe(60)
    expect(totals.profitAmount).toBe(66)
    expect(totals.contractValue).toBe(726)
  })

  it('handles project with no valid line items', () => {
    const p = project({ lineItems: [] })
    const totals = calcRunningTotals(p)
    expect(totals.subtotal).toBe(0)
    expect(totals.contractValue).toBe(0)
  })

  it('sums multiple line items across different cost categories', () => {
    const p = project({
      lineItems: [
        lineItem({ id: 'li-1', materialCost: 500, laborCost: 200, equipmentCost: 100, lineTotal: 800 }),
        lineItem({ id: 'li-2', materialCost: 300, laborCost: 150, equipmentCost: 50, lineTotal: 500 }),
      ],
    })
    const totals = calcRunningTotals(p)
    expect(totals.materialTotal).toBe(800)
    expect(totals.laborTotal).toBe(350)
    expect(totals.equipmentTotal).toBe(150)
    expect(totals.subtotal).toBe(1300)
  })

  it('rounds all monetary values to 2 decimals (C-017)', () => {
    const p = project({
      overheadPercent: 7,
      profitPercent: 3,
      lineItems: [lineItem({ materialCost: 100.005, laborCost: 50.005, equipmentCost: 0, lineTotal: 150.01 })],
    })
    const totals = calcRunningTotals(p)
    // All returned fields should have at most 2 decimal places
    for (const val of Object.values(totals)) {
      const decimals = val.toString().split('.')[1]?.length ?? 0
      expect(decimals).toBeLessThanOrEqual(2)
    }
  })
})

describe('calcScheduleOfValues', () => {
  it('groups line items by systemTypeId', () => {
    const p = project({
      lineItems: [
        lineItem({ id: 'li-1', systemTypeId: 'sys-001', lineTotal: 500, sqft: 20 }),
        lineItem({ id: 'li-2', systemTypeId: 'sys-001', lineTotal: 300, sqft: 12 }),
        lineItem({ id: 'li-3', systemTypeId: 'sys-002', lineTotal: 400, sqft: 16 }),
      ],
    })
    const sov = calcScheduleOfValues(p, DEFAULT_SETTINGS)
    expect(sov.length).toBe(2)

    const curtainWall = sov.find(g => g.systemTypeId === 'sys-001')!
    expect(curtainWall.lineItemCount).toBe(2)
    expect(curtainWall.directCost).toBe(800)
    expect(curtainWall.totalSqft).toBe(32)
  })

  it('applies multiplicative O&P per row (C-011)', () => {
    const p = project({
      overheadPercent: 10,
      profitPercent: 10,
      lineItems: [lineItem({ systemTypeId: 'sys-001', lineTotal: 1000, sqft: 32 })],
    })
    const sov = calcScheduleOfValues(p, DEFAULT_SETTINGS)
    // 1000 * 1.10 * 1.10 = 1210
    expect(sov[0]!.contractValue).toBe(1210)
  })

  it('returns empty array when no valid items', () => {
    const p = project({ lineItems: [] })
    expect(calcScheduleOfValues(p, DEFAULT_SETTINGS)).toEqual([])
  })

  it('labels unknown system types as "Unknown"', () => {
    const p = project({
      lineItems: [lineItem({ systemTypeId: 'nonexistent', lineTotal: 100, sqft: 10 })],
    })
    const sov = calcScheduleOfValues(p, DEFAULT_SETTINGS)
    expect(sov[0]!.systemTypeName).toBe('Unknown')
  })
})

describe('calcPieData', () => {
  it('returns segments for non-zero categories', () => {
    const totals: RunningTotals = {
      materialTotal: 100, laborTotal: 50, equipmentTotal: 0,
      subtotal: 150, veSavings: 0, adjustedSubtotal: 150,
      overheadAmount: 15, profitAmount: 16.5, contractValue: 181.5,
    }
    const pie = calcPieData(totals)
    expect(pie.length).toBe(4) // equipment=0 filtered out
    expect(pie.map(s => s.name)).toEqual(['Materials', 'Labor', 'Overhead', 'Profit'])
  })

  it('returns empty array when all values are 0', () => {
    const totals: RunningTotals = {
      materialTotal: 0, laborTotal: 0, equipmentTotal: 0,
      subtotal: 0, veSavings: 0, adjustedSubtotal: 0,
      overheadAmount: 0, profitAmount: 0, contractValue: 0,
    }
    expect(calcPieData(totals)).toEqual([])
  })
})

describe('generateScopeDescription', () => {
  it('generates correct scope text (C-006)', () => {
    const p = project()
    const text = generateScopeDescription('sys-001', p, DEFAULT_SETTINGS)
    expect(text).toContain('Furnish and install')
    expect(text).toContain('Curtain Wall')
    expect(text).toContain('1 units')
    expect(text).toContain('32 SF total')
  })

  it('returns empty string for unknown systemTypeId', () => {
    const p = project()
    expect(generateScopeDescription('nonexistent', p, DEFAULT_SETTINGS)).toBe('')
  })

  it('returns empty string when no valid items for system type', () => {
    const p = project({ lineItems: [] })
    expect(generateScopeDescription('sys-001', p, DEFAULT_SETTINGS)).toBe('')
  })

  it('picks most common glass type by frequency', () => {
    const p = project({
      lineItems: [
        lineItem({ id: 'li-1', glassTypeId: 'glass-001', lineTotal: 100 }),
        lineItem({ id: 'li-2', glassTypeId: 'glass-002', lineTotal: 100 }),
        lineItem({ id: 'li-3', glassTypeId: 'glass-002', lineTotal: 100 }),
      ],
    })
    const text = generateScopeDescription('sys-001', p, DEFAULT_SETTINGS)
    // glass-002 appears twice — should be picked
    const glass002Name = DEFAULT_SETTINGS.glassTypes.find(g => g.id === 'glass-002')?.name
    expect(text).toContain(glass002Name)
  })
})
