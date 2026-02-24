import type { Equipment } from '@/types'

export function calcEquipmentCost(
  selectedEquipment: Equipment[],
  adjustedCrewDays: number,
): number {
  return Math.round(
    selectedEquipment.reduce((sum, eq) => sum + eq.dailyRate * adjustedCrewDays, 0) * 100,
  ) / 100
}

/** Equipment suggestion when height > 0 — C-003 */
export function shouldSuggestEquipment(heightInches: number): boolean {
  return heightInches > 0
}
