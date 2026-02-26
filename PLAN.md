# ClearEstimate — Sprint 1: Calc Engine Rebuild

## Context

ClearEstimate Phase 1 was built without a proper discovery process. A detailed interview with the user (estimator-manager at CGI, a glazing contractor) revealed that the calculation engine uses a fundamentally wrong labor model: "hours per unit" from the frame system, instead of the industry-standard **SF/MH (square feet per man-hour)** productivity approach tied to system type.

Additionally, the tool is missing waste factors, contingency, indirect labor time, and productivity adjustment factors — all standard elements of a glazing estimate per the user's "Commercial Glazing Cost Estimating Standards" reference document.

**Goal:** Rebuild the calc engine to produce numbers that match how CGI actually estimates, so the tool can be tested on real bids.

## Discovery Findings

- **User profile:** Estimator-manager, small team (2-3 people), high volume (8+ concurrent projects, 50+ lines each)
- **Labor calc:** SF/MH productivity per system type, not hours-per-unit from frame system
- **Burden model:** Base × (1 + burden%) + fringe — **already correct in current code**
- **Waste:** Single % per project (not per-material granularity)
- **Contingency:** Project-level %, applied before O&P
- **Takeoff organization:** By individual opening (current model is correct)
- **Key output:** Schedule of Values (SOV)
- **VE alternates:** Essential, must keep
- **Benchmarks:** Concept is right, but needs to use historical data long-term
- **Switch threshold:** Faster + more accurate + easy project reuse

## Roadmap (Approach C: Incremental)

| Sprint | Focus | Outcome |
|--------|-------|---------|
| **1 (this sprint)** | Fix calc engine | Numbers match reality; testable on real bids |
| 2 | Improve Takeoff UX | Faster data entry, keyboard-driven workflow |
| 3 | Templates & pricing library | Quick project cloning, centralized pricing |
| 4 | Historical benchmarks | Benchmark ranges from completed projects |

---

## Sprint 1 Design

### 1. Labor Cost — SF/MH Productivity Model

**Current formula:**
```
crewDays = (laborHoursPerUnit × quantity / 8) + Σ(conditionAdjustments)
laborCost = crewDays × 8 × loadedRate
```

**New formula:**
```
sqft = (widthInches × heightInches / 144) × quantity
baseManHours = sqft / sfPerManHour
adjustedManHours = baseManHours / productivityFactor   // factor < 1 means slower
totalManHours = adjustedManHours × (1 + indirectTimePct)
laborCost = totalManHours × loadedRate
crewDays = totalManHours / 8                           // for display and equipment calc
```

- `sfPerManHour` — stored on **SystemType**, not FrameSystem
- `indirectTimePct` — project-level setting (default 0.25)
- `productivityFactor` — product of all selected condition multipliers per line item
- `loadedRate` calculation unchanged: `baseRate × (1 + burdenPct) + fringeRate`

### 2. Material Cost — Waste Factor

**Current:** `materialCost = glassCost + frameCost + hardwareCost`
**New:** `materialCost = (glassCost + frameCost + hardwareCost) × (1 + wastePct)`

- `wastePct` — project-level setting (default 0.05, range 0-0.25)
- Applied to total material cost per line item (not per-material-type)

### 3. Equipment Cost — No Change

Equipment calc stays the same: `Σ(dailyRate × crewDays)`. The `crewDays` value will change because of the new labor formula, but the equipment calc logic itself is unchanged.

### 4. Contingency

New project-level setting: `contingencyPct` (default 0.05, range 0-0.25)

Applied at the project summary level:
```
subtotal = Σ(lineItem.lineTotal)
contingency = subtotal × contingencyPct
adjustedSubtotal = subtotal + contingency
contractValue = adjustedSubtotal × (1 + overheadPct) × (1 + profitPct)
```

### 5. Productivity Conditions (Replacing Crew-Day Conditions)

**Current:** Conditions are flat crew-day adjustments (+0.5, -0.75, etc.)
**New:** Conditions are multiplicative factors (0.70 to 1.00)

