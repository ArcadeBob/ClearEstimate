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
 * Area-based labor: baseManHours = sqft / sfPerManHour — C-021
 * Division-by-zero guard: returns 0 if sfPerManHour <= 0 — C-043
 */
export function calcBaseManHoursArea(sqft: number, sfPerManHour: number): number {
  if (sfPerManHour <= 0) return 0
  return sqft / sfPerManHour
}

/**
 * Unit-based labor: baseManHours = hoursPerUnit × quantity — C-022
 */
export function calcBaseManHoursUnit(hoursPerUnit: number, quantity: number): number {
  return hoursPerUnit * quantity
}

/**
 * Labor cost from man-hours: round2(manHours × loadedRate) — C-026
 */
export function calcLaborCost(manHours: number, loadedRate: number): number {
  return Math.round(manHours * loadedRate * 100) / 100
}
