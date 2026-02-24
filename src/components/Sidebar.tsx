import { NavLink, useLocation } from 'react-router'
import { useAppStore } from '@/hooks/use-app-store'

function SidebarLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-gray-800 text-white'
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`
      }
    >
      {label}
    </NavLink>
  )
}

export function Sidebar() {
  const location = useLocation()
  const { state } = useAppStore()

  // Derive active project from URL (C-007)
  const projectMatch = location.pathname.match(/^\/project\/([^/]+)/)
  const projectId = projectMatch?.[1] ?? null
  const project = projectId ? state.projects.find(p => p.id === projectId) : null

  return (
    <aside className="flex h-screen w-64 flex-col bg-gray-900 print:hidden">
      <div className="px-4 py-5">
        <h1 className="text-lg font-bold text-white">ClearEstimate</h1>
        <p className="text-xs text-gray-400">Glazing Estimation Tool</p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        <SidebarLink to="/" label="Dashboard" />
        <SidebarLink to="/settings" label="Settings" />

        {project && (
          <>
            <div className="my-3 border-t border-gray-700" />
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              {project.name}
            </p>
            <SidebarLink to={`/project/${projectId}/setup`} label="Project Setup" />
            <SidebarLink to={`/project/${projectId}/takeoff`} label="Takeoff" />
            <SidebarLink to={`/project/${projectId}/summary`} label="Summary" />
          </>
        )}

        {!project && projectId === null && (
          <>
            <div className="my-3 border-t border-gray-700" />
            <p className="px-3 text-xs text-gray-500">
              Select a project to see navigation
            </p>
          </>
        )}
      </nav>

      <div className="border-t border-gray-700 px-4 py-3">
        <p className="text-xs text-gray-500">Phase 1 — Local Storage</p>
      </div>
    </aside>
  )
}
