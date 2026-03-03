import { useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { LineItem } from '@/types'
import { useAppStore } from './use-app-store'
import { calcFullLineItem } from '@/calc'

export interface LineItemValidation {
  isValid: boolean
  errors: string[]
}

/** Input validation at hook layer (C-013) */
export function validateLineItem(li: LineItem): LineItemValidation {
  const errors: string[] = []
  if (!li.systemTypeId) errors.push('System type required')
  if (!li.glassTypeId) errors.push('Glass type required')
  if (!li.frameSystemId) errors.push('Frame system required')
  if (li.quantity < 1) errors.push('Quantity must be at least 1')
  if (li.widthInches <= 0) errors.push('Width must be positive')
  if (li.heightInches <= 0) errors.push('Height must be positive')
  return { isValid: errors.length === 0, errors }
}

export function useLineItems(projectId: string) {
  const { state, setState } = useAppStore()

  const project = state.projects.find(p => p.id === projectId)
  const lineItems = project?.lineItems ?? []

  const addLineItem = useCallback(() => {
    const newItem: LineItem = {
      id: uuidv4(),
      systemTypeId: '',
      glassTypeId: '',
      frameSystemId: '',
      description: '',
      quantity: 1,
      widthInches: 0,
      heightInches: 0,
      sqft: 0,
      perimeter: 0,
      materialCost: 0,
      laborCost: 0,
      equipmentCost: 0,
      doorHardwareCost: 0,
      lineTotal: 0,
      conditionIds: [],
      crewDays: 0,
      manHours: 0,
      equipmentIds: [],
      hardwareIds: [],
      doorHardware: [],
    }
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === projectId
          ? {
              ...p,
              lineItems: [...p.lineItems, newItem],
              timestamps: { ...p.timestamps, updatedAt: new Date().toISOString() },
            }
          : p,
      ),
    }))
    return newItem.id
  }, [projectId, setState])

  const updateLineItem = useCallback(
    (itemId: string, updates: Partial<LineItem>) => {
      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => {
          if (p.id !== projectId) return p

          const newLineItems = p.lineItems.map(li => {
            if (li.id !== itemId) return li
            const merged = { ...li, ...updates }
            if (validateLineItem(merged).isValid) {
              return calcFullLineItem(merged, prev.settings, p.prevailingWage, p.pwBaseRate, p.pwFringeRate)
            }
            return merged
          })

          // Auto-update VE alternate originalCost (C-015)
          const newVeAlternates = p.veAlternates.map(ve => {
            const linkedItem = newLineItems.find(li => li.id === ve.lineItemId)
            if (!linkedItem) return ve
            const originalCost = linkedItem.lineTotal
            return { ...ve, originalCost, savings: originalCost - ve.alternateCost }
          })

          return {
            ...p,
            lineItems: newLineItems,
            veAlternates: newVeAlternates,
            timestamps: { ...p.timestamps, updatedAt: new Date().toISOString() },
          }
        }),
      }))
    },
    [projectId, setState],
  )

  const deleteLineItem = useCallback(
    (itemId: string) => {
      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => {
          if (p.id !== projectId) return p
          return {
            ...p,
            lineItems: p.lineItems.filter(li => li.id !== itemId),
            // Cascade delete VE alternates referencing this line item
            veAlternates: p.veAlternates.filter(ve => ve.lineItemId !== itemId),
            timestamps: { ...p.timestamps, updatedAt: new Date().toISOString() },
          }
        }),
      }))
    },
    [projectId, setState],
  )

  const duplicateLineItem = useCallback(
    (itemId: string) => {
      const item = lineItems.find(li => li.id === itemId)
      if (!item) return null
      const newItem: LineItem = { ...item, id: uuidv4() }
      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p =>
          p.id === projectId
            ? {
                ...p,
                lineItems: [...p.lineItems, newItem],
                timestamps: { ...p.timestamps, updatedAt: new Date().toISOString() },
              }
            : p,
        ),
      }))
      return newItem.id
    },
    [lineItems, projectId, setState],
  )

  /** Recalculate all valid line items + cascade to VE alternates */
  const recalculateAll = useCallback(() => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(p => {
        if (p.id !== projectId) return p
        const newLineItems = p.lineItems.map(li => {
          if (!validateLineItem(li).isValid) return li
          return calcFullLineItem(li, prev.settings, p.prevailingWage, p.pwBaseRate, p.pwFringeRate)
        })
        const newVeAlternates = p.veAlternates.map(ve => {
          const linkedItem = newLineItems.find(li => li.id === ve.lineItemId)
          if (!linkedItem) return ve
          return { ...ve, originalCost: linkedItem.lineTotal, savings: linkedItem.lineTotal - ve.alternateCost }
        })
        return {
          ...p,
          lineItems: newLineItems,
          veAlternates: newVeAlternates,
          timestamps: { ...p.timestamps, updatedAt: new Date().toISOString() },
        }
      }),
    }))
  }, [projectId, setState])

  return { lineItems, addLineItem, updateLineItem, deleteLineItem, duplicateLineItem, recalculateAll }
}
