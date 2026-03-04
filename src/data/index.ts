import type { AppSettings, AppState } from '@/types'
import { SEED_GLASS_TYPES } from './seed-glass'
import { SEED_FRAME_SYSTEMS } from './seed-frames'
import { SEED_LABOR_RATES } from './seed-labor'
import { SEED_CONDITIONS } from './seed-conditions'
import { SEED_HARDWARE } from './seed-hardware'
import { SEED_DOOR_HARDWARE, DOOR_HARDWARE_DEFAULTS } from './seed-door-hardware'
import { SEED_EQUIPMENT } from './seed-equipment'
import { SEED_SYSTEM_TYPES } from './seed-systems'

export const DEFAULT_SETTINGS: AppSettings = {
  glassTypes: SEED_GLASS_TYPES,
  frameSystems: SEED_FRAME_SYSTEMS,
  laborRates: SEED_LABOR_RATES,
  conditions: SEED_CONDITIONS,
  hardware: SEED_HARDWARE,
  doorHardware: SEED_DOOR_HARDWARE,
  equipment: SEED_EQUIPMENT,
  systemTypes: SEED_SYSTEM_TYPES,
}

export function createDefaultAppState(): AppState {
  return {
    schemaVersion: 3,
    projects: [],
    settings: DEFAULT_SETTINGS,
  }
}

export { DOOR_HARDWARE_DEFAULTS }

/**
 * SPOT-CHECK VERIFICATION (48"×96" qty 1, Clear Tempered + Kawneer, Curtain Wall system):
 *
 * sqft       = (48 × 96) / 144 × 1     = 32.00 SF
 * perimeter  = 2 × (48 + 96) / 12 × 1  = 24.00 LF
 *
 * Glass cost = 32.00 × $15.00           = $480.00
 * Frame cost = 24.00 × $9.85            = $236.40
 * Material   = $480.00 + $236.40         = $716.40
 *
 * Loaded rate = $38.50 × 1.35 + $2.50   = $54.475/hr
 * Man-hours   = 32.00 SF / 6.0 SF/MH    = 5.3333 MH  (area mode, Curtain Wall)
 * Labor cost  = 5.3333 × $54.475        = $290.53
 * Crew days   = 5.3333 / 8              = 0.6667
 *
 * LINE TOTAL  = $716.40 + $290.53        = $1,006.93
 */
