import { useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { AppState, HardwareSetTemplate, DoorHardwareEntry } from '@/types'
import { useAppStore } from './use-app-store'

// ── Pure mutation functions (exported for testing) ──────────────

/**
 * Creates a new template with the given name. Validates non-empty and unique (case-insensitive).
 * Returns { templates, newId } on success, null on validation failure.
 */
export function applyAddTemplate(
  templates: HardwareSetTemplate[],
  name: string,
): { templates: HardwareSetTemplate[]; newId: string } | null {
  const trimmed = name.trim()
  if (!trimmed) return null

  const lowerName = trimmed.toLowerCase()
  if (templates.some(t => t.name.toLowerCase() === lowerName)) return null

  const newId = uuidv4()
  const newTemplate: HardwareSetTemplate = {
    id: newId,
    name: trimmed,
    items: [],
  }
  return { templates: [...templates, newTemplate], newId }
}

/**
 * Renames a template. Validates non-empty and unique (case-insensitive, excluding self).
 * Returns updated array on success, null on validation failure or missing id.
 */
export function applyRenameTemplate(
  templates: HardwareSetTemplate[],
  id: string,
  newName: string,
): HardwareSetTemplate[] | null {
  const trimmed = newName.trim()
  if (!trimmed) return null

  const target = templates.find(t => t.id === id)
  if (!target) return null

  const lowerName = trimmed.toLowerCase()
  if (templates.some(t => t.id !== id && t.name.toLowerCase() === lowerName)) return null

  return templates.map(t => (t.id === id ? { ...t, name: trimmed } : t))
}

/**
 * Removes a template by id. Returns the filtered array.
 */
export function applyDeleteTemplate(
  templates: HardwareSetTemplate[],
  id: string,
): HardwareSetTemplate[] {
  return templates.filter(t => t.id !== id)
}

/**
 * Toggles a hardware item in a template. Adds with qty 1 if not present, removes if present.
 * Returns null if template not found.
 */
export function applyToggleTemplateItem(
  templates: HardwareSetTemplate[],
  templateId: string,
  hardwareId: string,
): HardwareSetTemplate[] | null {
  const target = templates.find(t => t.id === templateId)
  if (!target) return null

  const exists = target.items.some(i => i.hardwareId === hardwareId)
  const newItems: DoorHardwareEntry[] = exists
    ? target.items.filter(i => i.hardwareId !== hardwareId)
    : [...target.items, { hardwareId, quantity: 1 }]

  return templates.map(t => (t.id === templateId ? { ...t, items: newItems } : t))
}

/**
 * Updates quantity for a hardware item in a template.
 * Enforces min 1, rounds to integer.
 * Returns null if template or hardware item not found.
 */
export function applyUpdateTemplateItemQuantity(
  templates: HardwareSetTemplate[],
  templateId: string,
  hardwareId: string,
  quantity: number,
): HardwareSetTemplate[] | null {
  const target = templates.find(t => t.id === templateId)
  if (!target) return null

  if (!target.items.some(i => i.hardwareId === hardwareId)) return null

  const safeQty = Math.max(1, Math.round(quantity))
  const newItems = target.items.map(i =>
    i.hardwareId === hardwareId ? { ...i, quantity: safeQty } : i,
  )

  return templates.map(t => (t.id === templateId ? { ...t, items: newItems } : t))
}

// ── Hook ────────────────────────────────────────────────────────

/** Returns new AppState with hardwareTemplates replaced, or prev if templates is null. */
function withTemplates(prev: AppState, templates: HardwareSetTemplate[] | null): AppState {
  if (!templates) return prev
  return { ...prev, settings: { ...prev.settings, hardwareTemplates: templates } }
}

export function useHardwareTemplates() {
  const { state, setState } = useAppStore()

  const templates = state.settings.hardwareTemplates

  const addTemplate = useCallback(
    (name: string): string | null => {
      let newId: string | null = null
      setState(prev => {
        const result = applyAddTemplate(prev.settings.hardwareTemplates, name)
        if (!result) return prev
        newId = result.newId
        return withTemplates(prev, result.templates)
      })
      return newId
    },
    [setState],
  )

  const renameTemplate = useCallback(
    (id: string, newName: string): boolean => {
      let success = false
      setState(prev => {
        const result = applyRenameTemplate(prev.settings.hardwareTemplates, id, newName)
        if (!result) return prev
        success = true
        return withTemplates(prev, result)
      })
      return success
    },
    [setState],
  )

  const deleteTemplate = useCallback(
    (id: string): void => {
      setState(prev =>
        withTemplates(prev, applyDeleteTemplate(prev.settings.hardwareTemplates, id)),
      )
    },
    [setState],
  )

  const toggleTemplateItem = useCallback(
    (templateId: string, hardwareId: string): void => {
      setState(prev =>
        withTemplates(prev, applyToggleTemplateItem(prev.settings.hardwareTemplates, templateId, hardwareId)),
      )
    },
    [setState],
  )

  const updateTemplateItemQuantity = useCallback(
    (templateId: string, hardwareId: string, quantity: number): void => {
      setState(prev =>
        withTemplates(prev, applyUpdateTemplateItemQuantity(
          prev.settings.hardwareTemplates, templateId, hardwareId, quantity,
        )),
      )
    },
    [setState],
  )

  return {
    templates,
    addTemplate,
    renameTemplate,
    deleteTemplate,
    toggleTemplateItem,
    updateTemplateItemQuantity,
  }
}
