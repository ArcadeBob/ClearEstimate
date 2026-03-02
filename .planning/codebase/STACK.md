# Technology Stack

**Analysis Date:** 2026-03-01

## Languages

**Primary:**
- TypeScript ~5.7.0 - Source code and type definitions
- JSX (React 19) - UI components via `@vitejs/plugin-react`

**Secondary:**
- CSS3 - Styling via Tailwind CSS v4
- JSON - Configuration and data serialization

## Runtime

**Environment:**
- Node.js (no specific version pinned; see `package.json`)
- Browser runtime (ES2020+)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React 19.0.0 - UI library and component framework
- React Router 7.0.0 - Client-side routing and navigation
- Recharts 2.15.0 - Data visualization and charting

**Testing:**
- Vitest 4.0.18 - Unit test runner with globals enabled
- jsdom 28.1.0 - Virtual DOM for testing component rendering

**Build/Dev:**
- Vite 6.0.0 - Build tool and dev server
- @vitejs/plugin-react 4.0.0 - React plugin for Vite
- @tailwindcss/vite 4.0.0 - Tailwind CSS v4 Vite plugin
- vite-tsconfig-paths 5.0.0 - Path alias support (enables `@/` imports)
- vite-node 5.3.0 - Node.js script runner (used for verification script)

## Key Dependencies

**Critical:**
- react-dom 19.0.0 - React DOM rendering
- react-is 19.0.0 - React type checks (peer dependency for Recharts)
- uuid 11.0.0 - Unique ID generation for projects and line items

**Type Definitions:**
- @types/react 19.0.0
- @types/react-dom 19.0.0
- @types/uuid 10.0.0

## Configuration

**Environment:**
- `.env` file listed in `.gitignore` but no required environment variables detected in codebase
- No runtime secrets or API keys required (all data stored locally)

**Build:**
- `tsconfig.json` - Root TypeScript configuration with references to app and node configs
- `tsconfig.app.json` - Strict mode enabled (`strict: true`), ES2020 target, path aliases, jsdom types
- `tsconfig.node.json` - ES2022 target for build scripts
- `vite.config.ts` - Unified Vite + Vitest configuration using `vitest/config`
  - React plugin enabled
  - Tailwind CSS v4 plugin enabled (CSS-first, no config file needed)
  - Path alias plugin for `@/*` imports
  - Vitest globals enabled (no need to import `describe`/`it`/`expect`)
  - Test environment: `node` (jsdom available via pragma in individual test files)
  - Test pattern: `src/**/*.test.ts`

## Platform Requirements

**Development:**
- Node.js with npm
- Modern terminal/IDE with TypeScript support
- No additional tools required (all build tools included)

**Production:**
- Static file hosting (SPA deployable to any CDN or static host)
- Deployment targets: Vercel (`.vercel` in `.gitignore` suggests Vercel compatibility)
- No server-side runtime required

## Build & Development Commands

```bash
npm run dev              # Start Vite dev server (localhost:5173)
npm run build           # TypeScript check + production build (tsc -b && vite build)
npm run preview         # Preview production build locally
npm run lint            # TypeScript type check (tsc -b)
npm test                # Run all unit tests
npm run test:watch      # Run tests in watch mode
npm run verify          # Run 37-assertion calculation verification script
```

---

*Stack analysis: 2026-03-01*
