# Changelog

This project follows Conventional Commits and maintains this changelog manually.

## [0.3.0] - 2026-03-17

### Added
- New tools: `get_overview` (overtime/vacation balance), `list_absences` (absences by year), `get_current_user` (authenticated user profile), `list_absence_types` (available absence types), `get_company` (company info), `cancel_timer` (discard running timer).
- Zod `.describe()` annotations on all tool input fields for better LLM guidance.
- Input format validation: dates must match `YYYY-MM-DD`, times must match `HH:mm`.
- MCP tool annotations (`readOnlyHint`, `destructiveHint`, `idempotentHint`) on all 20 tools.
- Error handling: all tool handlers wrapped with try/catch returning structured `isError` responses instead of crashing.
- Absence types cache (alongside existing projects/tasks cache).
- Logging capability enabled on MCP server.

### Fixed
- `start_timer`: `task_id` changed from optional to required (matches Hakuna API requirement).
- `start_timer`: added `start_time` parameter for overriding the start time.

### Changed
- Extracted all Zod schemas to `src/schemas.ts` for separation of concerns.
- Replaced hand-written parameter types in `hakuna.ts` with types inferred from schemas.
- Replaced `AnyArray` type alias and `any` return types with `unknown` for type safety.
- Improved tool description strings with return format details and usage guidance.
- `clear_catalog_cache` now also clears absence types cache.

## [0.2.0] - 2025-09-12

### Added
- Unofficial MCP server for Hakuna (hakuna.ch) with stdio transport.
- CLI binary `hakuna-mcp`; requires `HAKUNA_TOKEN` env var.
- Tools: `list_time_entries`, `get_time_entry`, `create_time_entry`, `update_time_entry`, `delete_time_entry` (disabled), `get_timer`, `start_timer`, `stop_timer`, `find_projects`, `find_tasks`, `total_hours_in_period`, `hours_by_project`, `hours_on_day`, `clear_catalog_cache`.
- Parameter guide (`TOOLS.md`) with exact date/time formats and input types.
- HTTP client with rate-limit handling and simple in-memory catalog cache for projects/tasks.
- README with configuration examples, npm badges, and safety notes.

### Security
- Requires `HAKUNA_TOKEN`; secrets are never logged.
- Deletion action intentionally disabled to prevent data loss.

### Packaging
- Published as `@lucasjahn/hakuna-mcp`; Node >= 18.17; ESM; prepack build.
- Bin exposes `hakuna-mcp`; minimal publish surface (dist + docs).

## [0.2.5] - 2026-03-17

### Fixed
- Sync McpServer version string in `src/index.ts` to match published 0.2.4 (was stuck at 0.2.1).

### Added
- `CLAUDE.md` with project conventions, commit rules, release process, and version sync checklist.
- Claude Code hooks (`.claude/settings.json`) for commit validation: conventional commit format, Co-Authored-By blocking, version sync check on tags, changelog freshness reminder.

### Chore
- Add `.claude/settings.local.json` to `.gitignore`.

## [0.2.1] - 2025-09-12

### Changed
- Update package metadata links (repository, bugs, homepage) to `lucasjahn/hakuna-mcp`.
- Update CLI help URL accordingly.

### Notes
- Republish to update npm page links.

## [0.2.2] - 2025-09-13

### Added
- GitHub Actions workflow to build and publish a GitHub Release with a packaged `.mcpb` using the Anthropic `mcpb` packer.
- README “Downloads (.mcpb)” section with direct latest download link and install steps for Claude Desktop.
- Yarn script `mcpb:pack` to locally produce `hakuna-mcp.mcpb` via `npx mcpb@latest pack`.

### Changed
- Manifest: add `permissions.network` and `permissions.env`, `min_runtime` (Node >= 18.17), `categories`, and richer `keywords` for better discovery.
- Manifest: include a `tools` list (name + description only) for catalog/discovery.

### Chore
- Ignore packaged `*.mcpb` files in git.

## [0.2.4] - 2025-09-13

### Added
- Icon asset (`icon.png`) and manifest reference for better directory presence.

### Changed
- Bump versions to 0.2.4 in `package.json` and `manifest.json`.
- Manifest metadata polish:
  - `display_name` set to `hakuna.ch`.
  - Shorter `description` and new `long_description` for clearer catalog text.
  - Updated author URL, added `homepage`, `documentation` (README anchor), and `support` (GitHub Issues) links.
  - Added `compatibility` block (Claude Desktop version, platforms, runtimes) to aid review and discovery.
