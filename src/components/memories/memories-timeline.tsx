import { motion, useReducedMotion } from "framer-motion";
import { MemoryCard, type Moment } from "./memory-card";
import type { ProfileLike } from "@/components/calendar/user-avatar";

type DayGroup = [string, Moment[]];

export function MemoriesTimeline({
  groups,
  profileById,
  onSelect,
}: {
  groups: DayGroup[];
  profileById: Record<string, ProfileLike>;
  onSelect: (m: Moment) => void;
}) {
  const yearGroups = groupByYear(groups);

  return (
    <div className="relative">
      {yearGroups.map(([year, days], yi) => (
        <section key={year} className="relative pb-4 last:pb-0">
          {/* Sticky year marker */}
          <div className="memory-year-marker sticky top-16 z-20 mb-8 flex items-center gap-4 sm:top-20">
            <span className="font-display text-3xl font-semibold tabular-nums tracking-tight text-foreground/90 sm:text-4xl">
              {year}
            </span>
            <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" aria-hidden />
          </div>

          <div className="relative space-y-12 pl-8 sm:space-y-14 sm:pl-10">
            {/* Timeline rail */}
            <div
              className="memory-timeline-rail absolute bottom-0 left-[11px] top-0 w-px sm:left-[15px]"
              aria-hidden
            />

            {days.map(([day, items], di) => (
              <TimelineDay
                key={day}
                day={day}
                items={items}
                profileById={profileById}
                onSelect={onSelect}
                index={yi * 10 + di}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function groupByYear(groups: DayGroup[]): [number, DayGroup[]][] {
  const map = new Map<number, DayGroup[]>();
  groups.forEach(([day, items]) => {
    const y = Number(day.slice(0, 4));
    const arr = map.get(y) ?? [];
    arr.push([day, items]);
    map.set(y, arr);
  });
  return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
}

function TimelineDay({
  day,
  items,
  profileById,
  onSelect,
  index,
}: {
  day: string;
  items: Moment[];
  profileById: Record<string, ProfileLike>;
  onSelect: (m: Moment) => void;
  index: number;
}) {
  const reduced = useReducedMotion();
  const d = new Date(day + "T00:00:00");
  const weekday = d.toLocaleDateString([], { weekday: "short" });
  const monthDay = d.toLocaleDateString([], { month: "short", day: "numeric" });

  return (
    <motion.section
      className="relative"
      initial={reduced ? {} : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: Math.min(index * 0.04, 0.24), ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Timeline node */}
      <div className="absolute -left-8 top-3 flex h-5 w-5 items-center justify-center sm:-left-10">
        {!reduced && (
          <motion.span
            className="absolute h-5 w-5 rounded-full bg-hearth/30"
            animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeOut", repeatDelay: 2.5 }}
          />
        )}
        <span className="memory-timeline-node relative h-2.5 w-2.5 rounded-full" />
      </div>

      {/* Date header */}
      <div className="mb-4 flex items-baseline gap-3">
        <span className="font-display text-2xl font-semibold tabular-nums leading-none text-foreground">
          {monthDay}
        </span>
        <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">{weekday}</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((m) => (
          <MemoryCard key={m.id} m={m} who={profileById[m.created_by]} onSelect={onSelect} />
        ))}
      </div>
    </motion.section>
  );
}
