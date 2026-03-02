# Coding Conventions

**Analysis Date:** 2026-03-01

## Naming Patterns

**Files:**
- React components: PascalCase with `View` suffix for pages (e.g., `DashboardView.tsx`, `ProjectSetupView.tsx`)
- Shared components: PascalCase without suffix (e.g., `ConfirmDialog.tsx`, `BenchmarkBadge.tsx`)
- Calculation modules: camelCase with descriptive names (e.g., `material-calc.ts`, `labor-calc.ts`)
- Hooks: camelCase with `use-` prefix (e.g., `use-projects.ts`, `use-line-items.ts`)
- Test files: co-located with source using `.test.ts` suffix (e.g., `material-calc.test.ts`)

**Functions:**
- Named exports: camelCase (e.g., `calcMaterialCost`, `createProject`, `updateLineItem`)
- React hooks: camelCase starting with `use` (e.g., `useProjects`, `useLineItems`)
- Factory helpers in tests: camelCase (e.g., `lineItem()`, `project()`, `validItem()`)

**Variables:**
- Local state: camelCase (e.g., `expandedId`, `deleteTarget`, `veDesc`)
- Constants: UPPER_SNAKE_CASE (e.g., `STORAGE_KEY`, `CURRENT_SCHEMA_VERSION`)
- Type/interface names: PascalCase (e.g., `Project`, `LineItem`, `ConfirmDialogProps`)
- Boolean flags: prefix with `is`, `can`, `has`, `should` (e.g., `isValid`, `prevailingWage`, `shouldSuggestEquipment`)

**Types:**
- Interfaces: PascalCase (e.g., `Project`, `LineItem`, `LineItemValidation`)
- Component props interfaces: `ComponentNameProps` (e.g., `ConfirmDialogProps`, `SearchInputProps`)
- Union types: PascalCase (e.g., `ProjectStatus`)
- Type imports: `import type { ... }` (always use explicit `type` keyword)

## Code Style

**Formatting:**
- Prettier (built into Vite, runs via `npm run dev`)
- Line length: Not explicitly configured; follows Prettier defaults
- Indentation: 2 spaces
- Trailing commas: Enabled

**Linting:**
- TypeScript strict mode: Enabled in `tsconfig.app.json`
- `noUncheckedIndexedAccess: true` — array access requires bounds checking
- `noUnusedLocals: true` — all local variables must be used
- `noUnusedParameters: true` — all function parameters must be used
- `noFallthroughCasesInSwitch: true` — switch cases must have break/return
- Run check: `npm run lint` (type-checks via `tsc -b`)

## Import Organization

**Order:**
1. External libraries (React, React Router, third-party packages)
2. Internal modules from `@/` alias (types, hooks, components, calc, data)
3. CSS imports (at bottom of component files)

**Path Aliases:**
- `@/types` → `src/types/index.ts` (all type definitions)
- `@/hooks` → `src/hooks/` (all React hooks)
- `@/calc` → `src/calc/index.ts` (exported calculation functions)
- `@/components` → `src/components/`
- `@/views` → `src/views/`
- `@/data` → `src/data/index.ts`
- `@/storage` → `src/storage/`

Alias usage: Can be used in `src/**` files and tests (via `tsconfigPaths()` Vite plugin). Scripts in `scripts/` must use relative imports.

## Error Handling

**Patterns:**
- **Null coalescing for missing entities:** Use optional chaining and nullish coalescing before operations
  ```typescript
  const glass = settings.glassTypes.find(g => g.id === lineItem.glassTypeId)
  const glazier = settings.laborRates.find(l => l.role === 'Glazier') ?? settings.laborRates[0]
  if (!glass || !frame || !systemType || !glazier) return lineItem
  ```
  See: `src/calc/line-total-calc.ts`

- **JSON parse errors:** Wrap `JSON.parse()` in try-catch and return default state on failure
  ```typescript
  try {
    const parsed = JSON.parse(raw) as Partial<AppState>
    // ...
  } catch {
    return createDefaultAppState()  // Corrupted JSON — reset to defaults
  }
  ```
  See: `src/storage/storage-service.ts`

- **Division by zero:** Guard with conditional return
  ```typescript
  if (sfPerManHour <= 0) return 0  // C-043 div-by-zero guard
  return sqft / sfPerManHour
  ```
  See: `src/calc/labor-calc.ts` line 20

- **Validation before mutation:** All user input is validated before state updates
  ```typescript
  const merged = { ...li, ...updates }
  if (validateLineItem(merged).isValid) {
    return calcFullLineItem(merged, prev.settings, ...)
  }
  return merged
  ```
  See: `src/hooks/use-line-items.ts` line 77

- **Input validation:** Return `{ isValid: boolean, errors: string[] }` objects from validators
  See: `src/hooks/use-line-items.ts` lines 13–22

## Logging

**Framework:** `console` only — no logging library

**Patterns:**
- No debug logging in the codebase currently
- Errors are handled via try-catch blocks, not logged
- In future, use `console.warn()` or `console.error()` for critical issues only (production consideration)

## Comments

