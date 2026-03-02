# Codebase Concerns

**Analysis Date:** 2026-03-01

## Tech Debt

**Frame-System Missing Foreign Key Relationship:**
- Issue: `FrameSystem` has no `systemTypeId` field despite constraint C-037 requiring frame-system grouping by system type
- Files: `src/types/index.ts` (FrameSystem interface, line 72-76), `src/views/TakeoffView.tsx` (frame dropdown at line 347)
- Impact: Frame dropdown in TakeoffView displays ALL frames regardless of selected system type (constraint I-004 not enforced). Users can select incompatible frame-system combinations.
- Fix approach: Add `systemTypeId: string` to FrameSystem interface, filter frame dropdown by selected system type ID, add validation in use-settings to prevent orphan frames when system type is deleted

**Labor Mode Parameters Not Validated on Save:**
- Issue: SystemType fields `sfPerManHour` and `hoursPerUnit` can be saved as 0, undefined, or negative despite constraints C-040, C-041
- Files: `src/hooks/use-settings.ts` (updateItem line 73-86), `src/views/SettingsView.tsx` (SystemType edit form)
- Impact: Division-by-zero guard in labor-calc.ts (line 20) returns 0 man-hours silently; calculations become incorrect. Invalid state persists to localStorage.
- Fix approach: Add validation in updateItem hook for SystemType: when laborMode='area', require sfPerManHour>0; when laborMode='unit', require hoursPerUnit>0. Reject update with error message.

**State Size and localStorage Limits:**
- Issue: App state (all projects + settings) is fully serialized to localStorage on every change. No size monitoring or truncation strategy.
- Files: `src/storage/storage-service.ts` (saveAppState line 49-51), `src/hooks/use-app-store.tsx` (persist effect line 28-42)
- Impact: localStorage typically has 5-10MB limit per origin. Large estimating workflows (100+ line items, many VE alternates) could exceed quota, causing silent save failures and data loss.
- Fix approach: Implement localStorage quota check before save; add warning UI when approaching limits; consider splitting storage into projects and settings buckets; implement cleanup/archive mechanism for old projects

**Frame Dropdown Not Filtered (C-038 Incomplete):**
- Issue: TakeoffView displays all frameSystems regardless of selected systemType
- Files: `src/views/TakeoffView.tsx` (line 347 maps all frameSystems without filter)
- Impact: Constraint C-038 not enforced. Users can select frame systems incompatible with glass/system type.
- Fix approach: Add `systemTypeId` FK to FrameSystem, filter: `settings.frameSystems.filter(f => f.systemTypeId === item.systemTypeId)`

## Known Bugs

**VE Alternate Orphan Cascade Not Complete:**
- Issue: When a project is deleted, orphaned VE alternates remain if they reference deleted projects. duplicateProject() properly remaps (C-019), but deleteProject() has no cleanup.
- Files: `src/hooks/use-projects.ts` (deleteProject line ~100+, deleteLineItem cascade in use-line-items.ts line 111-114)
- Impact: Over time, state accumulates dead VE alternate records. Export/summary functions filter these out, but storage bloats.
- Workaround: None — data persists but hidden
- Fix approach: In deleteProject hook, filter out veAlternates where lineItemId no longer exists in remaining projects

**Condition Deletion Cascades Globally (C-036) — Over-Broad:**
- Issue: Deleting a condition removes it from ALL line items across ALL projects immediately, without warning
- Files: `src/hooks/use-settings.ts` (deleteItem line 89-105 does not cascade), should be in deleteCondition handler
- Impact: User deletes one condition expecting to affect only current project; affects all projects permanently.
- Workaround: Manually re-add condition and re-select if deleted by mistake
- Fix approach: Change delete behavior: show usage count modal, let user confirm "Remove from X line items across Y projects"

**Benchmark Badge Renders But Benchmarking Module Scheduled for Removal:**
- Issue: BenchmarkBadge component (TakeoffView line 378, 517) displays benchmark 'green'/'amber'/'red', but benchmark-calc.ts and benchmark-calc.test.ts are marked for removal in B-008
- Files: `src/components/BenchmarkBadge.tsx`, `src/views/TakeoffView.tsx` (line 12, 378, 517), `src/calc/benchmark-calc.ts`
- Impact: Code path technically works, but module is slated for deletion. Creating technical debt if new features depend on benchmarking.
- Fix approach: Confirm B-008 removal is desired; if so, remove BenchmarkBadge imports/calls from TakeoffView immediately, delete benchmark-calc files, and commit removal

**Prev Wage (PW) Fields Optional but Can Cause Silent Zero Calculation:**
- Issue: Project.pwBaseRate and pwFringeRate are optional (line 15-16 of types/index.ts). calcFullLineItem checks `pwBaseRate != null && pwFringeRate != null` (line-total-calc.ts line 36), but if prevailingWage=true and either is undefined, calcPWLoadedRate receives undefined
- Files: `src/types/index.ts` (Project interface, line 14-16), `src/calc/line-total-calc.ts` (line 36-38)
- Impact: If user sets prevailingWage=true but doesn't fill in PW rates, falls back to standard loaded rate silently—estimate underprices labor.
- Fix approach: Make pwBaseRate and pwFringeRate required (no ?) when prevailingWage=true; add validation in use-projects.ts to enforce non-zero values

