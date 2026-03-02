# Stack Research

**Domain:** Door hardware selection for glazing estimation SPA
**Researched:** 2026-03-02
**Confidence:** HIGH (brownfield — stack is established)

## Existing Stack (Unchanged)

This is a brownfield enhancement. The stack is established and does not change:

- **React 19** + **TypeScript 5** (strict mode)
- **Vite 6** build tooling
- **Tailwind CSS v4** (CSS-first)
- **React Router 7** for navigation
- **Vitest 4** for testing
- **localStorage** for persistence with schema versioning

## New Modules Needed

No new dependencies required. All door hardware functionality is built with existing stack:

| Module | Pattern | Rationale | Confidence |
|--------|---------|-----------|------------|
| `seed-door-hardware.ts` | Follow `seed-hardware.ts` pattern — exported array of typed objects | Consistent with existing 7 seed data files in `src/data/` | HIGH |
| `door-defaults.ts` | Static `Record<string, DoorHardwareEntry[]>` mapping system type IDs to default sets | Configuration data, same pattern as system type definitions | HIGH |
| `door-hardware-calc.ts` | Pure function in `src/calc/`, composed into `calcFullLineItem()` | Matches existing calc module pattern (material-calc, labor-calc, equipment-calc) | HIGH |
| `use-door-hardware.ts` | Custom React hook wrapping `useLineItems.updateLineItem()` | Matches existing hook pattern (use-line-items, use-ve-alternates) | HIGH |
| `DoorHardwareSubRow.tsx` | React component with `memo()`, rendered conditionally below door line items | Matches existing `LineItemRow` component pattern | HIGH |

## What NOT to Add

| Temptation | Why Not |
|------------|---------|
| State management library (Zustand, Redux) | Existing Context + useState pattern handles this scope. Door hardware state lives on LineItem, not in a separate store. |
| Form library (React Hook Form) | Door hardware editing is simple checkboxes + number inputs. Not enough form complexity to justify a library. |
| Component library (Radix, Headless UI) | Existing Tailwind-only approach is consistent. Sub-row and editor are straightforward layout components. |
| UUID for door hardware IDs | Seed data uses deterministic IDs (`dhw-001`, `dhw-002`). Only custom one-off items need generated IDs — use existing `uuid` package already in dependencies. |

## Key Patterns to Follow

1. **Seed data with deterministic IDs:** `dhw-001` through `dhw-012`, matching `hw-001`/`eq-001` pattern
2. **Pure calc functions:** No side effects, no I/O, composition via `calcFullLineItem()`
3. **Hook-mediated state:** All mutations go through hooks that call `setState(updater)`
4. **Schema migration:** Bump version, add migration function, preserve existing data
5. **Memoized components:** `React.memo()` on sub-row to prevent unnecessary re-renders

## Sources

- Existing codebase: `src/data/`, `src/calc/`, `src/hooks/`, `src/types/index.ts`
- Project constraints: `CLAUDE.md`, `CONSTRAINTS.md`

---
*Stack research for: Door hardware in glazing estimation (brownfield)*
*Researched: 2026-03-02*
