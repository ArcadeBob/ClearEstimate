import { useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type {
  AppSettings,
  GlassType,
  FrameSystem,
  LaborRate,
  Condition,
  Hardware,
  Equipment,
  SystemType,
} from '@/types'
import { useAppStore } from './use-app-store'
import { calcLoadedRate } from '@/calc'

type SettingsTableName = keyof AppSettings
type SettingsItem = GlassType | FrameSystem | LaborRate | Condition | Hardware | Equipment | SystemType

export function useSettings() {
  const { state, setState } = useAppStore()
  const settings = state.settings

  /** Check if an item is used by any line item (C-008) */
  const getUsageCount = useCallback(
    (tableName: SettingsTableName, itemId: string): number => {
      let count = 0
      for (const project of state.projects) {
        for (const li of project.lineItems) {
          switch (tableName) {
            case 'glassTypes':
              if (li.glassTypeId === itemId) count++
              break
            case 'frameSystems':
              if (li.frameSystemId === itemId) count++
              break
            case 'systemTypes':
              if (li.systemTypeId === itemId) count++
              break
            case 'conditions':
              if (li.conditionIds.includes(itemId)) count++
              break
            case 'hardware':
              if (li.hardwareIds.includes(itemId)) count++
              break
            case 'doorHardware':
              if (li.doorHardware.some(entry => entry.hardwareId === itemId)) count++
              break
            case 'equipment':
              if (li.equipmentIds.includes(itemId)) count++
              break
            case 'laborRates':
              break // labor rates are not per-line-item in Phase 1
          }
        }
      }
      return count
    },
    [state.projects],
  )

  const addItem = useCallback(
    <T extends SettingsItem>(tableName: SettingsTableName, item: Omit<T, 'id'>) => {
      const newItem = { ...item, id: uuidv4() } as T
      setState(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [tableName]: [...(prev.settings[tableName] as T[]), newItem],
        },
      }))
      return newItem.id
    },
    [setState],
  )

  const updateItem = useCallback(
    <T extends SettingsItem>(tableName: SettingsTableName, itemId: string, updates: Partial<T>) => {
      setState(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [tableName]: (prev.settings[tableName] as T[]).map(item =>
            item.id === itemId ? { ...item, ...updates } : item,
          ),
        },
      }))
    },
    [setState],
  )

  /** Delete with referential integrity check (C-008-INV) */
  const deleteItem = useCallback(
    (tableName: SettingsTableName, itemId: string): { success: boolean; error?: string } => {
      const usageCount = getUsageCount(tableName, itemId)
      if (usageCount > 0) {
        return { success: false, error: `Used by ${usageCount} line item${usageCount > 1 ? 's' : ''}` }
      }
      setState(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [tableName]: (prev.settings[tableName] as SettingsItem[]).filter(item => item.id !== itemId),
        },
      }))
      return { success: true }
    },
    [getUsageCount, setState],
  )

  /** Auto-recalculate loaded rate on labor field change */
  const updateLaborRate = useCallback(
    (itemId: string, updates: Partial<LaborRate>) => {
      setState(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          laborRates: prev.settings.laborRates.map(lr => {
            if (lr.id !== itemId) return lr
            const merged = { ...lr, ...updates }
            return {
              ...merged,
              loadedRate: Math.round(
                calcLoadedRate(merged.baseRate, merged.burdenPercent, merged.healthHourly) * 100,
              ) / 100,
            }
          }),
        },
      }))
    },
    [setState],
  )

  return { settings, addItem, updateItem, deleteItem, updateLaborRate, getUsageCount }
}