**When to Comment:**
- **JSDoc for exported functions:** Add JSDoc block for public calc functions, especially those referenced in CONSTRAINTS.md
  ```typescript
  /**
   * Standard loaded rate: base × (1 + burden) + health — C-001
   */
  export function calcLoadedRate(...): number { }
  ```
  See: `src/calc/labor-calc.ts`

- **Constraint references:** Include `(C-xxx)` or `(B-xxx)` comment in code that implements a constraint
  ```typescript
  // Hardware cost = Σ(unitCost × lineItem.quantity) — C-002, C-016
  ```
  See: `src/calc/material-calc.ts` line 20

- **Complex logic:** Comment branching logic or multi-step calculations
  ```typescript
  // Labor — branch on system type labor mode (C-020)
  const manHours = systemType.laborMode === 'area'
    ? calcBaseManHoursArea(sqft, systemType.sfPerManHour ?? 0)
    : calcBaseManHoursUnit(systemType.hoursPerUnit ?? 0, lineItem.quantity)
  ```
  See: `src/calc/line-total-calc.ts` lines 35–42

- **Non-obvious behavior:** Comment guard conditions, nullish operators, or workarounds
  ```typescript
  // Corrupted JSON — reset to defaults
  return createDefaultAppState()
  ```
  See: `src/storage/storage-service.ts` line 21

**JSDoc/TSDoc:**
- Use JSDoc for exported functions
- Format: `/** Description — constraint reference */`
- No @param/@return tags in simple functions
- Include constraint ID if the function enforces/implements one

## Function Design

**Size:**
- Most calc functions: 1-5 lines (pure math)
- Hook functions: 10-30 lines (state management)
- Component event handlers: Keep inlined or extract if > 5 lines
- View components: Organize into sub-sections with comments

**Parameters:**
- Calc functions: pass all needed values as separate parameters (no object destructuring at call site)
  ```typescript
  calcMaterialCost(sqft, perimeter, glassCostPerSqft, frameCostPerLinFt, selectedHardware, quantity)
  ```
  See: `src/calc/line-total-calc.ts` line 31

- React component props: define interface, destructure in function signature
  ```typescript
  interface ConfirmDialogProps {
    open: boolean
    title: string
    // ...
  }
  export function ConfirmDialog({ open, title, ...}: ConfirmDialogProps) { }
  ```

- Hooks: typically take IDs or minimal config, return object with functions and state

**Return Values:**
- Calc functions: return single value (number) or typed object for multiple results
- Hooks: return object with state and callback functions `{ state, setState }` or `{ lineItems, addLineItem, ... }`
- Validators: return `{ isValid: boolean, errors: string[] }`
- React components: return JSX or null

## Module Design

**Exports:**
- **Named exports:** Preferred for all files except App.tsx
  ```typescript
  export function calcSqft(...) { }
  export function formatCurrency(...) { }
  ```

- **Default export exception:** `src/App.tsx` exports as default for Vite convention
  ```typescript
  export default function App() { }
  ```

- **Type exports:** Always use `export type` keyword
  ```typescript
  export type ProjectStatus = 'Bidding' | 'Awarded' | ...
  export interface Project { }
  ```

- **Re-exports:** Barrel files export all public members
  - `src/calc/index.ts` re-exports all calc modules and `formatCurrency()`
  - `src/data/index.ts` re-exports seed data and factory functions
  - See: `src/calc/index.ts` lines 1–13

**Barrel Files:**
- `src/calc/index.ts` — Single export point for all calculation functions and formatter
- `src/data/index.ts` — Single export point for seed data and default app state
- Import from barrel file: `import { calcMaterialCost, formatCurrency } from '@/calc'`

## State Management Pattern

**React Context + useState:**
- Single `AppStoreProvider` wraps the app at `src/main.tsx`
- State updates via `setState(prev => ({ ...prev, /* changes */ }))`
- All mutations go through hooks (never direct state access in components)
- Timestamps: `{ createdAt: ISO string, updatedAt: ISO string }` for entities
- Debounced persistence: 500ms flush to localStorage + `beforeunload` event

See: `src/hooks/use-app-store.tsx` and `src/main.tsx`

## Immutability & Spread Operator

**Pattern:**
- Always use spread operator for shallow copies: `{ ...obj, fieldToUpdate: value }`
- Nested updates: map through arrays and reconstruct parent objects
  ```typescript
  projects: prev.projects.map(p =>
    p.id === projectId
      ? { ...p, lineItems: [...p.lineItems, newItem], timestamps: { ...p.timestamps, updatedAt: now } }
      : p
  )
  ```
  See: `src/hooks/use-projects.ts` line 29 and `use-line-items.ts` line 52

## Calculation Rounding

**Pattern:**
- Round final monetary values to 2 decimal places: `Math.round(value * 100) / 100`
- Applied in all cost calc functions and line total
  ```typescript
  return Math.round((glassCost + frameCost + hardwareCost) * 100) / 100
  ```
  See: `src/calc/material-calc.ts` line 23

- Applied to man-hours and crew days too: `Math.round(value * 10000) / 10000` (4 decimal places)
  See: `src/calc/line-total-calc.ts` line 61

- Always use `formatCurrency()` for display (constraint C-017)
  See: `src/calc/index.ts` lines 18–25

---

*Convention analysis: 2026-03-01*
