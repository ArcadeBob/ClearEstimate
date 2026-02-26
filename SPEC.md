# ClearEstimate Sprint 1 — Complete Specification

## Context

ClearEstimate Phase 1 was built without a proper discovery process. A detailed technical interview with the user (estimator-manager at CGI, a glazing contractor running 8+ concurrent bids with 50+ line items each) revealed fundamental mismatches between the tool's calculation engine and industry-standard estimating practices. This spec defines Sprint 1: rebuild the calc engine to produce accurate numbers testable on real bids.

### What Stays
- 5-view structure (Dashboard, Setup, Takeoff, Summary, Settings)
- VE alternates feature (essential per user) **[C-005, C-015]**
- Auto-persist via hooks with 500ms debounced localStorage **[C-012]**
- Project duplication with ID remapping **[C-019]**
- Scope description auto-generation (descriptive only, no cost numbers) **[C-006, C-014]**
- Input validation at hook layer **[C-013]**
- Single labor rate (Glazier) per project (D-24)

### What Changes
- Labor model: SF/MH productivity (area-based) + hours/unit (count-based) dual mode **[C-020]**
- Material cost: waste factor applied project-level to material subtotal only **[C-028]**
- New project-level settings: wastePct, indirectTimePct, contingencyPct **[C-046]**
- Conditions: multiplicative factors (one per category max), penalties only **[C-023, C-034, C-035]**
- Frame systems: grouped by system type (new FK relationship) **[C-037]**
- FrameSystem: remove laborHoursPerUnit field (D-09)
- SystemType: gains sfPerManHour, hoursPerUnit, laborMode fields **[C-020, C-040, C-041]**
- SOV: contingency as separate row with show/hide toggle **[C-011, I-007]**
- Contract value formula updated to include waste, contingency, VE as separate lines **[C-032, C-044]**

### What Gets Removed
- Pie chart (and Recharts dependency) **[B-006]** (D-05)
- O&P suggestion feature **[B-008]** (D-06)
- Benchmark badges (disabled until Sprint 4 historical data) **[B-008]** (D-07)
- JSON export updates (deferred) (D-18)

---

## 1. Data Model Changes

### 1.1 SystemType (modified)

```typescript
interface SystemType {
  id: string;
  name: string;
  laborMode: 'area' | 'unit';      // NEW: determines which labor field is used [C-020]
  sfPerManHour?: number;             // NEW: used when laborMode === 'area' [C-021]
  hoursPerUnit?: number;             // NEW: used when laborMode === 'unit' [C-022]
  // benchmarkLow, benchmarkHigh — REMOVED (benchmarks disabled)
}
```

**Validation:** When laborMode is 'area', sfPerManHour must be > 0 **[C-040]**. When laborMode is 'unit', hoursPerUnit must be > 0 **[C-041]**.

**Seed data SF/MH rates:**

| System Type | Labor Mode | SF/MH | Hours/Unit |
|-------------|-----------|-------|------------|
| Storefront | area | 20 | — |
| Curtain Wall - Stick Built | area | 12 | — |
| Curtain Wall - Unitized | area | 15 | — |
| Window Wall | area | 14 | — |
| Fire-Rated (20-min) | area | 9 | — |
| Fire-Rated (60-min) | area | 9 | — |
| Fire-Rated (2-hr) | area | 9 | — |
| Interior Partitions | area | 23 | — |
| Structural Glass (Canopy) | area | 7.5 | — |
| Structural Glass (Railing) | unit | — | 6 |
| All-Glass Entrance | unit | — | 10 |
| Automatic Door System | unit | — | 12 |
| Revolving Door | unit | — | 16 |
| Blast-Resistant | area | 8 | — |
| Skylight Systems | area | 10 | — |

Remaining system types from the existing 21 will be mapped to appropriate modes and rates. All editable in Settings.

### 1.2 FrameSystem (modified)

```typescript
interface FrameSystem {
  id: string;
  name: string;
  systemTypeId: string;    // NEW: FK to SystemType [C-037]
  costPerLinFt: number;
  // laborHoursPerUnit — REMOVED (D-09)
}
```

**Behavior:** In the Takeoff line item form, the frame dropdown is filtered to show only frames matching the selected system type **[C-038]**. If system type changes, the frame selection is cleared if the current frame doesn't belong to the new system type **[C-039]**.

