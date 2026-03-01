import type { AppState } from '@/types'
import { createDefaultAppState } from '@/data'

const STORAGE_KEY = 'cgi_estimating_app_v1'
const CURRENT_SCHEMA_VERSION = 2

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultAppState()

    const parsed = JSON.parse(raw) as Partial<AppState>

    // Schema migration: merge with defaults to fill any new fields (B-005)
    if (!parsed.schemaVersion || parsed.schemaVersion < CURRENT_SCHEMA_VERSION) {
      const defaults = createDefaultAppState()
      const migrated: AppState = {
        ...defaults,
        ...parsed,
        schemaVersion: CURRENT_SCHEMA_VERSION,
        settings: {
          ...defaults.settings,
          ...(parsed.settings ?? {}),
        },
        projects: parsed.projects ?? [],
      }
      saveAppState(migrated)
      return migrated
    }

    return parsed as AppState
  } catch {
    // Corrupted JSON — reset to defaults
    return createDefaultAppState()
  }
}

export function saveAppState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function resetAppState(): AppState {
  const state = createDefaultAppState()
  saveAppState(state)
  return state
}
