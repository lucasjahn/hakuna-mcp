import { request } from "undici";
import { setTimeout as delay } from "node:timers/promises";
import type {
  HttpTransport,
  HakunaClientConfig,
  RateInfo,
  ApiResponse,
  TimeEntry,
  Timer,
  Project,
  Task,
  AbsenceType,
  Absence,
  User,
  Company,
  Overview,
} from "./types.js";
import type {
  ListTimeEntriesParams,
  CreateTimeEntryParams,
  UpdateTimeEntryPatch,
  StartTimerParams,
  StopTimerParams,
  CancelTimerParams,
  ListAbsencesParams,
} from "./schemas.js";

const DEFAULT_BASE = "https://app.hakuna.ch/api/v1";

function createUndiciTransport(): HttpTransport {
  return {
    async request(url, options) {
      const res = await request(url, {
        method: options.method,
        headers: options.headers,
        body: options.body,
      });
      return {
        statusCode: res.statusCode,
        headers: res.headers as Record<string, string | string[] | undefined>,
        body: res.body,
      };
    },
  };
}

export class HakunaClient {
  private readonly token: string;
  private readonly baseUrl: string;
  private readonly transport: HttpTransport;

  private rlState = { remaining: Infinity as number, resetAt: 0 as number };

  private projectsCache: { data: Project[]; timestamp: number } | null = null;
  private tasksCache = new Map<string, { data: Task[]; timestamp: number }>();
  private absenceTypesCache: { data: AbsenceType[]; timestamp: number } | null = null;

  constructor(config: HakunaClientConfig) {
    if (!config.token) throw new Error("Missing HAKUNA_TOKEN");
    this.token = config.token;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE;
    this.transport = config.transport ?? createUndiciTransport();
  }

  private async respectRateLimit() {
    const now = Date.now();
    if (this.rlState.remaining <= 0 && this.rlState.resetAt > now) {
      const waitMs = this.rlState.resetAt - now;
      await delay(waitMs);
    }
  }

  private async http<T>(
    method: "GET" | "POST" | "PATCH" | "DELETE" | "PUT",
    path: string,
    body?: Record<string, unknown>,
    query?: Record<string, string | number | undefined>
  ): Promise<ApiResponse<T>> {
    await this.respectRateLimit();

    const qs = query
      ? "?" +
        Object.entries(query)
          .filter(([, v]) => v !== undefined && v !== "")
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join("&")
      : "";

    const headers: Record<string, string> = {
      "X-Auth-Token": this.token,
      Accept: "application/json",
    };
    const payload = body !== undefined ? JSON.stringify(body) : undefined;
    if (payload) headers["Content-Type"] = "application/json; charset=utf-8";

    const res = await this.transport.request(`${this.baseUrl}${path}${qs}`, {
      method,
      headers,
      body: payload,
    });

    const limit = Number(res.headers["x-ratelimit-limit"] ?? 0);
    const remaining = Number(res.headers["x-ratelimit-remaining"] ?? 0);
    const resetSec = Number(res.headers["x-ratelimit-reset"] ?? 0);

    if (limit) {
      this.rlState.remaining = remaining;
      this.rlState.resetAt = Date.now() + resetSec * 1000;
    }

    if (res.statusCode >= 400) {
      const text = await res.body.text();
      throw new Error(`Hakuna ${res.statusCode}: ${text}`);
    }

    const rate: RateInfo = { limit, remaining, resetSec };
    return { data: (await res.body.json()) as T, rate };
  }

  // --- Time entries ---

  async listTimeEntries(params: ListTimeEntriesParams): Promise<ApiResponse<TimeEntry[]>> {
    return this.http<TimeEntry[]>("GET", "/time_entries", undefined, params);
  }

  async getTimeEntry(id: number): Promise<ApiResponse<TimeEntry>> {
    return this.http<TimeEntry>("GET", `/time_entries/${id}`);
  }

  async createTimeEntry(body: CreateTimeEntryParams): Promise<ApiResponse<TimeEntry>> {
    return this.http<TimeEntry>("POST", "/time_entries", body as unknown as Record<string, unknown>);
  }

  async updateTimeEntry(id: number, patch: UpdateTimeEntryPatch): Promise<ApiResponse<TimeEntry>> {
    return this.http<TimeEntry>("PATCH", `/time_entries/${id}`, patch as unknown as Record<string, unknown>);
  }

  // --- Timer ---

  async getTimer(params?: { user_id?: number }): Promise<ApiResponse<Timer>> {
    return this.http<Timer>("GET", "/timer", undefined, params);
  }

  async startTimer(body: StartTimerParams): Promise<ApiResponse<Timer>> {
    return this.http<Timer>("POST", "/timer", body as unknown as Record<string, unknown>);
  }

  async stopTimer(params?: StopTimerParams): Promise<ApiResponse<TimeEntry>> {
    return this.http<TimeEntry>("PUT", "/timer", undefined, params);
  }

  async cancelTimer(params?: CancelTimerParams): Promise<ApiResponse<Timer>> {
    return this.http<Timer>("DELETE", "/timer", undefined, params);
  }

  // --- Overview, absences, user, company ---

  async getOverview(): Promise<ApiResponse<Overview>> {
    return this.http<Overview>("GET", "/overview");
  }

  async listAbsences(params: ListAbsencesParams): Promise<ApiResponse<Absence[]>> {
    return this.http<Absence[]>("GET", "/absences", undefined, params);
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.http<User>("GET", "/users/me");
  }

  async getCompany(): Promise<ApiResponse<Company>> {
    return this.http<Company>("GET", "/company");
  }

  // --- Catalog with cache ---

  clearCatalogCache() {
    this.projectsCache = null;
    this.tasksCache.clear();
    this.absenceTypesCache = null;
  }

  async listProjects(params?: { search?: string }): Promise<ApiResponse<Project[]>> {
    const search = params?.search?.trim();
    if (!search) {
      if (this.projectsCache) return { data: this.projectsCache.data };
      const res = await this.http<Project[]>("GET", "/projects");
      this.projectsCache = { data: Array.isArray(res.data) ? res.data : [], timestamp: Date.now() };
      return res;
    }
    return this.http<Project[]>("GET", "/projects", undefined, { search });
  }

  async listTasks(params?: { search?: string; project_id?: number }): Promise<ApiResponse<Task[]>> {
    const search = params?.search?.trim();
    const pid = params?.project_id;
    if (!search) {
      const key = `project:${pid ?? "all"}`;
      const cached = this.tasksCache.get(key);
      if (cached) return { data: cached.data };
      const res = await this.http<Task[]>("GET", "/tasks", undefined, pid ? { project_id: pid } : undefined);
      this.tasksCache.set(key, { data: Array.isArray(res.data) ? res.data : [], timestamp: Date.now() });
      return res;
    }
    return this.http<Task[]>("GET", "/tasks", undefined, { search, project_id: pid });
  }

  async listAbsenceTypes(): Promise<ApiResponse<AbsenceType[]>> {
    if (this.absenceTypesCache) return { data: this.absenceTypesCache.data };
    const res = await this.http<AbsenceType[]>("GET", "/absence_types");
    this.absenceTypesCache = { data: Array.isArray(res.data) ? res.data : [], timestamp: Date.now() };
    return res;
  }
}

export function createClient(token: string): HakunaClient {
  return new HakunaClient({ token });
}
