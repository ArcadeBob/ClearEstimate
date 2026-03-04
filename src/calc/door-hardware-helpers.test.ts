import { getDefaultDoorHardware, applyDoorHardwareAutoPopulate } from './door-hardware-helpers'
import { DOOR_HARDWARE_DEFAULTS } from '@/data'

describe('getDefaultDoorHardware', () => {
  it('returns Swing Door defaults (6 entries) with hinge qty=3 for height 84"', () => {
    const result = getDefaultDoorHardware('sys-009', 84)
    expect(result).toHaveLength(6)
    const hinge = result.find(e => e.hardwareId === 'dhw-001')
    expect(hinge).toBeDefined()
    expect(hinge!.quantity).toBe(3) // 61-90" -> 3 hinges
  })

  it('returns Swing Door defaults with hinge qty=2 for height 48"', () => {
    const result = getDefaultDoorHardware('sys-009', 48)
    const hinge = result.find(e => e.hardwareId === 'dhw-001')
    expect(hinge).toBeDefined()
    expect(hinge!.quantity).toBe(2) // <= 60" -> 2 hinges
  })

  it('returns Swing Door defaults with hinge qty=4 for height 96"', () => {
    const result = getDefaultDoorHardware('sys-009', 96)
    const hinge = result.find(e => e.hardwareId === 'dhw-001')
    expect(hinge).toBeDefined()
    expect(hinge!.quantity).toBe(4) // >= 91" -> 4 hinges
  })

  it('returns Swing Door defaults with hinge qty=3 when height is 0 (fallback to static default)', () => {
    const result = getDefaultDoorHardware('sys-009', 0)
    const hinge = result.find(e => e.hardwareId === 'dhw-001')
    expect(hinge).toBeDefined()
    expect(hinge!.quantity).toBe(3) // fallback to DOOR_HARDWARE_DEFAULTS default (3)
  })

  it('returns Sliding Door defaults (4 entries, no hinges)', () => {
    const result = getDefaultDoorHardware('sys-008', 72)
    expect(result).toHaveLength(4)
    const hinge = result.find(e => e.hardwareId === 'dhw-001')
    expect(hinge).toBeUndefined() // Sliding Door has no hinges
  })

  it('returns empty array for non-door system type', () => {
    const result = getDefaultDoorHardware('sys-001', 72)
    expect(result).toEqual([])
  })

  it('returns Entrance System defaults (7 entries)', () => {
    const result = getDefaultDoorHardware('sys-006', 72)
    expect(result).toHaveLength(7)
  })

  it('returns Revolving Door defaults (6 entries)', () => {
    const result = getDefaultDoorHardware('sys-007', 72)
    expect(result).toHaveLength(6)
  })

  it('returns a deep copy that does not mutate DOOR_HARDWARE_DEFAULTS', () => {
    const originalQty = DOOR_HARDWARE_DEFAULTS['sys-009']![0]!.quantity
    const result = getDefaultDoorHardware('sys-009', 72)
    result[0]!.quantity = 999
    expect(DOOR_HARDWARE_DEFAULTS['sys-009']![0]!.quantity).toBe(originalQty)
  })
})

describe('applyDoorHardwareAutoPopulate', () => {
  it('returns door defaults for non-door to door transition', () => {
    const result = applyDoorHardwareAutoPopulate(
      { systemTypeId: 'sys-009', heightInches: 72 },
      '',
      'sys-009',
    )
    expect(result).not.toBeNull()
    expect(result!).toHaveLength(6) // Swing Door has 6 entries
  })

  it('returns new door defaults for door-to-different-door transition', () => {
    const result = applyDoorHardwareAutoPopulate(
      { systemTypeId: 'sys-009', heightInches: 72 },
      'sys-006',
      'sys-009',
    )
    expect(result).not.toBeNull()
    expect(result!).toHaveLength(6) // Swing Door defaults
  })

  it('returns empty array for door-to-non-door transition', () => {
    const result = applyDoorHardwareAutoPopulate(
      { systemTypeId: 'sys-001', heightInches: 72 },
      'sys-009',
      'sys-001',
    )
    expect(result).toEqual([])
  })

  it('returns null (preserve existing) when same systemTypeId', () => {
    const result = applyDoorHardwareAutoPopulate(
      { systemTypeId: 'sys-009', heightInches: 72 },
      'sys-009',
      'sys-009',
    )
    expect(result).toBeNull()
  })

  it('returns null (preserve existing) when no systemTypeId in updates', () => {
    const result = applyDoorHardwareAutoPopulate(
      { systemTypeId: undefined, heightInches: 72 },
      'sys-009',
      undefined,
    )
    expect(result).toBeNull()
  })
})
