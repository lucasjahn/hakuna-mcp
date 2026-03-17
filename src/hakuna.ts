import { request } from "undici";
import { setTimeout as delay } from "node:timers/promises";
import type {
  ListTimeEntriesParams,
  CreateTimeEntryParams,
  UpdateTimeEntryPatch,
  StartTimerParams,
  StopTimerParams,
  CancelTimerParams,
  ListAbsencesParams,
} from "./schemas.js";

const BASE = "https://app.hakuna.ch/api/v1";

function token() {
  const t = process.env.HAKUNA_TOKEN;
  if (!t) throw new Error("Missing HAKUNA_TOKEN");
  return t;
}

// Simple global rate-limit state
let rlState = { remaining: Infinity as number, resetAt: 0 as number };

async function respectRateLimit() {
  const now = Date.now();
  if (rlState.remaining <= 0 && rlState.resetAt > now) {
    const waitMs = rlState.resetAt - now;
    await delay(waitMs);
  }
}

async function http<T>(
  method: "GET"|"POST"|"PATCH"|"DELETE"|"PUT",
  path: string,
  body?: Record<string, unknown>,
  query?: Record<string, string | number | undefined>
): Promise<{ data: T, rate?: { limit: number, remaining: number, resetSec: number } }> {
  await respectRateLimit();

  const qs = query
    ? "?" + Object.entries(query)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&")
    : "";

  const headers: Record<string, string> = {
    "X-Auth-Token": token(),
    "Accept": "application/json"
  };
  const payload = (body !== undefined) ? JSON.stringify(body) : undefined;
  if (payload) headers["Content-Type"] = "application/json; charset=utf-8";

  const res = await request(`${BASE}${path}${qs}`, { method, headers, body: payload });

  const limit = Number(res.headers["x-ratelimit-limit"] ?? 0);
  const remaining = Number(res.headers["x-ratelimit-remaining"] ?? 0);
  const resetSec = Number(res.headers["x-ratelimit-reset"] ?? 0);

  if (limit) {
    rlState.remaining = remaining;
    rlState.resetAt = Date.now() + resetSec * 1000;
  }

  if (res.statusCode >= 400) {
    const text = await res.body.text();
    throw new Error(`Hakuna ${res.statusCode}: ${text}`);
  }
  return { data: (await res.body.json()) as T, rate: { limit, remaining, resetSec } };
}

// --- Personal: time entries ---
export async function listTimeEntries(params: ListTimeEntriesParams) {
  return http<unknown>("GET", "/time_entries", undefined, params);
}
export async function getTimeEntry(id: number) {
  return http<unknown>("GET", `/time_entries/${id}`);
}
export async function createTimeEntry(body: CreateTimeEntryParams) {
  return http<unknown>("POST", "/time_entries", body as unknown as Record<string, unknown>);
}
export async function updateTimeEntry(id: number, patch: UpdateTimeEntryPatch) {
  return http<unknown>("PATCH", `/time_entries/${id}`, patch as unknown as Record<string, unknown>);
}
export async function deleteTimeEntry(id: number) {
  return http<unknown>("DELETE", `/time_entries/${id}`);
}

// --- Timer ---
export async function getTimer(params?: { user_id?: number }) {
  return http<unknown>("GET", "/timer", undefined, params);
}
export async function startTimer(body: StartTimerParams) {
  return http<unknown>("POST", "/timer", body as unknown as Record<string, unknown>);
}
export async function stopTimer(params?: StopTimerParams) {
  return http<unknown>("PUT", "/timer", undefined, params);
}
export async function cancelTimer(params?: CancelTimerParams) {
  return http<unknown>("DELETE", "/timer", undefined, params);
}

// --- Overview, absences, user, company ---
export async function getOverview() {
  return http<unknown>("GET", "/overview");
}
export async function listAbsences(params: ListAbsencesParams) {
  return http<unknown>("GET", "/absences", undefined, params);
}
export async function getCurrentUser() {
  return http<unknown>("GET", "/users/me");
}
export async function getCompany() {
  return http<unknown>("GET", "/company");
}

// --- Catalog for name → id resolution (with lightweight cache) ---

let projectsCache: { data: unknown[]; timestamp: number } | null = null;
const tasksCache = new Map<string, { data: unknown[]; timestamp: number }>();
let absenceTypesCache: { data: unknown[]; timestamp: number } | null = null;

export function clearCatalogCache() {
  projectsCache = null;
  tasksCache.clear();
  absenceTypesCache = null;
}

export async function listProjects(params?: { search?: string }) {
  const search = params?.search?.trim();
  if (!search) {
    if (projectsCache) return { data: projectsCache.data };
    const res = await http<unknown[]>("GET", "/projects");
    projectsCache = { data: Array.isArray(res.data) ? res.data : [], timestamp: Date.now() };
    return res;
  }
  return http<unknown[]>("GET", "/projects", undefined, { search });
}

export async function listTasks(params?: { search?: string; project_id?: number }) {
  const search = params?.search?.trim();
  const pid = params?.project_id;
  if (!search) {
    const key = `project:${pid ?? "all"}`;
    const cached = tasksCache.get(key);
    if (cached) return { data: cached.data };
    const res = await http<unknown[]>("GET", "/tasks", undefined, pid ? { project_id: pid } : undefined);
    tasksCache.set(key, { data: Array.isArray(res.data) ? res.data : [], timestamp: Date.now() });
    return res;
  }
  return http<unknown[]>("GET", "/tasks", undefined, { search, project_id: pid });
}

export async function listAbsenceTypes() {
  if (absenceTypesCache) return { data: absenceTypesCache.data };
  const res = await http<unknown[]>("GET", "/absence_types");
  absenceTypesCache = { data: Array.isArray(res.data) ? res.data : [], timestamp: Date.now() };
  return res;
}