## Security Considerations

**No Input Sanitization on Description Fields:**
- Issue: LineItem.description, VEAlternate.description, and ScopeDescription.text accept arbitrary strings with no sanitization
- Files: `src/views/TakeoffView.tsx` (line 408, VE description input line 179), `src/views/SummaryView.tsx` (line 356 textarea)
- Impact: Low in SPA (no server), but if JSON export is displayed in a web viewer or imported into another app without sanitization, could allow XSS
- Current mitigation: React auto-escapes text content in JSX
- Recommendations: Keep React escaping; if adding server-side export API, sanitize strings. Document limitation in export schema.

**localStorage Accessible to Any Script on Same Origin:**
- Issue: All app state (including project financial data) stored unencrypted in localStorage
- Files: `src/storage/storage-service.ts` (line 50)
- Impact: Any third-party script injected via CDN compromise can read all user estimates
- Current mitigation: SPA-only, no third-party scripts currently loaded
- Recommendations: For future server/multi-user phases, move to server-side storage. Consider warning users not to open app on shared computers. Document that estimates are not encrypted at rest.

## Performance Bottlenecks

**Full State Serialization on Every Line Item Change:**
- Problem: Every updateLineItem call triggers full JSON.stringify of entire AppState to localStorage, even if only one line item changed
- Files: `src/hooks/use-app-store.tsx` (persist effect line 28-42), triggered by every useState update
- Cause: Debounce only delays write, doesn't prevent full re-serialization; no granular change tracking
- Current performance: Acceptable for <1000 line items; degrades noticeably at 5000+ items
- Improvement path: Implement change-set tracking (delta updates) or batch debounce multiple updates into single write; measure with large datasets

**calcRunningTotals Filters and Reduces on Every Render:**
- Problem: TakeoffView calls calcRunningTotals(project) on every render (line 46), which filters lineItems and reduces twice (material + labor + equipment totals)
- Files: `src/views/TakeoffView.tsx` (line 46), `src/calc/summary-calc.ts` (line 7-14)
- Cause: calcRunningTotals not memoized; missing useMemo wrapper in TakeoffView
- Current performance: O(n) per render, acceptable for <500 items, slow for 5000+
- Improvement path: Wrap calcRunningTotals call in useMemo, add SummaryView's useMemo pattern to TakeoffView (line 1-5 of SummaryView shows correct pattern)

**Recharts Bundle Size (717KB) Not Code-Split:**
- Problem: recharts (D3-based) bundled in main chunk; no code-splitting despite being heavy visualization-only library
- Files: `src/views/SummaryView.tsx` (line 3 import PieChart), mentioned in CLAUDE.md
- Current size: 717KB chunk penalty on all page loads, including DashboardView and TakeoffView
- Improvement path: Use React.lazy() on SummaryView component to code-split recharts to separate chunk (documented in CLAUDE.md known pitfalls)

## Fragile Areas

**Frame System FK Missing — Cascades Dangerous:**
- Files: `src/types/index.ts` (FrameSystem, line 72-76), `src/hooks/use-line-items.ts` (updateLineItem line 67-101)
- Why fragile: Without systemTypeId on FrameSystem, the contract "frame must be compatible with system type" cannot be enforced. Changes to system type don't clear incompatible frame selections (C-039 states it should clear, but validation is incomplete).
- Safe modification: Add systemTypeId FK immediately; add test: select system type A → select frame from type B → change system type → verify frame clears
- Test coverage: No direct test for frame clearing on system type change; manual test only (see CONSTRAINTS.md line 48)

**Condition Cascading Deletes Globally Without Confirmation:**
- Files: `src/hooks/use-settings.ts` (deleteItem line 89-105)
- Why fragile: C-036 says "cascades to all line items across all projects" with no user confirmation or preview of impact. A single Delete click affects potentially hundreds of line items.
- Safe modification: Before deleting a condition, run getUsageCount, show count+list of projects affected, require explicit confirmation
- Test coverage: Manual test only (CONSTRAINTS.md line 45); no unit test for cascade

**validateLineItem Excludes Invalid Items from Totals Silently:**
- Files: `src/hooks/use-line-items.ts` (validateLineItem line 13-22), `src/calc/summary-calc.ts` (validItems filter line 8)
- Why fragile: Invalid items (e.g., quantity=0, width=0) are completely hidden from running totals. No warning. Users may think item is deleted when it's just silently excluded.
- Safe modification: Show validation error inline (I-002 implemented), but also show a separate "Invalid Items" section in running totals so user knows 3 items are excluded
- Test coverage: validate-line-item.test.ts covers validation rules, but no integration test of exclusion from totals

