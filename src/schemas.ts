import { z } from "zod";

// ── Reusable primitives ──

export const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format")
  .describe("Date in YYYY-MM-DD format");

export const timeString = z
  .string()
  .regex(/^\d{1,2}:\d{2}$/, "Must be HH:mm (24-hour)")
  .describe("Time in HH:mm format (24-hour)");

export const positiveId = z.number().int().positive();

// ── Time entry tools ──

export const listTimeEntriesInput = {
  start_date: dateString.describe("Start date (inclusive) in YYYY-MM-DD format"),
  end_date: dateString.describe("End date (inclusive) in YYYY-MM-DD format"),
  project_id: positiveId.optional().describe("Filter by project ID"),
  task_id: positiveId.optional().describe("Filter by task ID"),
  user_id: positiveId.optional().describe("Filter by user ID (admin only)"),
};

export const getTimeEntryInput = {
  id: positiveId.describe("Time entry ID"),
};

export const createTimeEntryInput = {
  date: dateString.describe("Date of the time entry"),
  start_time: timeString.describe("Start time of the entry"),
  end_time: timeString.describe("End time of the entry"),
  task_id: positiveId.describe("Task ID (required)"),
  project_id: positiveId.optional().describe("Project ID"),
  note: z.string().optional().describe("Optional note for the entry"),
  user_id: positiveId.optional().describe("User ID (admin only)"),
};

export const updateTimeEntryInput = {
  id: positiveId.describe("Time entry ID to update"),
  date: dateString.optional().describe("New date"),
  start_time: timeString.optional().describe("New start time"),
  end_time: timeString.optional().describe("New end time"),
  task_id: positiveId.optional().describe("New task ID"),
  project_id: positiveId.optional().describe("New project ID"),
  note: z.string().optional().describe("New note"),
};

export const deleteTimeEntryInput = {
  id: positiveId.describe("Time entry ID"),
};

// ── Timer tools ──

export const getTimerInput = {
  user_id: positiveId.optional().describe("User ID (admin only)"),
};

export const startTimerInput = {
  task_id: positiveId.describe("Task ID (required by Hakuna API)"),
  project_id: positiveId.optional().describe("Project ID"),
  start_time: timeString.optional().describe("Override start time in HH:mm (defaults to now)"),
  note: z.string().optional().describe("Optional note"),
};

export const stopTimerInput = {
  end_time: timeString.optional().describe("Override end time in HH:mm (defaults to now)"),
  user_id: positiveId.optional().describe("User ID (admin only)"),
};

export const cancelTimerInput = {
  user_id: positiveId.optional().describe("User ID (admin only)"),
};

// ── Finder tools ──

export const findProjectsInput = {
  name: z.string().min(1).describe("Search substring to match against project names (case-insensitive)"),
};

export const findTasksInput = {
  name: z.string().min(1).describe("Search substring to match against task names (case-insensitive)"),
  project_id: positiveId.optional().describe("Filter tasks to a specific project"),
};

// ── Analytics tools ──

export const totalHoursInPeriodInput = {
  start_date: dateString.describe("Period start date (inclusive)"),
  end_date: dateString.describe("Period end date (inclusive)"),
  project_id: positiveId.optional().describe("Filter by project ID"),
  task_id: positiveId.optional().describe("Filter by task ID"),
};

export const hoursByProjectInput = {
  start_date: dateString.describe("Period start date (inclusive)"),
  end_date: dateString.describe("Period end date (inclusive)"),
};

export const hoursOnDayInput = {
  date: dateString.describe("The date to sum hours for"),
  project_id: positiveId.optional().describe("Filter by project ID"),
  task_id: positiveId.optional().describe("Filter by task ID"),
};

// ── New tools ──

export const listAbsencesInput = {
  year: z.number().int().min(2000).max(2100).describe("Year to list absences for (e.g. 2026)"),
};

// get_overview, get_current_user, list_absence_types, get_company, clear_catalog_cache → no params

// ── Inferred types for hakuna.ts ──

export type ListTimeEntriesParams = {
  start_date: string;
  end_date: string;
  project_id?: number;
  task_id?: number;
  user_id?: number;
};

export type CreateTimeEntryParams = {
  date: string;
  start_time: string;
  end_time: string;
  task_id: number;
  project_id?: number;
  note?: string;
  user_id?: number;
};

export type UpdateTimeEntryPatch = {
  date?: string;
  start_time?: string;
  end_time?: string;
  task_id?: number;
  project_id?: number;
  note?: string;
};

export type StartTimerParams = {
  task_id: number;
  project_id?: number;
  start_time?: string;
  note?: string;
};

export type StopTimerParams = { end_time?: string; user_id?: number };
export type CancelTimerParams = { user_id?: number };
export type ListAbsencesParams = { year: number };
