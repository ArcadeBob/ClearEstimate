import { formatCurrency } from './index'

describe('formatCurrency (C-017)', () => {
  it('formats positive dollar amount', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('formats negative amount', () => {
    expect(formatCurrency(-500)).toBe('-$500.00')
  })

  it('rounds to 2 decimal places', () => {
    expect(formatCurrency(99.999)).toBe('$100.00')
  })

  it('adds trailing zeros', () => {
    expect(formatCurrency(42)).toBe('$42.00')
  })

  it('handles large numbers with commas', () => {
    expect(formatCurrency(1234567.89)).toBe('$1,234,567.89')
  })
})
