import { useState } from 'react'
import { useSettings } from '@/hooks/use-settings'
import { useHardwareTemplates } from '@/hooks/use-hardware-templates'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { formatCurrency } from '@/calc'
import type { AppSettings, Hardware, HardwareSetTemplate } from '@/types'

type TabName = 'glass' | 'frames' | 'systems' | 'labor' | 'conditions' | 'hardware' | 'equipment' | 'templates'

const TABS: { key: TabName; label: string }[] = [
  { key: 'glass', label: 'Glass' },
  { key: 'frames', label: 'Frame Systems' },
  { key: 'systems', label: 'System Types' },
  { key: 'labor', label: 'Labor' },
  { key: 'conditions', label: 'Conditions' },
  { key: 'hardware', label: 'Hardware' },
  { key: 'equipment', label: 'Equipment' },
  { key: 'templates', label: 'Templates' },
]

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<TabName>('glass')
  const { settings, addItem, updateItem, deleteItem, updateLaborRate, getUsageCount } = useSettings()
  const {
    templates,
    addTemplate,
    renameTemplate,
    deleteTemplate,
    toggleTemplateItem,
    updateTemplateItemQuantity,
  } = useHardwareTemplates()
  const [deleteTarget, setDeleteTarget] = useState<{ tableName: keyof AppSettings; id: string; name: string } | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null)

  const handleDelete = () => {
    if (!deleteTarget) return
    if (deleteTarget.tableName === 'hardwareTemplates') {
      deleteTemplate(deleteTarget.id)
      if (expandedTemplateId === deleteTarget.id) {
        setExpandedTemplateId(null)
      }
    } else {
      const result = deleteItem(deleteTarget.tableName, deleteTarget.id)
      if (!result.success) {
        setDeleteError(result.error ?? 'Cannot delete')
      }
    }
    setDeleteTarget(null)
  }

  const handleAddTemplate = () => {
    let name = 'New Template'
    // If "New Template" already exists, increment: "New Template (2)", "New Template (3)", etc.
    let attempt = addTemplate(name)
    if (!attempt) {
      let counter = 2
      while (!attempt && counter <= 100) {
        name = `New Template (${counter})`
        attempt = addTemplate(name)
        counter++
      }
    }
    if (attempt) {
      setExpandedTemplateId(attempt)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
      <p className="mt-1 text-sm text-gray-600">Manage reference data for estimates</p>

      {/* Tab Bar */}
      <div className="mt-4 border-b border-gray-200">
        <nav className="-mb-px flex gap-4">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setDeleteError(null) }}
              className={`border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {deleteError && (
        <div className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {deleteError}
          <button onClick={() => setDeleteError(null)} className="ml-2 font-medium underline">Dismiss</button>
        </div>
      )}

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'glass' && (
          <SettingsTable
            columns={['Name', 'Cost / SF']}
            rows={settings.glassTypes.map(g => ({
              id: g.id,
              cells: [
                { value: g.name, onChange: (v: string) => updateItem('glassTypes', g.id, { name: v }) },
                { value: g.costPerSqft, onChange: (v: number) => updateItem('glassTypes', g.id, { costPerSqft: v }), type: 'number' as const, prefix: '$' },
              ],
            }))}
            onAdd={() => addItem('glassTypes', { name: 'New Glass Type', costPerSqft: 0 })}
            onDelete={(id, name) => setDeleteTarget({ tableName: 'glassTypes', id, name })}
            getUsage={(id) => getUsageCount('glassTypes', id)}
          />
        )}

        {activeTab === 'frames' && (
          <SettingsTable
            columns={['Name', 'Cost / LF']}
            rows={settings.frameSystems.map(f => ({
              id: f.id,
              cells: [
                { value: f.name, onChange: (v: string) => updateItem('frameSystems', f.id, { name: v }) },
                { value: f.costPerLinFt, onChange: (v: number) => updateItem('frameSystems', f.id, { costPerLinFt: v }), type: 'number' as const, prefix: '$' },
              ],
            }))}
            onAdd={() => addItem('frameSystems', { name: 'New Frame System', costPerLinFt: 0 })}
            onDelete={(id, name) => setDeleteTarget({ tableName: 'frameSystems', id, name })}
            getUsage={(id) => getUsageCount('frameSystems', id)}
          />
        )}

        {activeTab === 'systems' && (
          <SystemTypesTable
            systemTypes={settings.systemTypes}
            onUpdate={(id, updates) => updateItem('systemTypes', id, updates)}
            onAdd={() => addItem('systemTypes', { name: 'New System Type', benchmarkLow: 0, benchmarkHigh: 0, laborMode: 'area' as const, sfPerManHour: 10 })}
            onDelete={(id, name) => setDeleteTarget({ tableName: 'systemTypes', id, name })}
            getUsage={(id) => getUsageCount('systemTypes', id)}
          />
        )}

        {activeTab === 'labor' && (
          <LaborTable
            laborRates={settings.laborRates}
            onUpdate={updateLaborRate}
            onAdd={() => addItem('laborRates', { role: 'New Role', baseRate: 0, burdenPercent: 0.35, healthHourly: 0, loadedRate: 0 })}
            onDelete={(id, name) => setDeleteTarget({ tableName: 'laborRates', id, name })}
          />
        )}

        {activeTab === 'conditions' && (
          <SettingsTable
            columns={['Name', 'Adjustment (crew-days)']}
            rows={settings.conditions.map(c => ({
              id: c.id,
              cells: [
                { value: c.name, onChange: (v: string) => updateItem('conditions', c.id, { name: v }) },
                { value: c.adjustment, onChange: (v: number) => updateItem('conditions', c.id, { adjustment: v }), type: 'number' as const, step: '0.25' },
              ],
            }))}
            onAdd={() => addItem('conditions', { name: 'New Condition', adjustment: 0 })}
            onDelete={(id, name) => setDeleteTarget({ tableName: 'conditions', id, name })}
            getUsage={(id) => getUsageCount('conditions', id)}
          />
        )}

        {activeTab === 'hardware' && (
          <SettingsTable
            columns={['Name', 'Unit Cost']}
            rows={settings.hardware.map(h => ({
              id: h.id,
              cells: [
                { value: h.name, onChange: (v: string) => updateItem('hardware', h.id, { name: v }) },
                { value: h.unitCost, onChange: (v: number) => updateItem('hardware', h.id, { unitCost: v }), type: 'number' as const, prefix: '$' },
              ],
            }))}
            onAdd={() => addItem('hardware', { name: 'New Hardware', unitCost: 0 })}
            onDelete={(id, name) => setDeleteTarget({ tableName: 'hardware', id, name })}
            getUsage={(id) => getUsageCount('hardware', id)}
          />
        )}

        {activeTab === 'equipment' && (
          <SettingsTable
            columns={['Name', 'Daily Rate']}
            rows={settings.equipment.map(e => ({
              id: e.id,
              cells: [
                { value: e.name, onChange: (v: string) => updateItem('equipment', e.id, { name: v }) },
                { value: e.dailyRate, onChange: (v: number) => updateItem('equipment', e.id, { dailyRate: v }), type: 'number' as const, prefix: '$' },
              ],
            }))}
            onAdd={() => addItem('equipment', { name: 'New Equipment', dailyRate: 0 })}
            onDelete={(id, name) => setDeleteTarget({ tableName: 'equipment', id, name })}
            getUsage={(id) => getUsageCount('equipment', id)}
          />
        )}

        {activeTab === 'templates' && (
          <TemplatesTab
            templates={templates}
            doorHardwareCatalog={settings.doorHardware}
            expandedTemplateId={expandedTemplateId}
            onToggleExpand={(id) => setExpandedTemplateId(prev => prev === id ? null : id)}
            onRename={renameTemplate}
            onToggleItem={toggleTemplateItem}
            onUpdateItemQty={updateTemplateItemQuantity}
            onDelete={(id, name) => setDeleteTarget({ tableName: 'hardwareTemplates', id, name })}
            onAdd={handleAddTemplate}
          />
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Item"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

// ── Templates Tab ─────────────────────────────────────────────────

interface TemplatesTabProps {
  templates: HardwareSetTemplate[]
  doorHardwareCatalog: Hardware[]
  expandedTemplateId: string | null
  onToggleExpand: (id: string) => void
  onRename: (id: string, newName: string) => boolean
  onToggleItem: (templateId: string, hardwareId: string) => void
  onUpdateItemQty: (templateId: string, hardwareId: string, quantity: number) => void
  onDelete: (id: string, name: string) => void
  onAdd: () => void
}

function TemplatesTab({
  templates,
  doorHardwareCatalog,
  expandedTemplateId,
  onToggleExpand,
  onRename,
  onToggleItem,
  onUpdateItemQty,
  onDelete,
  onAdd,
}: TemplatesTabProps) {
  const [renameError, setRenameError] = useState<string | null>(null)

  return (
    <div>
      {templates.length === 0 && (
        <p className="py-4 text-sm text-gray-500">No templates yet. Create one to get started.</p>
      )}

      <div className="space-y-1">
        {templates.map(tmpl => {
          const isExpanded = expandedTemplateId === tmpl.id
          return (
            <div key={tmpl.id} className="rounded-lg border border-gray-200">
              {/* Collapsed Row */}
              <div
                className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-gray-50"
                onClick={() => { onToggleExpand(tmpl.id); setRenameError(null) }}
              >
                <div className="flex items-center gap-3">
                  <svg
                    className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">{tmpl.name}</span>
                  <span className="text-xs text-gray-400">
                    {tmpl.items.length} item{tmpl.items.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); onDelete(tmpl.id, tmpl.name) }}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>

              {/* Expanded Area */}
              {isExpanded && (
                <div className="border-l-2 border-blue-200 bg-gray-50 px-6 py-4">
                  {/* Inline Name Input */}
                  <div className="mb-4">
                    <label className="mb-1 block text-xs font-medium text-gray-600">Template Name</label>
                    <input
                      type="text"
                      value={tmpl.name}
                      onClick={e => e.stopPropagation()}
                      onChange={e => {
                        const success = onRename(tmpl.id, e.target.value)
                        setRenameError(success ? null : 'Name must be unique and non-empty')
                      }}
                      onBlur={() => {
                        // Re-validate on blur to clear transient errors
                        if (tmpl.name.trim()) setRenameError(null)
                      }}
                      className="w-full max-w-xs rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                    />
                    {renameError && (
                      <p className="mt-1 text-xs text-red-600">{renameError}</p>
                    )}
                  </div>

                  {/* Hardware Checkbox List */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-gray-600">Hardware Items</h4>
                    {doorHardwareCatalog.map(hw => {
                      const entry = tmpl.items.find(i => i.hardwareId === hw.id)
                      const isChecked = !!entry
                      return (
                        <div key={hw.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`${tmpl.id}-${hw.id}`}
                            checked={isChecked}
                            onChange={() => onToggleItem(tmpl.id, hw.id)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label
                            htmlFor={`${tmpl.id}-${hw.id}`}
                            className="flex-1 text-sm text-gray-700"
                          >
                            {hw.name}
                            <span className="ml-1 text-xs text-gray-400">({formatCurrency(hw.unitCost)})</span>
                          </label>
                          {isChecked && (
                            <input
                              type="number"
                              min={1}
                              step={1}
                              value={entry.quantity}
                              onChange={e => {
                                const val = parseInt(e.target.value, 10)
                                if (!isNaN(val)) {
                                  onUpdateItemQty(tmpl.id, hw.id, val)
                                }
                              }}
                              className="w-16 rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button
        onClick={onAdd}
        className="mt-3 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700"
      >
        + New Template
      </button>
    </div>
  )
}

// ── Generic Settings Table ───────────────────────────────────────

interface CellDef {
  value: string | number
  onChange: (value: any) => void
  type?: 'number'
  prefix?: string
  step?: string
}

interface SettingsTableProps {
  columns: string[]
  rows: { id: string; cells: CellDef[] }[]
  onAdd: () => void
  onDelete: (id: string, name: string) => void
  getUsage?: (id: string) => number
}

function SettingsTable({ columns, rows, onAdd, onDelete, getUsage }: SettingsTableProps) {
  return (
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            {columns.map(col => (
              <th key={col} className="px-3 py-2 text-left font-medium text-gray-700">{col}</th>
            ))}
            <th className="w-20 px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
              {row.cells.map((cell, i) => (
                <td key={i} className="px-3 py-1.5">
                  <div className="flex items-center gap-1">
                    {cell.prefix && <span className="text-gray-400">{cell.prefix}</span>}
                    <input
                      type={cell.type === 'number' ? 'number' : 'text'}
                      value={cell.value}
                      step={cell.step}
                      onChange={e => {
                        const val = cell.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                        cell.onChange(val)
                      }}
                      className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </td>
              ))}
              <td className="px-3 py-1.5 text-right">
                <button
                  onClick={() => {
                    const name = String(row.cells[0]?.value ?? '')
                    onDelete(row.id, name)
                  }}
                  className="text-xs text-red-600 hover:text-red-800"
                  title={getUsage ? `Used by ${getUsage(row.id)} line items` : undefined}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={onAdd}
        className="mt-3 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700"
      >
        + Add Row
      </button>
    </div>
  )
}

// ── Labor Table (special: auto-recalc loaded rate) ───────────────

interface LaborTableProps {
  laborRates: { id: string; role: string; baseRate: number; burdenPercent: number; healthHourly: number; loadedRate: number }[]
  onUpdate: (id: string, updates: any) => void
  onAdd: () => void
  onDelete: (id: string, name: string) => void
}

function LaborTable({ laborRates, onUpdate, onAdd, onDelete }: LaborTableProps) {
  return (
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-3 py-2 text-left font-medium text-gray-700">Role</th>
            <th className="px-3 py-2 text-left font-medium text-gray-700">Base Rate</th>
            <th className="px-3 py-2 text-left font-medium text-gray-700">Burden %</th>
            <th className="px-3 py-2 text-left font-medium text-gray-700">Health / Hr</th>
            <th className="px-3 py-2 text-left font-medium text-gray-700">Loaded Rate</th>
            <th className="w-20 px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {laborRates.map(lr => (
            <tr key={lr.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-3 py-1.5">
                <input
                  type="text"
                  value={lr.role}
                  onChange={e => onUpdate(lr.id, { role: e.target.value })}
                  className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                />
              </td>
              <td className="px-3 py-1.5">
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">$</span>
                  <input
                    type="number"
                    value={lr.baseRate}
                    step="0.50"
                    onChange={e => onUpdate(lr.id, { baseRate: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </td>
              <td className="px-3 py-1.5">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={Math.round(lr.burdenPercent * 100)}
                    step="1"
                    onChange={e => onUpdate(lr.id, { burdenPercent: (parseFloat(e.target.value) || 0) / 100 })}
                    className="w-20 rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-gray-400">%</span>
                </div>
              </td>
              <td className="px-3 py-1.5">
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">$</span>
                  <input
                    type="number"
                    value={lr.healthHourly}
                    step="0.50"
                    onChange={e => onUpdate(lr.id, { healthHourly: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </td>
              <td className="px-3 py-1.5">
                <span className="font-medium text-gray-900">{formatCurrency(lr.loadedRate)}</span>
              </td>
              <td className="px-3 py-1.5 text-right">
                <button
                  onClick={() => onDelete(lr.id, lr.role)}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={onAdd}
        className="mt-3 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700"
      >
        + Add Row
      </button>
    </div>
  )
}

// ── System Types Table (conditional labor fields) ────────────────

interface SystemTypesTableProps {
  systemTypes: { id: string; name: string; benchmarkLow: number; benchmarkHigh: number; laborMode: 'area' | 'unit'; sfPerManHour?: number; hoursPerUnit?: number }[]
  onUpdate: (id: string, updates: Record<string, unknown>) => void
  onAdd: () => void
  onDelete: (id: string, name: string) => void
  getUsage: (id: string) => number
}

function SystemTypesTable({ systemTypes, onUpdate, onAdd, onDelete, getUsage }: SystemTypesTableProps) {
  return (
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-3 py-2 text-left font-medium text-gray-700">Name</th>
            <th className="px-3 py-2 text-left font-medium text-gray-700">Labor Mode</th>
            <th className="px-3 py-2 text-left font-medium text-gray-700">Productivity</th>
            <th className="w-20 px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {systemTypes.map(st => (
            <tr key={st.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-3 py-1.5">
                <input
                  type="text"
                  value={st.name}
                  onChange={e => onUpdate(st.id, { name: e.target.value })}
                  className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                />
              </td>
              <td className="px-3 py-1.5">
                <select
                  value={st.laborMode}
                  onChange={e => {
                    const mode = e.target.value as 'area' | 'unit'
                    onUpdate(st.id, {
                      laborMode: mode,
                      sfPerManHour: mode === 'area' ? (st.sfPerManHour ?? 10) : undefined,
                      hoursPerUnit: mode === 'unit' ? (st.hoursPerUnit ?? 4) : undefined,
                    })
                  }}
                  className="rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="area">Area (SF/MH)</option>
                  <option value="unit">Unit (Hrs/Unit)</option>
                </select>
              </td>
              <td className="px-3 py-1.5">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    value={st.laborMode === 'area' ? (st.sfPerManHour ?? 0) : (st.hoursPerUnit ?? 0)}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0
                      if (st.laborMode === 'area') {
                        onUpdate(st.id, { sfPerManHour: val })
                      } else {
                        onUpdate(st.id, { hoursPerUnit: val })
                      }
                    }}
                    className="w-24 rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-xs text-gray-400">
                    {st.laborMode === 'area' ? 'SF/MH' : 'hrs/unit'}
                  </span>
                </div>
              </td>
              <td className="px-3 py-1.5 text-right">
                <button
                  onClick={() => onDelete(st.id, st.name)}
                  className="text-xs text-red-600 hover:text-red-800"
                  title={`Used by ${getUsage(st.id)} line items`}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={onAdd}
        className="mt-3 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700"
      >
        + Add Row
      </button>
    </div>
  )
}
