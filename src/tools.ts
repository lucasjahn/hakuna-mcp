import type { z } from "zod";
import type { HakunaClient } from "./hakuna.js";
import type { TimeEntry, Project } from "./types.js";
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
import {
  minutesFromEntry,
  toHoursDecimal,
  totalHoursInPeriod,
  hoursByProject,
} from "./analytics.js";

export class TextResult {
  constructor(public text: string) {}
}

export interface ToolDefinition {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, z.ZodTypeAny>;
  annotations: {
    readOnlyHint?: boolean;
    idempotentHint?: boolean;
    destructiveHint?: boolean;
  };
  handler: (
    client: HakunaClient,
    args: Record<string, unknown>
  ) => Promise<unknown>;
}

export const tools: ToolDefinition[] = [
  // --- Time entries ---
  {
    name: "list_time_entries",
    title: "List time entries",
    description:
      "List time entries in a date range (YYYY-MM-DD). Returns array of entries with id, date, start_time, end_time, task, project, note. Optional filters by project_id/task_id/user_id.",
    inputSchema: listTimeEntriesInput,
    annotations: { readOnlyHint: true, idempotentHint: true },
    handler: async (client, args) => {
      const { data, rate } = await client.listTimeEntries(
        args as unknown as Parameters<HakunaClient["listTimeEntries"]>[0]
      );
      const meta = rate
        ? `(rate remaining ${rate.remaining}/${rate.limit}, reset in ${rate.resetSec}s)`
        : "";
      return { entries: data, meta };
    },
  },
  {
    name: "get_time_entry",
    title: "Get a time entry",
    description:
      "Fetch a single time entry by its numeric ID. Returns full entry details including date, times, task, project, note, and duration.",
    inputSchema: getTimeEntryInput,
    annotations: { readOnlyHint: true, idempotentHint: true },
    handler: async (client, args) => {
      const { data } = await client.getTimeEntry(args.id as number);
      return data;
    },
  },
  {
    name: "create_time_entry",
    title: "Create time entry",
    description:
      "Create a new time entry. Times must be HH:mm (24h). task_id is required; use find_tasks to look up the ID. project_id is optional. Returns the created entry.",
    inputSchema: createTimeEntryInput,
    annotations: { destructiveHint: false, idempotentHint: false },
    handler: async (client, args) => {
      const { data } = await client.createTimeEntry(
        args as unknown as Parameters<HakunaClient["createTimeEntry"]>[0]
      );
      return data;
    },
  },
  {
    name: "update_time_entry",
    title: "Update time entry",
    description:
      "Update fields on an existing time entry by ID. Send only the fields to change (PATCH semantics). Returns the updated entry.",
    inputSchema: updateTimeEntryInput,
    annotations: { destructiveHint: false, idempotentHint: false },
    handler: async (client, args) => {
      const { id, ...patch } = args as { id: number; [key: string]: unknown };
      const { data } = await client.updateTimeEntry(
        id,
        patch as unknown as Parameters<HakunaClient["updateTimeEntry"]>[1]
      );
      return data;
    },
  },
  {
    name: "delete_time_entry",
    title: "Delete time entry (disabled)",
    description:
      "Deletion is permanently disabled in this MCP server to prevent accidental data loss. This tool always returns a refusal message.",
    inputSchema: deleteTimeEntryInput,
    annotations: { readOnlyHint: true },
    handler: async (_client, args) => {
      return new TextResult(
        `Refused to delete time_entry ${args.id}. Deletion is disabled in this MCP.`
      );
    },
  },

  // --- Timer ---
  {
    name: "get_timer",
    title: "Get timer",
    description:
      "Read the currently running timer. Returns timer status including start_time, task, project, note, and duration. Returns empty/null if no timer is running.",
    inputSchema: getTimerInput,
    annotations: { readOnlyHint: true, idempotentHint: true },
    handler: async (client, args) => {
      const { data } = await client.getTimer(
        args as unknown as Parameters<HakunaClient["getTimer"]>[0]
      );
      return data;
    },
  },
  {
    name: "start_timer",
    title: "Start timer",
    description:
      "Start a new timer. task_id is required (use find_tasks to look it up). Optionally specify project_id, start_time override (HH:mm), and a note. Fails if a timer is already running — stop or cancel it first.",
    inputSchema: startTimerInput,
    annotations: { destructiveHint: false, idempotentHint: false },
    handler: async (client, args) => {
      const { data } = await client.startTimer(
        args as unknown as Parameters<HakunaClient["startTimer"]>[0]
      );
      return data;
    },
  },
  {
    name: "stop_timer",
    title: "Stop timer",
    description:
      "Stop the running timer and save it as a time entry. Optionally override end_time (HH:mm). Returns the created time entry. Use cancel_timer instead if you want to discard without saving.",
    inputSchema: stopTimerInput,
    annotations: { destructiveHint: false, idempotentHint: false },
    handler: async (client, args) => {
      const { data } = await client.stopTimer(
        args as unknown as Parameters<HakunaClient["stopTimer"]>[0]
      );
      return data;
    },
  },
  {
    name: "cancel_timer",
    title: "Cancel timer",
    description:
      "Discard the running timer without creating a time entry. The tracked time is lost. Use stop_timer instead if you want to save the entry.",
    inputSchema: cancelTimerInput,
    annotations: { destructiveHint: true, idempotentHint: false },
    handler: async (client, args) => {
      const { data } = await client.cancelTimer(
        args as unknown as Parameters<HakunaClient["cancelTimer"]>[0]
      );
      return data;
    },
  },

  // --- Finders ---
  {
    name: "find_projects",
    title: "Find projects",
    description:
      "Search projects by name substring (case-insensitive). Returns array of { id, name } matches. Use the returned id for project_id parameters in other tools.",
    inputSchema: findProjectsInput,
    annotations: { readOnlyHint: true, idempotentHint: true },
    handler: async (client, args) => {
      const { data } = await client.listProjects();
      const q = String(args.name).toLowerCase();
      return data
        .filter((p) => p.name.toLowerCase().includes(q))
        .map((p) => ({ id: p.id, name: p.name }));
    },
  },
  {
    name: "find_tasks",
    title: "Find tasks",
    description:
      "Search tasks by name substring (case-insensitive), optionally filtered to a specific project. Returns array of { id, name, project_id }. Use the returned id for task_id parameters.",
    inputSchema: findTasksInput,
    annotations: { readOnlyHint: true, idempotentHint: true },
    handler: async (client, args) => {
      const { data } = await client.listTasks({
        project_id: args.project_id as number | undefined,
      });
      const q = String(args.name).toLowerCase();
      return data
        .filter((t) => t.name.toLowerCase().includes(q))
        .map((t) => ({ id: t.id, name: t.name, project_id: t.project_id ?? null }));
    },
  },

  // --- Analytics ---
  {
    name: "total_hours_in_period",
    title: "Total hours in period",
    description:
      "Sum all time entry durations within [start_date, end_date]. Optional filters by project_id/task_id. Returns { hours_decimal } (e.g. 12.5 = 12h 30m).",
    inputSchema: totalHoursInPeriodInput,
    annotations: { readOnlyHint: true, idempotentHint: true },
    handler: async (client, args) => {
      const { data } = await client.listTimeEntries(
        args as unknown as Parameters<HakunaClient["listTimeEntries"]>[0]
      );
      const { totalHours } = totalHoursInPeriod(data);
      return { hours_decimal: totalHours };
    },
  },
  {
    name: "hours_by_project",
    title: "Hours by project",
    description:
      "Group and sum time entry durations by project for [start_date, end_date]. Returns array of { project_id, project_name, hours_decimal }.",
    inputSchema: hoursByProjectInput,
    annotations: { readOnlyHint: true, idempotentHint: true },
    handler: async (client, args) => {
      const { data: entries } = await client.listTimeEntries({
        start_date: args.start_date as string,
        end_date: args.end_date as string,
      });

      // Only fetch catalog if any entry has a project_id but no project name
      const needName = entries.some(
        (e) =>
          (e.project_id ?? e.project?.id) && !e.project?.name && !e.project_name
      );
      let projects: Project[] = [];
      if (needName) {
        const res = await client.listProjects();
        projects = res.data;
      }

      return hoursByProject(entries, projects);
    },
  },
  {
    name: "hours_on_day",
    title: "Hours on day",
    description:
      "Sum time entry durations for a single date (YYYY-MM-DD). Optional filters by project_id/task_id. Returns { date, hours_decimal }.",
    inputSchema: hoursOnDayInput,
    annotations: { readOnlyHint: true, idempotentHint: true },
    handler: async (client, args) => {
      const date = args.date as string;
      const { data } = await client.listTimeEntries({
        start_date: date,
        end_date: date,
        project_id: args.project_id as number | undefined,
        task_id: args.task_id as number | undefined,
      });
      const minutes = data.reduce(
        (acc: number, e: TimeEntry) => acc + minutesFromEntry(e),
        0
      );
      return { date, hours_decimal: toHoursDecimal(minutes) };
    },
  },

  // --- Overview & absences ---
  {
    name: "get_overview",
    title: "Get overview",
    description:
      "Get current overtime balance (in hh:mm format and total seconds) and vacation days (redeemed and remaining). No parameters needed.",
    inputSchema: {},
    annotations: { readOnlyHint: true, idempotentHint: true },
    handler: async (client) => {
      const { data } = await client.getOverview();
      return data;
    },
  },
  {
    name: "list_absences",
    title: "List absences",
    description:
      "List all absences (vacation, sick leave, etc.) for a given year. Returns array of absence records with dates, type, and status.",
    inputSchema: listAbsencesInput,
    annotations: { readOnlyHint: true, idempotentHint: true },
    handler: async (client, args) => {
      const { data } = await client.listAbsences(
        args as unknown as Parameters<HakunaClient["listAbsences"]>[0]
      );
      return data;
    },
  },

  // --- User & company ---
  {
    name: "get_current_user",
    title: "Get current user",
    description:
      "Get the profile of the currently authenticated user. Returns name, email, role, and other account details.",
    inputSchema: {},
    annotations: { readOnlyHint: true, idempotentHint: true },
    handler: async (client) => {
      const { data } = await client.getCurrentUser();
      return data;
    },
  },
  {
    name: "list_absence_types",
    title: "List absence types",
    description:
      "List all available absence types (e.g. vacation, sick leave, unpaid leave). Results are cached; use clear_catalog_cache to refresh.",
    inputSchema: {},
    annotations: { readOnlyHint: true, idempotentHint: true },
    handler: async (client) => {
      const { data } = await client.listAbsenceTypes();
      return data;
    },
  },
  {
    name: "get_company",
    title: "Get company",
    description:
      "Get company information including name, settings, and enabled features.",
    inputSchema: {},
    annotations: { readOnlyHint: true, idempotentHint: true },
    handler: async (client) => {
      const { data } = await client.getCompany();
      return data;
    },
  },

  // --- Cache control ---
  {
    name: "clear_catalog_cache",
    title: "Clear catalog cache",
    description:
      "Clear the in-memory cache for projects, tasks, and absence types so subsequent lookups fetch fresh data from the API.",
    inputSchema: {},
    annotations: { destructiveHint: false, idempotentHint: true },
    handler: async (client) => {
      client.clearCatalogCache();
      return new TextResult(
        "Catalog cache cleared (projects, tasks, absence types)."
      );
    },
  },
];
