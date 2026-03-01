import { calcLoadedRate, calcPWLoadedRate, calcBaseManHoursArea, calcBaseManHoursUnit, calcLaborCost } from './labor-calc'

describe('calcLoadedRate', () => {
  it('computes standard loaded rate: base * (1 + burden) + health', () => {
    expect(calcLoadedRate(38.50, 0.35, 2.50)).toBeCloseTo(54.475, 3)
  })

  it('returns base rate when burden and health are 0', () => {
    expect(calcLoadedRate(40, 0, 0)).toBe(40)
  })

  it('handles high burden percent', () => {
    expect(calcLoadedRate(50, 1.0, 5)).toBe(105)
  })
})

describe('calcPWLoadedRate', () => {
  it('computes PW loaded rate: pwBase * (1 + burden) + pwFringe (C-004)', () => {
    expect(calcPWLoadedRate(55.0, 0.35, 15.0)).toBeCloseTo(89.25, 2)
  })

  it('returns pwBase + fringe when burden is 0', () => {
    expect(calcPWLoadedRate(60, 0, 10)).toBe(70)
  })
})

describe('calcBaseManHoursArea', () => {
  it('computes man-hours: sqft / sfPerManHour (C-021)', () => {
    expect(calcBaseManHoursArea(32, 6.0)).toBeCloseTo(5.3333, 4)
  })

  it('scales with larger area', () => {
    expect(calcBaseManHoursArea(64, 6.0)).toBeCloseTo(10.6667, 4)
  })

  it('returns 0 when sfPerManHour is 0 (C-043 div-by-zero guard)', () => {
    expect(calcBaseManHoursArea(32, 0)).toBe(0)
  })

  it('returns 0 when sfPerManHour is negative (C-043)', () => {
    expect(calcBaseManHoursArea(32, -5)).toBe(0)
  })

  it('returns 0 when sqft is 0', () => {
    expect(calcBaseManHoursArea(0, 6.0)).toBe(0)
  })
})

describe('calcBaseManHoursUnit', () => {
  it('computes man-hours: hoursPerUnit * quantity (C-022)', () => {
    expect(calcBaseManHoursUnit(8.0, 1)).toBe(8.0)
  })

  it('scales with quantity', () => {
    expect(calcBaseManHoursUnit(8.0, 3)).toBe(24.0)
  })

  it('returns 0 for zero quantity', () => {
    expect(calcBaseManHoursUnit(8.0, 0)).toBe(0)
  })

  it('returns 0 for zero hoursPerUnit', () => {
    expect(calcBaseManHoursUnit(0, 5)).toBe(0)
  })
})

describe('calcLaborCost', () => {
  it('computes labor cost: manHours * loadedRate (C-026)', () => {
    expect(calcLaborCost(5.3333, 54.475)).toBeCloseTo(290.53, 1)
  })

  it('returns 0 for zero man-hours', () => {
    expect(calcLaborCost(0, 54.475)).toBe(0)
  })

  it('rounds to 2 decimals (C-042)', () => {
    expect(calcLaborCost(1.0, 33.333)).toBe(33.33)
  })

  it('computes PW labor cost correctly', () => {
    expect(calcLaborCost(5.3333, 89.25)).toBeCloseTo(476.00, 0)
  })
})
