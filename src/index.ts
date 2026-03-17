#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from "./hakuna.js";
import { tools, TextResult } from "./tools.js";

// Simple CLI help
const argv = process.argv.slice(2);
if (argv.includes("-h") || argv.includes("--help")) {
  console.log(`hakuna-mcp — Hakuna MCP server (stdio)
Usage: hakuna-mcp
Env:   HAKUNA_TOKEN=<token>
Docs:  https://github.com/lucasjahn/hakuna-mcp`);
  process.exit(0);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function wrapHandler(fn: (args: any) => Promise<{ content: { type: "text"; text: string }[] }>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (args: any) => {
    try {
      return await fn(args);
    } catch (err) {
      return {
        isError: true as const,
        content: [{
          type: "text" as const,
          text: `Error: ${err instanceof Error ? err.message : String(err)}`,
        }],
      };
    }
  };
}

function jsonContent(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

async function main() {
  process.on("uncaughtException", (err) => {
    console.error("[hakuna-mcp] Uncaught exception:", err);
  });
  process.on("unhandledRejection", (reason) => {
    console.error("[hakuna-mcp] Unhandled rejection:", reason);
  });

  if (!process.env.HAKUNA_TOKEN) {
    console.error("Missing HAKUNA_TOKEN environment variable.");
    process.exit(1);
  }

  const client = createClient(process.env.HAKUNA_TOKEN);
  const server = new McpServer(
    { name: "hakuna", version: "0.3.0" },
    { capabilities: { logging: {} } }
  );

  for (const tool of tools) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
        annotations: tool.annotations,
      },
      wrapHandler(async (args) => {
        const result = await tool.handler(client, args);
        if (result instanceof TextResult) {
          return { content: [{ type: "text" as const, text: result.text }] };
        }
        return jsonContent(result);
      })
    );
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
