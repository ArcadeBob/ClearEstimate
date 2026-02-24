import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useProjects } from '@/hooks/use-projects'
import { useAppStore } from '@/hooks/use-app-store'
import { calcRunningTotals, calcWinRate, formatCurrency } from '@/calc'
import { StatusBadge } from '@/components/StatusBadge'
import { SearchInput } from '@/components/SearchInput'
import { ConfirmDialog } from '@/components/ConfirmDialog'

export function DashboardView() {
  const navigate = useNavigate()
  const { projects, createProject, deleteProject, duplicateProject } = useProjects()
  const { state } = useAppStore()
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const winRate = calcWinRate(state.projects)

  const filtered = projects.filter(p => {
    const q = search.toLowerCase()
    return p.name.toLowerCase().includes(q) || p.clientName.toLowerCase().includes(q)
  })

  const handleCreate = () => {
    const id = createProject()
    navigate(`/project/${id}/setup`)
  }

  const handleDuplicate = (id: string) => {
    const newId = duplicateProject(id)
    if (newId) navigate(`/project/${newId}/setup`)
  }

  const handleDelete = () => {
    if (deleteId) {
      deleteProject(deleteId)
      setDeleteId(null)
    }
  }

  const projectToDelete = deleteId ? projects.find(p => p.id === deleteId) : null

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="mt-1 text-sm text-gray-600">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
            {winRate !== null
              ? <> · Win Rate: <span className="font-medium">{(winRate * 100).toFixed(0)}%</span></>
              : <> · Win Rate: <span className="text-gray-400">N/A</span></>
            }
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New Project
        </button>
      </div>

      <div className="mt-4 max-w-sm">
        <SearchInput value={search} onChange={setSearch} placeholder="Search projects..." />
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-700">Project</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Client</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Bid Date</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">Contract Value</th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  {search ? 'No projects match your search.' : 'No projects yet. Click "New Project" to start.'}
                </td>
              </tr>
            )}
            {filtered.map(project => {
              const totals = calcRunningTotals(project)
              return (
                <tr
                  key={project.id}
                  className="cursor-pointer border-b border-gray-100 hover:bg-gray-50"
                  onClick={() => navigate(`/project/${project.id}/setup`)}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{project.name}</td>
                  <td className="px-4 py-3 text-gray-600">{project.clientName || '\u2014'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {project.bidDate
                      ? new Date(project.bidDate + 'T00:00:00').toLocaleDateString()
                      : '\u2014'}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={project.status} /></td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {formatCurrency(totals.contractValue)}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleDuplicate(project.id)}
                      className="mr-2 text-xs text-blue-600 hover:text-blue-800"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={() => setDeleteId(project.id)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Project"
        message={`Are you sure you want to delete "${projectToDelete?.name}"? All line items and data will be permanently lost.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
