/**
 * O&P tier suggestion based on subtotal brackets.
 * <$100K → 10%/10%, <$500K → 8%/8%, ≥$500K → 5%/5%
 */
export function suggestOPPercents(subtotal: number): { overhead: number; profit: number } {
  if (subtotal < 100_000) return { overhead: 10, profit: 10 }
  if (subtotal < 500_000) return { overhead: 8, profit: 8 }
  return { overhead: 5, profit: 5 }
}
