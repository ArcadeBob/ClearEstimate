import type { DoorHardwareEntry, Hardware } from '@/types'
import {
  applyAddDoorHardware,
  applyRemoveDoorHardware,
  applyUpdateDoorHardwareQty,
} from './use-door-hardware'

const baseDoorHardware: DoorHardwareEntry[] = [
  { hardwareId: 'dhw-001', quantity: 3 }, // Hinges
  { hardwareId: 'dhw-002', quantity: 1 }, // Closer
  { hardwareId: 'dhw-003', quantity: 1 }, // Handle/Pull
]

const catalog: Hardware[] = [
  { id: 'dhw-001', name: 'Hinges', unitCost: 15 },
  { id: 'dhw-002', name: 'Closer', unitCost: 85 },
  { id: 'dhw-003', name: 'Handle/Pull', unitCost: 45 },
  { id: 'dhw-005', name: 'Panic Device', unitCost: 250 },
]

describe('applyAddDoorHardware', () => {
  it('appends a new hardware entry', () => {
    const result = applyAddDoorHardware(baseDoorHardware, 'dhw-005', 1, catalog)
    expect(result).not.toBeNull()
    expect(result!).toHaveLength(4)
    expect(result![3]).toEqual({ hardwareId: 'dhw-005', quantity: 1 })
  })

  it('returns null for duplicate hardwareId (no-op)', () => {
    const result = applyAddDoorHardware(baseDoorHardware, 'dhw-001', 2, catalog)
    expect(result).toBeNull()
  })

  it('returns null for invalid hardwareId not in catalog (no-op)', () => {
    const result = applyAddDoorHardware(baseDoorHardware, 'dhw-999', 1, catalog)
    expect(result).toBeNull()
  })

  it('does not mutate the original array', () => {
    const original = [...baseDoorHardware]
    applyAddDoorHardware(baseDoorHardware, 'dhw-005', 1, catalog)
    expect(baseDoorHardware).toEqual(original)
  })
})

describe('applyRemoveDoorHardware', () => {
  it('removes an existing hardware entry', () => {
    const result = applyRemoveDoorHardware(baseDoorHardware, 'dhw-002')
    expect(result).toHaveLength(2)
    expect(result.find(e => e.hardwareId === 'dhw-002')).toBeUndefined()
  })

  it('returns unchanged array for non-existent hardwareId', () => {
    const result = applyRemoveDoorHardware(baseDoorHardware, 'dhw-999')
    expect(result).toHaveLength(3)
  })
})

describe('applyUpdateDoorHardwareQty', () => {
  it('updates quantity of an existing entry', () => {
    const result = applyUpdateDoorHardwareQty(baseDoorHardware, 'dhw-001', 4)
    expect(result).not.toBeNull()
    const hinge = result!.find(e => e.hardwareId === 'dhw-001')
    expect(hinge!.quantity).toBe(4)
  })

  it('removes entry when quantity is 0', () => {
    const result = applyUpdateDoorHardwareQty(baseDoorHardware, 'dhw-001', 0)
    expect(result).not.toBeNull()
    expect(result!).toHaveLength(2)
    expect(result!.find(e => e.hardwareId === 'dhw-001')).toBeUndefined()
  })

  it('removes entry when quantity is negative', () => {
    const result = applyUpdateDoorHardwareQty(baseDoorHardware, 'dhw-001', -1)
    expect(result).not.toBeNull()
    expect(result!).toHaveLength(2)
  })

  it('returns null for non-existent hardwareId (no-op)', () => {
    const result = applyUpdateDoorHardwareQty(baseDoorHardware, 'dhw-999', 3)
    expect(result).toBeNull()
  })

  it('does not mutate the original array', () => {
    const original = baseDoorHardware.map(e => ({ ...e }))
    applyUpdateDoorHardwareQty(baseDoorHardware, 'dhw-001', 4)
    expect(baseDoorHardware).toEqual(original)
  })
})
