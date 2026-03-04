import { useCallback } from 'react'
import type { DoorHardwareEntry, Hardware } from '@/types'
import { useAppStore } from './use-app-store'
import { calcFullLineItem } from '@/calc'
import { validateLineItem } from './use-line-items'
import { cascadeVEAlternates, touchTimestamp } from './project-helpers'

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

interface UseDoorHardwareResult {
  doorHardware: DoorHardwareEntry[]
  addDoorHardware: (hardwareId: string, quantity?: number) => void
  removeDoorHardware: (hardwareId: string) => void
  updateDoorHardwareQty: (hardwareId: string, quantity: number) => void
}

export function useDoorHardware(projectId: string, lineItemId: string): UseDoorHardwareResult {
  const { state, setState } = useAppStore()

  const project = state.projects.find(p => p.id === projectId)
  const lineItem = project?.lineItems.find(li => li.id === lineItemId)
  const doorHardware = lineItem?.doorHardware ?? []

  /** Shared helper: apply door hardware change, recalc, VE cascade, timestamp */
  const applyMutation = useCallback(
    (mutate: (li: typeof lineItem, catalog: Hardware[]) => DoorHardwareEntry[] | null) => {
      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => {
          if (p.id !== projectId) return p

          const li = p.lineItems.find(item => item.id === lineItemId)
          if (!li) return p

          const newDoorHardware = mutate(li, prev.settings.doorHardware)
          if (newDoorHardware === null) return p // no-op

          const updated = { ...li, doorHardware: newDoorHardware }

          const newLineItems = p.lineItems.map(item => {
            if (item.id !== lineItemId) return item
            if (validateLineItem(updated).isValid) {
              return calcFullLineItem(updated, prev.settings, p.prevailingWage, p.pwBaseRate, p.pwFringeRate)
            }
            return updated
          })

          return {
            ...p,
            lineItems: newLineItems,
            veAlternates: cascadeVEAlternates(p.veAlternates, newLineItems),
            timestamps: touchTimestamp(p.timestamps),
          }
        }),
      }))
    },
    [projectId, lineItemId, setState],
  )

  const addDoorHardware = useCallback(
    (hardwareId: string, quantity: number = 1) => {
      applyMutation((li, catalog) => {
        if (!li) return null
        return applyAddDoorHardware(li.doorHardware, hardwareId, quantity, catalog)
      })
    },
    [applyMutation],
  )

  const removeDoorHardware = useCallback(
    (hardwareId: string) => {
      applyMutation(li => {
        if (!li) return null
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
