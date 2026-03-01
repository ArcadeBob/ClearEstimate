import type { AppState, LineItem } from '@/types'
import { createDefaultAppState } from '@/data'

const STORAGE_KEY = 'cgi_estimating_app_v1'
const CURRENT_SCHEMA_VERSION = 2

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

  // v1→v2: Replace all settings with new seed data (B-007).
  // Settings are incompatible: SystemType gained laborMode, FrameSystem lost laborHoursPerUnit.
  const projects = (parsed.projects ?? []).map(p => ({
    ...p,
    lineItems: (p.lineItems ?? []).map((li: Partial<LineItem>) => ({
      ...li,
      manHours: 0,
      conditionIds: [],
    })),
  }))

  const migrated: AppState = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    settings: defaults.settings,  // full replacement, not merge
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
