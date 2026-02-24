import type { Hardware } from '@/types'

/**
 * 8 hardware items. Cost is per unit — multiplied by lineItem.quantity
 * in the material calc (C-016).
 */
export const SEED_HARDWARE: Hardware[] = [
  { id: 'hw-001', name: 'Setting Blocks', unitCost: 2.50 },
  { id: 'hw-002', name: 'Glazing Tape (per unit)', unitCost: 4.75 },
  { id: 'hw-003', name: 'Structural Silicone (per unit)', unitCost: 8.00 },
  { id: 'hw-004', name: 'Pressure Plate', unitCost: 12.50 },
  { id: 'hw-005', name: 'Snap Cap', unitCost: 6.25 },
  { id: 'hw-006', name: 'Corner Key', unitCost: 3.75 },
  { id: 'hw-007', name: 'Anchor Clip', unitCost: 5.50 },
  { id: 'hw-008', name: 'Weep Hole Cover', unitCost: 1.25 },
]
