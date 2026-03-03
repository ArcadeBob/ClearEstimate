export { calcSqft, calcPerimeter, calcMaterialCost } from './material-calc'
export { calcLoadedRate, calcPWLoadedRate, calcBaseManHoursArea, calcBaseManHoursUnit, calcLaborCost } from './labor-calc'
export { calcEquipmentCost, shouldSuggestEquipment } from './equipment-calc'
export { calcFullLineItem } from './line-total-calc'
export { suggestOPPercents } from './op-suggest'
export { calcBenchmark } from './benchmark-calc'
export { calcWinRate } from './win-rate-calc'
export {
  calcRunningTotals,
  calcScheduleOfValues,
  calcPieData,
  generateScopeDescription,
} from './summary-calc'
export { isDoorSystemType, DOOR_SYSTEM_IDS } from './door-system-util'

/**
 * Shared currency formatter: $1,234.56 — C-017
 */
export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}
