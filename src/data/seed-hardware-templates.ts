import type { HardwareSetTemplate } from '@/types'
import { DOOR_HARDWARE_DEFAULTS } from './seed-door-hardware'

/**
 * 4 seed hardware set templates — one per door system type.
 * Derived from DOOR_HARDWARE_DEFAULTS so templates stay in sync with
 * the default hardware selections for each door system.
 */
export const SEED_HARDWARE_TEMPLATES: HardwareSetTemplate[] = [
  { id: 'hst-001', name: 'Entrance System', items: DOOR_HARDWARE_DEFAULTS['sys-006']! },
  { id: 'hst-002', name: 'Revolving Door',  items: DOOR_HARDWARE_DEFAULTS['sys-007']! },
  { id: 'hst-003', name: 'Sliding Door',    items: DOOR_HARDWARE_DEFAULTS['sys-008']! },
  { id: 'hst-004', name: 'Swing Door',      items: DOOR_HARDWARE_DEFAULTS['sys-009']! },
]
