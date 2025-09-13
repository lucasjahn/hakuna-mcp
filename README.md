# Hakuna MCP Server (Unofficial)

![npm version](https://img.shields.io/npm/v/%40lucasjahn%2Fhakuna-mcp)
![npm downloads](https://img.shields.io/npm/dm/%40lucasjahn%2Fhakuna-mcp)
![license](https://img.shields.io/npm/l/%40lucasjahn%2Fhakuna-mcp)
![node](https://img.shields.io/node/v/%40lucasjahn%2Fhakuna-mcp)

Bring Hakuna (hakuna.ch) time tracking into AI assistants via Model Context Protocol (MCP). Use natural language to list, create, and update time entries; start/stop timers; look up projects and tasks; and get quick hour totals by day or project. Deletion is intentionally disabled for safety.

## What You Can Do

- "Log 1.5 hours to task 123 on Project A for yesterday"
- "What did I track between 2025-09-01 and 2025-09-07?"
- "Start a timer for the 'Client Meeting' task"
- "How many hours did I spend per project last week?"
- "Find the project named 'Website Redesign' and the task 'Home Page'"

## Key Features

- Time tracking: list/get/create/update time entries; start/stop timers
- Quick analytics: total hours in a period, hours by project, hours for a day
- Resolver tools: find projects/tasks by name substring to get IDs fast
- Safe by design: delete is disabled to prevent accidental data loss
- Solid ergonomics: clear input formats, rate limit handling, JSON responses

Unofficial Model Context Protocol (MCP) server for Hakuna (hakuna.ch). This project is not affiliated with, endorsed by, or sponsored by the Hakuna team. It exposes Hakuna time‑tracking operations as MCP tools for LLM clients.

## Downloads (.mcpb)

- Get the latest packaged Claude Desktop extension: https://github.com/lucasjahn/hakuna-mcp/releases/latest/download/hakuna-mcp.mcpb
- Install in Claude Desktop: open Claude → Extensions → Install from file → select the downloaded `hakuna-mcp.mcpb`.
- After install, open the extension’s Settings and set `HAKUNA_TOKEN`.

## Tools and Parameters

Available tools (details in [TOOLS.md](TOOLS.md)):
- `list_time_entries`, `get_time_entry`, `create_time_entry`, `update_time_entry`, `delete_time_entry` (disabled)
- `get_timer`, `start_timer`, `stop_timer`
- `find_projects`, `find_tasks`
- `total_hours_in_period`, `hours_by_project`, `hours_on_day`
- `clear_catalog_cache`

Tips:
- Dates use `yyyy-mm-dd` and times use 24h `HH:mm`.
- Use `find_projects`/`find_tasks` first if you don’t know numeric IDs.

Conventions:

- Dates: `yyyy-mm-dd` (ISO) — e.g., `2025-09-12`
- Times: `HH:mm` (24h) — e.g., `08:30`, `17:45`
- IDs: numbers; resolve via `find_projects` and `find_tasks`

## Configure in MCP Clients

Example (Claude Desktop): create `~/.mcp/servers/hakuna.json`:

```json
{
  "command": "hakuna-mcp",
  "env": { "HAKUNA_TOKEN": "${env:HAKUNA_TOKEN}" }
}
```

Generic MCP config:

- Command: `hakuna-mcp`
- Transport: stdio
- Env: `HAKUNA_TOKEN` must be set

## Development

```bash
yarn dev    # run with tsx (dev)
yarn build  # compile to dist/
yarn start  # run compiled build
```

Project layout:

- `src/index.ts` MCP server + tools
- `src/hakuna.ts` HTTP client + rate limit/cache
- `TOOLS.md` Tool catalog and parameter guide
- `AGENTS.md` Repo/contributor guidelines

### Releasing downloadable .mcpb

Releases attach a ready-to-install `hakuna-mcp.mcpb` asset for easy download. Create a semver tag to trigger the release workflow:

```bash
git tag v0.2.2
git push origin v0.2.2
```

GitHub Actions builds the project, packages `hakuna-mcp.mcpb` using the Anthropic `mcpb` packer, and publishes a GitHub Release with the asset. Users can always download the latest from:

- Latest: `https://github.com/lucasjahn/hakuna-mcp/releases/latest/download/hakuna-mcp.mcpb`

Local packaging (optional):

```bash
yarn build
yarn mcpb:pack   # produces hakuna-mcp.mcpb
```

## Safety Notes

- Deleting entries is disabled by design.
- Rate limits are respected automatically; network calls use a single client.
- Do not log or commit secrets. Configure `HAKUNA_TOKEN` via environment variables.

## Disclaimer

This is an independent, community-maintained integration targeting Hakuna (https://hakuna.ch). Use at your own discretion.
