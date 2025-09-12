import { request } from "undici";
import { setTimeout as delay } from "node:timers/promises";

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
  body?: any,
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
export async function listTimeEntries(params: {
  start_date: string; end_date: string;
  project_id?: number; task_id?: number; user_id?: number;
}) {
  return http<any>("GET", "/time_entries", undefined, params);
}
export async function getTimeEntry(id: number) {
  return http<any>("GET", `/time_entries/${id}`);
}
export async function createTimeEntry(body: {
  date: string; start_time: string; end_time: string;
  task_id: number; project_id?: number; note?: string; user_id?: number;
}) {
  return http<any>("POST", "/time_entries", body);
}
export async function updateTimeEntry(id: number, patch: Partial<{
  date: string; start_time: string; end_time: string;
  task_id: number; project_id: number; note: string;
}>) {
  return http<any>("PATCH", `/time_entries/${id}`, patch);
}
export async function deleteTimeEntry(id: number) {
  return http<any>("DELETE", `/time_entries/${id}`);
}

// --- Timer ---
export async function getTimer(params?: { user_id?: number }) {
  return http<any>("GET", "/timer", undefined, params);
}
export async function startTimer(body?: { project_id?: number; task_id?: number; note?: string }) {
  return http<any>("POST", "/timer", body ?? {});
}
export async function stopTimer(params?: { end_time?: string; user_id?: number }) {
  return http<any>("PUT", "/timer", undefined, params);
}

// --- Catalog for name → id resolution (with lightweight cache) ---
type AnyArray = any[];

let projectsCache: { data: AnyArray; timestamp: number } | null = null;
const tasksCache = new Map<string, { data: AnyArray; timestamp: number }>();

export function clearCatalogCache() {
  projectsCache = null;
  tasksCache.clear();
}

export async function listProjects(params?: { search?: string }) {
  const search = params?.search?.trim();
  if (!search) {
    if (projectsCache) return { data: projectsCache.data } as any;
    const res = await http<any[]>("GET", "/projects");
    projectsCache = { data: Array.isArray(res.data) ? res.data : [], timestamp: Date.now() };
    return res;
  }
  // For searched queries, bypass cache to respect server-side filtering
  return http<any[]>("GET", "/projects", undefined, { search });
}

export async function listTasks(params?: { search?: string; project_id?: number }) {
  const search = params?.search?.trim();
  const pid = params?.project_id;
  if (!search) {
    const key = `project:${pid ?? "all"}`;
    const cached = tasksCache.get(key);
    if (cached) return { data: cached.data } as any;
    const res = await http<any[]>("GET", "/tasks", undefined, pid ? { project_id: pid } : undefined);
    tasksCache.set(key, { data: Array.isArray(res.data) ? res.data : [], timestamp: Date.now() });
    return res;
  }
  // For searched queries, bypass cache
  return http<any[]>("GET", "/tasks", undefined, { search, project_id: pid });
}
