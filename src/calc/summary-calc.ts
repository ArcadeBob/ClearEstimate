import type { Project, RunningTotals, SOVGroup, PieSegment, AppSettings } from '@/types'

/**
 * Running totals with multiplicative O&P:
 * contractValue = adjustedSubtotal × (1 + OH%) × (1 + profit%)
 */
export function calcRunningTotals(project: Project): RunningTotals {
  const validItems = project.lineItems.filter(li => li.lineTotal > 0)

  const materialTotal = validItems.reduce((sum, li) => sum + li.materialCost, 0)
  const laborTotal = validItems.reduce((sum, li) => sum + li.laborCost, 0)
  const equipmentTotal = validItems.reduce((sum, li) => sum + li.equipmentCost, 0)
  const subtotal = materialTotal + laborTotal + equipmentTotal

  const veSavings = project.veAlternates.reduce((sum, ve) => sum + ve.savings, 0)
  const adjustedSubtotal = subtotal - veSavings

  // Multiplicative: profit applied AFTER overhead
  const overheadAmount = adjustedSubtotal * (project.overheadPercent / 100)
  const afterOverhead = adjustedSubtotal + overheadAmount
  const profitAmount = afterOverhead * (project.profitPercent / 100)
  const contractValue = afterOverhead + profitAmount

  return {
    materialTotal: round2(materialTotal),
    laborTotal: round2(laborTotal),
    equipmentTotal: round2(equipmentTotal),
    subtotal: round2(subtotal),
    veSavings: round2(veSavings),
    adjustedSubtotal: round2(adjustedSubtotal),
    overheadAmount: round2(overheadAmount),
    profitAmount: round2(profitAmount),
    contractValue: round2(contractValue),
  }
}

/**
 * SOV groups by system type. Per-row contract value uses same
 * multiplicative formula (C-011). Penny discrepancy accepted (C-018).
 */
export function calcScheduleOfValues(project: Project, settings: AppSettings): SOVGroup[] {
  const groups = new Map<string, SOVGroup>()
  const validItems = project.lineItems.filter(li => li.lineTotal > 0)

  for (const li of validItems) {
    const systemType = settings.systemTypes.find(s => s.id === li.systemTypeId)
    const existing = groups.get(li.systemTypeId)

    if (existing) {
      existing.lineItemCount += 1
      existing.totalSqft += li.sqft
      existing.directCost += li.lineTotal
    } else {
      groups.set(li.systemTypeId, {
        systemTypeId: li.systemTypeId,
        systemTypeName: systemType?.name ?? 'Unknown',
        lineItemCount: 1,
        totalSqft: li.sqft,
        directCost: li.lineTotal,
        contractValue: 0,
      })
    }
  }

  const ohMult = 1 + project.overheadPercent / 100
  const profitMult = 1 + project.profitPercent / 100

  for (const group of groups.values()) {
    group.directCost = round2(group.directCost)
    group.totalSqft = round2(group.totalSqft)
    group.contractValue = round2(group.directCost * ohMult * profitMult)
  }

  return Array.from(groups.values())
}

export function calcPieData(totals: RunningTotals): PieSegment[] {
  return [
    { name: 'Materials', value: totals.materialTotal, color: '#3b82f6' },
    { name: 'Labor', value: totals.laborTotal, color: '#10b981' },
    { name: 'Equipment', value: totals.equipmentTotal, color: '#f59e0b' },
    { name: 'Overhead', value: totals.overheadAmount, color: '#8b5cf6' },
    { name: 'Profit', value: totals.profitAmount, color: '#ef4444' },
  ].filter(s => s.value > 0)
}

/**
 * Generate scope description for a system type group (C-006).
 * Uses most common glass/frame per group (Decision #6 from review).
 */
export function generateScopeDescription(
  systemTypeId: string,
  project: Project,
  settings: AppSettings,
): string {
  const systemType = settings.systemTypes.find(s => s.id === systemTypeId)
  if (!systemType) return ''

  const items = project.lineItems.filter(li => li.systemTypeId === systemTypeId && li.lineTotal > 0)
  if (items.length === 0) return ''

  const count = items.reduce((sum, li) => sum + li.quantity, 0)
  const totalSqft = round2(items.reduce((sum, li) => sum + li.sqft, 0))

  // Most common glass type (ties broken alphabetically by ID)
  const glassFreq = new Map<string, number>()
  for (const li of items) {
    glassFreq.set(li.glassTypeId, (glassFreq.get(li.glassTypeId) ?? 0) + 1)
  }
  const topGlassId = [...glassFreq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0]
  const glassName = settings.glassTypes.find(g => g.id === topGlassId)?.name ?? 'glass'

  // Most common frame system
  const frameFreq = new Map<string, number>()
  for (const li of items) {
    frameFreq.set(li.frameSystemId, (frameFreq.get(li.frameSystemId) ?? 0) + 1)
  }
  const topFrameId = [...frameFreq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0]
  const frameName = settings.frameSystems.find(f => f.id === topFrameId)?.name ?? 'frames'

  return `Furnish and install ${systemType.name} system — ${count} units, ${totalSqft} SF total. ${glassName} glass in ${frameName} frames.`
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
