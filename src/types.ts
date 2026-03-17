// API response interfaces and transport abstraction

export interface HttpTransport {
  request(
    url: string,
    options: {
      method: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
      headers: Record<string, string>;
      body?: string;
    }
  ): Promise<{
    statusCode: number;
    headers: Record<string, string | string[] | undefined>;
    body: { text(): Promise<string>; json(): Promise<unknown> };
  }>;
}

export interface HakunaClientConfig {
  token: string;
  baseUrl?: string;
  transport?: HttpTransport;
}

export interface RateInfo {
  limit: number;
  remaining: number;
  resetSec: number;
}

export interface ApiResponse<T> {
  data: T;
  rate?: RateInfo;
}

// Domain models

export interface TimeEntry {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes?: number;
  duration_in_minutes?: number;
  minutes?: number;
  task_id: number;
  task?: { id: number; name: string };
  project_id?: number | null;
  project?: { id: number; name: string } | null;
  project_name?: string | null;
  note?: string | null;
  user_id?: number;
}

export interface Timer {
  id?: number;
  start_time?: string;
  date?: string;
  task_id?: number;
  task?: { id: number; name: string };
  project_id?: number | null;
  project?: { id: number; name: string } | null;
  note?: string | null;
  duration?: number;
  [key: string]: unknown;
}

export interface Project {
  id: number;
  name: string;
  archived?: boolean;
}

export interface Task {
  id: number;
  name: string;
  project_id?: number | null;
  archived?: boolean;
}

export interface AbsenceType {
  id: number;
  name: string;
}

export interface Absence {
  id: number;
  start_date: string;
  end_date: string;
  absence_type_id?: number;
  absence_type?: { id: number; name: string };
  status?: string;
  note?: string | null;
  [key: string]: unknown;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  [key: string]: unknown;
}

export interface Company {
  id: number;
  name: string;
  [key: string]: unknown;
}

export interface Overview {
  overtime?: { total_seconds?: number; formatted?: string; [key: string]: unknown };
  vacation?: { redeemed?: number; remaining?: number; [key: string]: unknown };
  [key: string]: unknown;
}

// Analytics result types

export interface ProjectHours {
  project_id: number | null;
  project_name: string | null;
  hours_decimal: number;
}
