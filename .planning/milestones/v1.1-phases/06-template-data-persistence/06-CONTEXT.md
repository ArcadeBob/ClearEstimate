# Phase 6: Template Data & Persistence - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Type definitions, storage schema, and persistence plumbing for hardware set templates. A HardwareSetTemplate type exists with name, hardware items, and quantities. Templates are stored in AppSettings and survive browser refresh via localStorage. Schema migration v3->v4 preserves existing user data.

Phase 7 handles CRUD UI in Settings. Phase 8 handles the template picker dropdown in the edit panel.

</domain>

<decisions>
## Implementation Decisions

### Template fields
- Name + hardware items (DoorHardwareEntry[]) only — no description, no timestamps, no isDefault flag
- Template names must be unique (enforced at the data model level, validated in Phase 7 UI)
- All templates are equal — no distinction between seed and user-created templates

### Seed templates
- Ship 4 pre-built seed templates based on existing DOOR_HARDWARE_DEFAULTS: "Entrance System", "Revolving Door", "Sliding Door", "Swing Door"
- Seed template names match existing system type names for familiarity
- DOOR_HARDWARE_DEFAULTS (auto-populate on door type selection) continues to work alongside templates — two independent paths
- Migration v3->v4 adds seed templates to existing users' settings (not just new users)

### Template-door type association
- Generic templates — no door type association. Any template can be applied to any door type
- Applying a template is a one-shot replace — no template ID stored on the line item, no link back

### Claude's Discretion
- Template ID format and generation strategy (consistent with existing ID patterns like `dhw-xxx`)
- Exact placement within AppSettings interface (likely `hardwareTemplates: HardwareSetTemplate[]`)
- Migration implementation details (additive v3->v4, following existing pattern)
- Whether to add a barrel re-export for template types

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The template type should be minimal and match the existing `DoorHardwareEntry` pattern for hardware items.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DoorHardwareEntry` interface: Already defines `{ hardwareId: string, quantity: number }` — templates reuse this exact shape for their hardware items
- `DOOR_HARDWARE_DEFAULTS` in `seed-door-hardware.ts`: Record<string, DoorHardwareEntry[]> — source data for seed templates
- `Hardware` interface: The catalog items referenced by `hardwareId` in door hardware entries

### Established Patterns
- Schema migration: Sequential version bump in `storage-service.ts` (v1->v2, v2->v3 pattern). v3->v4 follows the same additive approach
- Seed data: `src/data/seed-*.ts` files with UPPER_SNAKE_CASE exports, re-exported through `src/data/index.ts` barrel
- AppSettings: Array-of-objects pattern (e.g., `glassTypes: GlassType[]`, `doorHardware: Hardware[]`)
- ID format: Prefix-dash-number (e.g., `dhw-001`, `sys-006`)
- `createDefaultAppState()` in `src/data/index.ts`: Assembles DEFAULT_SETTINGS from all seed data

### Integration Points
- `AppSettings` in `src/types/index.ts`: New `hardwareTemplates` array added here
- `storage-service.ts`: Migration function gets v3->v4 block, CURRENT_SCHEMA_VERSION bumps to 4
- `src/data/index.ts`: DEFAULT_SETTINGS includes seed templates, new seed file re-exported
- `src/data/seed-door-hardware.ts` or new `seed-hardware-templates.ts`: Seed template data defined here

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-template-data-persistence*
*Context gathered: 2026-03-04*
