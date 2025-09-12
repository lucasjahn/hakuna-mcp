# Hakuna MCP Server (Unofficial)

![npm version](https://img.shields.io/npm/v/%40lucasjahn%2Fhakuna-mcp)
![npm downloads](https://img.shields.io/npm/dm/%40lucasjahn%2Fhakuna-mcp)
![license](https://img.shields.io/npm/l/%40lucasjahn%2Fhakuna-mcp)
![node](https://img.shields.io/node/v/%40lucasjahn%2Fhakuna-mcp)

Unofficial Model Context Protocol (MCP) server for Hakuna (hakuna.ch). This project is not affiliated with, endorsed by, or sponsored by the Hakuna team. It exposes Hakuna time‑tracking operations as MCP tools for LLM clients.

## Install

- Node.js 18.17+ required
- NPM (recommended)

```bash
npm install -g @lucasjahn/hakuna-mcp
# or run without a global install
npx @lucasjahn/hakuna-mcp --help  # starts the server over stdio
```

Set your token before running:

```bash
export HAKUNA_TOKEN=YOUR_HAKUNA_API_TOKEN
```

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

## Tools and Parameters

See TOOLS.md for a complete list, inputs, and output shapes. Conventions:

- Dates: `yyyy-mm-dd` (ISO) — e.g., `2025-09-12`
- Times: `HH:mm` (24h) — e.g., `08:30`, `17:45`
- IDs: numbers; resolve via `find_projects` and `find_tasks`

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

## Safety Notes

- Deleting entries is disabled by design.
- Rate limits are respected automatically; network calls use a single client.
- Do not log or commit secrets. Configure `HAKUNA_TOKEN` via environment variables.

## Release & Publish (manual)

1) Update CHANGELOG.md with notable changes for the new version.
2) Bump version in `package.json` (and keep `src/index.ts` server version in sync).
3) Commit and tag:

```bash
git add -A
git commit -m "chore(release): vX.Y.Z"
git tag vX.Y.Z
git push && git push --tags
```

4) Publish to npm (scoped package, public):

```bash
npm login
yarn build
npm publish --access public
```

5) Create a GitHub Release from tag `vX.Y.Z` (optional but recommended).

## Disclaimer

This is an independent, community-maintained integration targeting Hakuna (https://hakuna.ch). Use at your own discretion.
