import { calcLoadedRate, calcPWLoadedRate, calcCrewDays, calcLaborCost } from './labor-calc'

describe('calcLoadedRate', () => {
  it('computes standard loaded rate: base * (1 + burden) + health', () => {
    // 38.50 * 1.35 + 2.50 = 54.475
    expect(calcLoadedRate(38.50, 0.35, 2.50)).toBeCloseTo(54.475, 3)
  })

  it('returns base rate when burden and health are 0', () => {
    expect(calcLoadedRate(40, 0, 0)).toBe(40)
  })

  it('handles high burden percent', () => {
    // 50 * (1 + 1.0) + 5 = 105
    expect(calcLoadedRate(50, 1.0, 5)).toBe(105)
  })
})

describe('calcPWLoadedRate', () => {
  it('computes PW loaded rate: pwBase * (1 + burden) + pwFringe (C-004)', () => {
    // 55 * 1.35 + 15 = 89.25
    expect(calcPWLoadedRate(55.0, 0.35, 15.0)).toBeCloseTo(89.25, 2)
  })

  it('returns pwBase + fringe when burden is 0', () => {
    expect(calcPWLoadedRate(60, 0, 10)).toBe(70)
  })
})

describe('calcCrewDays', () => {
  it('computes base crew days: hours * qty / 8', () => {
    // 3.0 * 1 / 8 = 0.375
    expect(calcCrewDays(3.0, 1, [])).toBe(0.375)
  })

  it('scales with quantity', () => {
    // 3.0 * 2 / 8 = 0.75
    expect(calcCrewDays(3.0, 2, [])).toBe(0.75)
  })

  it('adds condition adjustments (positive)', () => {
    // 0.75 + 0.5 + 0.75 + 1.0 = 3.0
    expect(calcCrewDays(3.0, 2, [0.5, 0.75, 1.0])).toBe(3.0)
  })

  it('handles net-zero condition adjustments', () => {
    // 0.75 + 0.5 + (-0.5) = 0.75
    expect(calcCrewDays(3.0, 2, [0.5, -0.5])).toBe(0.75)
  })

  it('clamps to 0 when adjustments are heavily negative', () => {
    // 0.375 + (-2.0) = -1.625 -> clamped to 0
    expect(calcCrewDays(3.0, 1, [-2.0])).toBe(0)
  })

  it('returns 0 for zero quantity with no adjustments', () => {
    expect(calcCrewDays(3.0, 0, [])).toBe(0)
  })

  it('allows positive adjustments even with zero base', () => {
    // 0 + 1.5 = 1.5
    expect(calcCrewDays(0, 0, [1.5])).toBe(1.5)
  })
})

describe('calcLaborCost', () => {
  it('computes labor cost: crewDays * 8 * loadedRate', () => {
    // 0.375 * 8 * 54.475 = 163.425 -> rounded to 163.43
    expect(calcLaborCost(0.375, 54.475)).toBeCloseTo(163.43, 2)
  })

  it('returns 0 for zero crew days', () => {
    expect(calcLaborCost(0, 54.475)).toBe(0)
  })

  it('rounds to 2 decimals (C-042)', () => {
    // 1.0 * 8 * 33.333 = 266.664 -> 266.66
    expect(calcLaborCost(1.0, 33.333)).toBe(266.66)
  })

  it('computes PW labor cost correctly', () => {
    // 0.375 * 8 * 89.25 = 267.75
    expect(calcLaborCost(0.375, 89.25)).toBe(267.75)
  })
})
