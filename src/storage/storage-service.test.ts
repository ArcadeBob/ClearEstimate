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
      expect(state.schemaVersion).toBe(3)
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
      expect(state.schemaVersion).toBe(3)
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
      expect(state.schemaVersion).toBe(3)

      // Settings fully replaced with defaults (v1->v2 replaces all, v2->v3 adds doorHardware)
      expect(state.settings).toEqual(defaults.settings)

      // Projects preserved
      expect(state.projects.length).toBe(1)
      expect(state.projects[0]!.name).toBe('Legacy Project')

      // Line items gain new fields (v1->v2 adds manHours/conditionIds, v2->v3 adds doorHardware)
      const li = state.projects[0]!.lineItems[0]!
      expect(li.manHours).toBe(0)
      expect(li.conditionIds).toEqual([])
      expect(li.doorHardware).toEqual([])
      expect(li.doorHardwareCost).toBe(0)
      // Original fields preserved
      expect(li.description).toBe('Old line item')
      expect(li.quantity).toBe(5)
    })

    it('migrates v2 data to v3: adds doorHardware to settings and line items (DATA-04)', () => {
      const v2State = {
        schemaVersion: 2,
        projects: [
          {
            id: 'p1',
            name: 'V2 Project',
            lineItems: [
              {
                id: 'li1',
                description: 'Existing line item',
                quantity: 5,
                hardwareIds: ['hw-001'],
                conditionIds: ['cond-001'],
                manHours: 10,
              },
            ],
          },
        ],
        settings: {
          glassTypes: [{ id: 'glass-custom', name: 'Custom Glass', costPerSqft: 20 }],
          frameSystems: [{ id: 'frame-custom', name: 'Custom Frame', costPerLinFt: 12 }],
          laborRates: [{ id: 'lr-custom', role: 'Custom', baseRate: 40, burdenPercent: 0.3, healthHourly: 3, loadedRate: 55 }],
          conditions: [],
          hardware: [{ id: 'hw-001', name: 'Setting Blocks', unitCost: 2.50 }],
          equipment: [],
          systemTypes: [{ id: 'sys-001', name: 'Curtain Wall', benchmarkLow: 45, benchmarkHigh: 75, laborMode: 'area', sfPerManHour: 6 }],
        },
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(v2State))

      const state = loadAppState()

      // Schema version bumped to 3
      expect(state.schemaVersion).toBe(3)

      // Existing settings preserved (not replaced)
      expect(state.settings.glassTypes[0]!.name).toBe('Custom Glass')
      expect(state.settings.frameSystems[0]!.name).toBe('Custom Frame')
      expect(state.settings.laborRates[0]!.role).toBe('Custom')
      expect(state.settings.hardware[0]!.name).toBe('Setting Blocks')
      expect(state.settings.systemTypes[0]!.name).toBe('Curtain Wall')

      // Door hardware catalog added from defaults
      expect(state.settings.doorHardware).toHaveLength(12)
      expect(state.settings.doorHardware[0]!.id).toBe('dhw-001')

      // Line items gain empty doorHardware array
      const li = state.projects[0]!.lineItems[0]!
      expect(li.doorHardware).toEqual([])
      expect(li.doorHardwareCost).toBe(0)

      // Existing line item fields preserved
      expect(li.description).toBe('Existing line item')
      expect(li.quantity).toBe(5)
      expect(li.hardwareIds).toEqual(['hw-001'])
    })

    it('migrates v1 data through v2 and v3 in sequence', () => {
      const v1State = {
        schemaVersion: 1,
        projects: [
          {
            id: 'p1',
            name: 'V1 Project',
            lineItems: [
              { id: 'li1', description: 'V1 line item' },
            ],
          },
        ],
        settings: { glassTypes: [{ id: 'old', name: 'Old Glass' }] },
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(v1State))

      const state = loadAppState()

      // Fully migrated to v3
      expect(state.schemaVersion).toBe(3)

      // v1->v2 applied: settings fully replaced, line items get manHours + conditionIds
      expect(state.settings.doorHardware).toHaveLength(12)

      // v2->v3 applied: line items get doorHardware
      const li = state.projects[0]!.lineItems[0]!
      expect(li.doorHardware).toEqual([])
      expect(li.doorHardwareCost).toBe(0)
      expect(li.manHours).toBe(0)
      expect(li.conditionIds).toEqual([])
    })

    it('returns default state with doorHardware when localStorage is empty', () => {
      const state = loadAppState()
      expect(state.schemaVersion).toBe(3)
      expect(state.settings.doorHardware).toHaveLength(12)
    })
  })

  describe('saveAppState', () => {
    it('persists state to localStorage', () => {
      const state = createDefaultAppState()
      saveAppState(state)

      const raw = localStorage.getItem(STORAGE_KEY)
      expect(raw).not.toBeNull()
      const parsed = JSON.parse(raw!)
      expect(parsed.schemaVersion).toBe(3)
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
