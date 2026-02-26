import { calcSqft, calcPerimeter, calcMaterialCost } from './material-calc'
import type { Hardware } from '@/types'

describe('calcSqft', () => {
  it('computes sqft for 48x96 qty 1', () => {
    expect(calcSqft(48, 96, 1)).toBe(32)
  })

  it('scales by quantity', () => {
    expect(calcSqft(48, 96, 2)).toBe(64)
  })

  it('returns 0 for zero quantity', () => {
    expect(calcSqft(48, 96, 0)).toBe(0)
  })

  it('returns 0 for zero dimensions', () => {
    expect(calcSqft(0, 0, 1)).toBe(0)
  })

  it('handles non-standard dimensions', () => {
    // 36x60 qty 1 = (36*60)/144 = 15.0
    expect(calcSqft(36, 60, 1)).toBe(15)
  })
})

describe('calcPerimeter', () => {
  it('computes perimeter for 48x96 qty 1', () => {
    expect(calcPerimeter(48, 96, 1)).toBe(24)
  })

  it('scales by quantity', () => {
    expect(calcPerimeter(48, 96, 2)).toBe(48)
  })

  it('returns 0 for zero quantity', () => {
    expect(calcPerimeter(48, 96, 0)).toBe(0)
  })

  it('returns 0 for zero dimensions', () => {
    expect(calcPerimeter(0, 0, 1)).toBe(0)
  })
})

describe('calcMaterialCost', () => {
  it('computes glass + frame cost without hardware', () => {
    // sqft=32, perim=24, glass=$15/SF, frame=$9.85/LF
    // 32*15 + 24*9.85 = 480 + 236.40 = 716.40
    expect(calcMaterialCost(32, 24, 15.0, 9.85, [], 1)).toBe(716.4)
  })

  it('includes hardware cost multiplied by quantity (C-002)', () => {
    const hw: Hardware[] = [
      { id: 'hw-1', name: 'Setting Blocks', unitCost: 2.50 },
      { id: 'hw-2', name: 'Silicone', unitCost: 8.00 },
    ]
    // glass=960, frame=472.80, hw=(2.50+8.00)*2=21.00
    // total = 960 + 472.80 + 21.00 = 1453.80
    expect(calcMaterialCost(64, 48, 15.0, 9.85, hw, 2)).toBe(1453.8)
  })

  it('returns 0 with zero sqft and perimeter', () => {
    expect(calcMaterialCost(0, 0, 15.0, 9.85, [], 1)).toBe(0)
  })

  it('rounds to 2 decimal places (C-017)', () => {
    // 10 * 3.33 + 5 * 7.77 = 33.30 + 38.85 = 72.15
    expect(calcMaterialCost(10, 5, 3.33, 7.77, [], 1)).toBe(72.15)
  })

  it('handles fractional cost that needs rounding', () => {
    // 1 * 1.111 + 1 * 2.222 = 3.333 -> rounds to 3.33
    expect(calcMaterialCost(1, 1, 1.111, 2.222, [], 1)).toBe(3.33)
  })
})
