#!/usr/bin/env node
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as api from "./hakuna.js";

// Create server
const server = new McpServer({ name: "hakuna", version: "0.2.0" });

// Simple CLI help
const argv = process.argv.slice(2);
if (argv.includes("-h") || argv.includes("--help")) {
  console.log(`hakuna-mcp — Hakuna MCP server (stdio)
Usage: hakuna-mcp
Env:   HAKUNA_TOKEN=<token>
Docs:  https://github.com/krautnerds/hakuna-mcp`);
  process.exit(0);
}

// -------------- helpers (local) --------------
function parseHHMM(s?: string): number | null {
  if (!s) return null;
  const m = String(s).match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
}

function minutesFromEntry(e: any): number {
  const m = e?.duration_minutes ?? e?.duration_in_minutes ?? e?.minutes;
  if (typeof m === "number" && !Number.isNaN(m)) return m;
  const start = parseHHMM(e?.start_time);
  const end = parseHHMM(e?.end_time);
  if (start != null && end != null) {
    let diff = end - start;
    // handle simple overnight (rare for time tracking; keep conservative)
    if (diff < 0) diff += 24 * 60;
    return diff;
  }
  return 0;
}

function toHoursDecimal(mins: number): number {
  return Math.round((mins / 60) * 100) / 100; // 2 decimals
}

// -------------- Tools --------------

server.registerTool(
  "list_time_entries",
  {
    title: "List time entries",
    description: "List time entries in a date range (yyyy-mm-dd). Optional filters by project_id/task_id/user_id.",
    inputSchema: {
      start_date: z.string(),
      end_date: z.string(),
      project_id: z.number().optional(),
      task_id: z.number().optional(),
      user_id: z.number().optional()
    }
  },
  async (args) => {
    const { data, rate } = await api.listTimeEntries(args as any);
    const meta = rate ? ` (rate remaining ${rate.remaining}/${rate.limit}, reset in ${rate.resetSec}s)` : "";
    return { content: [{ type: "text", text: JSON.stringify({ entries: data, meta }, null, 2) }] };
  }
);

