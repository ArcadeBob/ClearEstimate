import type { Equipment } from '@/types'

/**
 * 5 equipment items. Daily rate is multiplied by adjusted crew days
 * for equipment cost calculation.
 */
export const SEED_EQUIPMENT: Equipment[] = [
  { id: 'equip-001', name: 'Boom Lift (40ft)', dailyRate: 350.00 },
  { id: 'equip-002', name: 'Boom Lift (60ft)', dailyRate: 550.00 },
  { id: 'equip-003', name: 'Scissor Lift', dailyRate: 225.00 },
  { id: 'equip-004', name: 'Swing Stage', dailyRate: 450.00 },
  { id: 'equip-005', name: 'Material Hoist', dailyRate: 300.00 },
]
