export function initialsFromName(name?: string | null, email?: string | null) {
  const base = (name && name.trim()) || (email && email.split("@")[0]) || "?";
  const parts = base.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

export const EVENT_COLORS = [
  "#f97316", "#ef4444", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
];

export function fmtTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function startOfWeek(d: Date) {
  const x = startOfDay(d);
  const day = x.getDay(); // 0=Sun
  x.setDate(x.getDate() - day);
  return x;
}

export function startOfMonth(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  return x;
}

export function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function eventsOnDay<T extends { start_at: string; end_at: string }>(events: T[], day: Date) {
  const s = startOfDay(day).getTime();
  const e = addDays(startOfDay(day), 1).getTime();
  return events.filter((ev) => {
    const a = new Date(ev.start_at).getTime();
    const b = new Date(ev.end_at).getTime();
    return a < e && b > s;
  });
}

export function toLocalInput(iso: string | Date) {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInput(value: string) {
  return new Date(value).toISOString();
}

// ---------------- Recurrence ----------------

export type Recurrence = "none" | "daily" | "weekly" | "monthly" | "yearly";

export const RECURRENCE_OPTIONS: { value: Recurrence; label: string }[] = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

function advanceOccurrence(d: Date, freq: Recurrence) {
  const x = new Date(d);
  if (freq === "daily") x.setDate(x.getDate() + 1);
  else if (freq === "weekly") x.setDate(x.getDate() + 7);
  else if (freq === "monthly") x.setMonth(x.getMonth() + 1);
  else if (freq === "yearly") x.setFullYear(x.getFullYear() + 1);
  return x;
}

type RecurringBase = {
  start_at: string;
  end_at: string;
  recurrence?: string | null;
  recurrence_until?: string | null;
  recurrence_exdates?: string[] | null;
};

/**
 * Expand one recurring base event into concrete occurrences that overlap
 * [rangeStart, rangeEnd]. Each occurrence keeps the base fields but gets a
 * synthetic id, base_id, occurrence_date, recurring flag, and shifted times.
 */
export function expandRecurring<T extends RecurringBase & { id: string }>(
  base: T,
  rangeStart: Date,
  rangeEnd: Date,
): Array<T & { base_id: string; occurrence_date: string; recurring: true }> {
  const freq = (base.recurrence ?? "none") as Recurrence;
  if (freq === "none") return [];

  const baseStart = new Date(base.start_at);
  const durationMs = new Date(base.end_at).getTime() - baseStart.getTime();
  const until = base.recurrence_until ? new Date(base.recurrence_until) : null;
  const exset = new Set((base.recurrence_exdates ?? []).map((d) => new Date(d).toISOString()));

  let occ = new Date(baseStart);

  // Fast-forward daily/weekly events whose series began well before the range.
  if ((freq === "daily" || freq === "weekly") && occ < rangeStart) {
    const step = freq === "daily" ? 1 : 7;
    const dayDiff = Math.floor((startOfDay(rangeStart).getTime() - startOfDay(occ).getTime()) / 86_400_000);
    const jumps = Math.floor(dayDiff / step);
    if (jumps > 0) occ.setDate(occ.getDate() + jumps * step);
  }

  const out: Array<T & { base_id: string; occurrence_date: string; recurring: true }> = [];
  let guard = 0;
  while (occ <= rangeEnd && (!until || occ <= until) && guard < 2000) {
    guard++;
    const occEnd = new Date(occ.getTime() + durationMs);
    if (occEnd >= rangeStart) {
      const occISO = occ.toISOString();
      if (!exset.has(occISO)) {
        out.push({
          ...base,
          id: `${base.id}__${occISO}`,
          base_id: base.id,
          occurrence_date: occISO,
          recurring: true,
          start_at: occISO,
          end_at: occEnd.toISOString(),
        });
      }
    }
    occ = advanceOccurrence(occ, freq);
  }
  return out;
}

export function matchesSearch(
  ev: { title: string; description?: string | null; location?: string | null },
  search: string,
) {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return (
    ev.title.toLowerCase().includes(q) ||
    (ev.description ?? "").toLowerCase().includes(q) ||
    (ev.location ?? "").toLowerCase().includes(q)
  );
}
