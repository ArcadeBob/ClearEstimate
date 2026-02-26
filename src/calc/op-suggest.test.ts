import { suggestOPPercents } from './op-suggest'

describe('suggestOPPercents', () => {
  it('returns 10%/10% for subtotal < $100K', () => {
    expect(suggestOPPercents(50_000)).toEqual({ overhead: 10, profit: 10 })
  })

  it('returns 10%/10% for $0', () => {
    expect(suggestOPPercents(0)).toEqual({ overhead: 10, profit: 10 })
  })

  it('returns 10%/10% at $99,999.99', () => {
    expect(suggestOPPercents(99_999.99)).toEqual({ overhead: 10, profit: 10 })
  })

  it('returns 8%/8% at exactly $100K', () => {
    expect(suggestOPPercents(100_000)).toEqual({ overhead: 8, profit: 8 })
  })

  it('returns 8%/8% for subtotal $100K-$500K', () => {
    expect(suggestOPPercents(250_000)).toEqual({ overhead: 8, profit: 8 })
  })

  it('returns 8%/8% at $499,999.99', () => {
    expect(suggestOPPercents(499_999.99)).toEqual({ overhead: 8, profit: 8 })
  })

  it('returns 5%/5% at exactly $500K', () => {
    expect(suggestOPPercents(500_000)).toEqual({ overhead: 5, profit: 5 })
  })

  it('returns 5%/5% for subtotal >= $500K', () => {
    expect(suggestOPPercents(1_000_000)).toEqual({ overhead: 5, profit: 5 })
  })

  it('returns 10%/10% for negative subtotal', () => {
    expect(suggestOPPercents(-50_000)).toEqual({ overhead: 10, profit: 10 })
  })
})
