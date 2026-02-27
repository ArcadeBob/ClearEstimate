import { calcWinRate } from './win-rate-calc'
import type { Project } from '@/types'

// Minimal project factory — only `status` matters for win rate
function proj(status: Project['status']): Project {
  return { status } as Project
}

describe('calcWinRate', () => {
  it('returns correct ratio: Awarded / (Awarded + Lost)', () => {
    const projects = [proj('Awarded'), proj('Awarded'), proj('Lost'), proj('Bidding')]
    expect(calcWinRate(projects)).toBeCloseTo(0.6667, 3)
  })

  it('returns null for empty array', () => {
    expect(calcWinRate([])).toBeNull()
  })

  it('returns null when no decided projects', () => {
    expect(calcWinRate([proj('Bidding'), proj('In Progress')])).toBeNull()
  })

  it('returns 1.0 when all are Awarded', () => {
    expect(calcWinRate([proj('Awarded'), proj('Awarded')])).toBe(1)
  })

  it('returns 0.0 when all are Lost', () => {
    expect(calcWinRate([proj('Lost'), proj('Lost')])).toBe(0)
  })

  it('ignores Completed status', () => {
    expect(calcWinRate([proj('Awarded'), proj('Completed')])).toBe(1)
  })

  it('handles single Awarded project', () => {
    expect(calcWinRate([proj('Awarded')])).toBe(1)
  })

  it('handles single Lost project', () => {
    expect(calcWinRate([proj('Lost')])).toBe(0)
  })
})
