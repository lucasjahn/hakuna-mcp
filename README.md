# Hakuna MCP Server — Unofficial Time Tracking for AI Assistants

[![npm version](https://img.shields.io/npm/v/%40lucasjahn%2Fhakuna-mcp)](https://www.npmjs.com/package/@lucasjahn/hakuna-mcp)
[![npm downloads](https://img.shields.io/npm/dm/%40lucasjahn%2Fhakuna-mcp)](https://www.npmjs.com/package/@lucasjahn/hakuna-mcp)
[![license](https://img.shields.io/npm/l/%40lucasjahn%2Fhakuna-mcp)](./LICENSE)
[![node](https://img.shields.io/node/v/%40lucasjahn%2Fhakuna-mcp)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-server-7C3AED.svg)](https://modelcontextprotocol.io/)

An unofficial MCP server for [Hakuna](https://hakuna.ch) time tracking. Use natural language to list, create, and update time entries; start and stop timers; look up projects and tasks; and get quick hour totals — all through any MCP-compatible AI assistant. Built on the Model Context Protocol (MCP) with stdio transport.

**Why this server?** Hakuna's API requires structured HTTP calls with specific date/time formats and numeric IDs. This server wraps 20 tools behind a single MCP connection so your AI assistant handles the details — date formatting, ID resolution, rate limits — while you speak naturally.

> **Experimental Software Notice**
> This MCP server is experimental and under active development. While implemented with care to prevent data loss (deletion disabled, append-only updates), use with caution in production environments. Always test in a non-critical workspace first.

## Quickstart

### Claude Desktop (.mcpb)

1. Download the latest extension: [hakuna-mcp.mcpb](https://github.com/lucasjahn/hakuna-mcp/releases/latest/download/hakuna-mcp.mcpb)
2. In Claude Desktop: Extensions → Install from file → select `hakuna-mcp.mcpb`
3. Open the extension's Settings and set your `HAKUNA_TOKEN`
4. Start asking about your time entries

### npm (any MCP client)

```bash
npm install -g @lucasjahn/hakuna-mcp
```

Set `HAKUNA_TOKEN` in your environment, then configure your MCP client to run `hakuna-mcp` via stdio.

## What You Can Do

- "Log 1.5 hours to task 123 on Project A for yesterday"
- "What did I track between 2025-09-01 and 2025-09-07?"
- "Start a timer for the 'Client Meeting' task"
- "How many hours did I spend per project last week?"
- "Find the project named 'Website Redesign' and the task 'Home Page'"
- "Show me my overtime balance and remaining vacation days"
- "List my absences for 2026"

## Tools

20 tools available (full parameter details in [TOOLS.md](TOOLS.md)):

| Tool | Description |
|------|-------------|
| `list_time_entries` | List time entries in a date range with optional filters |
| `get_time_entry` | Fetch a single time entry by ID |
| `create_time_entry` | Create a new time entry |
| `update_time_entry` | Update fields on an existing time entry (PATCH) |
| `delete_time_entry` | Disabled — always returns a refusal message |
| `get_timer` | Read the currently running timer |
| `start_timer` | Start a new timer |
| `stop_timer` | Stop the running timer and save as time entry |
| `cancel_timer` | Discard the running timer without saving |
| `find_projects` | Search projects by name substring |
| `find_tasks` | Search tasks by name substring |
| `total_hours_in_period` | Sum durations in a date range |
| `hours_by_project` | Group and sum durations by project |
| `hours_on_day` | Sum durations for a single date |
| `get_overview` | Get overtime balance and vacation days |
| `list_absences` | List absences for a given year |
| `get_current_user` | Get the authenticated user's profile |
| `list_absence_types` | List available absence types (cached) |
| `get_company` | Get company info and settings |
| `clear_catalog_cache` | Clear cached projects, tasks, and absence types |

### Conventions

| Format | Pattern | Example |
|--------|---------|---------|
| Dates | `yyyy-mm-dd` (ISO) | `2025-09-12` |
| Times | `HH:mm` (24h) | `08:30`, `17:45` |
| IDs | Numbers | Resolve via `find_projects` / `find_tasks` |

## Setup — Connect Your Hakuna API Token

### Getting your token

1. Log in to [hakuna.ch](https://hakuna.ch)
2. Go to Account Settings → API
3. Copy your API token

### Option A: Environment variable (recommended)

Export in your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
export HAKUNA_TOKEN=your-api-token
```

### Option B: Project `.env` file

Add to your project's `.env` file:

```
HAKUNA_TOKEN=your-api-token
```

## Configure in MCP Clients

### Claude Desktop (legacy JSON config)

Create `~/.mcp/servers/hakuna.json`:

```json
{
  "command": "hakuna-mcp",
  "env": { "HAKUNA_TOKEN": "${env:HAKUNA_TOKEN}" }
}
```

### Generic MCP config

- **Command**: `hakuna-mcp`
- **Transport**: stdio
- **Env**: `HAKUNA_TOKEN` must be set

## Architecture

```
hakuna-mcp/
  src/
    types.ts       # API response interfaces and domain models
    schemas.ts     # Zod input schemas and inferred param types
    hakuna.ts      # HakunaClient class — HTTP, rate limits, caching
    analytics.ts   # Pure functions for duration math and aggregation
    tools.ts       # Data-driven tool definitions (all 20 handlers)
    index.ts       # CLI help, client creation, registration loop, boot
  dist/            # Compiled output (tsc)
  TOOLS.md         # Tool catalog and parameter guide
  CHANGELOG.md     # Release history
  manifest.json    # Claude Desktop extension manifest
```

## Development

```bash
yarn dev        # run with tsx (transpile-on-the-fly)
yarn build      # compile to dist/
yarn start      # run compiled dist/index.js
yarn mcpb:pack  # package .mcpb for Claude Desktop
```

### Releasing

Releases attach a ready-to-install `hakuna-mcp.mcpb` asset. Create a semver tag to trigger the release workflow:

```bash
git tag v0.3.1
git push origin v0.3.1
```

GitHub Actions builds the project, packages `hakuna-mcp.mcpb`, and publishes a GitHub Release with changelog notes. Local packaging:

```bash
yarn build && yarn mcpb:pack
```

## Safety

- **Deletion disabled** by design — prevents accidental data loss
- **Rate limits** respected automatically with a single HTTP client
- **Secrets** never logged or committed — configure `HAKUNA_TOKEN` via environment only

## Version History

See [CHANGELOG.md](./CHANGELOG.md) for the full release history.

## Disclaimer

This is an independent, community-maintained integration for [Hakuna](https://hakuna.ch). Not affiliated with, endorsed by, or sponsored by the Hakuna team. Use at your own discretion.

## License

MIT

---

Built by [Lucas Jahn](https://github.com/lucasjahn)
