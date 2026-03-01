import type { AppSettings, LineItem } from '@/types'
import { calcSqft, calcPerimeter, calcMaterialCost } from './material-calc'
import { calcLoadedRate, calcPWLoadedRate, calcBaseManHoursArea, calcBaseManHoursUnit, calcLaborCost } from './labor-calc'
import { calcEquipmentCost } from './equipment-calc'

/**
 * Orchestrator: recalculates all derived fields on a line item.
 * Uses primary Glazier labor rate (C-001).
 * Branches on SystemType.laborMode for labor calc (C-020).
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
  const systemType = settings.systemTypes.find(s => s.id === lineItem.systemTypeId)
  const glazier = settings.laborRates.find(l => l.role === 'Glazier') ?? settings.laborRates[0]

  if (!glass || !frame || !systemType || !glazier) return lineItem

  const selectedHardware = settings.hardware.filter(h => lineItem.hardwareIds.includes(h.id))
  const selectedEquipment = settings.equipment.filter(e => lineItem.equipmentIds.includes(e.id))

  // Material
  const sqft = calcSqft(lineItem.widthInches, lineItem.heightInches, lineItem.quantity)
  const perimeter = calcPerimeter(lineItem.widthInches, lineItem.heightInches, lineItem.quantity)
  const materialCost = calcMaterialCost(
    sqft, perimeter, glass.costPerSqft, frame.costPerLinFt, selectedHardware, lineItem.quantity,
  )

  // Labor — branch on system type labor mode (C-020)
  const loadedRate = prevailingWage && pwBaseRate != null && pwFringeRate != null
    ? calcPWLoadedRate(pwBaseRate, glazier.burdenPercent, pwFringeRate)
    : calcLoadedRate(glazier.baseRate, glazier.burdenPercent, glazier.healthHourly)

  const manHours = systemType.laborMode === 'area'
    ? calcBaseManHoursArea(sqft, systemType.sfPerManHour ?? 0)
    : calcBaseManHoursUnit(systemType.hoursPerUnit ?? 0, lineItem.quantity)

  const crewDays = manHours / 8 // C-027
  const laborCost = calcLaborCost(manHours, loadedRate)

  // Equipment
  const equipmentCost = calcEquipmentCost(selectedEquipment, crewDays)

  // Total (C-033)
  const lineTotal = Math.round((materialCost + laborCost + equipmentCost) * 100) / 100

  return {
    ...lineItem,
    sqft: Math.round(sqft * 100) / 100,
    perimeter: Math.round(perimeter * 100) / 100,
    materialCost,
    laborCost,
    equipmentCost,
    lineTotal,
    manHours: Math.round(manHours * 10000) / 10000,
    crewDays: Math.round(crewDays * 10000) / 10000,
  }
}
