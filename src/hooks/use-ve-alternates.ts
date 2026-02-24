import { useCallback, useMemo } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { VEAlternate } from '@/types'
import { useAppStore } from './use-app-store'

export function useVEAlternates(projectId: string) {
  const { state, setState } = useAppStore()

  const project = state.projects.find(p => p.id === projectId)
  const veAlternates = project?.veAlternates ?? []

  const totalSavings = useMemo(
    () => veAlternates.reduce((sum, ve) => sum + ve.savings, 0),
    [veAlternates],
  )

  const addVEAlternate = useCallback(
    (lineItemId: string, description: string, alternateCost: number) => {
      const linkedItem = project?.lineItems.find(li => li.id === lineItemId)
      if (!linkedItem) return null

      const ve: VEAlternate = {
        id: uuidv4(),
        lineItemId,
        description,
        originalCost: linkedItem.lineTotal,
        alternateCost,
        savings: linkedItem.lineTotal - alternateCost,
      }

      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p =>
          p.id === projectId
            ? {
                ...p,
                veAlternates: [...p.veAlternates, ve],
                timestamps: { ...p.timestamps, updatedAt: new Date().toISOString() },
              }
            : p,
        ),
      }))
      return ve.id
    },
    [project, projectId, setState],
  )

  const updateVEAlternate = useCallback(
    (veId: string, updates: Partial<Pick<VEAlternate, 'description' | 'alternateCost'>>) => {
      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => {
          if (p.id !== projectId) return p
          return {
            ...p,
            veAlternates: p.veAlternates.map(ve => {
              if (ve.id !== veId) return ve
              const updated = { ...ve, ...updates }
              if (updates.alternateCost !== undefined) {
                updated.savings = updated.originalCost - updated.alternateCost
              }
              return updated
            }),
            timestamps: { ...p.timestamps, updatedAt: new Date().toISOString() },
          }
        }),
      }))
    },
    [projectId, setState],
  )

  const deleteVEAlternate = useCallback(
    (veId: string) => {
      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p =>
          p.id === projectId
            ? {
                ...p,
                veAlternates: p.veAlternates.filter(ve => ve.id !== veId),
                timestamps: { ...p.timestamps, updatedAt: new Date().toISOString() },
              }
            : p,
        ),
      }))
    },
    [projectId, setState],
  )

  return { veAlternates, totalSavings, addVEAlternate, updateVEAlternate, deleteVEAlternate }
}
