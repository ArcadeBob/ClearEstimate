import { useCallback, useMemo } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Project, LineItem, VEAlternate } from '@/types'
import { useAppStore } from './use-app-store'

export function useProjects() {
  const { state, setState } = useAppStore()

  const createProject = useCallback((overrides?: Partial<Project>) => {
    const now = new Date().toISOString()
    const project: Project = {
      id: uuidv4(),
      name: 'New Project',
      clientName: '',
      bidDate: new Date().toISOString().split('T')[0]!,
      status: 'Bidding',
      address: '',
      projectManager: '',
      estimator: '',
      prevailingWage: false,
      overheadPercent: 10,
      profitPercent: 10,
      lineItems: [],
      veAlternates: [],
      scopeDescriptions: [],
      timestamps: { createdAt: now, updatedAt: now },
      ...overrides,
    }
    setState(prev => ({ ...prev, projects: [...prev.projects, project] }))
    return project.id
  }, [setState])

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === id
          ? { ...p, ...updates, timestamps: { ...p.timestamps, updatedAt: new Date().toISOString() } }
          : p,
      ),
    }))
  }, [setState])

  const deleteProject = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== id),
    }))
  }, [setState])

  /**
   * Deep clone with ID remapping (C-019).
   * - New UUIDs for all line items
   * - VEAlternate.lineItemId remapped via oldId→newId map
   * - Orphaned VE alternates dropped
   */
  const duplicateProject = useCallback((id: string) => {
    const original = state.projects.find(p => p.id === id)
    if (!original) return null

    const now = new Date().toISOString()
    const idMap = new Map<string, string>()

    const newLineItems: LineItem[] = original.lineItems.map(li => {
      const newId = uuidv4()
      idMap.set(li.id, newId)
      return { ...li, id: newId }
    })

    const newVeAlternates: VEAlternate[] = original.veAlternates
      .filter(ve => idMap.has(ve.lineItemId))
      .map(ve => ({
        ...ve,
        id: uuidv4(),
        lineItemId: idMap.get(ve.lineItemId)!,
      }))

    const newProject: Project = {
      ...original,
      id: uuidv4(),
      name: `${original.name} (Copy)`,
      lineItems: newLineItems,
      veAlternates: newVeAlternates,
      scopeDescriptions: [...original.scopeDescriptions],
      timestamps: { createdAt: now, updatedAt: now },
    }

    setState(prev => ({ ...prev, projects: [...prev.projects, newProject] }))
    return newProject.id
  }, [state.projects, setState])

  const getProject = useCallback((id: string) => {
    return state.projects.find(p => p.id === id) ?? null
  }, [state.projects])

  // Sort by most recently updated (Decision #8)
  const sortedProjects = useMemo(() =>
    [...state.projects].sort((a, b) =>
      b.timestamps.updatedAt.localeCompare(a.timestamps.updatedAt),
    ),
  [state.projects])

  return {
    projects: sortedProjects,
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,
    getProject,
  }
}
