# Phase 4: UI Components - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Takeoff view UI for door hardware: a compact sub-row below door line items showing selected hardware, a door hardware editing section in the expanded panel with checkboxes and quantity inputs, a cost breakdown sub-line for door hardware, and a "Reset to Defaults" button. No new hooks, no calc changes, no data model changes — those are complete from Phases 1-3.

</domain>

<decisions>
## Implementation Decisions

### Sub-row layout
- Inline chips format: `🔧 Hinges×3  Closer×1  Handle×1  Lock×1  ...  $285`
- Always visible for door line items (no toggle/collapse) — hardware is core to door estimation
- Chips wrap to second line when many items (e.g., Entrance System with 7 items)
- Subtle indent + muted color: left-indented, text-gray-500, slightly smaller font (text-xs), thin top border separator
- Chips show name + quantity only, hardware subtotal at the end of the row
- Sub-row does NOT appear for non-door line items

### Hardware editing UX
- All editing in the expanded detail panel only — sub-row is read-only display
- Checkbox + quantity input pattern: all 12 door hardware items listed, checked items are in the selection, unchecked are available to add
- Quantity input appears next to checked items; unchecked items show just the unit cost
- Door hardware section replaces generic hardware section for door line items — doors don't use setting blocks/corner keys
- Non-door line items continue to show the existing generic hardware checkboxes
- When checking a new item, default quantity is 1 (simple, predictable)

### Cost breakdown detail
- Door hardware cost shown as an indented sub-line under Material in the expanded cost breakdown
- Two sub-lines for door items: "Glass + Frame" and "Door Hardware" under the Material total
- Sub-line breakdown only appears for door line items — non-door items keep the simple "Material" line
- Sub-row chips show name + quantity only (no per-item cost), with hardware subtotal at the right end

### Reset to Defaults
- Button lives in the expanded panel, below the door hardware checkbox list
- No confirmation dialog — immediate reset on click. Low-stakes action, estimator can re-add items
- Button always enabled (even when already at defaults) — simpler logic, clicking is a no-op if already matching

### Claude's Discretion
- Exact chip styling (border radius, padding, colors)
- How to extract LineItemRow sub-components (DoorHardwareSubRow, DoorHardwarePanel) vs inline
- Whether to create new component files or keep everything in TakeoffView.tsx
- Exact layout of the checkbox + qty input grid in the expanded panel
- How to wire useDoorHardware hook into the existing LineItemRow component

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `LineItemRow` (memo'd) in `TakeoffView.tsx` — collapsed row + expanded panel, this is where sub-row and editing section are added
- `useDoorHardware(projectId, lineItemId)` in `src/hooks/use-door-hardware.ts` — provides `addDoorHardware`, `removeDoorHardware`, `updateDoorHardwareQty`
- `isDoorSystemType()` from `@/calc` — used to conditionally render sub-row and door hardware section
- `formatCurrency()` from `@/calc` — for hardware subtotal and cost display
- `ConfirmDialog` in `src/components/ConfirmDialog.tsx` — available but NOT needed (reset has no confirmation)
- `DOOR_HARDWARE_DEFAULTS` from `@/data` — used by reset-to-defaults logic
- Existing `toggleArray` helper in LineItemRow — pattern for checkbox interactions (door hardware needs a different approach with quantity)

### Established Patterns
- Expanded panel uses 2-column grid (`grid grid-cols-2 gap-4`) with sections: Description, Conditions, Hardware, Equipment, Cost Breakdown
- Generic hardware uses checkboxes with `toggleArray('hardwareIds', id)` — door hardware needs checkboxes + quantity inputs
- Cost breakdown uses `flex justify-between` rows with `text-gray-500` labels and formatted values
- Collapsed row is `flex items-center gap-2 px-3 py-2` with selects, inputs, and action buttons
- Validation errors shown as a conditional border-t section between collapsed row and expanded panel

### Integration Points
- `LineItemRow` component — add sub-row between collapsed row and expanded panel
- Expanded panel grid — replace generic hardware section with door hardware section when `isDoorSystemType`
- Cost breakdown section — add sub-lines under Material when `isDoorSystemType`
- `LineItemRowProps` — may need `projectId` prop to pass to `useDoorHardware` hook
- `TakeoffView` — needs to pass `projectId` (from `id` param) to LineItemRow

</code_context>

<specifics>
## Specific Ideas

No specific requirements — follow existing TakeoffView patterns. The sub-row is a new visual pattern but should feel native to the existing line item card design.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-ui-components*
*Context gathered: 2026-03-03*
