import { SEED_HARDWARE_TEMPLATES } from './seed-hardware-templates'
import { SEED_DOOR_HARDWARE } from './seed-door-hardware'
import { createDefaultAppState, DEFAULT_SETTINGS } from '@/data'

describe('seed-hardware-templates', () => {
  it('has exactly 4 templates', () => {
    expect(SEED_HARDWARE_TEMPLATES).toHaveLength(4)
  })

  it('each template has a unique id matching pattern hst-NNN', () => {
    const ids = SEED_HARDWARE_TEMPLATES.map(t => t.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
    for (const id of ids) {
      expect(id).toMatch(/^hst-\d{3}$/)
    }
  })

  it('each template has a non-empty name', () => {
    for (const template of SEED_HARDWARE_TEMPLATES) {
      expect(template.name.length).toBeGreaterThan(0)
    }
  })

  it('each template has a non-empty items array of DoorHardwareEntry objects', () => {
    for (const template of SEED_HARDWARE_TEMPLATES) {
      expect(template.items.length).toBeGreaterThan(0)
      for (const item of template.items) {
        expect(item).toHaveProperty('hardwareId')
        expect(item).toHaveProperty('quantity')
        expect(typeof item.hardwareId).toBe('string')
        expect(typeof item.quantity).toBe('number')
      }
    }
  })

  it('template names match door system types', () => {
    const names = SEED_HARDWARE_TEMPLATES.map(t => t.name)
    expect(names).toEqual([
      'Entrance System',
      'Revolving Door',
      'Sliding Door',
      'Swing Door',
    ])
  })

  it('template items reference valid dhw-xxx hardware IDs from SEED_DOOR_HARDWARE', () => {
    const validIds = new Set(SEED_DOOR_HARDWARE.map(h => h.id))
    for (const template of SEED_HARDWARE_TEMPLATES) {
      for (const item of template.items) {
        expect(validIds.has(item.hardwareId)).toBe(true)
      }
    }
  })

  it('createDefaultAppState().settings.hardwareTemplates has 4 templates', () => {
    const state = createDefaultAppState()
    expect(state.settings.hardwareTemplates).toHaveLength(4)
  })

  it('DEFAULT_SETTINGS.hardwareTemplates equals SEED_HARDWARE_TEMPLATES', () => {
    expect(DEFAULT_SETTINGS.hardwareTemplates).toEqual(SEED_HARDWARE_TEMPLATES)
  })
})
