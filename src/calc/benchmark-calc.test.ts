import { calcBenchmark } from './benchmark-calc'
import type { SystemType } from '@/types'

describe('calcBenchmark', () => {
  // Curtain Wall: benchmarkLow=45, benchmarkHigh=75
  const curtainWall: SystemType = {
    id: 'sys-001',
    name: 'Curtain Wall',
    benchmarkLow: 45,
    benchmarkHigh: 75,
  }

  it('returns green when $/SF <= benchmarkLow', () => {
    // 1000 / 32 = 31.25 $/SF (below 45)
    expect(calcBenchmark(1000, 32, curtainWall)).toBe('green')
  })

  it('returns green at exactly benchmarkLow', () => {
    // 45 * 32 = 1440 -> 1440/32 = 45.00
    expect(calcBenchmark(1440, 32, curtainWall)).toBe('green')
  })

  it('returns amber when $/SF is between low and high', () => {
    // 2000 / 32 = 62.50 $/SF (between 45 and 75)
    expect(calcBenchmark(2000, 32, curtainWall)).toBe('amber')
  })

  it('returns amber at exactly benchmarkHigh', () => {
    // 75 * 32 = 2400 -> 2400/32 = 75.00
    expect(calcBenchmark(2400, 32, curtainWall)).toBe('amber')
  })

  it('returns red when $/SF > benchmarkHigh', () => {
    // 3000 / 32 = 93.75 $/SF (above 75)
    expect(calcBenchmark(3000, 32, curtainWall)).toBe('red')
  })

  it('returns amber when sqft is 0 (division guard)', () => {
    expect(calcBenchmark(1000, 0, curtainWall)).toBe('amber')
  })

  it('returns amber when sqft is negative', () => {
    expect(calcBenchmark(1000, -1, curtainWall)).toBe('amber')
  })

  it('returns amber when systemType is undefined', () => {
    expect(calcBenchmark(1000, 32, undefined)).toBe('amber')
  })
})
