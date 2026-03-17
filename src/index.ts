#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as api from "./hakuna.js";
import {
  listTimeEntriesInput,
  getTimeEntryInput,
  createTimeEntryInput,
  updateTimeEntryInput,
  deleteTimeEntryInput,
  getTimerInput,
  startTimerInput,
  stopTimerInput,
  cancelTimerInput,
  findProjectsInput,
  findTasksInput,
  totalHoursInPeriodInput,
  hoursByProjectInput,
  hoursOnDayInput,
  listAbsencesInput,
} from "./schemas.js";

// Create server
const server = new McpServer(
  { name: "hakuna", version: "0.2.5" },
  { capabilities: { logging: {} } }
);

// Simple CLI help
const argv = process.argv.slice(2);
if (argv.includes("-h") || argv.includes("--help")) {
  console.log(`hakuna-mcp — Hakuna MCP server (stdio)
Usage: hakuna-mcp
Env:   HAKUNA_TOKEN=<token>
Docs:  https://github.com/lucasjahn/hakuna-mcp`);
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

interface TimeEntryLike {
  duration_minutes?: number;
  duration_in_minutes?: number;
  minutes?: number;
  start_time?: string;
  end_time?: string;
}

function minutesFromEntry(e: TimeEntryLike): number {
  const m = e?.duration_minutes ?? e?.duration_in_minutes ?? e?.minutes;
  if (typeof m === "number" && !Number.isNaN(m)) return m;
  const start = parseHHMM(e?.start_time);
  const end = parseHHMM(e?.end_time);
  if (start != null && end != null) {
    let diff = end - start;
    if (diff < 0) diff += 24 * 60;
    return diff;
  }
  return 0;
}

function toHoursDecimal(mins: number): number {
  return Math.round((mins / 60) * 100) / 100;
}

// -------------- Error handling wrapper --------------

function wrapHandler(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (args: any) => Promise<{ content: { type: "text"; text: string }[] }>
) {
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

// -------------- Tools --------------

server.registerTool(
  "list_time_entries",
  {
    title: "List time entries",
    description:
      "List time entries in a date range (YYYY-MM-DD). Returns array of entries with id, date, start_time, end_time, task, project, note. Optional filters by project_id/task_id/user_id.",
    inputSchema: listTimeEntriesInput,
    annotations: { readOnlyHint: true, idempotentHint: true },
  },
  wrapHandler(async (args) => {
    const { data, rate } = await api.listTimeEntries(args);
    const meta = rate ? `(rate remaining ${rate.remaining}/${rate.limit}, reset in ${rate.resetSec}s)` : "";
    return jsonContent({ entries: data, meta });
  })
);

server.registerTool(
  "get_time_entry",
  {
    title: "Get a time entry",
    description:
      "Fetch a single time entry by its numeric ID. Returns full entry details including date, times, task, project, note, and duration.",
    inputSchema: getTimeEntryInput,
    annotations: { readOnlyHint: true, idempotentHint: true },
  },
  wrapHandler(async ({ id }) => {
    const { data } = await api.getTimeEntry(id);
    return jsonContent(data);
  })
);

server.registerTool(
  "create_time_entry",
  {
    title: "Create time entry",
    description:
      "Create a new time entry. Times must be HH:mm (24h). task_id is required; use find_tasks to look up the ID. project_id is optional. Returns the created entry.",
    inputSchema: createTimeEntryInput,
    annotations: { destructiveHint: false, idempotentHint: false },
  },
  wrapHandler(async (args) => {
    const { data } = await api.createTimeEntry(args);
    return jsonContent(data);
  })
);

server.registerTool(
  "update_time_entry",
  {
    title: "Update time entry",
    description:
      "Update fields on an existing time entry by ID. Send only the fields to change (PATCH semantics). Returns the updated entry.",
    inputSchema: updateTimeEntryInput,
    annotations: { destructiveHint: false, idempotentHint: false },
  },
  wrapHandler(async ({ id, ...patch }) => {
    const { data } = await api.updateTimeEntry(id, patch);
    return jsonContent(data);
  })
);

// DELETION DISABLED to avoid accidental data loss
server.registerTool(
  "delete_time_entry",
  {
    title: "Delete time entry (disabled)",
    description:
      "Deletion is permanently disabled in this MCP server to prevent accidental data loss. This tool always returns a refusal message.",
    inputSchema: deleteTimeEntryInput,
    annotations: { readOnlyHint: true },
  },
  wrapHandler(async ({ id }) => {
    return { content: [{ type: "text" as const, text: `Refused to delete time_entry ${id}. Deletion is disabled in this MCP.` }] };
  })
);

// Timer tools
server.registerTool(
  "get_timer",
  {
    title: "Get timer",
    description:
      "Read the currently running timer. Returns timer status including start_time, task, project, note, and duration. Returns empty/null if no timer is running.",
    inputSchema: getTimerInput,
    annotations: { readOnlyHint: true, idempotentHint: true },
  },
  wrapHandler(async (args) => {
    const { data } = await api.getTimer(args);
    return jsonContent(data);
  })
);

server.registerTool(
  "start_timer",
  {
    title: "Start timer",
    description:
      "Start a new timer. task_id is required (use find_tasks to look it up). Optionally specify project_id, start_time override (HH:mm), and a note. Fails if a timer is already running — stop or cancel it first.",
    inputSchema: startTimerInput,
    annotations: { destructiveHint: false, idempotentHint: false },
  },
  wrapHandler(async (args) => {
    const { data } = await api.startTimer(args);
    return jsonContent(data);
  })
);

server.registerTool(
  "stop_timer",
  {
    title: "Stop timer",
    description:
      "Stop the running timer and save it as a time entry. Optionally override end_time (HH:mm). Returns the created time entry. Use cancel_timer instead if you want to discard without saving.",
    inputSchema: stopTimerInput,
    annotations: { destructiveHint: false, idempotentHint: false },
  },
  wrapHandler(async (args) => {
    const { data } = await api.stopTimer(args);
    return jsonContent(data);
  })
);

server.registerTool(
  "cancel_timer",
  {
    title: "Cancel timer",
    description:
      "Discard the running timer without creating a time entry. The tracked time is lost. Use stop_timer instead if you want to save the entry.",
    inputSchema: cancelTimerInput,
    annotations: { destructiveHint: true, idempotentHint: false },
  },
  wrapHandler(async (args) => {
    const { data } = await api.cancelTimer(args);
    return jsonContent(data);
  })
);

// Resolver tools for friendly name → id
server.registerTool(
  "find_projects",
  {
    title: "Find projects",
    description:
      "Search projects by name substring (case-insensitive). Returns array of { id, name } matches. Use the returned id for project_id parameters in other tools.",
    inputSchema: findProjectsInput,
    annotations: { readOnlyHint: true, idempotentHint: true },
  },
  wrapHandler(async ({ name }) => {
    const { data } = await api.listProjects();
    const q = String(name).toLowerCase();
    const items = (Array.isArray(data) ? data : []) as Record<string, unknown>[];
    const hits = items
      .filter((p) => (String(p.name ?? "")).toLowerCase().includes(q))
      .map((p) => ({ id: p.id, name: p.name }));
    return jsonContent(hits);
  })
);

server.registerTool(
  "find_tasks",
  {
    title: "Find tasks",
    description:
      "Search tasks by name substring (case-insensitive), optionally filtered to a specific project. Returns array of { id, name, project_id }. Use the returned id for task_id parameters.",
    inputSchema: findTasksInput,
    annotations: { readOnlyHint: true, idempotentHint: true },
  },
  wrapHandler(async ({ name, project_id }) => {
    const { data } = await api.listTasks({ project_id });
    const q = String(name).toLowerCase();
    const items = (Array.isArray(data) ? data : []) as Record<string, unknown>[];
    const hits = items
      .filter((t) => (String(t.name ?? "")).toLowerCase().includes(q))
      .map((t) => ({ id: t.id, name: t.name, project_id: t.project_id ?? null }));
    return jsonContent(hits);
  })
);

// -------- Analytics tools --------
server.registerTool(
  "total_hours_in_period",
  {
    title: "Total hours in period",
    description:
      "Sum all time entry durations within [start_date, end_date]. Optional filters by project_id/task_id. Returns { hours_decimal } (e.g. 12.5 = 12h 30m).",
    inputSchema: totalHoursInPeriodInput,
    annotations: { readOnlyHint: true, idempotentHint: true },
  },
  wrapHandler(async (args) => {
    const { data } = await api.listTimeEntries(args);
    const entries = Array.isArray(data) ? data : [];
    const minutes = entries.reduce((acc: number, e: TimeEntryLike) => acc + minutesFromEntry(e), 0);
    return jsonContent({ hours_decimal: toHoursDecimal(minutes) });
  })
);

server.registerTool(
  "hours_by_project",
  {
    title: "Hours by project",
    description:
      "Group and sum time entry durations by project for [start_date, end_date]. Returns array of { project_id, project_name, hours_decimal }.",
    inputSchema: hoursByProjectInput,
    annotations: { readOnlyHint: true, idempotentHint: true },
  },
  wrapHandler(async ({ start_date, end_date }) => {
    const { data } = await api.listTimeEntries({ start_date, end_date });
    const by: Record<string, { project_id: number | null; project_name: string | null; minutes: number }> = {};
    for (const e of (Array.isArray(data) ? data : []) as Record<string, unknown>[]) {
      const proj = e.project as Record<string, unknown> | undefined;
      const pid = (e.project_id ?? proj?.id ?? null) as number | null;
      const pname = (proj?.name ?? e.project_name ?? null) as string | null;
      const key = String(pid ?? "none");
      if (!by[key]) by[key] = { project_id: pid, project_name: pname, minutes: 0 };
      by[key].minutes += minutesFromEntry(e as unknown as TimeEntryLike);
      if (!by[key].project_name && pname) by[key].project_name = pname;
    }

    // Enrich missing names from catalog
    const needName = Object.values(by).some(x => x.project_id && !x.project_name);
    if (needName) {
      const { data: projects } = await api.listProjects();
      const nameMap = new Map<number, string>(
        ((Array.isArray(projects) ? projects : []) as Record<string, unknown>[])
          .map((p) => [Number(p.id), String(p.name ?? "")] as [number, string])
      );
      for (const v of Object.values(by)) {
        if (v.project_id && !v.project_name) v.project_name = nameMap.get(v.project_id) ?? null;
      }
    }

    const rows = Object.values(by).map(v => ({
      project_id: v.project_id,
      project_name: v.project_name,
      hours_decimal: toHoursDecimal(v.minutes),
    }));
    return jsonContent(rows);
  })
);

server.registerTool(
  "hours_on_day",
  {
    title: "Hours on day",
    description:
      "Sum time entry durations for a single date (YYYY-MM-DD). Optional filters by project_id/task_id. Returns { date, hours_decimal }.",
    inputSchema: hoursOnDayInput,
    annotations: { readOnlyHint: true, idempotentHint: true },
  },
  wrapHandler(async ({ date, project_id, task_id }) => {
    const { data } = await api.listTimeEntries({ start_date: date, end_date: date, project_id, task_id });
    const entries = Array.isArray(data) ? data : [];
    const minutes = entries.reduce((acc: number, e: TimeEntryLike) => acc + minutesFromEntry(e), 0);
    return jsonContent({ date, hours_decimal: toHoursDecimal(minutes) });
  })
);

// -------- Overview & absences --------
server.registerTool(
  "get_overview",
  {
    title: "Get overview",
    description:
      "Get current overtime balance (in hh:mm format and total seconds) and vacation days (redeemed and remaining). No parameters needed.",
    inputSchema: {},
    annotations: { readOnlyHint: true, idempotentHint: true },
  },
  wrapHandler(async () => {
    const { data } = await api.getOverview();
    return jsonContent(data);
  })
);

server.registerTool(
  "list_absences",
  {
    title: "List absences",
    description:
      "List all absences (vacation, sick leave, etc.) for a given year. Returns array of absence records with dates, type, and status.",
    inputSchema: listAbsencesInput,
    annotations: { readOnlyHint: true, idempotentHint: true },
  },
  wrapHandler(async (args) => {
    const { data } = await api.listAbsences(args);
    return jsonContent(data);
  })
);

// -------- User & company info --------
server.registerTool(
  "get_current_user",
  {
    title: "Get current user",
    description:
      "Get the profile of the currently authenticated user. Returns name, email, role, and other account details.",
    inputSchema: {},
    annotations: { readOnlyHint: true, idempotentHint: true },
  },
  wrapHandler(async () => {
    const { data } = await api.getCurrentUser();
    return jsonContent(data);
  })
);

server.registerTool(
  "list_absence_types",
  {
    title: "List absence types",
    description:
      "List all available absence types (e.g. vacation, sick leave, unpaid leave). Results are cached; use clear_catalog_cache to refresh.",
    inputSchema: {},
    annotations: { readOnlyHint: true, idempotentHint: true },
  },
  wrapHandler(async () => {
    const { data } = await api.listAbsenceTypes();
    return jsonContent(data);
  })
);

server.registerTool(
  "get_company",
  {
    title: "Get company",
    description:
      "Get company information including name, settings, and enabled features.",
    inputSchema: {},
    annotations: { readOnlyHint: true, idempotentHint: true },
  },
  wrapHandler(async () => {
    const { data } = await api.getCompany();
    return jsonContent(data);
  })
);

// Cache control
server.registerTool(
  "clear_catalog_cache",
  {
    title: "Clear catalog cache",
    description:
      "Clear the in-memory cache for projects, tasks, and absence types so subsequent lookups fetch fresh data from the API.",
    inputSchema: {},
    annotations: { destructiveHint: false, idempotentHint: true },
  },
  wrapHandler(async () => {
    api.clearCatalogCache();
    return { content: [{ type: "text" as const, text: "Catalog cache cleared (projects, tasks, absence types)." }] };
  })
);

// --- Boot (stdio) ---
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
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
