import { useCallback } from 'react'
import type { DoorHardwareEntry, Hardware } from '@/types'
import { useAppStore } from './use-app-store'
import { calcFullLineItem } from '@/calc'
import { validateLineItem } from './use-line-items'

// ── Pure mutation functions (exported for testing) ──────────────

/**
 * Appends a hardware entry if not duplicate and hardwareId is in catalog.
 * Returns null if no-op (duplicate or invalid).
 */
export function applyAddDoorHardware(
  doorHardware: DoorHardwareEntry[],
  hardwareId: string,
  quantity: number,
  catalog: Hardware[],
): DoorHardwareEntry[] | null {
  if (doorHardware.some(e => e.hardwareId === hardwareId)) return null
  if (!catalog.some(h => h.id === hardwareId)) return null
  return [...doorHardware, { hardwareId, quantity }]
}

/**
 * Removes a hardware entry by hardwareId.
 * Returns the filtered array (may be unchanged if not found).
 */
export function applyRemoveDoorHardware(
  doorHardware: DoorHardwareEntry[],
  hardwareId: string,
): DoorHardwareEntry[] {
  return doorHardware.filter(e => e.hardwareId !== hardwareId)
}

/**
 * Updates quantity for a hardware entry.
 * If quantity <= 0, removes the entry.
 * Returns null if hardwareId not found (no-op).
 */
export function applyUpdateDoorHardwareQty(
  doorHardware: DoorHardwareEntry[],
  hardwareId: string,
  quantity: number,
): DoorHardwareEntry[] | null {
  if (!doorHardware.some(e => e.hardwareId === hardwareId)) return null
  if (quantity <= 0) {
    return doorHardware.filter(e => e.hardwareId !== hardwareId)
  }
  return doorHardware.map(e =>
    e.hardwareId === hardwareId ? { ...e, quantity } : e,
  )
}

// ── Hook ────────────────────────────────────────────────────────

export function useDoorHardware(projectId: string, lineItemId: string) {
  const { state, setState } = useAppStore()

  const project = state.projects.find(p => p.id === projectId)
  const lineItem = project?.lineItems.find(li => li.id === lineItemId)
  const doorHardware = lineItem?.doorHardware ?? []

  /** Shared helper: apply door hardware change, recalc, VE cascade, timestamp */
  const applyMutation = useCallback(
    (mutate: (li: typeof lineItem) => DoorHardwareEntry[] | null) => {
      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => {
          if (p.id !== projectId) return p

          const li = p.lineItems.find(item => item.id === lineItemId)
          if (!li) return p

          const newDoorHardware = mutate(li)
          if (newDoorHardware === null) return p // no-op

          const updated = { ...li, doorHardware: newDoorHardware }

          const newLineItems = p.lineItems.map(item => {
            if (item.id !== lineItemId) return item
            if (validateLineItem(updated).isValid) {
              return calcFullLineItem(updated, prev.settings, p.prevailingWage, p.pwBaseRate, p.pwFringeRate)
            }
            return updated
          })

          // Auto-update VE alternate originalCost (C-015)
          const newVeAlternates = p.veAlternates.map(ve => {
            const linkedItem = newLineItems.find(item => item.id === ve.lineItemId)
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
    [projectId, lineItemId, setState],
  )

  const addDoorHardware = useCallback(
    (hardwareId: string, quantity: number = 1) => {
      applyMutation(li => {
        if (!li) return null
        return applyAddDoorHardware(li.doorHardware, hardwareId, quantity, state.settings.doorHardware)
      })
    },
    [applyMutation, state.settings.doorHardware],
  )

  const removeDoorHardware = useCallback(
    (hardwareId: string) => {
      applyMutation(li => {
        if (!li) return null
        // Check if entry exists; if not, return null (no-op)
        if (!li.doorHardware.some(e => e.hardwareId === hardwareId)) return null
        return applyRemoveDoorHardware(li.doorHardware, hardwareId)
      })
    },
    [applyMutation],
  )

  const updateDoorHardwareQty = useCallback(
    (hardwareId: string, quantity: number) => {
      applyMutation(li => {
        if (!li) return null
        return applyUpdateDoorHardwareQty(li.doorHardware, hardwareId, quantity)
      })
    },
    [applyMutation],
  )

  return { doorHardware, addDoorHardware, removeDoorHardware, updateDoorHardwareQty }
}
