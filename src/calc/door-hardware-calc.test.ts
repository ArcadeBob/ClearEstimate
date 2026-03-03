import { calcDoorHardwareCost, suggestHingeCount } from './door-hardware-calc'
import type { Hardware, DoorHardwareEntry } from '@/types'

const catalog: Hardware[] = [
  { id: 'dhw-001', name: 'Hinges', unitCost: 15.00 },
  { id: 'dhw-002', name: 'Closer', unitCost: 85.00 },
  { id: 'dhw-003', name: 'Handle/Pull', unitCost: 45.00 },
]

describe('calcDoorHardwareCost', () => {
  it('returns 0 for empty entries array', () => {
    expect(calcDoorHardwareCost([], catalog, 1)).toBe(0)
  })

  it('computes single entry: 3 hinges at $15 x 2 doors = $90', () => {
    const entries: DoorHardwareEntry[] = [{ hardwareId: 'dhw-001', quantity: 3 }]
    expect(calcDoorHardwareCost(entries, catalog, 2)).toBe(90)
  })

  it('computes multiple entries: (3 hinges at $15 + 1 closer at $85) x 2 doors = $260', () => {
    const entries: DoorHardwareEntry[] = [
      { hardwareId: 'dhw-001', quantity: 3 },
      { hardwareId: 'dhw-002', quantity: 1 },
    ]
    expect(calcDoorHardwareCost(entries, catalog, 2)).toBe(260)
  })

  it('skips missing hardwareId, contributes $0', () => {
    const entries: DoorHardwareEntry[] = [{ hardwareId: 'nonexistent', quantity: 5 }]
    expect(calcDoorHardwareCost(entries, catalog, 1)).toBe(0)
  })

  it('counts only valid entries when mixed with invalid', () => {
    const entries: DoorHardwareEntry[] = [
      { hardwareId: 'dhw-001', quantity: 3 },  // valid: 3 * 15 * 1 = 45
      { hardwareId: 'nonexistent', quantity: 2 },  // invalid: $0
      { hardwareId: 'dhw-003', quantity: 1 },  // valid: 1 * 45 * 1 = 45
    ]
    expect(calcDoorHardwareCost(entries, catalog, 1)).toBe(90)
  })

  it('returns $0 for zero quantity line item', () => {
    const entries: DoorHardwareEntry[] = [{ hardwareId: 'dhw-001', quantity: 3 }]
    expect(calcDoorHardwareCost(entries, catalog, 0)).toBe(0)
  })

  it('rounds result to 2 decimal places', () => {
    // unitCost that would cause floating point: 45.00 * 3 * 7 = 945.00 (clean)
    // Use a custom catalog with a tricky price
    const trickyCatalog: Hardware[] = [
      { id: 'dhw-x', name: 'Test', unitCost: 33.33 },
    ]
    const entries: DoorHardwareEntry[] = [{ hardwareId: 'dhw-x', quantity: 3 }]
    // 33.33 * 3 * 1 = 99.99
    const result = calcDoorHardwareCost(entries, trickyCatalog, 1)
    const decimals = result.toString().split('.')[1]?.length ?? 0
    expect(decimals).toBeLessThanOrEqual(2)
  })
})

describe('suggestHingeCount', () => {
  it('returns 2 for 48" height (<=60")', () => {
    expect(suggestHingeCount(48, 'sys-009')).toBe(2)
  })

  it('returns 2 for 60" height (boundary <=60")', () => {
    expect(suggestHingeCount(60, 'sys-009')).toBe(2)
  })

  it('returns 3 for 61" height (boundary 61-90")', () => {
    expect(suggestHingeCount(61, 'sys-009')).toBe(3)
  })

  it('returns 3 for 72" height (61-90")', () => {
    expect(suggestHingeCount(72, 'sys-009')).toBe(3)
  })

  it('returns 3 for 90" height (boundary 61-90")', () => {
    expect(suggestHingeCount(90, 'sys-009')).toBe(3)
  })

  it('returns 4 for 91" height (boundary 91-120")', () => {
    expect(suggestHingeCount(91, 'sys-009')).toBe(4)
  })

  it('returns 4 for 96" height (91-120")', () => {
    expect(suggestHingeCount(96, 'sys-009')).toBe(4)
  })

  it('returns 4 for 120" height (boundary 91-120")', () => {
    expect(suggestHingeCount(120, 'sys-009')).toBe(4)
  })

  it('returns 4 for 130" height (>120" cap)', () => {
    expect(suggestHingeCount(130, 'sys-009')).toBe(4)
  })

  it('returns null for non-door system type (sys-001)', () => {
    expect(suggestHingeCount(72, 'sys-001')).toBeNull()
  })

  it('returns appropriate count for door system type sys-006 (Entrance System)', () => {
    expect(suggestHingeCount(72, 'sys-006')).toBe(3)
  })
})
