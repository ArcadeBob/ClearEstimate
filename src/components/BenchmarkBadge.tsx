import type { BenchmarkLevel } from '@/types'

const LEVEL_STYLES: Record<BenchmarkLevel, { dot: string; label: string }> = {
  green: { dot: 'bg-green-500', label: 'Competitive' },
  amber: { dot: 'bg-amber-500', label: 'Typical' },
  red: { dot: 'bg-red-500', label: 'Expensive' },
}

export function BenchmarkBadge({ level }: { level: BenchmarkLevel }) {
  const style = LEVEL_STYLES[level]
  return (
    <span className="inline-flex items-center gap-1.5" title={style.label}>
      <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
      <span className="text-xs text-gray-600">{style.label}</span>
    </span>
  )
}
