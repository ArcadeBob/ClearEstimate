import type { LaborRate } from '@/types'

/**
 * 4 labor roles. Only the primary Glazier rate (labor-001) is used for
 * line item calculations in Phase 1 (C-001).
 *
 * SPOT-CHECK: Glazier loaded rate = $38.50 × (1 + 0.35) + $2.50
 *   = $38.50 × 1.35 + $2.50 = $51.975 + $2.50 = $54.475 → rounds to $54.48/hr
 *   labor cost = 0.375 crewDays × 8 hrs × $54.475 = $163.43
 *
 * Combined with material $716.40 → total ≈ $879.83 ✓
 */
export const SEED_LABOR_RATES: LaborRate[] = [
  {
    id: 'labor-001',
    role: 'Glazier',
    baseRate: 38.50,
    burdenPercent: 0.35,
    healthHourly: 2.50,
    loadedRate: 54.48, // pre-calculated cross-check: 38.50 * 1.35 + 2.50
  },
  {
    id: 'labor-002',
    role: 'Apprentice',
    baseRate: 24.00,
    burdenPercent: 0.35,
    healthHourly: 2.50,
    loadedRate: 34.90, // 24.00 * 1.35 + 2.50
  },
  {
    id: 'labor-003',
    role: 'Foreman',
    baseRate: 45.00,
    burdenPercent: 0.35,
    healthHourly: 2.50,
    loadedRate: 63.25, // 45.00 * 1.35 + 2.50
  },
  {
    id: 'labor-004',
    role: 'Superintendent',
    baseRate: 52.00,
    burdenPercent: 0.35,
    healthHourly: 2.50,
    loadedRate: 72.70, // 52.00 * 1.35 + 2.50
  },
]
