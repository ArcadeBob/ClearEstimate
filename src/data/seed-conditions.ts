import type { Condition } from '@/types'

/**
 * 6 site conditions. Each adjustment is in CREW-DAY units added to the
 * total crew days for the line item — NOT per unit (I-003).
 *
 * Positive = penalty (more time), negative = improvement (less time).
 * Total crew days are clamped to min 0 after all adjustments.
 */
export const SEED_CONDITIONS: Condition[] = [
  { id: 'cond-001', name: 'High Wind Area', adjustment: 0.5 },
  { id: 'cond-002', name: 'Limited Access', adjustment: 0.75 },
  { id: 'cond-003', name: 'Night Work Required', adjustment: 1.0 },
  { id: 'cond-004', name: 'Occupied Building', adjustment: 0.25 },
  { id: 'cond-005', name: 'Pre-fabricated Units', adjustment: -0.5 },
  { id: 'cond-006', name: 'Union Labor Site', adjustment: 0.25 },
]
