import type { LineItem, VEAlternate, Project } from '@/types'

/**
 * Cascades line item cost changes to linked VE alternates (C-015).
 * Updates originalCost and savings on any VE alternate whose lineItemId
 * matches an item in newLineItems.
 */
export function cascadeVEAlternates(
  veAlternates: VEAlternate[],
  newLineItems: LineItem[],
): VEAlternate[] {
  return veAlternates.map(ve => {
    const linkedItem = newLineItems.find(li => li.id === ve.lineItemId)
    if (!linkedItem) return ve
    const originalCost = linkedItem.lineTotal
    return { ...ve, originalCost, savings: originalCost - ve.alternateCost }
  })
}

/**
 * Returns a new timestamps object with updatedAt set to the current time.
 */
export function touchTimestamp(
  timestamps: Project['timestamps'],
): Project['timestamps'] {
  return { ...timestamps, updatedAt: new Date().toISOString() }
}
