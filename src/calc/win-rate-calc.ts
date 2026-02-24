import type { Project } from '@/types'

/**
 * Win rate = Awarded / (Awarded + Lost).
 * Returns null when denominator is 0 (no decided projects).
 */
export function calcWinRate(projects: Project[]): number | null {
  const awarded = projects.filter(p => p.status === 'Awarded').length
  const lost = projects.filter(p => p.status === 'Lost').length
  const denominator = awarded + lost
  if (denominator === 0) return null
  return awarded / denominator
}
