# hakuna-mcp

## Overview

- Unofficial MCP server for Hakuna.ch time-tracking
- TypeScript (ES2022, strict mode), ESM, stdio transport
- Published as @lucasjahn/hakuna-mcp on npm + .mcpb for Claude Desktop
- Node >= 18.17, Yarn package manager

## Architecture

- `src/index.ts` — MCP server, tool registrations (14 tools), CLI help, analytics helpers
- `src/hakuna.ts` — HTTP client (undici), rate-limit state, catalog caching
- Rule: new API calls go in `hakuna.ts`, new tool registrations go in `index.ts`
- Deletion is intentionally disabled for safety

## Commands

- `yarn dev` — run with tsx (transpile-on-the-fly)
- `yarn build` — tsc compile to dist/
- `yarn start` — run compiled dist/index.js
- `yarn mcpb:pack` — package .mcpb for Claude Desktop

## Code Conventions

- TypeScript strict mode, ES2022 target, Bundler moduleResolution
- 2-space indent, ~100-120 char lines
- camelCase for variables/functions, PascalCase for types, snake_case for MCP tool names
- Lowercase filenames (e.g., hakuna.ts)
- Import order: node builtins, external packages, local modules
- No default exports
- Use `.js` extensions in import paths (ESM requirement)

## MCP Tool Naming

- All names use snake_case with verb_noun pattern
- Verbs: list, get, create, update, delete, find, start, stop, clear
- Examples: list_time_entries, start_timer, find_projects, hours_by_project

## Commit Messages — STRICT RULES

- Format: `type(scope): lowercase imperative description`
- Types: feat, fix, docs, chore, ci, refactor, test, perf, style
- Common scopes: tools, api, release, readme, changelog, manifest, ci
- **NEVER add "Co-Authored-By" lines — absolutely forbidden**
- **NEVER add any trailers or sign-off lines to commits**
- Subject must start lowercase after the colon
- Subject must not end with a period
- Examples:
  - `feat(tools): add weekly_summary tool`
  - `fix(api): handle 429 rate limit retry`
  - `docs(changelog): add 0.3.0 release notes`
  - `chore(release): bump version to 0.3.0`

## Changelog

- File: CHANGELOG.md
- Format: Keep a Changelog (keepachangelog.com)
- Heading format: `## [X.Y.Z] - YYYY-MM-DD`
- Sections in order: Added, Changed, Fixed, Removed, Security, Chore, Notes
- Update CHANGELOG.md BEFORE creating the version bump commit
- Every feat commit needs a corresponding "Added" entry
- Every fix commit needs a corresponding "Fixed" entry
- Keep an "Unreleased" section at the top for work-in-progress

## Version Locations (ALL must stay in sync)

- `package.json` → `"version"`
- `manifest.json` → `"version"`
- `manifest.json` → `"dxt_version"`
- `src/index.ts` → McpServer constructor version string

## Semantic Versioning

- MAJOR: breaking changes to tool schemas, removed tools, changed transport
- MINOR: new tools, new optional parameters on existing tools
- PATCH: bug fixes, docs, internal refactors, metadata

## Release Process

1. Ensure all changes are committed on main
2. Update CHANGELOG.md: move Unreleased items into `## [X.Y.Z] - YYYY-MM-DD`
3. Commit: `docs(changelog): add X.Y.Z release notes`
4. Bump version in ALL locations (package.json, manifest.json x2, src/index.ts)
5. Commit: `chore(release): bump version to X.Y.Z`
6. Create tag: `git tag vX.Y.Z`
7. Push: `git push origin main && git push origin vX.Y.Z`
8. CI builds .mcpb and creates GitHub Release with changelog excerpt
9. If publishing to npm: `npm publish` (manual)

## Security

- HAKUNA_TOKEN required via env var — never commit, log, or hardcode
- .env files are gitignored
- Deletion disabled by design — do not enable without explicit review
- Rate limits handled in hakuna.ts — do not bypass
- Never include real API responses or user data in commits/docs

## Testing

- No test runner configured yet
- Preferred: Vitest or Node built-in test runner
- Location: `src/__tests__/*.test.ts`
- Mock all HTTP calls — never hit real Hakuna API
- Focus: input validation, error paths, duration math helpers
