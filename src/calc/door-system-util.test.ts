import { isDoorSystemType, DOOR_SYSTEM_IDS } from './door-system-util'

describe('isDoorSystemType (CALC-02)', () => {
  it('returns true for Entrance System (sys-006)', () => {
    expect(isDoorSystemType('sys-006')).toBe(true)
  })

  it('returns true for Revolving Door (sys-007)', () => {
    expect(isDoorSystemType('sys-007')).toBe(true)
  })

  it('returns true for Sliding Door (sys-008)', () => {
    expect(isDoorSystemType('sys-008')).toBe(true)
  })

  it('returns true for Swing Door (sys-009)', () => {
    expect(isDoorSystemType('sys-009')).toBe(true)
  })

  it('returns false for Curtain Wall (sys-001)', () => {
    expect(isDoorSystemType('sys-001')).toBe(false)
  })

  it('returns false for Storefront (sys-002)', () => {
    expect(isDoorSystemType('sys-002')).toBe(false)
  })

  it('returns false for Glass Railing (sys-012)', () => {
    expect(isDoorSystemType('sys-012')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isDoorSystemType('')).toBe(false)
  })

  it('returns false for unknown ID', () => {
    expect(isDoorSystemType('sys-999')).toBe(false)
  })

  it('DOOR_SYSTEM_IDS contains exactly 4 entries', () => {
    expect(DOOR_SYSTEM_IDS.size).toBe(4)
  })
})