### 1.3 Condition (modified)

```typescript
interface Condition {
  id: string;
  name: string;
  category: 'height' | 'site' | 'complexity';   // NEW: for mutual exclusivity [C-035]
  factor: number;                                  // NEW: replaces adjustmentDays [C-034]
  // adjustmentDays — REMOVED
}
```

**Rules:**
- Factor range: 0.01 to 1.00 (penalties only, no improvements > 1.0) **[C-034]**
- One condition per category per line item (mutual exclusivity within category) **[C-035]**
- Multiple conditions from different categories multiply: `productivityFactor = Π(selectedCondition.factor)` **[C-023]**
- UI: radio buttons per category, not checkboxes **[I-003]**

**Seed data:**

| ID | Category | Name | Factor |
|----|----------|------|--------|
| cond-001 | height | Ground to 2nd floor | 1.00 |
| cond-002 | height | 3rd to 5th floor | 0.875 |
| cond-003 | height | 6th to 10th floor | 0.80 |
| cond-004 | height | Above 10th floor | 0.70 |
| cond-005 | site | New construction, open site | 1.00 |
| cond-006 | site | Occupied building | 0.85 |
| cond-007 | site | Restricted access | 0.775 |
| cond-008 | site | Urban/congested site | 0.80 |
| cond-009 | complexity | Standard design | 1.00 |
| cond-010 | complexity | Complex geometry | 0.825 |
| cond-011 | complexity | Tight tolerances | 0.85 |
| cond-012 | complexity | First-time system | 0.775 |

### 1.4 Project (modified)

```typescript
interface Project {
  // ... existing fields ...
  wastePct: number;           // NEW: 0-1.00, default 0.05 (5%) [C-046]
  indirectTimePct: number;    // NEW: 0-1.00, default 0.25 (25%) [C-046]
  contingencyPct: number;     // NEW: 0-1.00, default 0.05 (5%) [C-046]
  showContingencyInSov: boolean;  // NEW: default true [I-007]
}
```

**Validation:** All percentages 0-100% (stored as 0-1.00). Hard limits enforced at input **[C-013]**.

### 1.5 LineItem (modified)

```typescript
interface LineItem {
  // ... existing fields ...
  manHours: number;           // NEW: total man-hours (replaces crewDays as primary display) [I-005]
  crewDays: number;           // KEPT: derived from manHours / 8 [C-027], used for equipment calc
  // conditionIds changes: now stores at most one ID per category [C-047]
}
```

**conditionIds behavior:** Array of condition IDs, but enforced to contain at most one condition per category **[C-035, C-047]**. When user selects a condition in a category, it replaces any existing condition in that category **[C-035-INV]**.

---

## 2. Calculation Engine

### 2.1 Labor Cost (per line item)

**Area-based systems (laborMode === 'area'):** **[C-020, C-021]**

```
sqft = (widthInches × heightInches / 144) × quantity
baseManHours = sqft / systemType.sfPerManHour              [C-021]
adjustedManHours = baseManHours / productivityFactor        [C-024]
totalManHours = adjustedManHours × (1 + project.indirectTimePct)  [C-025]
laborCost = round2(totalManHours × loadedRate)              [C-026]
crewDays = totalManHours / 8                                [C-027]
```

**Unit-based systems (laborMode === 'unit'):** **[C-020, C-022]**

```
baseManHours = systemType.hoursPerUnit × quantity           [C-022]
adjustedManHours = baseManHours / productivityFactor        [C-024]
totalManHours = adjustedManHours × (1 + project.indirectTimePct)  [C-025]
laborCost = round2(totalManHours × loadedRate)              [C-026]
crewDays = totalManHours / 8                                [C-027]
```

**Loaded rate (unchanged):** **[C-004]**

```
Standard: loadedRate = baseRate × (1 + burdenPct) + healthHourly
Prevailing wage: loadedRate = pwBaseRate × (1 + burdenPct) + pwFringeRate
```

**Productivity factor:** **[C-023]**
```
productivityFactor = Π(condition.factor for each selected condition)
// If no conditions selected, productivityFactor = 1.0
```

**Rounding rule:** Man-hours, sqft, crew-days carry full floating-point precision. Only monetary values (laborCost) round to 2 decimal places **[C-042]**.

