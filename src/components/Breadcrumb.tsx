import { Link, useLocation } from 'react-router'
import { useAppStore } from '@/hooks/use-app-store'

interface Crumb {
  label: string
  to?: string
}

export function Breadcrumb() {
  const location = useLocation()
  const { state } = useAppStore()

  const crumbs: Crumb[] = [{ label: 'Dashboard', to: '/' }]

  const projectMatch = location.pathname.match(/^\/project\/([^/]+)\/(.+)/)
  if (projectMatch) {
    const [, projectId, view] = projectMatch
    const project = state.projects.find(p => p.id === projectId)
    crumbs.push({
      label: project?.name ?? 'Project',
      to: `/project/${projectId}/setup`,
    })
    crumbs.push({ label: view!.charAt(0).toUpperCase() + view!.slice(1) })
  } else if (location.pathname === '/settings') {
    crumbs.push({ label: 'Settings' })
  }

  return (
    <nav className="flex items-center gap-2 text-sm text-gray-500">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <span>/</span>}
          {crumb.to && i < crumbs.length - 1 ? (
            <Link to={crumb.to} className="hover:text-gray-700">
              {crumb.label}
            </Link>
          ) : (
            <span className="font-medium text-gray-900">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
