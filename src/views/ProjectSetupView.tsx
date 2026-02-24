import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useProjects } from '@/hooks/use-projects'
import { useLineItems } from '@/hooks/use-line-items'
import { suggestOPPercents, calcRunningTotals } from '@/calc'
import type { ProjectStatus } from '@/types'

const STATUS_OPTIONS: ProjectStatus[] = ['Bidding', 'Awarded', 'Lost', 'In Progress', 'Completed']

export function ProjectSetupView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getProject, updateProject } = useProjects()
  const { recalculateAll } = useLineItems(id!)
  const [saved, setSaved] = useState(false)

  const project = getProject(id!)
  if (!project) return null

  const handleChange = (field: string, value: string | number | boolean) => {
    updateProject(id!, { [field]: value })
    // Recalculate all line items when PW settings change (C-004)
    if (['prevailingWage', 'pwBaseRate', 'pwFringeRate'].includes(field)) {
      recalculateAll()
    }
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSuggestOP = () => {
    const totals = calcRunningTotals(project)
    const suggestion = suggestOPPercents(totals.subtotal)
    updateProject(id!, {
      overheadPercent: suggestion.overhead,
      profitPercent: suggestion.profit,
    })
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900">Project Setup</h2>
      <p className="mt-1 text-sm text-gray-600">Configure project details and markup</p>

      <div className="mt-6 space-y-6">
        {/* Project Details */}
        <Section title="Project Details">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Project Name" value={project.name} onChange={v => handleChange('name', v)} />
            <Field label="Client Name" value={project.clientName} onChange={v => handleChange('clientName', v)} />
            <Field label="Bid Date" value={project.bidDate} onChange={v => handleChange('bidDate', v)} type="date" />
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={project.status}
                onChange={e => handleChange('status', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <Field label="Address" value={project.address} onChange={v => handleChange('address', v)} />
            </div>
            <Field label="Project Manager" value={project.projectManager} onChange={v => handleChange('projectManager', v)} />
            <Field label="Estimator" value={project.estimator} onChange={v => handleChange('estimator', v)} />
          </div>
        </Section>

        {/* Prevailing Wage */}
        <Section
          title="Prevailing Wage"
          action={
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={project.prevailingWage}
                onChange={e => handleChange('prevailingWage', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">PW Project</span>
            </label>
          }
        >
          {project.prevailingWage && (
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="PW Base Rate ($/hr)"
                value={project.pwBaseRate ?? ''}
                onChange={v => handleChange('pwBaseRate', parseFloat(v) || 0)}
                type="number"
              />
              <Field
                label="PW Fringe Rate ($/hr)"
                value={project.pwFringeRate ?? ''}
                onChange={v => handleChange('pwFringeRate', parseFloat(v) || 0)}
                type="number"
              />
            </div>
          )}
        </Section>

        {/* Overhead & Profit */}
        <Section
          title="Overhead & Profit"
          action={
            <button onClick={handleSuggestOP} className="text-xs font-medium text-blue-600 hover:text-blue-800">
              Suggest O&P
            </button>
          }
        >
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Overhead %"
              value={project.overheadPercent}
              onChange={v => handleChange('overheadPercent', parseFloat(v) || 0)}
              type="number"
            />
            <Field
              label="Profit %"
              value={project.profitPercent}
              onChange={v => handleChange('profitPercent', parseFloat(v) || 0)}
              type="number"
            />
          </div>
        </Section>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
              saved ? 'bg-green-600' : 'bg-gray-900 hover:bg-gray-800'
            }`}
          >
            {saved ? 'Saved!' : 'Save'}
          </button>
          <button
            onClick={() => navigate(`/project/${id}/takeoff`)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Start Takeoff
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Reusable sub-components ─────────────────────────────────────

function Section({ title, action, children }: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-700">{title}</h3>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Field({ label, value, onChange, type = 'text' }: {
  label: string
  value: string | number
  onChange: (value: string) => void
  type?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  )
}
