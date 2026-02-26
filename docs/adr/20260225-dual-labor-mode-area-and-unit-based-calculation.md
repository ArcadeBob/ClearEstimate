# Dual labor mode: area-based and unit-based calculation

- Status: accepted
- Date: 2026-02-25
- Tags: module-boundary, calc-engine, labor
- Refs: SPEC.md §2.1, D-01, C-020, C-021, C-022

## Context and Problem Statement

The Phase 1 calc engine used a single labor model: `laborHoursPerUnit` stored on `FrameSystem`. A discovery interview with the CGI estimator revealed this is fundamentally wrong for the glazing industry.

**Panel systems** (storefront, curtain wall, window wall) are estimated using **SF/MH (square feet per man-hour)** — a productivity rate tied to the system type, not the frame manufacturer. The area of glass drives the labor, not the unit count.

**Discrete items** (doors, railings, revolving doors) are estimated using **hours per unit** — it takes N hours to install one door regardless of its square footage.

The calc engine needs to support both models, selected per system type.

## Decision

Add a `laborMode: 'area' | 'unit'` discriminant field to `SystemType`. Each system type carries either `sfPerManHour` (for area mode) or `hoursPerUnit` (for unit mode).

The labor calc module (`labor-calc.ts`) branches on `laborMode`:
- **Area:** `baseManHours = sqft / sfPerManHour`
- **Unit:** `baseManHours = hoursPerUnit × quantity`

Both paths then share the same downstream pipeline: `adjustedManHours → totalManHours → laborCost → crewDays`.

The `laborHoursPerUnit` field is removed from `FrameSystem` — labor is now driven entirely by `SystemType`.

## Considered Alternatives

### A. Area-only model (SF/MH for everything)
Convert door installations to an equivalent SF/MH rate. Rejected because it produces absurd rates for small discrete items (a 3×7 door at 10 hours = 2.1 SF/MH, which is meaningless as a productivity metric).

### B. Keep hours-per-unit on FrameSystem
The existing model. Rejected because (1) labor productivity is tied to the *system type* not the frame manufacturer — two different Kawneer frames for the same storefront system have the same labor rate, and (2) it conflates material pricing (frame cost/LF) with labor (hours/unit).

### C. Per-line-item labor mode override
Let each line item choose its own labor mode. Rejected as unnecessary complexity — the system type determines the mode, and there's no real-world case where the same system type would use both modes.

## Consequences

### Positive
- Matches industry-standard estimating practice (SF/MH for panels, hours/unit for discrete items)
- System type is the single source of truth for labor calculation method
- Frame systems become purely a material pricing entity (cost/LF only)
- Seed data maps cleanly to the user's reference document

### Negative
- Every existing line item must be recalculated after migration (crewDays values will change)
- The Takeoff UI must show different labor info depending on mode (SF/MH vs hrs/unit)
- Settings > Systems tab needs conditional columns (show SF/MH or Hours/Unit based on mode)
- 15 of 21 system types use area mode; 6 use unit mode — the mapping must be correct in seed data
