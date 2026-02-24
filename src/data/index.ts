import type { AppSettings, AppState } from '@/types'
import { SEED_GLASS_TYPES } from './seed-glass'
import { SEED_FRAME_SYSTEMS } from './seed-frames'
import { SEED_LABOR_RATES } from './seed-labor'
import { SEED_CONDITIONS } from './seed-conditions'
import { SEED_HARDWARE } from './seed-hardware'
import { SEED_EQUIPMENT } from './seed-equipment'
import { SEED_SYSTEM_TYPES } from './seed-systems'

export const DEFAULT_SETTINGS: AppSettings = {
  glassTypes: SEED_GLASS_TYPES,
  frameSystems: SEED_FRAME_SYSTEMS,
  laborRates: SEED_LABOR_RATES,
  conditions: SEED_CONDITIONS,
  hardware: SEED_HARDWARE,
  equipment: SEED_EQUIPMENT,
  systemTypes: SEED_SYSTEM_TYPES,
}

export function createDefaultAppState(): AppState {
  return {
    schemaVersion: 1,
    projects: [],
    settings: DEFAULT_SETTINGS,
  }
}

/**
 * SPOT-CHECK VERIFICATION (48"×96" qty 1, Clear Tempered + Kawneer, no conditions/equipment):
 *
 * sqft       = (48 × 96) / 144 × 1     = 32.00 SF
 * perimeter  = 2 × (48 + 96) / 12 × 1  = 24.00 LF
 *
 * Glass cost = 32.00 × $15.00           = $480.00
 * Frame cost = 24.00 × $9.85            = $236.40
 * Hardware   = $0                        (none selected)
 * Material   = $480.00 + $236.40         = $716.40
 *
 * Loaded rate = $38.50 × 1.35 + $2.50   = $54.475/hr
 * Crew days   = 3.0 hrs × 1 / 8         = 0.375
 * Labor cost  = 0.375 × 8 × $54.475     = $163.43
 *
 * Equipment   = $0                       (none selected)
 *
 * LINE TOTAL  = $716.40 + $163.43        = $879.83  ← target ~$879 ✓
 */