server.registerTool(
  "get_time_entry",
  {
    title: "Get a time entry",
    description: "Fetch a single time entry by id.",
    inputSchema: { id: z.number() }
  },
  async ({ id }) => {
    const { data } = await api.getTimeEntry(id as number);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.registerTool(
  "create_time_entry",
  {
    title: "Create time entry",
    description: "Create a time entry. Times must be 'HH:mm' (24h). `task_id` required; `project_id` optional.",
    inputSchema: {
      date: z.string(),                  // yyyy-mm-dd
      start_time: z.string(),            // HH:mm
      end_time: z.string(),              // HH:mm
      task_id: z.number(),
      project_id: z.number().optional(),
      note: z.string().optional(),
      user_id: z.number().optional()
    }
  },
  async (args) => {
    const { data } = await api.createTimeEntry(args as any);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.registerTool(
  "update_time_entry",
  {
    title: "Update time entry",
    description: "PATCH fields on a time entry by id. Any subset of fields allowed.",
    inputSchema: {
      id: z.number(),
      date: z.string().optional(),
      start_time: z.string().optional(),
      end_time: z.string().optional(),
      task_id: z.number().optional(),
      project_id: z.number().optional(),
      note: z.string().optional()
    }
  },
  async ({ id, ...patch }) => {
    const { data } = await api.updateTimeEntry(id as number, patch as any);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// DELETION DISABLED to avoid accidental data loss
server.registerTool(
  "delete_time_entry",
  {
    title: "Delete time entry (disabled)",
    description: "Deletion is disabled in this MCP to prevent accidental data loss.",
    inputSchema: { id: z.number() }
  },
  async ({ id }) => {
    return { content: [{ type: "text", text: `Refused to delete time_entry ${id}. Deletion is disabled in this MCP.` }] };
  }
);

// Timer tools (kept simple)
server.registerTool(
  "get_timer",
  {
    title: "Get timer",
    description: "Read current timer.",
    inputSchema: { user_id: z.number().optional() }
  },
  async (args) => {
    const { data } = await api.getTimer(args as any);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.registerTool(
  "start_timer",
  {
    title: "Start timer",
    description: "Start a timer (optional project/task and note).",
    inputSchema: {
      project_id: z.number().optional(),
      task_id: z.number().optional(),
      note: z.string().optional()
    }
  },
  async (args) => {
    const { data } = await api.startTimer(args as any);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.registerTool(
  "stop_timer",
  {
    title: "Stop timer",
    description: "Stop the current timer (optionally set end_time HH:mm).",
    inputSchema: { end_time: z.string().optional(), user_id: z.number().optional() }
  },
  async (args) => {
    const { data } = await api.stopTimer(args as any);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// Resolver tools for friendly name → id
server.registerTool(
  "find_projects",
  {
    title: "Find projects",
    description: "Find projects by name substring. Returns id and name.",
    inputSchema: { name: z.string() }
  },
  async ({ name }) => {
    const { data } = await api.listProjects();
    const q = String(name).toLowerCase();
    const hits = (Array.isArray(data) ? data : []).filter((p: any) =>
      (p.name ?? "").toLowerCase().includes(q)
    ).map((p: any) => ({ id: p.id, name: p.name }));
    return { content: [{ type: "text", text: JSON.stringify(hits, null, 2) }] };
  }
);

server.registerTool(
  "find_tasks",
  {
    title: "Find tasks",
    description: "Find tasks by name substring (optionally for a project). Returns id, name, project_id.",
    inputSchema: { name: z.string(), project_id: z.number().optional() }
  },
  async ({ name, project_id }) => {
    const { data } = await api.listTasks({ project_id: project_id as number | undefined });
    const q = String(name).toLowerCase();
    const hits = (Array.isArray(data) ? data : []).filter((t: any) =>
      (t.name ?? "").toLowerCase().includes(q)
    ).map((t: any) => ({ id: t.id, name: t.name, project_id: t.project_id ?? null }));
    return { content: [{ type: "text", text: JSON.stringify(hits, null, 2) }] };
  }
);

// -------- Analytics tools (hours in decimal, e.g., 12.5) --------
server.registerTool(
  "total_hours_in_period",
  {
    title: "Total hours in period",
    description: "Sum durations for entries within [start_date, end_date]. Optional filters by project_id/task_id. Returns decimal hours (e.g., 12.5).",
    inputSchema: {
      start_date: z.string(),
      end_date: z.string(),
      project_id: z.number().optional(),
      task_id: z.number().optional()
    }
  },
  async (args) => {
    const { data } = await api.listTimeEntries(args as any);
    const minutes = (Array.isArray(data) ? data : []).reduce((acc: number, e: any) => acc + minutesFromEntry(e), 0);
    const hours = toHoursDecimal(minutes);
    return { content: [{ type: "text", text: JSON.stringify({ hours_decimal: hours }, null, 2) }] };
  }
);

server.registerTool(
  "hours_by_project",
  {
    title: "Hours by project",
    description: "Group and sum durations by project for entries in [start_date, end_date] (yyyy-mm-dd). Output decimal hours per project.",
    inputSchema: {
      start_date: z.string(),
      end_date: z.string()
    }
  },
  async ({ start_date, end_date }) => {
    const { data } = await api.listTimeEntries({ start_date, end_date } as any);
    const by: Record<string, { project_id: number | null; project_name: string | null; minutes: number }> = {};
    for (const e of (Array.isArray(data) ? data : [])) {
      const pid: number | null = e.project_id ?? e.project?.id ?? null;
      const pname: string | null = e.project?.name ?? e.project_name ?? null;
      const key = String(pid ?? "none");
      if (!by[key]) by[key] = { project_id: pid, project_name: pname, minutes: 0 };
      by[key].minutes += minutesFromEntry(e);
      if (!by[key].project_name && pname) by[key].project_name = pname;
    }

    // If names are missing but we have ids, try to enrich from catalog
    const needName = Object.values(by).some(x => x.project_id && !x.project_name);
    if (needName) {
      const { data: projects } = await api.listProjects();
      const nameMap = new Map<number, string>(
        (Array.isArray(projects) ? projects : [])
          .map((p: any) => [Number(p.id), String(p.name ?? "")] as [number, string])
      );
      for (const v of Object.values(by)) {
        if (v.project_id && !v.project_name) v.project_name = nameMap.get(v.project_id) ?? null;
      }
    }

    const rows = Object.values(by).map(v => ({
      project_id: v.project_id,
      project_name: v.project_name,
      hours_decimal: toHoursDecimal(v.minutes)
    }));
    return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
  }
);

server.registerTool(
  "hours_on_day",
  {
    title: "Hours on day",
    description: "Sum durations for a single date (yyyy-mm-dd). Optional filters by project_id/task_id. Returns decimal hours.",
    inputSchema: {
      date: z.string(),
      project_id: z.number().optional(),
      task_id: z.number().optional()
    }
  },
  async ({ date, project_id, task_id }) => {
    const { data } = await api.listTimeEntries({ start_date: date, end_date: date, project_id, task_id } as any);
    const minutes = (Array.isArray(data) ? data : []).reduce((acc: number, e: any) => acc + minutesFromEntry(e), 0);
    const hours = toHoursDecimal(minutes);
    return { content: [{ type: "text", text: JSON.stringify({ date, hours_decimal: hours }, null, 2) }] };
  }
);

// Cache control for catalogs
server.registerTool(
  "clear_catalog_cache",
  {
    title: "Clear catalog cache",
    description: "Clears the in-memory cache for projects/tasks so subsequent lookups fetch fresh data.",
    inputSchema: {}
  },
  async () => {
    api.clearCatalogCache();
    return { content: [{ type: "text", text: "Catalog cache cleared." }] };
  }
);

// --- Boot (stdio) ---
async function main() {
  if (!process.env.HAKUNA_TOKEN) {
    console.error("Missing HAKUNA_TOKEN environment variable.");
    process.exit(1);
  }
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
