import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { AppLayout } from '@/components/AppLayout'
import { ProjectGuard } from '@/components/ProjectGuard'
import { DashboardView } from '@/views/DashboardView'
import { ProjectSetupView } from '@/views/ProjectSetupView'
import { TakeoffView } from '@/views/TakeoffView'
import { SummaryView } from '@/views/SummaryView'
import { SettingsView } from '@/views/SettingsView'
import { NotFoundView } from '@/views/NotFoundView'

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardView /> },
      { path: 'settings', element: <SettingsView /> },
      {
        path: 'project/:id',
        element: <ProjectGuard />,
        children: [
          { path: 'setup', element: <ProjectSetupView /> },
          { path: 'takeoff', element: <TakeoffView /> },
          { path: 'summary', element: <SummaryView /> },
        ],
      },
      { path: '*', element: <NotFoundView /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
