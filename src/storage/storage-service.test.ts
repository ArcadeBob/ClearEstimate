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
      expect(state.schemaVersion).toBe(4)
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
      expect(state.schemaVersion).toBe(4)
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
      expect(state.schemaVersion).toBe(4)

      // Settings fully replaced with defaults (v1->v2 replaces all, v2->v3 adds doorHardware, v3->v4 adds hardwareTemplates)
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

    it('migrates v2 data through v3 and v4: adds doorHardware and hardwareTemplates (DATA-04)', () => {
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

      // Schema version bumped to 4 (v2->v3->v4)
      expect(state.schemaVersion).toBe(4)

      // Existing settings preserved (not replaced)
      expect(state.settings.glassTypes[0]!.name).toBe('Custom Glass')
      expect(state.settings.frameSystems[0]!.name).toBe('Custom Frame')
      expect(state.settings.laborRates[0]!.role).toBe('Custom')
      expect(state.settings.hardware[0]!.name).toBe('Setting Blocks')
      expect(state.settings.systemTypes[0]!.name).toBe('Curtain Wall')

      // Door hardware catalog added from defaults (v2->v3)
      expect(state.settings.doorHardware).toHaveLength(12)
      expect(state.settings.doorHardware[0]!.id).toBe('dhw-001')

      // Hardware templates added from defaults (v3->v4)
      expect(state.settings.hardwareTemplates).toHaveLength(4)

      // Line items gain empty doorHardware array
      const li = state.projects[0]!.lineItems[0]!
      expect(li.doorHardware).toEqual([])
      expect(li.doorHardwareCost).toBe(0)

      // Existing line item fields preserved
      expect(li.description).toBe('Existing line item')
      expect(li.quantity).toBe(5)
      expect(li.hardwareIds).toEqual(['hw-001'])
    })

    it('migrates v1 data through v2, v3, and v4 in sequence', () => {
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

      // Fully migrated to v4
      expect(state.schemaVersion).toBe(4)

      // v1->v2 applied: settings fully replaced, line items get manHours + conditionIds
      expect(state.settings.doorHardware).toHaveLength(12)

      // v3->v4 applied: hardwareTemplates added
      expect(state.settings.hardwareTemplates).toHaveLength(4)

      // v2->v3 applied: line items get doorHardware
      const li = state.projects[0]!.lineItems[0]!
      expect(li.doorHardware).toEqual([])
      expect(li.doorHardwareCost).toBe(0)
      expect(li.manHours).toBe(0)
      expect(li.conditionIds).toEqual([])
    })

    it('migrates v3 data to v4: adds hardwareTemplates to settings', () => {
      const v3State = {
        schemaVersion: 3,
        projects: [
          {
            id: 'p1',
            name: 'V3 Project',
            lineItems: [
              {
                id: 'li1',
                description: 'Existing line item',
                quantity: 2,
                doorHardware: [{ hardwareId: 'dhw-001', quantity: 3 }],
                doorHardwareCost: 45,
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
          doorHardware: [{ id: 'dhw-001', name: 'Hinges', unitCost: 15.00 }],
          equipment: [],
          systemTypes: [{ id: 'sys-001', name: 'Curtain Wall', benchmarkLow: 45, benchmarkHigh: 75, laborMode: 'area', sfPerManHour: 6 }],
        },
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(v3State))

      const state = loadAppState()

      // Schema version bumped to 4
      expect(state.schemaVersion).toBe(4)

      // Existing settings preserved (not replaced)
      expect(state.settings.glassTypes[0]!.name).toBe('Custom Glass')
      expect(state.settings.doorHardware[0]!.name).toBe('Hinges')

      // Hardware templates added from defaults
      expect(state.settings.hardwareTemplates).toHaveLength(4)
      expect(state.settings.hardwareTemplates[0]!.id).toBe('hst-001')
      expect(state.settings.hardwareTemplates[0]!.name).toBe('Entrance System')
      expect(state.settings.hardwareTemplates[0]!.items.length).toBeGreaterThan(0)

      // Projects and line items untouched
      expect(state.projects[0]!.name).toBe('V3 Project')
      const li = state.projects[0]!.lineItems[0]!
      expect(li.doorHardware).toEqual([{ hardwareId: 'dhw-001', quantity: 3 }])
      expect(li.doorHardwareCost).toBe(45)
    })

    it('returns default state with hardwareTemplates when localStorage is empty', () => {
      const state = loadAppState()
      expect(state.settings.hardwareTemplates).toHaveLength(4)
      expect(state.settings.hardwareTemplates.map(t => t.name)).toEqual([
        'Entrance System', 'Revolving Door', 'Sliding Door', 'Swing Door',
      ])
    })

    it('returns default state with doorHardware when localStorage is empty', () => {
      const state = loadAppState()
      expect(state.schemaVersion).toBe(4)
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
      expect(parsed.schemaVersion).toBe(4)
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
