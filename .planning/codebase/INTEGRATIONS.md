# External Integrations

**Analysis Date:** 2026-03-01

## APIs & External Services

**No external APIs detected.**

The application is a fully client-side React SPA with no external API integrations. No HTTP requests, webhooks, or third-party service calls detected in the codebase.

## Data Storage

**Databases:**
- None (client-side only)

**File Storage:**
- Local browser storage via `localStorage` only
- Storage key: `cgi_estimating_app_v1`
- Schema versioning: Current version = 2
- Persistence mechanism: `src/storage/storage-service.ts`
  - `loadAppState()` - Loads state from localStorage, applies migrations if needed
  - `saveAppState(state)` - Serializes full `AppState` to JSON and persists
  - `resetAppState()` - Clears and reinitializes with defaults

**Data Export:**
The application supports client-side export only:
- JSON export format defined in `src/types/index.ts` as `ProjectExport`
- Export triggered via `document.createElement('a')` for download (see `src/views/SummaryView.tsx`)
- Print functionality via `window.print()` for PDF generation

**Caching:**
- None (no explicit cache layer)
- localStorage acts as permanent local cache

## Authentication & Identity

**Auth Provider:**
- None (no authentication required)

**Access Model:**
- Single-user application with no multi-user or permission system
- No user login or registration

## Monitoring & Observability

**Error Tracking:**
- Not detected

**Logs:**
- No structured logging detected
- Console availability for debugging via browser DevTools

## CI/CD & Deployment

**Hosting:**
- Static file hosting required
- Vercel support indicated (`.vercel` in `.gitignore`)

**CI Pipeline:**
- Not detected (no `.github/workflows/`, `.gitlab-ci.yml`, or similar)
- Manual deployment via `npm run build` suggested by CLAUDE.md

## Environment Configuration

**Required env vars:**
- None detected
- No API keys, secrets, or environment-specific configuration required

**Secrets location:**
- Not applicable (no secrets used)

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Browser APIs Used

The application uses standard browser APIs:
- **localStorage** - Persistent client-side data storage
- **window.addEventListener/removeEventListener** - Event handling for `beforeunload` (flush pending saves)
- **window.print()** - Print dialog for summary page
- **document.createElement()** - Dynamic DOM creation for file export links
- **document.body.appendChild/removeChild** - DOM manipulation for export feature

## Schema Versioning

**Current schema version:** 2

**Migration logic:** `src/storage/storage-service.ts`
- v1→v2 migration on `migrateState()`:
  - Replaces all settings with new defaults (system type changes)
  - Adds `manHours: 0` and `conditionIds: []` to line items
  - Full settings replacement (not merge) per constraint B-007

## Data Synchronization

**Debounced persistence:**
- 500ms debounce interval in `src/hooks/use-app-store.tsx`
- Flush on `beforeunload` event (page unload)
- Skip on initial mount via `isInitialMount` ref to prevent unnecessary saves

---

*Integration audit: 2026-03-01*
