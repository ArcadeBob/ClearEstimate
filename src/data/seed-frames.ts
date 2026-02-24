import type { FrameSystem } from '@/types'

/**
 * 5 frame systems with realistic pricing.
 *
 * SPOT-CHECK: "Kawneer Trifab 451T" (frame-001) at $9.85/LF, 3.0 labor hrs/unit
 *   48"×96" → perimeter = 2×(48+96)/12×1 = 24 LF → frame cost = 24 × $9.85 = $236.40
 *   crewDays = 3.0 × 1 / 8 = 0.375
 */
export const SEED_FRAME_SYSTEMS: FrameSystem[] = [
  { id: 'frame-001', name: 'Kawneer Trifab 451T', costPerLinFt: 9.85, laborHoursPerUnit: 3.0 },
  { id: 'frame-002', name: 'YKK AP YCW 750 OG', costPerLinFt: 11.50, laborHoursPerUnit: 3.5 },
  { id: 'frame-003', name: 'Oldcastle Reliance SS', costPerLinFt: 8.25, laborHoursPerUnit: 2.5 },
  { id: 'frame-004', name: 'EFCO 5600', costPerLinFt: 10.75, laborHoursPerUnit: 3.25 },
  { id: 'frame-005', name: 'Vitro Architectural', costPerLinFt: 12.00, laborHoursPerUnit: 4.0 },
]
