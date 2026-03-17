import type { TimeEntry, Project, ProjectHours } from "./types.js";

export function parseHHMM(s?: string): number | null {
  if (!s) return null;
  const m = String(s).match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
}

export function minutesFromEntry(e: TimeEntry): number {
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

export function toHoursDecimal(mins: number): number {
  return Math.round((mins / 60) * 100) / 100;
}

export function totalHoursInPeriod(entries: TimeEntry[]): {
  totalMinutes: number;
  totalHours: number;
} {
  const totalMinutes = entries.reduce((acc, e) => acc + minutesFromEntry(e), 0);
  return { totalMinutes, totalHours: toHoursDecimal(totalMinutes) };
}

export function hoursByProject(
  entries: TimeEntry[],
  projectCatalog: Project[]
): ProjectHours[] {
  const by: Record<
    string,
    { project_id: number | null; project_name: string | null; minutes: number }
  > = {};

  for (const e of entries) {
    const pid = (e.project_id ?? e.project?.id ?? null) as number | null;
    const pname = (e.project?.name ?? e.project_name ?? null) as string | null;
    const key = String(pid ?? "none");
    if (!by[key]) by[key] = { project_id: pid, project_name: pname, minutes: 0 };
    by[key].minutes += minutesFromEntry(e);
    if (!by[key].project_name && pname) by[key].project_name = pname;
  }

  // Enrich missing names from catalog
  const nameMap = new Map<number, string>(
    projectCatalog.map((p) => [p.id, p.name])
  );
  for (const v of Object.values(by)) {
    if (v.project_id && !v.project_name) {
      v.project_name = nameMap.get(v.project_id) ?? null;
    }
  }

  return Object.values(by).map((v) => ({
    project_id: v.project_id,
    project_name: v.project_name,
    hours_decimal: toHoursDecimal(v.minutes),
  }));
}