**Indirect time is per-line-item** — baked into totalManHours before costing **[C-025]**.

### 2.2 Material Cost (per line item)

```
glassCost = sqft × glassType.costPerSqft
frameCost = perimeter × frameSystem.costPerLinFt
hardwareCost = Σ(hardware.unitCost × lineItem.quantity)     [C-002, C-016]
materialCost = round2(glassCost + frameCost + hardwareCost) [C-042]
```

**Waste is NOT applied per line item.** materialCost is the raw cost. Waste is applied project-level (see 2.5) **[C-028]**.

### 2.3 Equipment Cost (per line item)

```
equipmentCost = round2(Σ(equipment.dailyRate × crewDays))   [C-042]
```

No change from current implementation. crewDays value comes from the new labor formula **[C-027]**.

### 2.4 Line Item Total

```
lineTotal = materialCost + laborCost + equipmentCost         [C-033]
```

**lineTotal does NOT include waste, contingency, or O&P.** These are project-level **[C-033]**.

### 2.5 Project-Level Totals

**[C-044]** — Order of operations:

```
materialSubtotal = Σ(lineItem.materialCost)
laborSubtotal = Σ(lineItem.laborCost)
equipmentSubtotal = Σ(lineItem.equipmentCost)

wasteAmount = round2(materialSubtotal × project.wastePct)                   [C-028, C-029]

subtotal = materialSubtotal + laborSubtotal + equipmentSubtotal + wasteAmount

contingencyAmount = round2(subtotal × project.contingencyPct)               [C-030, C-031]

veSavings = Σ(veAlternate.savings)                                          [C-005]

adjustedSubtotal = subtotal + contingencyAmount - veSavings                 [C-045]

contractValue = round2(adjustedSubtotal × (1 + project.overheadPct) × (1 + project.profitPct))  [C-032]
```

**Order of operations:** **[C-044]**
1. Sum line item costs → raw subtotals
2. Apply waste to material subtotal **[C-029]**
3. Calculate subtotal (with waste)
4. Apply contingency to subtotal **[C-031]**
5. Deduct VE savings **[C-045]**
6. Apply O&P multiplicatively **[C-032]**

### 2.6 SOV (Schedule of Values)

Group line items by systemTypeId. Per-row: **[C-011]**
```
rowDirectCost = Σ(lineItem.lineTotal) for items in this system type
rowContractValue = round2(rowDirectCost × (1 + OH) × (1 + profit))
```

**Contingency row:** Shown as a separate row at the bottom of the SOV when `project.showContingencyInSov === true` **[I-007]**. When false, contingency is distributed proportionally:
```
rowContingencyShare = contingencyAmount × (rowDirectCost / totalDirectCost)
rowContractValue = round2((rowDirectCost + rowContingencyShare) × (1 + OH) × (1 + profit))
```

**Waste row:** Shown as a separate "Material Waste" row in the cost breakdown sidebar, not as an SOV row **[I-006]**.

---

## 3. UI Changes

### 3.1 Project Setup View

Add three new fields in a "Project Parameters" section: **[C-046]**
- **Material Waste %** — number input, default 5, range 0-25, step 0.5
- **Indirect Labor Time %** — number input, default 25, range 0-50, step 1
- **Contingency %** — number input, default 5, range 0-25, step 0.5

Add toggle:
- **Show Contingency in SOV** — checkbox, default checked **[I-007]**

**Remove:** "Suggest O&P" button and logic **[B-008]**.

### 3.2 Takeoff View

**Line item form changes:**
- System Type dropdown: required, must be selected first (determines labor mode and filters frame dropdown) **[I-004, C-020]**
- Frame System dropdown: filtered by selected system type **[C-038]**
- Conditions: radio buttons grouped by category (Height, Site, Complexity), one selection per category max, with "None" option per category **[I-003, C-035]**

**Line item detail display:**
- Show man-hours (total, with indirect) instead of just crew-days **[I-005]**
- Show productivity factor if conditions are applied **[C-023]**
- Show labor mode indicator (SF/MH or hrs/unit) **[C-020]**

**Running totals sidebar:** **[I-006]**
- Materials subtotal
- Material Waste (wastePct × materialSubtotal) **[C-029]**
- Labor subtotal
- Equipment subtotal
- **Subtotal** (with waste)
- Contingency **[C-031]**
- VE Deductions (-) **[C-045]**
- **Adjusted Subtotal**
- Overhead
- Profit
- **Contract Value** **[C-032]**

