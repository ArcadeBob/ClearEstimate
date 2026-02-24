import type { BenchmarkLevel, SystemType } from '@/types'

/**
 * Benchmark: $/SF vs system thresholds → green/amber/red
 *   ≤ benchmarkLow  → green (competitive)
 *   > low && ≤ high → amber (typical)
 *   > benchmarkHigh → red (expensive)
 */
export function calcBenchmark(
  lineTotal: number,
  sqft: number,
  systemType: SystemType | undefined,
): BenchmarkLevel {
  if (!systemType || sqft <= 0) return 'amber'
  const costPerSqft = lineTotal / sqft
  if (costPerSqft <= systemType.benchmarkLow) return 'green'
  if (costPerSqft <= systemType.benchmarkHigh) return 'amber'
  return 'red'
}
