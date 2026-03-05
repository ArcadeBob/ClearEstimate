import type { DoorHardwareEntry } from '@/types'
import { isDoorSystemType } from './door-system-util'
import { suggestHingeCount } from './door-hardware-calc'
import { DOOR_HARDWARE_DEFAULTS } from '@/data'

const HINGE_HARDWARE_ID = 'dhw-001'

/**
 * Returns the default door hardware set for a given system type,
 * with hinge quantity adjusted based on door height (CALC-03).
 *
 * Returns [] for non-door system types.
 * Returns a deep copy -- safe to mutate without affecting seed data.
 */
export function getDefaultDoorHardware(
  systemTypeId: string,
  heightInches: number,
): DoorHardwareEntry[] {
  if (!isDoorSystemType(systemTypeId)) return []

  const defaults = DOOR_HARDWARE_DEFAULTS[systemTypeId]
  if (!defaults) return []

  return defaults.map(entry => {
    const copy = { ...entry }
    if (copy.hardwareId === HINGE_HARDWARE_ID && heightInches > 0) {
      const suggested = suggestHingeCount(heightInches, systemTypeId)
      if (suggested !== null) {
        copy.quantity = suggested
      }
    }
    return copy
  })
}

/**
 * Pure function that determines door hardware auto-populate behavior
 * when systemTypeId changes on a line item (UI-01).
 *
 * Returns:
 * - DoorHardwareEntry[] to replace doorHardware (auto-populate or clear)
 * - null to preserve existing doorHardware (no change needed)
 */
export function applyDoorHardwareAutoPopulate(
  updates: { systemTypeId?: string; heightInches?: number },
  previousSystemTypeId: string,
  newSystemTypeId: string | undefined,
): DoorHardwareEntry[] | null {
  // No systemTypeId change in updates -- preserve existing
  if (newSystemTypeId === undefined) return null

  // Same system type selected -- preserve existing customizations
  if (newSystemTypeId === previousSystemTypeId) return null

  // Switching to a door system type -- auto-populate with defaults
  if (isDoorSystemType(newSystemTypeId)) {
    return getDefaultDoorHardware(newSystemTypeId, updates.heightInches ?? 0)
  }

  // Switching to a non-door system type -- clear door hardware
  return []
}
