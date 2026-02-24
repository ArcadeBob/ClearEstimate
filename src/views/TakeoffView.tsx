import { useState, useCallback, memo } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useProjects } from '@/hooks/use-projects'
import { useLineItems, validateLineItem } from '@/hooks/use-line-items'
import { useVEAlternates } from '@/hooks/use-ve-alternates'
import { useAppStore } from '@/hooks/use-app-store'
import {
  calcRunningTotals,
  calcBenchmark,
  formatCurrency,
  shouldSuggestEquipment,
} from '@/calc'
import { BenchmarkBadge } from '@/components/BenchmarkBadge'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import type { LineItem, AppSettings } from '@/types'

// ── Main TakeoffView ────────────────────────────────────────────

export function TakeoffView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getProject } = useProjects()
  const {
    lineItems, addLineItem, updateLineItem,
    deleteLineItem, duplicateLineItem,
  } = useLineItems(id!)
  const {
    veAlternates, totalSavings, addVEAlternate,
    updateVEAlternate, deleteVEAlternate,
  } = useVEAlternates(id!)
  const { state } = useAppStore()

  const project = getProject(id!)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleteVEId, setDeleteVEId] = useState<string | null>(null)

  // VE form
  const [showVEForm, setShowVEForm] = useState(false)
  const [veLineItemId, setVeLineItemId] = useState('')
  const [veDesc, setVeDesc] = useState('')
  const [veCost, setVeCost] = useState(0)

  if (!project) return null
  const settings = state.settings
  const totals = calcRunningTotals(project)

  const handleToggle = useCallback((itemId: string) => {
    setExpandedId(prev => prev === itemId ? null : itemId)
  }, [])

  const handleUpdate = useCallback((itemId: string, updates: Partial<LineItem>) => {
    updateLineItem(itemId, updates)
  }, [updateLineItem])

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteLineItem(deleteTarget)
      if (expandedId === deleteTarget) setExpandedId(null)
      setDeleteTarget(null)
    }
  }

  const handleAddVE = () => {
    if (!veLineItemId || veCost <= 0) return
    addVEAlternate(veLineItemId, veDesc, veCost)
    setShowVEForm(false)
    setVeLineItemId('')
    setVeDesc('')
    setVeCost(0)
  }

  return (
    <div className="flex gap-6">
      {/* ── Left: Line Items ─────────────────────────────── */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Takeoff</h2>
          <div className="flex gap-2">
            <button
              onClick={addLineItem}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + Add Line Item
            </button>
            <button
              onClick={() => navigate(`/project/${id}/summary`)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              View Summary
            </button>
          </div>
        </div>

        {lineItems.length === 0 && (
          <div className="mt-8 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-gray-500">
            No line items yet. Click "+ Add Line Item" to start estimating.
          </div>
        )}

        <div className="mt-4 space-y-2">
          {lineItems.map(item => (
            <LineItemRow
              key={item.id}
              item={item}
              settings={settings}
              isExpanded={expandedId === item.id}
              onToggle={handleToggle}
              onUpdate={handleUpdate}
              onDuplicate={duplicateLineItem}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      </div>

      {/* ── Right: Running Totals + VE ───────────────────── */}
      <div className="w-72 shrink-0">
        <div className="sticky top-0 space-y-4">
          {/* Running Totals */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-700">
              Running Totals
            </h3>
            <div className="mt-3 space-y-1.5 text-sm">
              <TotalRow label="Materials" value={totals.materialTotal} />
              <TotalRow label="Labor" value={totals.laborTotal} />
              <TotalRow label="Equipment" value={totals.equipmentTotal} />
              <div className="border-t border-gray-200 pt-1.5">
                <TotalRow label="Subtotal" value={totals.subtotal} bold />
              </div>
              {totals.veSavings > 0 && (
                <TotalRow label="VE Deducts" value={-totals.veSavings} className="text-green-600" />
              )}
              <div className="border-t border-gray-200 pt-1.5">
                <TotalRow label={`OH (${project.overheadPercent}%)`} value={totals.overheadAmount} />
                <TotalRow label={`Profit (${project.profitPercent}%)`} value={totals.profitAmount} />
              </div>
              <div className="border-t-2 border-gray-900 pt-1.5">
                <TotalRow label="Contract Value" value={totals.contractValue} bold />
              </div>
            </div>
          </div>

          {/* VE Alternates */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-700">
                VE Alternates
              </h3>
              <button
                onClick={() => setShowVEForm(!showVEForm)}
                className="text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                {showVEForm ? 'Cancel' : '+ Add VE'}
              </button>
            </div>

            {showVEForm && (
              <div className="mt-3 space-y-2 rounded-md bg-gray-50 p-3">
                <select
                  value={veLineItemId}
                  onChange={e => setVeLineItemId(e.target.value)}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
                >
                  <option value="">Select line item...</option>
                  {lineItems.filter(li => li.lineTotal > 0).map(li => {
                    const sys = settings.systemTypes.find(s => s.id === li.systemTypeId)
                    return (
                      <option key={li.id} value={li.id}>
                        {sys?.name ?? 'Item'} {li.widthInches}&quot;x{li.heightInches}&quot; ({formatCurrency(li.lineTotal)})
                      </option>
                    )
                  })}
                </select>
                <input
                  type="text"
                  placeholder="Description"
                  value={veDesc}
                  onChange={e => setVeDesc(e.target.value)}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
                />
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">$</span>
                  <input
                    type="number"
                    placeholder="Alternate cost"
                    value={veCost || ''}
                    onChange={e => setVeCost(parseFloat(e.target.value) || 0)}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
                  />
                </div>
                <button
                  onClick={handleAddVE}
                  disabled={!veLineItemId || veCost <= 0}
                  className="w-full rounded bg-blue-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Add VE Alternate
                </button>
              </div>
            )}

            {veAlternates.length === 0 && !showVEForm && (
              <p className="mt-2 text-xs text-gray-400">No VE alternates</p>
            )}

            <div className="mt-2 space-y-2">
              {veAlternates.map(ve => {
                const linked = lineItems.find(li => li.id === ve.lineItemId)
                const sys = linked
                  ? settings.systemTypes.find(s => s.id === linked.systemTypeId)
                  : null
                return (
                  <div key={ve.id} className="rounded-md border border-gray-100 bg-gray-50 p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-700">
                        {ve.description || sys?.name || 'VE Item'}
                      </span>
                      <button
                        onClick={() => setDeleteVEId(ve.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        x
                      </button>
                    </div>
                    <div className="mt-1 space-y-0.5 text-gray-500">
                      <div className="flex justify-between">
                        <span>Original</span>
                        <span>{formatCurrency(ve.originalCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Alternate</span>
                        <input
                          type="number"
                          value={ve.alternateCost}
                          onChange={e =>
                            updateVEAlternate(ve.id, {
                              alternateCost: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-20 rounded border border-gray-200 px-1 py-0.5 text-right text-xs"
                        />
                      </div>
                      <div className="flex justify-between font-medium text-green-600">
                        <span>Savings</span>
                        <span>{formatCurrency(ve.savings)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {totalSavings > 0 && (
              <div className="mt-2 border-t border-gray-200 pt-2 text-right text-sm font-semibold text-green-600">
                Total: {formatCurrency(totalSavings)}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Line Item"
        message="Are you sure? Any linked VE alternates will also be deleted."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      <ConfirmDialog
        open={deleteVEId !== null}
        title="Delete VE Alternate"
        message="Remove this VE alternate?"
        onConfirm={() => { if (deleteVEId) { deleteVEAlternate(deleteVEId); setDeleteVEId(null) } }}
        onCancel={() => setDeleteVEId(null)}
      />
    </div>
  )
}

// ── LineItemRow (memo for performance) ──────────────────────────

interface LineItemRowProps {
  item: LineItem
  settings: AppSettings
  isExpanded: boolean
  onToggle: (id: string) => void
  onUpdate: (id: string, updates: Partial<LineItem>) => void
  onDuplicate: (id: string) => void | string | null
  onDelete: (id: string) => void
}

const LineItemRow = memo(function LineItemRow({
  item, settings, isExpanded, onToggle, onUpdate, onDuplicate, onDelete,
}: LineItemRowProps) {
  const validation = validateLineItem(item)
  const systemType = settings.systemTypes.find(s => s.id === item.systemTypeId)
  const benchmark = calcBenchmark(item.lineTotal, item.sqft, systemType)
  const showEquipSuggestion = shouldSuggestEquipment(item.heightInches) && item.equipmentIds.length === 0

  const toggleArray = (field: 'conditionIds' | 'hardwareIds' | 'equipmentIds', id: string) => {
    const current = item[field]
    const updated = current.includes(id)
      ? current.filter(x => x !== id)
      : [...current, id]
    onUpdate(item.id, { [field]: updated })
  }

  return (
    <div className={`rounded-lg border bg-white ${!validation.isValid ? 'border-red-300' : 'border-gray-200'}`}>
      {/* Collapsed Row */}
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={() => onToggle(item.id)}
          className="shrink-0 text-gray-400 hover:text-gray-600"
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          <svg className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <select
          value={item.systemTypeId}
          onChange={e => onUpdate(item.id, { systemTypeId: e.target.value })}
          className="w-36 truncate rounded border border-gray-200 px-1.5 py-1 text-xs focus:border-blue-500 focus:outline-none"
        >
          <option value="">System...</option>
          {settings.systemTypes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <select
          value={item.glassTypeId}
          onChange={e => onUpdate(item.id, { glassTypeId: e.target.value })}
          className="w-36 truncate rounded border border-gray-200 px-1.5 py-1 text-xs focus:border-blue-500 focus:outline-none"
        >
          <option value="">Glass...</option>
          {settings.glassTypes.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>

        <select
          value={item.frameSystemId}
          onChange={e => onUpdate(item.id, { frameSystemId: e.target.value })}
          className="w-36 truncate rounded border border-gray-200 px-1.5 py-1 text-xs focus:border-blue-500 focus:outline-none"
        >
          <option value="">Frame...</option>
          {settings.frameSystems.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>

        <div className="flex items-center gap-0.5">
          <input
            type="number"
            value={item.widthInches || ''}
            placeholder="W"
            onChange={e => onUpdate(item.id, { widthInches: parseFloat(e.target.value) || 0 })}
            className="w-14 rounded border border-gray-200 px-1.5 py-1 text-center text-xs focus:border-blue-500 focus:outline-none"
          />
          <span className="text-xs text-gray-400">x</span>
          <input
            type="number"
            value={item.heightInches || ''}
            placeholder="H"
            onChange={e => onUpdate(item.id, { heightInches: parseFloat(e.target.value) || 0 })}
            className="w-14 rounded border border-gray-200 px-1.5 py-1 text-center text-xs focus:border-blue-500 focus:outline-none"
          />
        </div>

        <input
          type="number"
          value={item.quantity}
          min={1}
          onChange={e => onUpdate(item.id, { quantity: parseInt(e.target.value) || 1 })}
          className="w-12 rounded border border-gray-200 px-1.5 py-1 text-center text-xs focus:border-blue-500 focus:outline-none"
          title="Quantity"
        />

        <div className="ml-auto flex items-center gap-2">
          {item.lineTotal > 0 && <BenchmarkBadge level={benchmark} />}
          <span className="w-24 text-right text-sm font-semibold text-gray-900">
            {item.lineTotal > 0 ? formatCurrency(item.lineTotal) : '\u2014'}
          </span>
          <button onClick={() => onDuplicate(item.id)} className="text-xs text-blue-600 hover:text-blue-800" title="Duplicate">
            Dup
          </button>
          <button onClick={() => onDelete(item.id)} className="text-xs text-red-600 hover:text-red-800" title="Delete">
            Del
          </button>
        </div>
      </div>

      {/* Validation Errors (I-002) */}
      {!validation.isValid && validation.errors.length > 0 && (
        <div className="border-t border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-600">
          {validation.errors.join(' · ')}
        </div>
      )}

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
          <div className="grid grid-cols-2 gap-4">
            {/* Description */}
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">Description</label>
              <input
                type="text"
                value={item.description}
                onChange={e => onUpdate(item.id, { description: e.target.value })}
                placeholder="Optional description..."
                className="mt-1 w-full rounded border border-gray-200 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Conditions (I-003: adjustment is in crew-day units) */}
            <div>
              <label className="text-xs font-medium text-gray-600">
                Conditions <span className="font-normal text-gray-400">(crew-day adj.)</span>
              </label>
              <div className="mt-1 space-y-1">
                {settings.conditions.map(c => (
                  <label key={c.id} className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={item.conditionIds.includes(c.id)}
                      onChange={() => toggleArray('conditionIds', c.id)}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
                    />
                    <span>{c.name}</span>
                    <span className={`text-gray-400 ${c.adjustment >= 0 ? '' : 'text-green-600'}`}>
                      ({c.adjustment >= 0 ? '+' : ''}{c.adjustment}d)
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Hardware (C-016: qty = lineItem.quantity) */}
            <div>
              <label className="text-xs font-medium text-gray-600">Hardware</label>
              <div className="mt-1 space-y-1">
                {settings.hardware.map(h => (
                  <label key={h.id} className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={item.hardwareIds.includes(h.id)}
                      onChange={() => toggleArray('hardwareIds', h.id)}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
                    />
                    <span>{h.name}</span>
                    <span className="text-gray-400">{formatCurrency(h.unitCost)}/ea</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Equipment */}
            <div>
              <label className="text-xs font-medium text-gray-600">Equipment</label>
              {showEquipSuggestion && (
                <p className="mt-0.5 text-xs text-amber-600">
                  Height &gt; 0 — consider adding equipment (C-003)
                </p>
              )}
              <div className="mt-1 space-y-1">
                {settings.equipment.map(eq => (
                  <label key={eq.id} className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={item.equipmentIds.includes(eq.id)}
                      onChange={() => toggleArray('equipmentIds', eq.id)}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
                    />
                    <span>{eq.name}</span>
                    <span className="text-gray-400">{formatCurrency(eq.dailyRate)}/day</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Cost Breakdown */}
            <div>
              <label className="text-xs font-medium text-gray-600">Cost Breakdown</label>
              <div className="mt-1 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Material</span>
                  <span>{formatCurrency(item.materialCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Labor</span>
                  <span>{formatCurrency(item.laborCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Equipment</span>
                  <span>{formatCurrency(item.equipmentCost)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-1 font-medium">
                  <span>Total</span>
                  <span>{formatCurrency(item.lineTotal)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Crew Days</span>
                  <span>{item.crewDays.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Area</span>
                  <span>{item.sqft.toFixed(1)} SF</span>
                </div>
                {item.sqft > 0 && (
                  <div className="flex items-center justify-between text-gray-400">
                    <span>$/SF</span>
                    <span className="flex items-center gap-1.5">
                      {formatCurrency(item.lineTotal / item.sqft)}
                      <BenchmarkBadge level={benchmark} />
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

// ── TotalRow helper ─────────────────────────────────────────────

function TotalRow({ label, value, bold, className }: {
  label: string
  value: number
  bold?: boolean
  className?: string
}) {
  return (
    <div className={`flex justify-between ${bold ? 'font-semibold' : ''} ${className ?? ''}`}>
      <span className="text-gray-600">{label}</span>
      <span className={bold ? 'text-gray-900' : ''}>{formatCurrency(value)}</span>
    </div>
  )
}
