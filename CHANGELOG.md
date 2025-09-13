# Changelog

This project follows Conventional Commits and maintains this changelog manually.

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

Unreleased
- TBA

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
