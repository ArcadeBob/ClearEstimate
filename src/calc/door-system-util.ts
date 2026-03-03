/**
 * Door system type identification utility (CALC-02).
 * Single source of truth for which system types are door types.
 */
export const DOOR_SYSTEM_IDS: ReadonlySet<string> = new Set([
  'sys-006',  // Entrance System
  'sys-007',  // Revolving Door
  'sys-008',  // Sliding Door
  'sys-009',  // Swing Door
])

/**
 * Returns true if the given system type ID is a door system type.
 * Used by calc engine (Phase 2) and hooks (Phase 3) to apply
 * door-specific logic.
 */
export function isDoorSystemType(systemTypeId: string): boolean {
  return DOOR_SYSTEM_IDS.has(systemTypeId)
}
