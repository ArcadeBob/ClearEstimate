// @vitest-environment jsdom
import { loadAppState, saveAppState, resetAppState } from './storage-service'
import { createDefaultAppState } from '@/data'

const STORAGE_KEY = 'cgi_estimating_app_v1'

describe('storage-service', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('loadAppState', () => {
    it('returns default state when localStorage is empty', () => {
      const state = loadAppState()
      expect(state.schemaVersion).toBe(2)
      expect(state.projects).toEqual([])
      expect(state.settings.glassTypes.length).toBeGreaterThan(0)
    })

    it('loads previously saved state', () => {
      const defaults = createDefaultAppState()
      defaults.projects = [{ id: 'p1', name: 'Saved Project' } as any]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults))

      const state = loadAppState()
      expect(state.projects.length).toBe(1)
      expect(state.projects[0]!.name).toBe('Saved Project')
    })

    it('returns default state on corrupted JSON (B-005)', () => {
      localStorage.setItem(STORAGE_KEY, 'not-valid-json{{{')
      const state = loadAppState()
      expect(state.schemaVersion).toBe(2)
      expect(state.projects).toEqual([])
    })

    it('migrates old schema version to current with full settings replacement (B-007)', () => {
      const defaults = createDefaultAppState()
      const oldState = {
        schemaVersion: 1,
        projects: [
          {
            id: 'p1',
            name: 'Legacy Project',
            lineItems: [
              { id: 'li1', description: 'Old line item', quantity: 5 },
            ],
          },
        ],
        settings: { glassTypes: [{ id: 'stale', name: 'Stale Glass' }] },
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(oldState))

      const state = loadAppState()

      // Schema version bumped
      expect(state.schemaVersion).toBe(2)

      // Settings fully replaced with defaults — not merged
      expect(state.settings).toEqual(defaults.settings)

      // Projects preserved
      expect(state.projects.length).toBe(1)
      expect(state.projects[0]!.name).toBe('Legacy Project')

      // Line items gain new fields
      const li = state.projects[0]!.lineItems[0]!
      expect(li.manHours).toBe(0)
      expect(li.conditionIds).toEqual([])
      // Original fields preserved
      expect(li.description).toBe('Old line item')
      expect(li.quantity).toBe(5)
    })
  })

  describe('saveAppState', () => {
    it('persists state to localStorage', () => {
      const state = createDefaultAppState()
      saveAppState(state)

      const raw = localStorage.getItem(STORAGE_KEY)
      expect(raw).not.toBeNull()
      const parsed = JSON.parse(raw!)
      expect(parsed.schemaVersion).toBe(2)
    })
  })

  describe('resetAppState', () => {
    it('clears and returns default state', () => {
      // Save something first
      const state = createDefaultAppState()
      state.projects = [{ id: 'p1' } as any]
      saveAppState(state)

      const reset = resetAppState()
      expect(reset.projects).toEqual([])

      // Verify it was also persisted
      const raw = localStorage.getItem(STORAGE_KEY)
      const parsed = JSON.parse(raw!)
      expect(parsed.projects).toEqual([])
    })
  })
})