**Remove:** Benchmark badges (disabled until Sprint 4) **[B-008]**.

### 3.3 Summary View

**SOV table:** **[C-011]**
- System type rows with direct cost and contract value
- Contingency row (when showContingencyInSov is true) **[I-007]**
- Grand total row

**Cost breakdown sidebar:** **[I-006]**
- Materials
- Material Waste **[C-029]**
- Labor
- Equipment
- Subtotal
- Contingency **[C-031]**
- VE Deductions **[C-045]**
- Adjusted Subtotal
- Overhead ($ amount and %)
- Profit ($ amount and %)
- Contract Value **[C-032]**

**Remove:** Pie chart (Recharts). Can remove `recharts` and `react-is` dependencies from package.json **[B-006]**.

**Unchanged:** Scope descriptions (auto-generate, editable, purely descriptive) **[C-006, C-014]**. Print layout. JSON export (deferred).

### 3.4 Settings View

**Systems tab:**
- Add columns: Labor Mode (dropdown: area/unit), SF/MH (number, shown when area), Hours/Unit (number, shown when unit) **[C-020]**
- Validation: SF/MH > 0 when area **[C-040, C-040-INV]**, hoursPerUnit > 0 when unit **[C-041, C-041-INV]**

**Conditions tab:**
- Replace "Adjustment (days)" column with "Factor" column (number, range 0.01-1.00) **[C-034]**
- Add "Category" column (dropdown: height/site/complexity) **[C-035]**

**Frames tab:**
- Add "System Type" column (dropdown linked to system types) **[C-037]**
- Remove "Labor Hours/Unit" column (D-09)

**Glass, Hardware, Equipment, Labor tabs:** No changes.

---

## 4. Data Validation

### 4.1 Input Validation (hard limits, prevent invalid) **[C-013]**

| Field | Rule | Constraint |
|-------|------|------------|
| SystemType.sfPerManHour | > 0 when laborMode === 'area' | **[C-040]** |
| SystemType.hoursPerUnit | > 0 when laborMode === 'unit' | **[C-041]** |
| Condition.factor | 0.01–1.00 | **[C-034]** |
| Project.wastePct | 0–1.00 (displayed as 0–100%) | **[C-046]** |
| Project.indirectTimePct | 0–1.00 (displayed as 0–100%) | **[C-046]** |
| Project.contingencyPct | 0–1.00 (displayed as 0–100%) | **[C-046]** |
| LineItem.widthInches | > 0 (always required) | **[C-013]** |
| LineItem.heightInches | > 0 (always required) | **[C-013]** |
| LineItem.quantity | ≥ 1 | **[C-013]** |
| LineItem.systemTypeId | Required (must be selected first) | **[I-004]** |
| FrameSystem.costPerLinFt | ≥ 0 | **[C-013]** |
| GlassType.costPerSqft | ≥ 0 | **[C-013]** |

### 4.2 Division by Zero Protection

- `sfPerManHour` validated > 0 at input; calc function also guards with `if (sfPerManHour <= 0) return 0` **[C-043]**
- `productivityFactor` cannot be 0 (minimum condition factor is 0.01; product of any number of 0.01+ values is always > 0) **[C-034]**

### 4.3 Condition Selection Integrity

- conditionIds array enforced to have at most 3 entries (one per category) **[C-047]**
- When selecting a condition, any existing condition in the same category is replaced **[C-035-INV]**
- When a condition is deleted from Settings, remove its ID from all line items across all projects **[C-036, C-036-INV]**

---

## 5. Schema Migration

### 5.1 Version Bump

Increment `schemaVersion` in storage-service.ts **[B-005, B-007]**. On load with old version:

### 5.2 Migration Steps **[B-007]**