Seed data (from user's industry standards doc):

| ID | Category | Name | Factor |
|----|----------|------|--------|
| cond-001 | Height | Ground to 2nd floor | 1.00 |
| cond-002 | Height | 3rd to 5th floor | 0.875 |
| cond-003 | Height | 6th to 10th floor | 0.80 |
| cond-004 | Height | Above 10th floor | 0.70 |
| cond-005 | Site | New construction, open site | 1.00 |
| cond-006 | Site | Occupied building | 0.85 |
| cond-007 | Site | Restricted access | 0.775 |
| cond-008 | Site | Urban/congested site | 0.80 |
| cond-009 | Complexity | Standard design | 1.00 |
| cond-010 | Complexity | Complex geometry | 0.825 |
| cond-011 | Complexity | Tight tolerances | 0.85 |
| cond-012 | Complexity | First-time system | 0.775 |

Multiple conditions multiply: `productivityFactor = Π(selectedCondition.factor)`

### 6. System Type SF/MH Rates

Add `sfPerManHour` to each system type:

| System Type | SF/MH |
|-------------|-------|
| Storefront | 20 |
| Curtain Wall - Stick Built | 12 |
| Curtain Wall - Unitized | 15 |
| Window Wall | 14 |
| Fire-Rated (all ratings) | 9 |
| Interior Partitions | 23 |
| Structural Glass | 7.5 |
| All-Glass Entrance | 10 |

Editable in Settings > Systems.

---

## Files to Modify

### Type Definitions
- **`src/types/index.ts`** — Add `sfPerManHour` to SystemType; change Condition shape from `{ adjustmentDays }` to `{ factor, category }`; add `wastePct`, `indirectTimePct`, `contingencyPct` to Project

### Calculation Modules
- **`src/calc/labor-calc.ts`** — Rewrite `calcCrewDays()` to use SF/MH model; new `calcManHours()` function; update `calcLaborCost()`
- **`src/calc/material-calc.ts`** — Apply waste factor to `calcMaterialCost()` output
- **`src/calc/line-total-calc.ts`** — Update `calcFullLineItem()` to pass new params (sfPerManHour, indirectTimePct, wastePct, productivity factor)
- **`src/calc/summary-calc.ts`** — Add contingency to SOV/summary calculations

### Seed Data
- **`src/data/seed-systems.ts`** — Add `sfPerManHour` to all 21 system types
- **`src/data/seed-conditions.ts`** — Replace crew-day adjustments with productivity factor multipliers; add category field

### Hooks
- **`src/hooks/use-line-items.ts`** — Pass new project-level settings to calc functions
- **`src/hooks/use-projects.ts`** — Handle new project fields (wastePct, indirectTimePct, contingencyPct) with defaults

### Views
- **`src/views/SetupView.tsx`** — Add Waste %, Indirect Time %, Contingency % fields
- **`src/views/TakeoffView.tsx`** — Update line item detail to show man-hours breakdown; update conditions selector for multiplier model
- **`src/views/SummaryView.tsx`** — Add contingency row in SOV; update cost breakdown sidebar
- **`src/views/SettingsView.tsx`** — Add SF/MH column to Systems tab; update Conditions tab for factor model

### Storage
- **`src/storage/storage-service.ts`** — Bump schema version; add migration for new fields

### Verification Script
- **`scripts/verify-calc.ts`** — Update all 37 assertions to match new formulas; add new assertions for waste, contingency, indirect time, productivity factors

---

## Verification Plan

### Manual Testing
1. `npm run dev` — App starts without errors
2. Create a new project — verify new fields (Waste %, Indirect Time %, Contingency %) appear on Setup with correct defaults (5%, 25%, 5%)
3. Add a line item with known inputs:
   - System: Storefront (20 SF/MH), Glass: 1/4" Clear Tempered ($15/SF)
   - Frame: Kawneer ($9.85/LF, but hours/unit field now ignored for labor)
   - Size: 48"W × 96"H × 1 qty
   - Conditions: "3rd-5th floor" (factor 0.875)
   - Equipment: Boom Lift 40ft ($350/day)
4. Verify calculations:
   ```
   sqft = (48 × 96 / 144) × 1 = 32 SF
   baseManHours = 32 / 20 = 1.6 MH
   adjustedMH = 1.6 / 0.875 = 1.8286 MH
   totalMH = 1.8286 × 1.25 = 2.2857 MH
   laborCost = 2.2857 × $54.48 = $124.53

   materialCost = ($480.00 + $236.40 + hardware) × 1.05 (5% waste)

   crewDays = 2.2857 / 8 = 0.2857 days
   equipmentCost = $350 × 0.2857 = $100.00
   ```
5. Navigate to Summary — verify contingency row appears between subtotal and O&P
6. `npm run build` — No TypeScript errors
7. `npm run verify` — All updated assertions pass

### Calculation Verification Script
Update `scripts/verify-calc.ts` with new test cases covering:
- SF/MH labor calculation (basic case)
- Multiple conditions stacking multiplicatively
- Waste factor applied to material cost
- Indirect time added to labor hours
- Contingency in summary totals
- Edge cases: zero sqft, no conditions, 0% waste

### Existing Project Migration
- Verify that loading an existing localStorage project (from Phase 1) applies defaults for new fields
- Existing projects should get: wastePct=0.05, indirectTimePct=0.25, contingencyPct=0.05
- Existing conditions should be migrated to the new factor-based model (or reset to defaults with a migration notice)
