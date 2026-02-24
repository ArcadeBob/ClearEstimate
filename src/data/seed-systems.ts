import type { SystemType } from '@/types'

/**
 * 21 system types with benchmark ranges ($/SF).
 * benchmarkLow = green/amber threshold
 * benchmarkHigh = amber/red threshold
 *   ≤ low  → green (competitive)
 *   > low && ≤ high → amber (typical)
 *   > high → red (expensive)
 */
export const SEED_SYSTEM_TYPES: SystemType[] = [
  { id: 'sys-001', name: 'Curtain Wall', benchmarkLow: 45, benchmarkHigh: 75 },
  { id: 'sys-002', name: 'Storefront', benchmarkLow: 25, benchmarkHigh: 45 },
  { id: 'sys-003', name: 'Window Wall', benchmarkLow: 35, benchmarkHigh: 60 },
  { id: 'sys-004', name: 'Ribbon Window', benchmarkLow: 30, benchmarkHigh: 55 },
  { id: 'sys-005', name: 'Punched Opening', benchmarkLow: 20, benchmarkHigh: 40 },
  { id: 'sys-006', name: 'Entrance System', benchmarkLow: 55, benchmarkHigh: 90 },
  { id: 'sys-007', name: 'Revolving Door', benchmarkLow: 80, benchmarkHigh: 150 },
  { id: 'sys-008', name: 'Sliding Door', benchmarkLow: 40, benchmarkHigh: 70 },
  { id: 'sys-009', name: 'Swing Door', benchmarkLow: 35, benchmarkHigh: 65 },
  { id: 'sys-010', name: 'Skylight', benchmarkLow: 50, benchmarkHigh: 85 },
  { id: 'sys-011', name: 'Sloped Glazing', benchmarkLow: 55, benchmarkHigh: 90 },
  { id: 'sys-012', name: 'Glass Railing', benchmarkLow: 60, benchmarkHigh: 100 },
  { id: 'sys-013', name: 'Glass Canopy', benchmarkLow: 65, benchmarkHigh: 110 },
  { id: 'sys-014', name: 'Blast Resistant', benchmarkLow: 70, benchmarkHigh: 120 },
  { id: 'sys-015', name: 'Hurricane Rated', benchmarkLow: 55, benchmarkHigh: 95 },
  { id: 'sys-016', name: 'Fire Rated', benchmarkLow: 60, benchmarkHigh: 100 },
  { id: 'sys-017', name: 'Bullet Resistant', benchmarkLow: 90, benchmarkHigh: 160 },
  { id: 'sys-018', name: 'Shower Enclosure', benchmarkLow: 30, benchmarkHigh: 55 },
  { id: 'sys-019', name: 'Interior Partition', benchmarkLow: 25, benchmarkHigh: 45 },
  { id: 'sys-020', name: 'Mirror Wall', benchmarkLow: 20, benchmarkHigh: 35 },
  { id: 'sys-021', name: 'Glass Floor', benchmarkLow: 100, benchmarkHigh: 180 },
]
