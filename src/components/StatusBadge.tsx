import type { ProjectStatus } from '@/types'

const STATUS_STYLES: Record<ProjectStatus, string> = {
  Bidding: 'bg-blue-100 text-blue-800',
  Awarded: 'bg-green-100 text-green-800',
  Lost: 'bg-red-100 text-red-800',
  'In Progress': 'bg-amber-100 text-amber-800',
  Completed: 'bg-gray-100 text-gray-800',
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  )
}
