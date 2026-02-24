import type { AppSettings, LineItem } from '@/types'
import { calcSqft, calcPerimeter, calcMaterialCost } from './material-calc'
import { calcLoadedRate, calcPWLoadedRate, calcCrewDays, calcLaborCost } from './labor-calc'
import { calcEquipmentCost } from './equipment-calc'

/**
 * Orchestrator: recalculates all derived fields on a line item.
 * Uses primary Glazier labor rate for all line items (C-001).
 */
export function calcFullLineItem(
  lineItem: LineItem,
  settings: AppSettings,
  prevailingWage: boolean,
  pwBaseRate?: number,
  pwFringeRate?: number,
): LineItem {
  const glass = settings.glassTypes.find(g => g.id === lineItem.glassTypeId)
  const frame = settings.frameSystems.find(f => f.id === lineItem.frameSystemId)
  const glazier = settings.laborRates.find(l => l.role === 'Glazier') ?? settings.laborRates[0]

  if (!glass || !frame || !glazier) return lineItem

  const selectedHardware = settings.hardware.filter(h => lineItem.hardwareIds.includes(h.id))
  const selectedEquipment = settings.equipment.filter(e => lineItem.equipmentIds.includes(e.id))
  const selectedConditions = settings.conditions.filter(c => lineItem.conditionIds.includes(c.id))

  // Material
  const sqft = calcSqft(lineItem.widthInches, lineItem.heightInches, lineItem.quantity)
  const perimeter = calcPerimeter(lineItem.widthInches, lineItem.heightInches, lineItem.quantity)
  const materialCost = calcMaterialCost(
    sqft, perimeter, glass.costPerSqft, frame.costPerLinFt, selectedHardware, lineItem.quantity,
  )

  // Labor
  const loadedRate = prevailingWage && pwBaseRate != null && pwFringeRate != null
    ? calcPWLoadedRate(pwBaseRate, glazier.burdenPercent, pwFringeRate)
    : calcLoadedRate(glazier.baseRate, glazier.burdenPercent, glazier.healthHourly)

  const crewDays = calcCrewDays(
    frame.laborHoursPerUnit,
    lineItem.quantity,
    selectedConditions.map(c => c.adjustment),
  )
  const laborCost = calcLaborCost(crewDays, loadedRate)

  // Equipment
  const equipmentCost = calcEquipmentCost(selectedEquipment, crewDays)

  // Total
  const lineTotal = Math.round((materialCost + laborCost + equipmentCost) * 100) / 100

  return {
    ...lineItem,
    sqft: Math.round(sqft * 100) / 100,
    perimeter: Math.round(perimeter * 100) / 100,
    materialCost,
    laborCost,
    equipmentCost,
    lineTotal,
    crewDays: Math.round(crewDays * 10000) / 10000, // 4 decimals for crew days
  }
}