**Labor Mode Parameter Validation Missing:**
- Files: `src/hooks/use-settings.ts` (updateItem line 73-86)
- Why fragile: updateItem accepts SystemType with sfPerManHour or hoursPerUnit = 0 or undefined. calcBaseManHoursArea (labor-calc.ts line 20) has guard returning 0, but this silently breaks labor cost calculations.
- Safe modification: Add validation before setState in updateItem, reject update with error message listing which field is invalid
- Test coverage: verify-calc.ts checks constraints, but no unit test of validation reject

## Scaling Limits

**localStorage Capacity:**
- Current capacity: 5-10MB per origin (browser-dependent)
- Limit: Estimated 50,000+ line items or 200+ complex projects with VE alternates
- Scaling path: Migrate to server-side database; implement data archival/cleanup for old projects; split state into separate storage buckets

**Calculation Performance:**
- Current capacity: <1000 line items at interactive speed (<100ms per update)
- Limit: 5000+ line items causes noticeable lag in TakeoffView due to calcRunningTotals re-filter on every keystroke
- Scaling path: Implement memoization (useMemo for totals), batch updates, consider worker thread for heavy calculations

**UI Responsiveness (TakeoffView Density):**
- Current capacity: ~100 line items display comfortably; spreadsheet-style grid
- Limit: 500+ items causes scroll/virtual-scroll lag due to rendering all LineItemRow components
- Scaling path: Implement react-window or react-virtual for virtualization; pagination; filter/search defaults to subset

## Dependencies at Risk

**Recharts Scheduled for Removal (B-006) But Still in Code:**
- Risk: B-006 says "Remove recharts + react-is dependencies" but SummaryView still imports and renders PieChart
- Impact: npm install will fail if recharts is removed from package.json without updating code
- Migration plan: Remove recharts import from SummaryView.tsx (line 3), delete PieChartCard component (line 134-171), integrate pie data into running totals sidebar or remove pie visualization entirely

**React Router 7 Non-Standard Import Pattern (B-004):**
- Risk: App and routing files must import from "react-router" not "react-router-dom"; typo in single file breaks build
- Files: `src/App.tsx`, `src/components/ProjectGuard.tsx`, `src/views/*.tsx` (all use "react-router")
- Impact: If developer unfamiliar with codebase uses familiar "react-router-dom", build succeeds but routes don't work at runtime
- Mitigation: ESLint rule or type-check rule to forbid react-router-dom imports
- Recommendations: Add eslint-plugin-import rule to forbid react-router-dom; document in CLAUDE.md with example

**Outdated ADRs vs Current Implementation:**
- Risk: docs/adr/ describes future state (dual labor mode, frame-system FK, multiplicative conditions) that is partially or fully implemented
- Files: `docs/adr/` (6 ADRs), but current code has implemented some ADRs (dual labor mode in place) and not others (frame FK missing)
- Impact: Developers follow ADR and assume feature is done, but code is incomplete; causes false confidence
- Recommendations: Audit each ADR against current code; mark as "Implemented", "Partially Implemented", or "Not Started"; remove completed ADRs or move to docs/implemented

## Missing Critical Features

**Frame-System Foreign Key:**
- Problem: Frames not filtered by system type; users can select incompatible combinations
- Blocks: Correct estimates if user accidentally picks incompatible frame
- Priority: High — directly impacts calculation accuracy

**Labor Mode Validation on Save:**
- Problem: SystemType can be saved with invalid labor params (0, undefined)
- Blocks: Correct labor cost calculations
- Priority: High — breaks core calculation

**Prevailing Wage Field Validation:**
- Problem: PW mode can be enabled without PW rates filled in
- Blocks: Correct labor estimates in PW jobs
- Priority: Medium — only affects subset of users

## Test Coverage Gaps

**Frame Compatibility (C-038, C-039):**
- What's not tested: Selecting incompatible frame after system type change; frame should clear or stay compatible
- Files: `src/hooks/use-line-items.ts`, `src/views/TakeoffView.tsx` (frame dropdown)
- Risk: Regression if frame filtering is added later; breaking change could go undetected
- Priority: High

**Condition Deletion Cascade:**
- What's not tested: Delete condition → verify removed from all line items across all projects
- Files: `src/hooks/use-settings.ts` (deleteItem), `src/hooks/use-line-items.ts`
- Risk: Over-deletion or partial deletion could corrupt data
- Priority: High

**Labor Mode Parameter Validation:**
- What's not tested: Attempt to save SystemType with sfPerManHour=0 or hoursPerUnit=undefined
- Files: `src/hooks/use-settings.ts` (updateItem)
- Risk: Invalid config persists, calculations break silently
- Priority: High

**localStorage Quota Edge Cases:**
- What's not tested: Behavior when localStorage quota exceeded during save
- Files: `src/storage/storage-service.ts` (saveAppState), `src/hooks/use-app-store.tsx`
- Risk: Silent data loss if save fails
- Priority: Medium

---

*Concerns audit: 2026-03-01*
