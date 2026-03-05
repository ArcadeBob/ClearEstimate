# Phase 8: Template Application in Edit Panel - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Dropdown picker to apply saved hardware templates to door line items in the DoorHardwarePanel. Selecting a template replaces the line item's current hardware selection with the template's items and quantities. User can modify individual items after applying. Template management (CRUD) is Phase 7.

</domain>

<decisions>
## Implementation Decisions

### Picker placement & style
- Template dropdown appears above the hardware checkbox list, below the "Door Hardware" label
- User picks template first, then fine-tunes individual items in the checklist below
- Each dropdown option shows template name + item count (e.g., "Entrance System (5 items)")
- Dropdown always shows "Apply Template..." placeholder — no "current template" state since templates are one-shot
- Hidden entirely when no templates exist (picker appears once user creates first template in Settings)

### Apply behavior
- Instant replace — selecting a template immediately replaces doorHardware on the line item, no confirmation dialog
- Template quantities win — if template says 3 hinges, apply 3 regardless of door height (no smart hinge override post-apply)
- Immediate recalc via existing pattern: replace doorHardware → calcFullLineItem → VE cascade → timestamp
- Dropdown resets to "Apply Template..." placeholder after selection

### Relationship to Reset button
- Keep both controls: template picker above checklist, "Reset to Defaults" stays at bottom
- Two distinct actions: "Apply Template" replaces with a saved template, "Reset to Defaults" restores door-type defaults
- Both useful in different contexts — no merging

### Edge states
- No templates: hide picker entirely — no empty/disabled dropdown
- Stale references: skip missing hardware items silently — apply only items that still exist in the catalog
- Scope: template picker only appears on door line items (inside DoorHardwarePanel, gated by isDoorSystemType)

### Claude's Discretion
- Control type (native select vs custom button menu) — match existing form patterns
- Reset button label (keep as-is or rename for clarity)
- Exact styling and spacing of the picker relative to checklist
- Post-apply visual feedback (if any)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches matching existing DoorHardwarePanel patterns.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DoorHardwarePanel` component (TakeoffView.tsx:591-642): Existing panel where picker will be added — has checkbox list, Reset to Defaults button
- `useHardwareTemplates` hook: Provides `templates` array from `state.settings.hardwareTemplates`
- `useDoorHardware` hook: Has `applyMutation` pattern that replaces doorHardware, recalcs, and cascades VE alternates
- `HardwareSetTemplate` type: `{ id, name, items: DoorHardwareEntry[] }` — already defined
- `settings.doorHardware`: 12-item catalog for validating template item references

### Established Patterns
- `onReset` callback in DoorHardwarePanel already replaces doorHardware wholesale: `onUpdate(item.id, { doorHardware: getDefaultDoorHardware(...) })` — template apply follows same pattern
- `applyMutation` in useDoorHardware handles recalc + VE cascade + timestamp for any doorHardware change
- Form controls in edit panel use Tailwind utility classes with consistent sizing (text-xs, small inputs)
- `isDoorSystemType()` utility gates door-specific UI

### Integration Points
- `DoorHardwarePanel` component: Add template picker dropdown above checkbox list
- `DoorHardwarePanelProps`: May need `templates` prop or access `useHardwareTemplates` within component
- `LineItemRow` (TakeoffView.tsx:301): Where useDoorHardware is called — template apply callback wired here
- `onUpdate` callback: Existing mechanism to update line item fields with recalc — used by Reset to Defaults

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-template-application-in-edit-panel*
*Context gathered: 2026-03-04*
