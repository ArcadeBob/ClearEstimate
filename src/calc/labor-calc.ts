/**
 * Standard loaded rate: base × (1 + burden) + health — C-001
 */
export function calcLoadedRate(baseRate: number, burdenPercent: number, healthHourly: number): number {
  return baseRate * (1 + burdenPercent) + healthHourly
}

/**
 * Prevailing wage loaded rate: pwBase × (1 + burden) + pwFringe — C-004
 */
export function calcPWLoadedRate(pwBaseRate: number, burdenPercent: number, pwFringeRate: number): number {
  return pwBaseRate * (1 + burdenPercent) + pwFringeRate
}

/**
 * Crew days with condition adjustments (I-003).
 * condition.adjustment is in crew-day units added to total (not per-unit).
 * Result clamped to min 0.
 */
export function calcCrewDays(
  laborHoursPerUnit: number,
  quantity: number,
  conditionAdjustments: number[],
): number {
  const baseDays = laborHoursPerUnit * quantity / 8
  const totalAdjustment = conditionAdjustments.reduce((sum, adj) => sum + adj, 0)
  return Math.max(0, baseDays + totalAdjustment)
}

export function calcLaborCost(crewDays: number, loadedRate: number): number {
  return Math.round(crewDays * 8 * loadedRate * 100) / 100
}
