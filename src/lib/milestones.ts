import { Cake, Heart, Sparkles, Star, type LucideIcon } from "lucide-react";
import { addDays, expandRecurring, startOfDay } from "@/lib/calendar-utils";

/**
 * Milestones — the love story's fixed points (Pillar A).
 *
 * A milestone is an ordinary event that is all-day + yearly and carries an
 * explicit `milestone` type. Crucially its `start_at` is the ORIGINAL date —
 * the wedding, the birth, the first date — so the year count of any occurrence
 * is simply (occurrence year − origin year). That's what lets Today say
 * "3 years together" instead of just repeating a date.
 */
export type MilestoneKind = "anniversary" | "birthday" | "first" | "other";

export type MilestoneMeta = {
  key: MilestoneKind;
  label: string;
  icon: LucideIcon;
  /** Placeholder title shown when creating this kind. */
  placeholder: string;
  /** How we say "it has been N years" for this kind. */
  years: (n: number) => string;
  color: string;
};

export const MILESTONE_TYPES: MilestoneMeta[] = [
  {
    key: "anniversary",
    label: "Anniversary",
    icon: Heart,
    placeholder: "Our anniversary",
    years: (n) => `${n} ${n === 1 ? "year" : "years"} together`,
    color: "#E86A8C", // Rose — love
  },
  {
    key: "birthday",
    label: "Birthday",
    icon: Cake,
    placeholder: "Their birthday",
    years: (n) => `Turning ${n}`,
    color: "#F4B740", // Marigold — celebration
  },
  {
    key: "first",
    label: "A first",
    icon: Sparkles,
    placeholder: "Our first date",
    years: (n) => `${n} ${n === 1 ? "year" : "years"} since`,
    color: "#9B7EDE", // Dusk — memory
  },
  {
    key: "other",
    label: "Milestone",
    icon: Star,
    placeholder: "Something worth keeping",
    years: (n) => `${n} ${n === 1 ? "year" : "years"} on`,
    color: "#5BAE9C", // Teal — togetherness
  },
];

export function milestoneMeta(key?: string | null): MilestoneMeta | undefined {
  return MILESTONE_TYPES.find((m) => m.key === key);
}

export function isMilestone(ev: { milestone?: string | null }) {
  return !!ev.milestone;
}

/**
 * How many years this occurrence marks, counted from the event's original date.
 * Returns 0 for the origin year itself (nothing to celebrate yet), which the UI
 * treats as "show no year badge".
 */
export function milestoneYears(originISO: string, occurrenceISO: string) {
  const n = new Date(occurrenceISO).getFullYear() - new Date(originISO).getFullYear();
  return n > 0 ? n : 0;
}

export function daysUntil(target: Date, now = new Date()) {
  return Math.round((startOfDay(target).getTime() - startOfDay(now).getTime()) / 86_400_000);
}

export function countdownLabel(n: number) {
  if (n <= 0) return "Today";
  if (n === 1) return "Tomorrow";
  return `${n} days`;
}

export type UpcomingMilestone = {
  /** Synthetic occurrence id, unique per year. */
  id: string;
  baseId: string;
  title: string;
  kind: MilestoneKind;
  meta: MilestoneMeta;
  date: Date;
  days: number;
  /** 0 when this is the origin year (no "N years" to show). */
  years: number;
};

type MilestoneEvent = {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  milestone?: string | null;
  recurrence?: string | null;
  recurrence_until?: string | null;
  recurrence_exdates?: string[] | null;
};

/**
 * The next `limit` milestone occurrences across the coming year, soonest first.
 * Takes BASE event rows (not expanded occurrences) so each one still knows its
 * original date — which is where the year count comes from.
 */
export function upcomingMilestones(
  events: MilestoneEvent[],
  limit = 3,
  now = new Date(),
): UpcomingMilestone[] {
  const from = startOfDay(now);
  const to = addDays(from, 400); // a little over a year, so the next one always exists

  const out: UpcomingMilestone[] = [];
  for (const ev of events) {
    const meta = milestoneMeta(ev.milestone);
    if (!meta) continue;

    // Non-recurring milestones (a one-off "first") still count, once.
    const occurrences =
      (ev.recurrence ?? "none") === "none"
        ? [{ id: ev.id, start_at: ev.start_at }]
        : expandRecurring({ ...ev, id: ev.id }, from, to);

    for (const occ of occurrences) {
      const date = new Date(occ.start_at);
      if (date < from) continue;
      out.push({
        id: occ.id,
        baseId: ev.id,
        title: ev.title,
        kind: meta.key,
        meta,
        date,
        days: daysUntil(date, now),
        years: milestoneYears(ev.start_at, occ.start_at),
      });
    }
  }

  return out.sort((a, b) => +a.date - +b.date).slice(0, limit);
}
