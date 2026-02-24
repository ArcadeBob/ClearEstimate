import type { Hardware } from '@/types'

export function calcSqft(widthInches: number, heightInches: number, quantity: number): number {
  return (widthInches * heightInches / 144) * quantity
}

export function calcPerimeter(widthInches: number, heightInches: number, quantity: number): number {
  return 2 * (widthInches + heightInches) / 12 * quantity
}

export function calcMaterialCost(
  sqft: number,
  perimeter: number,
  glassCostPerSqft: number,
  frameCostPerLinFt: number,
  selectedHardware: Hardware[],
  quantity: number,
): number {
  const glassCost = sqft * glassCostPerSqft
  const frameCost = perimeter * frameCostPerLinFt
  // Hardware cost = Σ(unitCost × lineItem.quantity) — C-002, C-016
  const hardwareCost = selectedHardware.reduce((sum, hw) => sum + hw.unitCost * quantity, 0)
  return Math.round((glassCost + frameCost + hardwareCost) * 100) / 100
}
