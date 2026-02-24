import type { GlassType } from '@/types'

/**
 * 14 glass types with realistic pricing.
 *
 * SPOT-CHECK: "1/4" Clear Tempered" (glass-001) at $15.00/SF
 *   48"×96" → sqft = (48×96/144)×1 = 32 SF → glass cost = 32 × $15.00 = $480.00
 */
export const SEED_GLASS_TYPES: GlassType[] = [
  { id: 'glass-001', name: '1/4" Clear Tempered', costPerSqft: 15.00 },
  { id: 'glass-002', name: '1/4" Clear Annealed', costPerSqft: 8.50 },
  { id: 'glass-003', name: '1/4" Low-E Tempered', costPerSqft: 22.00 },
  { id: 'glass-004', name: '1/4" Low-E Annealed', costPerSqft: 16.00 },
  { id: 'glass-005', name: '1/4" Tinted Tempered', costPerSqft: 18.50 },
  { id: 'glass-006', name: '1/4" Tinted Annealed', costPerSqft: 12.00 },
  { id: 'glass-007', name: '1" Insulated Clear', costPerSqft: 28.00 },
  { id: 'glass-008', name: '1" Insulated Low-E', costPerSqft: 35.00 },
  { id: 'glass-009', name: '1" Insulated Tinted', costPerSqft: 32.00 },
  { id: 'glass-010', name: '1/4" Spandrel', costPerSqft: 20.00 },
  { id: 'glass-011', name: '1/4" Laminated Clear', costPerSqft: 25.00 },
  { id: 'glass-012', name: '1/4" Laminated Tinted', costPerSqft: 30.00 },
  { id: 'glass-013', name: '3/8" Clear Tempered', costPerSqft: 19.00 },
  { id: 'glass-014', name: '1/2" Clear Tempered', costPerSqft: 24.00 },
]
