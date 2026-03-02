# Testing Patterns

**Analysis Date:** 2026-03-01

## Test Framework

**Runner:**
- Vitest 4.0.18 with `globals: true` (no need to import `describe`/`it`/`expect`)
- Config: `vite.config.ts` imports from `vitest/config` (not `vite`) and includes `test: { globals: true, environment: 'node', include: ['src/**/*.test.ts'] }`
- Default environment: `node` (use `// @vitest-environment jsdom` pragma for DOM/localStorage tests)

**Assertion Library:**
- Vitest built-in `expect()` (uses Chai assertions)

**Run Commands:**
```bash
npm test                      # Run all tests (vitest run)
npm run test:watch            # Run tests in watch mode (vitest)
npx vitest run src/calc/material-calc.test.ts  # Run single test file
npm run verify                # Run 37-assertion calc verification script (vite-node scripts/verify-calc.ts)
```

## Test File Organization

**Location:**
- Co-located with source files (not in separate test directory)
- Same directory as implementation: `src/calc/material-calc.test.ts` next to `src/calc/material-calc.ts`

**Naming:**
- Pattern: `*.test.ts` (e.g., `material-calc.test.ts`, `storage-service.test.ts`)
- Not used: `.spec.ts` suffix

**Structure:**
```
src/
├── calc/
│   ├── material-calc.ts
│   ├── material-calc.test.ts
│   ├── labor-calc.ts
│   ├── labor-calc.test.ts
│   └── ... (8 calc modules with tests)
├── storage/
│   ├── storage-service.ts
│   └── storage-service.test.ts
├── hooks/
│   ├── use-line-items.ts
│   └── validate-line-item.test.ts
```

## Test Structure

**Suite Organization:**

```typescript
import { calcSqft, calcPerimeter, calcMaterialCost } from './material-calc'
import type { Hardware } from '@/types'

describe('calcSqft', () => {
  it('computes sqft for 48x96 qty 1', () => {
    expect(calcSqft(48, 96, 1)).toBe(32)
  })

  it('scales by quantity', () => {
    expect(calcSqft(48, 96, 2)).toBe(64)
  })
})

describe('calcPerimeter', () => {
  it('computes perimeter for 48x96 qty 1', () => {
    expect(calcPerimeter(48, 96, 1)).toBe(24)
  })
})

describe('calcMaterialCost', () => {
  it('computes glass + frame cost without hardware', () => {
    expect(calcMaterialCost(32, 24, 15.0, 9.85, [], 1)).toBe(716.4)
  })
})
```

See: `src/calc/material-calc.test.ts`

**Patterns:**
- Top-level `describe('FunctionName')` for each exported function
- `it('descriptive behavior')` tests within each suite
- Each test is isolated and tests one behavior
- Comments in test body explain calculations: `// sqft=32, perim=24, glass=$15/SF, frame=$9.85/LF; 32*15 + 24*9.85 = 480 + 236.40 = 716.40`

**Constraint References in Tests:**
- Include constraint ID in test description when enforcing a specific business rule:
  ```typescript
  it('includes hardware cost multiplied by quantity (C-002)', () => {
    // ...
  })

  it('rounds to 2 decimal places (C-017)', () => {
    // ...
  })
  ```
  See: `src/calc/material-calc.test.ts` lines 52, 66

- Links constraint ID to test implementation for traceability

## Test Setup & Teardown

**Setup:**
- No global setup (each test file is independent)
- Storage tests use `beforeEach()` to reset localStorage:
  ```typescript
  describe('storage-service', () => {
    beforeEach(() => {
      localStorage.clear()
    })
  })
  ```
  See: `src/storage/storage-service.test.ts` lines 8–10

**Teardown:**
- No explicit teardown in most tests
- Storage tests clear localStorage in `beforeEach()` (covers both setup and isolation)

## Factory Functions

**Test Data:**
- Each test file defines its own minimal factory helpers inline
- No shared test utilities across files

**Example — Summary Calc Tests:**
```typescript
// Factory: minimal valid line item
function lineItem(overrides: Partial<LineItem> = {}): LineItem {
  return {
    id: 'li-1', systemTypeId: 'sys-001', glassTypeId: 'glass-001',
    frameSystemId: 'frame-001', description: '', quantity: 1,
    widthInches: 48, heightInches: 96, sqft: 32, perimeter: 24,
    materialCost: 716.40, laborCost: 163.43, equipmentCost: 0,
    lineTotal: 879.83, conditionIds: [], crewDays: 0.375, manHours: 0,
    equipmentIds: [], hardwareIds: [],
    ...overrides,
  }
}

// Factory: minimal project
function project(overrides: Partial<Project> = {}): Project {
  return {
    id: 'test', name: 'Test', clientName: '', bidDate: '', status: 'Bidding',
    address: '', projectManager: '', estimator: '', prevailingWage: false,
    overheadPercent: 10, profitPercent: 10,
    lineItems: [lineItem()],
    veAlternates: [],
    scopeDescriptions: [],
    timestamps: { createdAt: '', updatedAt: '' },
    ...overrides,
  }
}

// Usage:
const p = project({ lineItems: [lineItem({ id: 'li-2', lineTotal: 0 })] })
```

See: `src/calc/summary-calc.test.ts` lines 10–35

**Benefits of inline factories:**
- Minimal boilerplate
- Only what's needed for each test file
- Easy to see test data structure alongside tests
- No shared state between files

