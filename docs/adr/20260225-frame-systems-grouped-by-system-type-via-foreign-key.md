# Frame systems grouped by system type via foreign key

- Status: accepted
- Date: 2026-02-25
- Tags: state-model, api-contract
- Refs: SPEC.md §1.2, D-08, D-09, C-037, C-038, C-039

## Context and Problem Statement

In Phase 1, `FrameSystem` and `SystemType` were independent entities. The Takeoff line item form showed all frame systems in a flat dropdown regardless of the selected system type. This allowed nonsensical pairings — e.g., selecting a storefront frame with a curtain wall system type.

Additionally, `FrameSystem` carried a `laborHoursPerUnit` field that was used for labor calculation. With the new dual labor mode (see ADR for dual labor mode), labor is driven by `SystemType`, making this field dead.

## Decision

Add `systemTypeId: string` as a foreign key on `FrameSystem`, linking each frame to its parent system type. Remove `laborHoursPerUnit` from `FrameSystem`.

**UI behavior:**
- The frame dropdown in the Takeoff line item form is **filtered** to show only frames where `frame.systemTypeId === lineItem.systemTypeId`
- System type must be selected first before the frame dropdown is enabled
- If the user changes the system type on an existing line item and the current frame doesn't belong to the new system type, the frame selection is **cleared** (set to null)

**Data shape:**
```typescript
interface FrameSystem {
  id: string;
  name: string;
  systemTypeId: string;    // FK to SystemType
  costPerLinFt: number;
}
```

## Considered Alternatives

### A. Keep frames independent (flat list)
The existing model. Rejected because it allows invalid pairings that confuse the estimator and could produce misleading cost estimates.

### B. Many-to-many relationship (frames shared across system types)
A frame could belong to multiple system types via an array of systemTypeIds. More flexible but adds complexity. Rejected because in practice, frames are specific to a system type — a Kawneer Trifab 451T is a storefront frame, period.

### C. Nest frames inside SystemType as a sub-array
Instead of a FK, store frames as `SystemType.frames[]`. Rejected because it complicates the flat settings editor UI and makes frame CRUD operations awkward (need to navigate into a system type to manage its frames).

## Consequences

### Positive
- Prevents invalid frame/system pairings at the UI level
- Frame dropdown is shorter and more relevant (only compatible frames shown)
- Clean separation: `FrameSystem` = material pricing only, `SystemType` = labor + categorization
- Removing `laborHoursPerUnit` eliminates a dead field that would confuse future developers

### Negative
- Existing frame data must be migrated to include `systemTypeId` (or replaced with new seed data)
- Settings > Frames tab needs a "System Type" column (dropdown)
- If a system type is deleted, orphan frames must be handled (C-008 already prevents deleting referenced settings items)
- Changing a line item's system type can silently clear the frame selection — the UI must communicate this clearly