1. **Project fields:** Add `wastePct: 0.05`, `indirectTimePct: 0.25`, `contingencyPct: 0.05`, `showContingencyInSov: true` to all existing projects **[C-046]**
2. **SystemType:** Add `laborMode: 'area'`, `sfPerManHour: <from seed>`, remove benchmark fields. Replace entire systemTypes array with new seed data (existing user customizations lost — acceptable since tool hasn't been used on real bids) **[C-020]**
3. **FrameSystem:** Add `systemTypeId` (map existing frames to system types by name matching where possible, default to first system type). Remove `laborHoursPerUnit`. Or: replace with new seed data **[C-037]**
4. **Conditions:** Replace entirely with new seed data (factor-based). Clear all `conditionIds` from all line items across all projects **[C-034, C-035]**
5. **LineItem:** Add `manHours: 0`. Recalculate all line items after migration
6. **Remove benchmark fields** from any stored data **[B-008]**

### 5.3 Migration Strategy

Given that Phase 1 hasn't been used on real bids, the simplest migration is: **replace all settings (systemTypes, frameSystems, conditions) with new seed data, clear condition selections, add project defaults, and recalculate everything** (D-16). This avoids fragile field-by-field migration logic.

---

## 6. Removed Features

### 6.1 Pie Chart **[B-006]**
- Remove `<PieChart>` component from SummaryView
- Remove `recharts` and `react-is` from package.json dependencies
- Remove `PieSegment` type if no longer used
- Remove `calcPieData()` from summary-calc.ts

### 6.2 O&P Suggestion **[B-008]**
- Remove "Suggest O&P" button from SetupView
- Remove `op-suggest.ts` calc module
- Remove related type definitions

### 6.3 Benchmarks **[B-008]**
- Remove `BenchmarkBadge` component
- Remove benchmark ranges from SystemType
- Remove `benchmark-calc.ts` calc module
- Remove benchmark display from TakeoffView line items
- Keep the files/code structure so Sprint 4 can re-enable with historical data

### 6.4 Export Updates (D-18)
- Keep existing JSON export as-is (it will export old schema fields)
- Do not update ProjectExport type to match new calc model
- Export improvements deferred to future sprint

---

## 7. Files to Modify

### Must Change
| File | Changes |
|------|---------|
| `src/types/index.ts` | SystemType **[C-020]**, FrameSystem **[C-037]**, Condition **[C-034, C-035]**, Project **[C-046]**, LineItem type changes |
| `src/calc/labor-calc.ts` | Rewrite for dual labor mode **[C-020–C-027, C-043]** |
| `src/calc/material-calc.ts` | Remove waste from per-line — waste is now project-level **[C-028]** |
| `src/calc/line-total-calc.ts` | Update calcFullLineItem params and orchestration **[C-033]** |
| `src/calc/summary-calc.ts` | Add waste **[C-029]**, contingency **[C-031]**, updated contract value **[C-032, C-044, C-045]** |
| `src/data/seed-systems.ts` | Add sfPerManHour, hoursPerUnit, laborMode to all system types **[C-020]** |
| `src/data/seed-conditions.ts` | Replace with factor-based conditions with categories **[C-034, C-035]** |
| `src/data/seed-frames.ts` | Add systemTypeId, remove laborHoursPerUnit **[C-037]** |
| `src/data/index.ts` | Update createDefaultAppState() with new project defaults **[C-046]** |
| `src/hooks/use-line-items.ts` | Pass new params to calc, enforce condition category rules **[C-035, C-047]** |
| `src/hooks/use-projects.ts` | New project defaults for wastePct, indirectTimePct, contingencyPct **[C-046]** |
| `src/views/SetupView.tsx` | Add waste/indirect/contingency fields **[C-046]**, remove O&P suggest **[B-008]** |
| `src/views/TakeoffView.tsx` | Conditions as radio groups **[I-003]**, filtered frame dropdown **[C-038]**, man-hours display **[I-005]**, remove benchmarks **[B-008]** |
| `src/views/SummaryView.tsx` | New running totals **[I-006]**, contingency row **[I-007]**, remove pie chart **[B-006]** |
| `src/views/SettingsView.tsx` | Systems tab **[C-020, C-040, C-041]**, Conditions tab **[C-034, C-035]**, Frames tab **[C-037]** |
| `src/storage/storage-service.ts` | Schema version bump + migration logic **[B-005, B-007]** |
| `scripts/verify-calc.ts` | Rewrite all assertions for new formulas |
| `CONSTRAINTS.md` | Rewrite constraint registry for new calc model (D-17) |

### Must Remove **[B-008]**
| File | Reason |
|------|--------|
| `src/calc/op-suggest.ts` | O&P suggestion removed (D-06) |
| `src/calc/benchmark-calc.ts` | Benchmarks disabled (D-07) |
| `src/components/BenchmarkBadge.tsx` | Benchmarks disabled (D-07) |

### Must Update package.json **[B-006]**
- Remove: `recharts`, `react-is`

---

## 8. Verification Plan

### 8.1 Build Verification
- `npm run build` — 0 TypeScript errors
- `npm run dev` — App starts without errors

### 8.2 Test Case: Area-Based System (Storefront)

Verifies: **[C-020, C-021, C-024, C-025, C-026, C-027, C-002, C-042, C-029, C-031, C-032, C-044]**

**Inputs:**
- System: Storefront (laborMode: area, sfPerManHour: 20)
- Glass: 1/4" Clear Tempered ($15.00/SF)
- Frame: Kawneer Trifab 451T ($9.85/LF)
- Size: 48"W × 96"H × 1 qty
- Conditions: "3rd to 5th floor" (height, factor 0.875)
- Equipment: Boom Lift 40ft ($350/day)
- Hardware: Setting Blocks ($2.50) + Structural Silicone ($8.00)
- Project: wastePct=0.05, indirectTimePct=0.25, contingencyPct=0.05

**Expected (per line item):**
```
sqft = (48 × 96 / 144) × 1 = 32 SF
perimeter = 2 × (48 + 96) / 12 × 1 = 24 LF

materialCost = (32 × $15.00) + (24 × $9.85) + ($2.50 + $8.00) = $726.90      [C-002]

baseManHours = 32 / 20 = 1.6                                                   [C-021]
adjustedManHours = 1.6 / 0.875 = 1.828571...                                   [C-024]
totalManHours = 1.828571 × 1.25 = 2.285714...                                  [C-025]
loadedRate = $38.50 × 1.35 + $2.50 = $54.475                                   [C-004]
laborCost = round2(2.285714 × $54.475) = $124.52                               [C-026]

crewDays = 2.285714 / 8 = 0.285714...                                          [C-027]
equipmentCost = round2($350.00 × 0.285714) = $100.00

lineTotal = $726.90 + $124.52 + $100.00 = $951.42                              [C-033]
```

**Expected (project level, single line item):**
```
materialSubtotal = $726.90
wasteAmount = round2($726.90 × 0.05) = $36.35                                  [C-029]
laborSubtotal = $124.52
equipmentSubtotal = $100.00

subtotal = $726.90 + $124.52 + $100.00 + $36.35 = $987.77                      [C-044 step 3]
contingency = round2($987.77 × 0.05) = $49.39                                  [C-031]
veSavings = $0

adjustedSubtotal = $987.77 + $49.39 - $0 = $1,037.16                           [C-045]

(with 10% OH, 10% profit:)
contractValue = round2($1,037.16 × 1.10 × 1.10) = $1,254.96                   [C-032]
```

### 8.3 Test Case: Unit-Based System (All-Glass Entrance)

Verifies: **[C-020, C-022, C-024, C-025, C-026]**

**Inputs:**
- System: All-Glass Entrance (laborMode: unit, hoursPerUnit: 10)
- Glass: 1/4" Clear Tempered ($15.00/SF)
- Frame: (appropriate entrance frame, $12.00/LF)
- Size: 36"W × 84"H × 2 qty (pair of doors)
- Conditions: none (productivityFactor = 1.0) **[C-023 default]**
- Equipment: none
- Project: wastePct=0.05, indirectTimePct=0.25

**Expected:**
```
sqft = (36 × 84 / 144) × 2 = 42 SF
perimeter = 2 × (36 + 84) / 12 × 2 = 40 LF

materialCost = (42 × $15.00) + (40 × $12.00) + hardware = $630.00 + $480.00 + hardware

baseManHours = 10 × 2 = 20                                                     [C-022]
adjustedManHours = 20 / 1.0 = 20                                               [C-024]
totalManHours = 20 × 1.25 = 25                                                 [C-025]
laborCost = round2(25 × $54.475) = $1,361.88                                   [C-026]

lineTotal = materialCost + $1,361.88 + $0 (no equipment)                        [C-033]
```

### 8.4 Migration Verification **[B-007]**
- Load app with existing Phase 1 localStorage data
- Verify new project defaults are applied (wastePct=0.05, etc.) **[C-046]**
- Verify conditions are reset (conditionIds cleared) **[C-035]**
- Verify all line items are recalculated with new formulas
- Verify settings replaced with new seed data

### 8.5 Edge Case Verification
- Line item with no conditions: productivityFactor = 1.0 **[C-023]**
- Project with 0% waste, 0% contingency: formulas degenerate to current behavior (minus the old labor model)
- System type change on existing line item: frame cleared if incompatible, recalculated **[C-039, C-039-INV]**
- Delete condition from Settings: removed from all line items referencing it **[C-036, C-036-INV]**

### 8.6 Updated verify-calc.ts
Rewrite the 37-assertion script with new test cases covering:
- Area-based labor calculation **[C-021, C-024, C-025, C-026]**
- Unit-based labor calculation **[C-022, C-024, C-025, C-026]**
- Productivity factor with multiple conditions (one per category) **[C-023, C-035]**
- Waste on material subtotal (project-level) **[C-028, C-029]**
- Contingency in project totals **[C-030, C-031]**
- Full contract value calculation **[C-032, C-044]**
- Edge cases: no conditions, 0% waste, 0% contingency
- Condition category mutual exclusivity **[C-035, C-047]**

---

## 9. Decisions Log

| # | Decision | Rationale | Related Constraints |
|---|----------|-----------|---------------------|
| D-01 | Dual labor mode (area + unit) | Doors/railings use hours/unit; panels use SF/MH. Both are standard practice. | C-020, C-021, C-022 |
| D-02 | Waste is project-level on materials only | User applies single % to material subtotal. Labor and equipment don't have waste. | C-028, C-029 |
| D-03 | Conditions: one per category, penalties only | Height/site/complexity are mutually exclusive within category. Baseline (1.0) is best case. | C-023, C-034, C-035, C-047 |
| D-04 | Contingency show/hide toggle in SOV | GMP/cost-plus shows it; lump sum hides it. User needs both options. | C-011, I-007 |
| D-05 | Remove pie chart + Recharts | User says not useful for workflow. Saves 717KB bundle. | B-006 |
| D-06 | Remove O&P suggestion | User always sets O&P manually. Feature never used. | B-008 |
| D-07 | Disable benchmarks until Sprint 4 | Need historical data from real projects. Generic ranges aren't useful. | B-008 |
| D-08 | Frame systems grouped by system type | Prevents nonsensical pairings (storefront frame on curtain wall). | C-037, C-038, C-039 |
| D-09 | Remove laborHoursPerUnit from FrameSystem | Dead field — labor now driven by SystemType. | C-020 |
| D-10 | VE, contingency, waste are separate lines | Formula: `(subtotal + contingency - veSavings) × (1 + OH) × (1 + profit)` | C-044, C-045, C-032 |
| D-11 | Indirect time per-line, waste project-level | Indirect time is a labor concept (per man-hours). Waste is a material concept (on total). | C-025, C-028 |
| D-12 | System type must be selected first | Determines labor mode, filters frame dropdown, drives all downstream calc. | I-004, C-020, C-038 |
| D-13 | Round monetary values only | Man-hours, sqft, crew-days keep full precision. Only round $ to 2 decimals. | C-042 |
| D-14 | No minimum labor floor | Unrealistically small items don't occur in practice. | — |
| D-15 | PW only changes rate | No effect on productivity, indirect time, or conditions. | C-004 |
| D-16 | Replace all settings on migration | Phase 1 hasn't been used on real bids. Clean slate is safer than field-by-field migration. | B-007 |
| D-17 | Rewrite CONSTRAINTS.md | Many constraints reference the old labor model and are now invalid. | — |
| D-18 | Defer export updates | JSON export stays as-is. Focus on calc engine. | — |
| D-19 | Chrome only | No cross-browser testing required. | — |
| D-20 | Scope descriptions: descriptive only | No cost numbers in scope text. Template unchanged. | C-006, C-014 |
| D-21 | Deferred: hardware grouping by system | Hardware stays flat list for Sprint 1. Grouping in Sprint 2. | — |
| D-22 | Deferred: data lifecycle/archive | localStorage accumulation is a Phase 2 concern. | — |
| D-23 | No weather conditions | Weather risk captured by contingency, not productivity conditions. | C-034 |
| D-24 | Single labor rate (Glazier) | No crew composition complexity in Sprint 1. | C-004, C-026 |
