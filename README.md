# Hakuna MCP Server — Unofficial Time Tracking for AI Assistants

[![npm version](https://img.shields.io/npm/v/%40lucasjahn%2Fhakuna-mcp)](https://www.npmjs.com/package/@lucasjahn/hakuna-mcp)
[![npm downloads](https://img.shields.io/npm/dm/%40lucasjahn%2Fhakuna-mcp)](https://www.npmjs.com/package/@lucasjahn/hakuna-mcp)
[![license](https://img.shields.io/npm/l/%40lucasjahn%2Fhakuna-mcp)](./LICENSE)
[![node](https://img.shields.io/node/v/%40lucasjahn%2Fhakuna-mcp)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-server-7C3AED.svg)](https://modelcontextprotocol.io/)

An unofficial MCP server for [Hakuna](https://hakuna.ch) time tracking. Use natural language to list, create, and update time entries; start and stop timers; look up projects and tasks; and get quick hour totals — all through any MCP-compatible AI assistant. Built on the Model Context Protocol (MCP) with stdio transport.

**Why this server?** Hakuna's API requires structured HTTP calls with specific date/time formats and numeric IDs. This server wraps 14 tools behind a single MCP connection so your AI assistant handles the details — date formatting, ID resolution, rate limits — while you speak naturally.

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

## Time Tracking Features

| Domain | What you can do |
|--------|-----------------|
| **Time entries** | List, get, create, and update time entries with date/time ranges |
| **Timer** | Start, stop, and check current timer status |
| **Projects & tasks** | Find projects and tasks by name substring to resolve IDs |
| **Analytics** | Total hours in a period, hours by project, hours for a single day |
| **Cache** | Clear in-memory project/task catalog cache on demand |

### Tools

14 tools available (details in [TOOLS.md](TOOLS.md)):

- `list_time_entries`, `get_time_entry`, `create_time_entry`, `update_time_entry`, `delete_time_entry` (disabled)
- `get_timer`, `start_timer`, `stop_timer`
- `find_projects`, `find_tasks`
- `total_hours_in_period`, `hours_by_project`, `hours_on_day`
- `clear_catalog_cache`

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
    index.ts     # MCP server, 14 tool registrations, CLI help, analytics helpers
    hakuna.ts    # HTTP client (undici), rate-limit handling, catalog caching
  dist/          # Compiled output (tsc)
  TOOLS.md       # Tool catalog and parameter guide
  CHANGELOG.md   # Release history
  manifest.json  # Claude Desktop extension manifest
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
git tag v0.2.5
git push origin v0.2.5
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