## Assertion Patterns

**Basic assertions:**
```typescript
expect(calcSqft(48, 96, 1)).toBe(32)                    // Exact match
expect(calcLoadedRate(38.50, 0.35, 2.50)).toBeCloseTo(54.475, 3)  // Float tolerance
expect(state.projects).toHaveLength(1)                  // Array length
expect(result.isValid).toBe(true)                       // Boolean
expect(result.errors).toContain('System type required') // Includes
expect(state.projects).toEqual([])                      // Deep equality
```

**Error path assertions:**
```typescript
it('returns default state on corrupted JSON (B-005)', () => {
  localStorage.setItem(STORAGE_KEY, 'not-valid-json{{{')
  const state = loadAppState()
  expect(state.schemaVersion).toBe(2)
  expect(state.projects).toEqual([])
})
```

See: `src/storage/storage-service.test.ts` lines 30–35

## Test Coverage

**Requirements:** Not enforced (no coverage threshold configured)

**Testing approach:**
- Focus: Pure calculation functions are heavily tested (8 calc modules, 674 lines of test code)
- Hooks: Validation and critical state logic tested
- Components: Minimal testing (primarily calculation-driven)
- Storage: Full coverage of load/save/migrate paths

**View coverage:** 674 lines of test code across 11 test files for ~1000 lines of calc code (67% ratio)

## Test Types

**Unit Tests:**
- Scope: Individual pure functions (calc functions)
- Approach: Arrange-act-assert pattern with known inputs
- Example: `calcSqft(48, 96, 1)` expects `32`
- Coverage: All calc modules (`material-calc`, `labor-calc`, `equipment-calc`, `op-suggest`, `summary-calc`, `benchmark-calc`, `win-rate-calc`)

**Hook Tests:**
- Scope: Validation logic (`validateLineItem`)
- Approach: Test validator return types and error accumulation
- Example: `validateLineItem(validItem({ systemTypeId: '' }))` should mark invalid
- See: `src/hooks/validate-line-item.test.ts` lines 16–65

**Integration Tests:**
- Scope: Storage layer (load, save, migrate)
- Approach: Mock localStorage, test state transitions
- Example: Corrupt JSON → default state recovery
- See: `src/storage/storage-service.test.ts` lines 37–73

**E2E Tests:**
- Framework: Not used
- Manual verification: `npm run verify` runs 37-assertion calc verification script (`scripts/verify-calc.ts`)

## Common Patterns

**Async Testing:**
Not used in current tests (no async calc or hook logic)

**Error Testing:**
```typescript
it('returns default state on corrupted JSON (B-005)', () => {
  localStorage.setItem(STORAGE_KEY, 'not-valid-json{{{')
  const state = loadAppState()
  expect(state.schemaVersion).toBe(2)
  expect(state.projects).toEqual([])
})
```

See: `src/storage/storage-service.test.ts` lines 30–35

**Guard Clause Testing:**
```typescript
it('returns 0 when sfPerManHour is 0 (C-043 div-by-zero guard)', () => {
  expect(calcBaseManHoursArea(32, 0)).toBe(0)
})

it('returns amber when sqft is 0 (division guard)', () => {
  expect(calcBenchmark(1000, 0, curtainWall)).toBe('amber')
})
```

See: `src/calc/labor-calc.test.ts` line 36 and `benchmark-calc.test.ts` line 40

**Edge Case Testing:**
- Zero and negative values
- Boundary conditions (exact min/max)
- Type coercion (large numbers, decimals)
- Example: `expect(formatCurrency(99.999)).toBe('$100.00')` (rounding)
- See: `src/calc/format-currency.test.ts` lines 16–18

**Constraint-Linked Testing:**
Tests explicitly reference constraint IDs in descriptions and comments to maintain traceability to CONSTRAINTS.md. For example:
- `(C-002)` — Hardware cost calculation
- `(C-017)` — Currency formatting and rounding
- `(C-043)` — Division-by-zero guards

This makes it easy to find which tests enforce which constraints.

## DOM/localStorage Tests

**Environment Setup:**
Tests that need DOM or localStorage use the jsdom environment:

```typescript
// @vitest-environment jsdom
import { loadAppState, saveAppState, resetAppState } from './storage-service'
import { createDefaultAppState } from '@/data'

const STORAGE_KEY = 'cgi_estimating_app_v1'

describe('storage-service', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  // ...
})
```

See: `src/storage/storage-service.test.ts` lines 1–10

The pragma `// @vitest-environment jsdom` at the top of the file switches environment from default `node` to `jsdom`.

## Test Statistics

- **Total test files:** 11
- **Total test lines:** 674 (across all `.test.ts` files)
- **Modules tested:**
  - `src/calc/material-calc.test.ts` — 76 lines
  - `src/calc/labor-calc.test.ts` — 84 lines
  - `src/calc/equipment-calc.test.ts` — 47 lines
  - `src/calc/op-suggest.test.ts` — 40 lines
  - `src/calc/summary-calc.test.ts` — 130 lines
  - `src/calc/benchmark-calc.test.ts` — 50 lines
  - `src/calc/win-rate-calc.test.ts` — 38 lines
  - `src/calc/format-currency.test.ts` — 28 lines
  - `src/storage/storage-service.test.ts` — 105 lines
  - `src/hooks/validate-line-item.test.ts` — 67 lines

---

*Testing analysis: 2026-03-01*
