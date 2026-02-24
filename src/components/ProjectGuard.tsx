import { Navigate, Outlet, useParams } from 'react-router'
import { useAppStore } from '@/hooks/use-app-store'

/** Redirects to Dashboard if :id doesn't match any project (Task 7 guard) */
export function ProjectGuard() {
  const { id } = useParams<{ id: string }>()
  const { state } = useAppStore()

  if (!id || !state.projects.some(p => p.id === id)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
