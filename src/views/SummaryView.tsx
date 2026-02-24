import { useState, useMemo, useCallback } from 'react'
import { useParams } from 'react-router'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useProjects } from '@/hooks/use-projects'
import { useSettings } from '@/hooks/use-settings'
import {
  calcRunningTotals,
  calcScheduleOfValues,
  calcPieData,
  generateScopeDescription,
  formatCurrency,
} from '@/calc'
import type { ProjectExport, ScopeDescription, SOVGroup } from '@/types'

export function SummaryView() {
  const { id } = useParams<{ id: string }>()
  const { getProject, updateProject } = useProjects()
  const { settings } = useSettings()

  const project = getProject(id!)
  if (!project) return null

  const totals = calcRunningTotals(project)
  const sovGroups = calcScheduleOfValues(project, settings)
  const pieData = calcPieData(totals)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Project Summary</h2>
          <p className="mt-1 text-sm text-gray-600">{project.name}</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <ExportButton project={project} totals={totals} sovGroups={sovGroups} />
          <button
            onClick={() => window.print()}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Print
          </button>
        </div>
      </div>

      {/* Cost Breakdown + Pie Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CostBreakdownCard totals={totals} project={project} />
        <PieChartCard pieData={pieData} />
      </div>

      {/* Schedule of Values */}
      <SOVTable sovGroups={sovGroups} totals={totals} />

      {/* Scope Descriptions */}
      <ScopeDescriptionsSection
        projectId={id!}
        project={project}
        sovGroups={sovGroups}
        settings={settings}
        updateProject={updateProject}
      />
    </div>
  )
}

// ── Cost Breakdown Card ────────────────────────────────────────

function CostBreakdownCard({
  totals,
  project,
}: {
  totals: ReturnType<typeof calcRunningTotals>
  project: { overheadPercent: number; profitPercent: number }
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-700">
        Cost Breakdown
      </h3>
      <dl className="mt-4 space-y-2 text-sm">
        <Row label="Materials" value={totals.materialTotal} />
        <Row label="Labor" value={totals.laborTotal} />
        <Row label="Equipment" value={totals.equipmentTotal} />
        <Row label="Subtotal" value={totals.subtotal} bold />
        {totals.veSavings > 0 && (
          <Row label="VE Savings" value={-totals.veSavings} className="text-green-600" />
        )}
        {totals.veSavings > 0 && (
          <Row label="Adjusted Subtotal" value={totals.adjustedSubtotal} />
        )}
        <Row
          label={`Overhead (${project.overheadPercent}%)`}
          value={totals.overheadAmount}
        />
        <Row
          label={`Profit (${project.profitPercent}%)`}
          value={totals.profitAmount}
        />
        <div className="border-t border-gray-200 pt-2">
          <Row label="Contract Value" value={totals.contractValue} bold large />
        </div>
      </dl>
    </section>
  )
}

function Row({
  label,
  value,
  bold,
  large,
  className,
}: {
  label: string
  value: number
  bold?: boolean
  large?: boolean
  className?: string
}) {
  return (
    <div className={`flex justify-between ${className ?? ''}`}>
      <dt className={bold ? 'font-semibold text-gray-900' : 'text-gray-600'}>{label}</dt>
      <dd
        className={`${bold ? 'font-semibold text-gray-900' : 'text-gray-900'} ${large ? 'text-lg' : ''}`}
      >
        {formatCurrency(value)}
      </dd>
    </div>
  )
}

// ── Pie Chart Card ─────────────────────────────────────────────

