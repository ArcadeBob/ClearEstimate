import { applyTemplate } from './template-apply'
import type { HardwareSetTemplate, Hardware } from '@/types'

const catalog: Hardware[] = [
  { id: 'dhw-001', name: 'Closer', unitCost: 150 },
  { id: 'dhw-002', name: 'Panic Bar', unitCost: 350 },
  { id: 'dhw-003', name: 'Hinges', unitCost: 45 },
]

function makeTemplate(
  items: { hardwareId: string; quantity: number }[],
): HardwareSetTemplate {
  return { id: 'hst-test', name: 'Test Template', items }
}

describe('applyTemplate', () => {
  it('returns template items when all hardwareIds exist in catalog', () => {
    const template = makeTemplate([
      { hardwareId: 'dhw-001', quantity: 1 },
      { hardwareId: 'dhw-002', quantity: 2 },
    ])
    const result = applyTemplate(template, catalog)
    expect(result).toEqual([
      { hardwareId: 'dhw-001', quantity: 1 },
      { hardwareId: 'dhw-002', quantity: 2 },
    ])
  })

  it('filters out items whose hardwareId is not in catalog (stale reference)', () => {
    const template = makeTemplate([
      { hardwareId: 'dhw-001', quantity: 1 },
      { hardwareId: 'dhw-999', quantity: 3 }, // stale
    ])
    const result = applyTemplate(template, catalog)
    expect(result).toEqual([{ hardwareId: 'dhw-001', quantity: 1 }])
  })

  it('returns empty array for empty template items', () => {
    const template = makeTemplate([])
    const result = applyTemplate(template, catalog)
    expect(result).toEqual([])
  })

  it('returns empty array when all items are stale', () => {
    const template = makeTemplate([
      { hardwareId: 'dhw-888', quantity: 1 },
      { hardwareId: 'dhw-999', quantity: 2 },
    ])
    const result = applyTemplate(template, catalog)
    expect(result).toEqual([])
  })

  it('preserves template quantities exactly (no smart overrides)', () => {
    const template = makeTemplate([
      { hardwareId: 'dhw-003', quantity: 5 },
    ])
    const result = applyTemplate(template, catalog)
    expect(result).toEqual([{ hardwareId: 'dhw-003', quantity: 5 }])
  })

})
