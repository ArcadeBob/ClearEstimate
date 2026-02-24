export { calcSqft, calcPerimeter, calcMaterialCost } from './material-calc'
export { calcLoadedRate, calcPWLoadedRate, calcCrewDays, calcLaborCost } from './labor-calc'
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