function PieChartCard({ pieData }: { pieData: ReturnType<typeof calcPieData> }) {
  if (pieData.length === 0) {
    return (
      <section className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-5">
        <p className="text-sm text-gray-400">Add line items to see cost distribution</p>
      </section>
    )
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 print:hidden">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-700">
        Cost Distribution
      </h3>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {pieData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

// ── SOV Table ──────────────────────────────────────────────────

function SOVTable({
  sovGroups,
  totals,
}: {
  sovGroups: SOVGroup[]
  totals: ReturnType<typeof calcRunningTotals>
}) {
  if (sovGroups.length === 0) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-700">
          Schedule of Values
        </h3>
        <p className="mt-4 text-center text-sm text-gray-400">
          No line items to display.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-700">
        Schedule of Values
      </h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-2 text-left font-medium text-gray-700">System Type</th>
              <th className="px-4 py-2 text-right font-medium text-gray-700">Items</th>
              <th className="px-4 py-2 text-right font-medium text-gray-700">Total SF</th>
              <th className="px-4 py-2 text-right font-medium text-gray-700">Direct Cost</th>
              <th className="px-4 py-2 text-right font-medium text-gray-700">Contract Value</th>
            </tr>
          </thead>
          <tbody>
            {sovGroups.map(group => (
              <tr key={group.systemTypeId} className="border-b border-gray-100">
                <td className="px-4 py-2 font-medium text-gray-900">{group.systemTypeName}</td>
                <td className="px-4 py-2 text-right text-gray-600">{group.lineItemCount}</td>
                <td className="px-4 py-2 text-right text-gray-600">{group.totalSqft.toFixed(1)}</td>
                <td className="px-4 py-2 text-right text-gray-600">{formatCurrency(group.directCost)}</td>
                <td className="px-4 py-2 text-right font-medium text-gray-900">
                  {formatCurrency(group.contractValue)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-300 bg-gray-50">
              <td className="px-4 py-2 font-semibold text-gray-900">Total</td>
              <td className="px-4 py-2 text-right font-medium text-gray-900">
                {sovGroups.reduce((s, g) => s + g.lineItemCount, 0)}
              </td>
              <td className="px-4 py-2 text-right font-medium text-gray-900">
                {sovGroups.reduce((s, g) => s + g.totalSqft, 0).toFixed(1)}
              </td>
              <td className="px-4 py-2 text-right font-medium text-gray-900">
                {formatCurrency(sovGroups.reduce((s, g) => s + g.directCost, 0))}
              </td>
              <td className="px-4 py-2 text-right font-semibold text-gray-900">
                {formatCurrency(totals.contractValue)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  )
}

// ── Scope Descriptions ─────────────────────────────────────────

function ScopeDescriptionsSection({
  projectId,
  project,
  sovGroups,
  settings,
  updateProject,
}: {
  projectId: string
  project: Parameters<typeof generateScopeDescription>[1]
  sovGroups: SOVGroup[]
  settings: Parameters<typeof generateScopeDescription>[2]
  updateProject: (id: string, updates: Partial<{ scopeDescriptions: ScopeDescription[] }>) => void
}) {
  const [confirmRegenerate, setConfirmRegenerate] = useState<string | null>(null)

  // Build map of existing scope descriptions
  const scopeMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const sd of project.scopeDescriptions) {
      map.set(sd.systemTypeId, sd.text)
    }
    return map
  }, [project.scopeDescriptions])

  const handleGenerate = useCallback(
    (systemTypeId: string) => {
      const text = generateScopeDescription(systemTypeId, project, settings)
      const existing = project.scopeDescriptions.filter(sd => sd.systemTypeId !== systemTypeId)
      updateProject(projectId, {
        scopeDescriptions: [...existing, { systemTypeId, text }],
      })
    },
    [projectId, project, settings, updateProject],
  )

  const handleRegenerate = useCallback(
    (systemTypeId: string) => {
      // If user has edited the text, confirm before overwriting
      if (scopeMap.has(systemTypeId)) {
        setConfirmRegenerate(systemTypeId)
      } else {
        handleGenerate(systemTypeId)
      }
    },
    [scopeMap, handleGenerate],
  )

  const confirmRegen = useCallback(() => {
    if (confirmRegenerate) {
      handleGenerate(confirmRegenerate)
      setConfirmRegenerate(null)
    }
  }, [confirmRegenerate, handleGenerate])

  const handleTextChange = useCallback(
    (systemTypeId: string, text: string) => {
      const others = project.scopeDescriptions.filter(sd => sd.systemTypeId !== systemTypeId)
      updateProject(projectId, {
        scopeDescriptions: [...others, { systemTypeId, text }],
      })
    },
    [projectId, project.scopeDescriptions, updateProject],
  )

  const handleGenerateAll = useCallback(() => {
    const newDescriptions: ScopeDescription[] = sovGroups.map(group => ({
      systemTypeId: group.systemTypeId,
      text: generateScopeDescription(group.systemTypeId, project, settings),
    }))
    updateProject(projectId, { scopeDescriptions: newDescriptions })
  }, [projectId, project, settings, sovGroups, updateProject])

  if (sovGroups.length === 0) return null

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-700">
          Scope Descriptions
        </h3>
        <button
          onClick={handleGenerateAll}
          className="text-xs font-medium text-blue-600 hover:text-blue-800 print:hidden"
        >
          Generate All
        </button>
      </div>
      <div className="mt-4 space-y-4">
        {sovGroups.map(group => {
          const existing = scopeMap.get(group.systemTypeId) ?? ''
          return (
            <div key={group.systemTypeId}>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  {group.systemTypeName}
                </label>
                <button
                  onClick={() =>
                    existing ? handleRegenerate(group.systemTypeId) : handleGenerate(group.systemTypeId)
                  }
                  className="text-xs text-blue-600 hover:text-blue-800 print:hidden"
                >
                  {existing ? 'Regenerate' : 'Generate'}
                </button>
              </div>
              <textarea
                value={existing}
                onChange={e => handleTextChange(group.systemTypeId, e.target.value)}
                rows={2}
                placeholder="Click Generate to create scope description..."
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 print:border-none print:p-0"
              />
            </div>
          )
        })}
      </div>

      {/* Regenerate confirmation */}
      {confirmRegenerate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 print:hidden">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h4 className="text-lg font-semibold text-gray-900">Regenerate Scope?</h4>
            <p className="mt-2 text-sm text-gray-600">
              This will overwrite your edits for this system type. Continue?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setConfirmRegenerate(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmRegen}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

// ── JSON Export Button ─────────────────────────────────────────

function ExportButton({
  project,
  totals,
  sovGroups,
}: {
  project: {
    name: string
    clientName: string
    bidDate: string
    status: string
    address: string
    projectManager: string
    estimator: string
    overheadPercent: number
    profitPercent: number
    lineItems: any[]
    veAlternates: any[]
    scopeDescriptions: ScopeDescription[]
  }
  totals: ReturnType<typeof calcRunningTotals>
  sovGroups: SOVGroup[]
}) {
  const handleExport = () => {
    const exportData: ProjectExport = {
      exportDate: new Date().toISOString(),
      projectName: project.name,
      clientName: project.clientName,
      bidDate: project.bidDate,
      status: project.status as ProjectExport['status'],
      address: project.address,
      projectManager: project.projectManager,
      estimator: project.estimator,
      overheadPercent: project.overheadPercent,
      profitPercent: project.profitPercent,
      lineItems: project.lineItems,
      veAlternates: project.veAlternates,
      sovGroups,
      runningTotals: totals,
      scopeDescriptions: project.scopeDescriptions,
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_export.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
    >
      Export JSON
    </button>
  )
}
