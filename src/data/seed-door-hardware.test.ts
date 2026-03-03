import { SEED_DOOR_HARDWARE, DOOR_HARDWARE_DEFAULTS } from './seed-door-hardware'

describe('SEED_DOOR_HARDWARE (DATA-01)', () => {
  it('contains exactly 12 door hardware items', () => {
    expect(SEED_DOOR_HARDWARE).toHaveLength(12)
  })

  it('each item has id, name, and unitCost', () => {
    for (const item of SEED_DOOR_HARDWARE) {
      expect(item.id).toMatch(/^dhw-\d{3}$/)
      expect(item.name.length).toBeGreaterThan(0)
      expect(item.unitCost).toBeGreaterThan(0)
    }
  })

  it('has unique IDs', () => {
    const ids = SEED_DOOR_HARDWARE.map(h => h.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('includes all 12 required hardware types', () => {
    const names = SEED_DOOR_HARDWARE.map(h => h.name)
    expect(names).toContain('Hinges')
    expect(names).toContain('Closer')
    expect(names).toContain('Handle/Pull')
    expect(names).toContain('Lock/Cylinder')
    expect(names).toContain('Panic Device')
    expect(names).toContain('Pivots')
    expect(names).toContain('Threshold')
    expect(names).toContain('Weatherstrip')
    expect(names).toContain('Sweep')
    expect(names).toContain('Auto-Operator')
    expect(names).toContain('Card Reader')
    expect(names).toContain('Exit Device')
  })
})

describe('DOOR_HARDWARE_DEFAULTS (DATA-03)', () => {
  it('defines defaults for exactly 4 door system types', () => {
    const keys = Object.keys(DOOR_HARDWARE_DEFAULTS)
    expect(keys).toHaveLength(4)
    expect(keys).toContain('sys-006')  // Entrance System
    expect(keys).toContain('sys-007')  // Revolving Door
    expect(keys).toContain('sys-008')  // Sliding Door
    expect(keys).toContain('sys-009')  // Swing Door
  })

  it('each default entry references valid hardware IDs', () => {
    const validIds = new Set(SEED_DOOR_HARDWARE.map(h => h.id))
    for (const [systemId, entries] of Object.entries(DOOR_HARDWARE_DEFAULTS)) {
      for (const entry of entries) {
        expect(validIds.has(entry.hardwareId)).toBe(true)
        expect(entry.quantity).toBeGreaterThan(0)
      }
    }
  })

  it('Swing Door (sys-009) has correct defaults', () => {
    const swing = DOOR_HARDWARE_DEFAULTS['sys-009']!
    expect(swing).toHaveLength(6)
    // Hinges=3, Closer=1, Handle/Pull=1, Lock/Cylinder=1, Threshold=1, Weatherstrip=1
    const hinges = swing.find(e => e.hardwareId === 'dhw-001')
    expect(hinges?.quantity).toBe(3)
    const closer = swing.find(e => e.hardwareId === 'dhw-002')
    expect(closer?.quantity).toBe(1)
    const handle = swing.find(e => e.hardwareId === 'dhw-003')
    expect(handle?.quantity).toBe(1)
  })

  it('Sliding Door (sys-008) has no hinges or closer', () => {
    const sliding = DOOR_HARDWARE_DEFAULTS['sys-008']!
    expect(sliding).toHaveLength(4)
    const hinges = sliding.find(e => e.hardwareId === 'dhw-001')
    expect(hinges).toBeUndefined()
    const closer = sliding.find(e => e.hardwareId === 'dhw-002')
    expect(closer).toBeUndefined()
  })

  it('Revolving Door (sys-007) includes Auto-Operator and Sweep', () => {
    const revolving = DOOR_HARDWARE_DEFAULTS['sys-007']!
    expect(revolving).toHaveLength(6)
    const autoOp = revolving.find(e => e.hardwareId === 'dhw-010')
    expect(autoOp?.quantity).toBe(1)
    const sweep = revolving.find(e => e.hardwareId === 'dhw-009')
    expect(sweep?.quantity).toBe(1)
  })

  it('Entrance System (sys-006) includes Pivots', () => {
    const entrance = DOOR_HARDWARE_DEFAULTS['sys-006']!
    expect(entrance).toHaveLength(7)
    const pivots = entrance.find(e => e.hardwareId === 'dhw-006')
    expect(pivots?.quantity).toBe(2)
  })
})
