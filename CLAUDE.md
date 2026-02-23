# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ClearEstimate — a software project estimation tool. Repository is in early setup; update this file as the stack solidifies.

## Build & Test Commands

<!-- Update these once package.json / build tooling is added -->
```
npm install          # install dependencies
npm run dev          # start dev server
npm run build        # production build
npm run test         # run full test suite
npm run test -- <file>  # run a single test file
npm run lint         # lint with Trunk or configured linter
```

> **Note:** No package.json exists yet. Replace the commands above with actual scripts once the project is scaffolded.

## Architecture

- **Entry point:** TBD (e.g., `src/main.ts` or `src/index.tsx` once created)
- **Primary language:** JavaScript / TypeScript (Node.js)
- **Secondary language:** Python (utilities / backend)
- **Code quality:** Trunk.io (`.trunk/`)
- **Environment config:** `.env` / `.env.local` (never committed)

### Key Patterns

- TBD — document state management, routing, and data-flow patterns here as they are introduced.

## Key Files

| Path | Purpose |
|------|---------|
| `CLAUDE.md` | Guidance for Claude Code sessions |
| `.gitignore` | Ignore rules for Node, Python, env, build artifacts |
| `decisions/` | Architecture Decision Records (ADRs) |
| `archive/` | Archived specs and reference material |
| `.claude/` | Claude Code local settings |

<!-- Add rows as the project grows, e.g.: -->
<!-- | `src/main.ts` | Application entry point | -->
<!-- | `src/routes/` | Page / API route definitions | -->
<!-- | `tests/` | Test suites | -->

## Code Conventions

- Follow existing patterns in the codebase before introducing new ones.
- Use TypeScript strict mode when TS is configured.
- Prefer named exports over default exports.
- Keep files focused — one component/module per file.
- Environment variables must be accessed through a single config module (once created).
- Commit messages: imperative mood, concise subject line (≤72 chars).

## Constraint ID Format

Constraints referenced in specs, decisions, and code comments use these prefixes:

| Prefix | Meaning | Example |
|--------|---------|---------|
| `C-xxx` | **Core constraint** — fundamental business rule | `C-001` |
| `I-xxx` | **Interface constraint** — UI/UX or API contract | `I-001` |
| `B-xxx` | **Build constraint** — tooling, CI, infra requirement | `B-001` |

When adding or referencing a constraint, use the next available number in its prefix series. Constraints live in `decisions/` as ADRs or inline in spec files.

## Known Pitfalls

- **No build tooling yet.** Running `npm` commands will fail until `package.json` is created.
- **Branch mismatch.** The repo was initialized on `master` but PRs target `main`. Create and push `main` before opening PRs.
- **Empty directories.** `decisions/` and `archive/` are empty; Git may not track them without a `.gitkeep` or content.
- **Trunk.io not configured.** `.trunk/` is git-ignored but no Trunk config exists yet. Install via `trunk init` when ready.

## Compaction Rules

When Claude Code compacts conversation context, preserve the following:

1. **Active constraint IDs** (C-xxx, I-xxx, B-xxx) and their current status.
2. **Current task phase** (baseline → spec → plan → test-red → test-green → review → retire).
3. **Failing test names** and the file:line where they fail.
4. **Uncommitted file paths** — anything modified but not yet committed.
5. **Decision rationale** — why an approach was chosen over alternatives (link to `decisions/` ADR if one exists).
6. **Branch context** — which branch is checked out and what it targets.

Drop verbose tool output, exploratory dead ends, and resolved error traces.
