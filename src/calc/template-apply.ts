import type { HardwareSetTemplate, Hardware, DoorHardwareEntry } from '@/types'

/**
 * Applies a hardware set template to a door line item.
 * Filters out any template items that reference hardware IDs
 * no longer present in the catalog (stale references).
 *
 * Returns a new DoorHardwareEntry[] suitable for setting on a LineItem.
 */
export function applyTemplate(
  template: HardwareSetTemplate,
  catalog: Hardware[],
): DoorHardwareEntry[] {
  const catalogIds = new Set(catalog.map(h => h.id))
  return template.items.filter(entry => catalogIds.has(entry.hardwareId))
}
