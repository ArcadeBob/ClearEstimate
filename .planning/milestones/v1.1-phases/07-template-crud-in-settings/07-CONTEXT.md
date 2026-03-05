# Phase 7: Template CRUD in Settings - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can fully manage hardware set templates from the Settings view: create new templates (name + hardware items with quantities), rename existing templates, edit which hardware items and quantities are in a template, and delete templates. All changes persist immediately via localStorage.

Phase 6 handled template types and storage. Phase 8 handles the template picker dropdown in the edit panel.

</domain>

<decisions>
## Implementation Decisions

### Template editing UI
- Inline expand pattern — click a template row to expand it, revealing the hardware item picker and quantities below
- Checkbox list for hardware items — show all door hardware items as checkboxes with quantity inputs (mirrors the door hardware pattern in TakeoffView)
- Checked = included in template, unchecked = not included
- Auto-save — changes persist immediately as user checks/unchecks items and adjusts quantities, consistent with all other Settings tabs (no Save/Cancel buttons)

### New template creation
- New templates start empty — just a name field with no hardware items pre-checked
- User builds the hardware selection from scratch via the checkbox list
- "+ New Template" button below the template list (follows existing "+ Add Row" pattern)

### Tab placement & navigation
- New "Templates" tab added to the Settings tab bar
- Placed last in tab order (after Equipment) — least disruptive to existing layout
- Tab label: "Templates" (short, clear in context of Settings)

### Template list display
- Each template row shows: template name + item count (e.g., "5 items")
- Item count gives a quick sense of template complexity at a glance
- Delete button per row (consistent with other Settings tables)

### Claude's Discretion
- Delete safeguards — confirm dialog for delete (consistent with existing ConfirmDialog pattern), no referential integrity check needed (templates have no back-reference to line items)
- Name validation UX — inline validation for duplicate and empty names (Phase 6 decided names must be unique)
- Expanded area layout details — exact spacing, typography, checkbox styling
- Rename UX — inline editing of template name (consistent with other Settings tables' inline editing pattern)
- Template item quantity input constraints (min 1, integer only, etc.)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches matching existing Settings patterns.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SettingsTable` component in `SettingsView.tsx`: Generic table with inline editing, add/delete — template list can follow similar structure but needs custom expanded row
- `ConfirmDialog` component: Already used for Settings delete confirmation — reuse for template deletion
- `useSettings` hook: Provides `addItem`, `updateItem`, `deleteItem` with `setState` pattern — will need template-specific CRUD methods or extension
- `HardwareSetTemplate` type: Already defined in `types/index.ts` with `id`, `name`, `items: DoorHardwareEntry[]`
- `settings.doorHardware`: 12-item catalog (dhw-xxx IDs) — source for the checkbox list in template editing

### Established Patterns
- Settings tabs: Tab bar with `TabName` union type and conditional rendering per tab — add 'templates' to the union
- Inline editing: All Settings tables use inline inputs that call `updateItem` on change — auto-save, no explicit commit
- ID generation: `uuid v4` via `useSettings.addItem` — templates follow the same pattern
- Delete with confirmation: `setDeleteTarget` + `ConfirmDialog` pattern in SettingsView

### Integration Points
- `SettingsView.tsx`: Add 'templates' to `TabName` union, add tab to `TABS` array, add tab content section
- `useSettings.ts`: May need template-specific methods (add/update/delete template, update template items) since template CRUD is more complex than flat item CRUD
- `settings.hardwareTemplates`: Already exists on `AppSettings` (added in Phase 6)
- `settings.doorHardware`: Read-only source for the hardware item checkbox list

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-template-crud-in-settings*
*Context gathered: 2026-03-04*
