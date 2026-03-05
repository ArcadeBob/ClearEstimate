import type { HardwareSetTemplate } from '@/types'
import {
  applyAddTemplate,
  applyRenameTemplate,
  applyDeleteTemplate,
  applyToggleTemplateItem,
  applyUpdateTemplateItemQuantity,
} from './use-hardware-templates'

// ── Factory helpers ────────────────────────────────────────────

function baseTemplates(): HardwareSetTemplate[] {
  return [
    {
      id: 'hst-001',
      name: 'Entrance System',
      items: [
        { hardwareId: 'dhw-001', quantity: 3 },
        { hardwareId: 'dhw-002', quantity: 1 },
      ],
    },
    {
      id: 'hst-002',
      name: 'Interior Door',
      items: [{ hardwareId: 'dhw-001', quantity: 2 }],
    },
  ]
}

// ── addTemplate ────────────────────────────────────────────────

describe('applyAddTemplate', () => {
  it('creates a new template with empty items array', () => {
    const templates = baseTemplates()
    const result = applyAddTemplate(templates, 'Fire Exit')
    expect(result).not.toBeNull()
    expect(result!.templates).toHaveLength(3)
    const added = result!.templates[2]
    expect(added!.name).toBe('Fire Exit')
    expect(added!.items).toEqual([])
    expect(result!.newId).toBeTruthy()
  })

  it('trims whitespace from name', () => {
    const templates = baseTemplates()
    const result = applyAddTemplate(templates, '  Fire Exit  ')
    expect(result).not.toBeNull()
    expect(result!.templates[2]!.name).toBe('Fire Exit')
  })

  it('rejects empty name', () => {
    const templates = baseTemplates()
    expect(applyAddTemplate(templates, '')).toBeNull()
  })

  it('rejects whitespace-only name', () => {
    const templates = baseTemplates()
    expect(applyAddTemplate(templates, '   ')).toBeNull()
  })

  it('rejects duplicate name (case-insensitive)', () => {
    const templates = baseTemplates()
    expect(applyAddTemplate(templates, 'entrance system')).toBeNull()
    expect(applyAddTemplate(templates, 'ENTRANCE SYSTEM')).toBeNull()
  })

  it('does not mutate the original array', () => {
    const templates = baseTemplates()
    const original = templates.map(t => ({ ...t }))
    applyAddTemplate(templates, 'Fire Exit')
    expect(templates).toEqual(original)
  })
})

// ── renameTemplate ─────────────────────────────────────────────

describe('applyRenameTemplate', () => {
  it('renames a template', () => {
    const templates = baseTemplates()
    const result = applyRenameTemplate(templates, 'hst-001', 'Main Entrance')
    expect(result).not.toBeNull()
    expect(result!.find(t => t.id === 'hst-001')!.name).toBe('Main Entrance')
  })

  it('trims the new name', () => {
    const templates = baseTemplates()
    const result = applyRenameTemplate(templates, 'hst-001', '  Main Entrance  ')
    expect(result).not.toBeNull()
    expect(result!.find(t => t.id === 'hst-001')!.name).toBe('Main Entrance')
  })

  it('rejects empty name', () => {
    const templates = baseTemplates()
    expect(applyRenameTemplate(templates, 'hst-001', '')).toBeNull()
  })

  it('rejects whitespace-only name', () => {
    const templates = baseTemplates()
    expect(applyRenameTemplate(templates, 'hst-001', '  ')).toBeNull()
  })

  it('rejects duplicate name (case-insensitive, excluding self)', () => {
    const templates = baseTemplates()
    expect(applyRenameTemplate(templates, 'hst-001', 'interior door')).toBeNull()
  })

  it('allows renaming to same name with different case (self)', () => {
    const templates = baseTemplates()
    const result = applyRenameTemplate(templates, 'hst-001', 'ENTRANCE SYSTEM')
    expect(result).not.toBeNull()
    expect(result!.find(t => t.id === 'hst-001')!.name).toBe('ENTRANCE SYSTEM')
  })

  it('returns null for non-existent id', () => {
    const templates = baseTemplates()
    expect(applyRenameTemplate(templates, 'hst-999', 'New Name')).toBeNull()
  })
})

// ── deleteTemplate ─────────────────────────────────────────────

