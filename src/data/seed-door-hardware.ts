import type { Hardware, DoorHardwareEntry } from '@/types'

/**
 * 12 door hardware items. Cost is per unit -- estimators customize in Settings.
 * Prices are reasonable commercial glazing contractor defaults (DATA-01).
 */
export const SEED_DOOR_HARDWARE: Hardware[] = [
  { id: 'dhw-001', name: 'Hinges',         unitCost: 15.00 },
  { id: 'dhw-002', name: 'Closer',         unitCost: 85.00 },
  { id: 'dhw-003', name: 'Handle/Pull',    unitCost: 45.00 },
  { id: 'dhw-004', name: 'Lock/Cylinder',  unitCost: 65.00 },
  { id: 'dhw-005', name: 'Panic Device',   unitCost: 250.00 },
  { id: 'dhw-006', name: 'Pivots',         unitCost: 120.00 },
  { id: 'dhw-007', name: 'Threshold',      unitCost: 35.00 },
  { id: 'dhw-008', name: 'Weatherstrip',   unitCost: 18.00 },
  { id: 'dhw-009', name: 'Sweep',          unitCost: 12.00 },
  { id: 'dhw-010', name: 'Auto-Operator',  unitCost: 1200.00 },
  { id: 'dhw-011', name: 'Card Reader',    unitCost: 350.00 },
  { id: 'dhw-012', name: 'Exit Device',    unitCost: 275.00 },
]

/**
 * Default hardware sets per door system type (DATA-03).
 * Used by Phase 3 hooks to auto-populate when a door system is first selected.
 */
export const DOOR_HARDWARE_DEFAULTS: Record<string, DoorHardwareEntry[]> = {
  'sys-006': [  // Entrance System
    { hardwareId: 'dhw-001', quantity: 3 },  // Hinges
    { hardwareId: 'dhw-002', quantity: 1 },  // Closer
    { hardwareId: 'dhw-003', quantity: 2 },  // Handle/Pull
    { hardwareId: 'dhw-004', quantity: 1 },  // Lock/Cylinder
    { hardwareId: 'dhw-007', quantity: 1 },  // Threshold
    { hardwareId: 'dhw-008', quantity: 1 },  // Weatherstrip
    { hardwareId: 'dhw-006', quantity: 2 },  // Pivots
  ],
  'sys-007': [  // Revolving Door
    { hardwareId: 'dhw-003', quantity: 2 },  // Handle/Pull
    { hardwareId: 'dhw-004', quantity: 1 },  // Lock/Cylinder
    { hardwareId: 'dhw-007', quantity: 1 },  // Threshold
    { hardwareId: 'dhw-008', quantity: 1 },  // Weatherstrip
    { hardwareId: 'dhw-009', quantity: 1 },  // Sweep
    { hardwareId: 'dhw-010', quantity: 1 },  // Auto-Operator
  ],
  'sys-008': [  // Sliding Door
    { hardwareId: 'dhw-003', quantity: 2 },  // Handle/Pull
    { hardwareId: 'dhw-004', quantity: 1 },  // Lock/Cylinder
    { hardwareId: 'dhw-007', quantity: 1 },  // Threshold
    { hardwareId: 'dhw-008', quantity: 1 },  // Weatherstrip
  ],
  'sys-009': [  // Swing Door
    { hardwareId: 'dhw-001', quantity: 3 },  // Hinges
    { hardwareId: 'dhw-002', quantity: 1 },  // Closer
    { hardwareId: 'dhw-003', quantity: 1 },  // Handle/Pull
    { hardwareId: 'dhw-004', quantity: 1 },  // Lock/Cylinder
    { hardwareId: 'dhw-007', quantity: 1 },  // Threshold
    { hardwareId: 'dhw-008', quantity: 1 },  // Weatherstrip
  ],
}
