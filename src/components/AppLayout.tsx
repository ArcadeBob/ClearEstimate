import { Outlet } from 'react-router'
import { Sidebar } from './Sidebar'
import { Breadcrumb } from './Breadcrumb'

export function AppLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-gray-200 bg-white px-6 py-3 print:hidden">
          <Breadcrumb />
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
