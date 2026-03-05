import type { AppState } from '@/types'
import { createDefaultAppState } from '@/data'

const STORAGE_KEY = 'cgi_estimating_app_v1'
const CURRENT_SCHEMA_VERSION = 4

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultAppState()

    const parsed = JSON.parse(raw) as Partial<AppState>

    if (!parsed.schemaVersion || parsed.schemaVersion < CURRENT_SCHEMA_VERSION) {
      return migrateState(parsed)
    }

    return parsed as AppState
  } catch {
    // Corrupted JSON — reset to defaults
    return createDefaultAppState()
  }
}

function migrateState(parsed: Partial<AppState>): AppState {
  const defaults = createDefaultAppState()
  let version = parsed.schemaVersion ?? 1
  let projects = parsed.projects ?? []
  let settings = parsed.settings ?? defaults.settings

  // v1->v2: Replace all settings with new seed data (B-007).
  // Settings are incompatible: SystemType gained laborMode, FrameSystem lost laborHoursPerUnit.
  if (version < 2) {
    settings = defaults.settings
    projects = projects.map(p => ({
      ...p,
      lineItems: (p.lineItems ?? []).map((li: any) => ({
        ...li,
        manHours: 0,
        conditionIds: [],
      })),
    }))
    version = 2
  }

  // v2->v3: Add door hardware (additive, preserves existing settings)
  if (version < 3) {
    settings = {
      ...settings,
      doorHardware: defaults.settings.doorHardware,
    }
    projects = projects.map(p => ({
      ...p,
      lineItems: (p.lineItems ?? []).map((li: any) => ({
        ...li,
        doorHardware: li.doorHardware ?? [],
        doorHardwareCost: li.doorHardwareCost ?? 0,
      })),
    }))
    version = 3
  }

  // v3->v4: Add hardware set templates (additive, preserves existing settings)
  if (version < 4) {
    settings = {
      ...settings,
      hardwareTemplates: defaults.settings.hardwareTemplates,
    }
    version = 4
  }

  const migrated: AppState = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    settings: settings as AppState['settings'],
    projects: projects as AppState['projects'],
  }

  saveAppState(migrated)
  return migrated
}

export function saveAppState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function resetAppState(): AppState {
  const state = createDefaultAppState()
  saveAppState(state)
  return state
}