describe('applyDeleteTemplate', () => {
  it('removes a template by id', () => {
    const templates = baseTemplates()
    const result = applyDeleteTemplate(templates, 'hst-001')
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe('hst-002')
  })

  it('returns unchanged array for non-existent id', () => {
    const templates = baseTemplates()
    const result = applyDeleteTemplate(templates, 'hst-999')
    expect(result).toHaveLength(2)
  })

  it('does not mutate the original array', () => {
    const templates = baseTemplates()
    const original = [...templates]
    applyDeleteTemplate(templates, 'hst-001')
    expect(templates).toEqual(original)
  })
})

// ── toggleTemplateItem ─────────────────────────────────────────

describe('applyToggleTemplateItem', () => {
  it('adds a hardware item with quantity 1 when not present', () => {
    const templates = baseTemplates()
    const result = applyToggleTemplateItem(templates, 'hst-001', 'dhw-005')
    expect(result).not.toBeNull()
    const tmpl = result!.find(t => t.id === 'hst-001')!
    expect(tmpl.items).toHaveLength(3)
    expect(tmpl.items[2]).toEqual({ hardwareId: 'dhw-005', quantity: 1 })
  })

  it('removes a hardware item when already present', () => {
    const templates = baseTemplates()
    const result = applyToggleTemplateItem(templates, 'hst-001', 'dhw-001')
    expect(result).not.toBeNull()
    const tmpl = result!.find(t => t.id === 'hst-001')!
    expect(tmpl.items).toHaveLength(1)
    expect(tmpl.items.find(i => i.hardwareId === 'dhw-001')).toBeUndefined()
  })

  it('returns null for non-existent template id', () => {
    const templates = baseTemplates()
    expect(applyToggleTemplateItem(templates, 'hst-999', 'dhw-001')).toBeNull()
  })
})

// ── updateTemplateItemQuantity ─────────────────────────────────

describe('applyUpdateTemplateItemQuantity', () => {
  it('updates quantity on an existing item', () => {
    const templates = baseTemplates()
    const result = applyUpdateTemplateItemQuantity(templates, 'hst-001', 'dhw-001', 5)
    expect(result).not.toBeNull()
    const tmpl = result!.find(t => t.id === 'hst-001')!
    expect(tmpl.items.find(i => i.hardwareId === 'dhw-001')!.quantity).toBe(5)
  })

  it('enforces minimum quantity of 1', () => {
    const templates = baseTemplates()
    const result = applyUpdateTemplateItemQuantity(templates, 'hst-001', 'dhw-001', 0)
    expect(result).not.toBeNull()
    const tmpl = result!.find(t => t.id === 'hst-001')!
    expect(tmpl.items.find(i => i.hardwareId === 'dhw-001')!.quantity).toBe(1)
  })

  it('enforces minimum quantity of 1 for negative values', () => {
    const templates = baseTemplates()
    const result = applyUpdateTemplateItemQuantity(templates, 'hst-001', 'dhw-001', -3)
    expect(result).not.toBeNull()
    const tmpl = result!.find(t => t.id === 'hst-001')!
    expect(tmpl.items.find(i => i.hardwareId === 'dhw-001')!.quantity).toBe(1)
  })

  it('rounds to integer', () => {
    const templates = baseTemplates()
    const result = applyUpdateTemplateItemQuantity(templates, 'hst-001', 'dhw-001', 2.7)
    expect(result).not.toBeNull()
    const tmpl = result!.find(t => t.id === 'hst-001')!
    expect(tmpl.items.find(i => i.hardwareId === 'dhw-001')!.quantity).toBe(3)
  })

  it('returns null for non-existent template id', () => {
    const templates = baseTemplates()
    expect(applyUpdateTemplateItemQuantity(templates, 'hst-999', 'dhw-001', 5)).toBeNull()
  })

  it('returns null for non-existent hardware id in template', () => {
    const templates = baseTemplates()
    expect(applyUpdateTemplateItemQuantity(templates, 'hst-001', 'dhw-999', 5)).toBeNull()
  })

  it('does not mutate the original array', () => {
    const templates = baseTemplates()
    const original = templates.map(t => ({ ...t, items: t.items.map(i => ({ ...i })) }))
    applyUpdateTemplateItemQuantity(templates, 'hst-001', 'dhw-001', 5)
    expect(templates).toEqual(original)
  })
})
