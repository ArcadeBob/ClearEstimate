import type { FrameSystem } from '@/types'

/**
 * 5 frame systems — material pricing only (cost per linear foot).
 * Labor is now driven by SystemType (C-020).
 */
export const SEED_FRAME_SYSTEMS: FrameSystem[] = [
  { id: 'frame-001', name: 'Kawneer Trifab 451T', costPerLinFt: 9.85 },
  { id: 'frame-002', name: 'YKK AP YCW 750 OG',   costPerLinFt: 11.50 },
  { id: 'frame-003', name: 'Oldcastle Reliance SS', costPerLinFt: 8.25 },
  { id: 'frame-004', name: 'EFCO 5600',            costPerLinFt: 10.75 },
  { id: 'frame-005', name: 'Vitro Architectural',  costPerLinFt: 12.00 },
]
