import type { DoorHardwareEntry, Hardware } from '@/types'
import { isDoorSystemType } from './door-system-util'

/**
 * Computes total door hardware cost for a line item (CALC-01).
 * SUM(unitCost x qtyPerDoor x quantity) for all valid entries.
 * Missing hardware IDs are skipped and contribute $0.
 */
export function calcDoorHardwareCost(
  doorHardwareEntries: DoorHardwareEntry[],
  doorHardwareCatalog: Hardware[],
  quantity: number,
): number {
  const total = doorHardwareEntries.reduce((sum, entry) => {
    const hw = doorHardwareCatalog.find(h => h.id === entry.hardwareId)
    if (!hw) return sum
    return sum + hw.unitCost * entry.quantity * quantity
  }, 0)
  return Math.round(total * 100) / 100
}

/**
 * Suggests hinge count based on door height (CALC-03).
 * Returns null for non-door system types.
 *
 * Thresholds:
 *   <= 60"  -> 2 hinges
 *   61-90"  -> 3 hinges
 *   >= 91"  -> 4 hinges (capped)
 */
export function suggestHingeCount(
  heightInches: number,
  systemTypeId: string,
): number | null {
  if (!isDoorSystemType(systemTypeId)) return null
  if (heightInches <= 60) return 2
  if (heightInches <= 90) return 3
  return 4
}
