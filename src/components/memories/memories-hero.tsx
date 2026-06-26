import { motion, useReducedMotion } from "framer-motion";
import { Camera, MapPin, Sparkles } from "lucide-react";
import { UserAvatar, type ProfileLike } from "@/components/calendar/user-avatar";
import { cn } from "@/lib/utils";
import type { Moment } from "./memory-card";

function trackSpotlight(e: React.MouseEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - r.left}px`);
  el.style.setProperty("--my", `${e.clientY - r.top}px`);
}

export function MemoriesHero({
  moments,
  members,
  spaceName,
  onAdd,
  action,
}: {
  moments: Moment[];
  members: ProfileLike[];
  spaceName?: string;
  onAdd?: () => void;
  action?: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  const count = moments.length;
  const photoCount = moments.filter((m) => m.photo_url).length;
  const placeCount = moments.filter((m) => m.location?.trim()).length;
  const years = [...new Set(moments.map((m) => Number(m.happened_on.slice(0, 4))))].sort((a, b) => a - b);
  const spanLabel =
    years.length > 1
      ? `${years[0]}–${years[years.length - 1]}`
      : years.length === 1
        ? `Since ${years[0]}`
        : null;

  return (
    <header className="relative mb-10 sm:mb-12">
      {/* Warm bloom behind the title */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-10 -top-16 h-56 w-96 rounded-full bg-[oklch(0.78_0.12_55/0.18)] blur-[90px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 top-0 h-48 w-72 rounded-full bg-hearth/15 blur-[80px]"
      />

      <div className="relative flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0 max-w-2xl">
          <p className="flex items-center gap-2.5 text-overline text-hearth">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {spaceName ? `${spaceName}'s archive` : "Your shared archive"}
          </p>
          <h1 className="mt-3 font-display text-[2.35rem] font-semibold leading-[1.04] tracking-tight text-foreground sm:text-[3rem]">
            The moments
            <br />
            <span className="text-gradient-peri">you kept</span>
          </h1>
          <p className="mt-3 max-w-lg text-[0.95rem] leading-relaxed text-muted-foreground">
            {count > 0
              ? `${count} ${count === 1 ? "memory" : "memories"} woven into your shared story${spanLabel ? ` · ${spanLabel}` : ""}.`
              : "Photos, notes, and the small true things worth returning to."}
          </p>

          {count > 0 && (
            <motion.div
              className="mt-6 flex flex-wrap gap-2.5"
              initial={reduced ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <StatPill label="Kept" value={count} />
              {photoCount > 0 && (
                <StatPill label="Photos" value={photoCount} icon={<Camera className="h-3.5 w-3.5" />} />
              )}
              {placeCount > 0 && (
                <StatPill label="Places" value={placeCount} icon={<MapPin className="h-3.5 w-3.5" />} />
              )}
            </motion.div>
          )}
        </div>

        <div className="flex flex-col items-end gap-4">
          {members.length > 0 && (
            <div className="flex items-center -space-x-2.5">
              {members.map((p) => (
                <span
                  key={p.id}
                  className="relative rounded-full ring-2 ring-background transition-transform hover:z-10 hover:-translate-y-0.5"
                >
                  <UserAvatar profile={p} size="md" ring />
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            {action}
            {onAdd && count === 0 && (
              <button
                type="button"
                onClick={onAdd}
                className="btn-glow inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
              >
                <Sparkles className="h-4 w-4" />
                Add first memory
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function StatPill({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className="memory-stat-pill inline-flex items-center gap-2 rounded-full px-3.5 py-2"
      onMouseMove={trackSpotlight}
    >
      {icon && <span className="text-hearth">{icon}</span>}
      <span className="font-display text-lg font-semibold leading-none tabular-nums text-foreground">
        {value}
      </span>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

export function MemoryFilterBar({
  members,
  userId,
  personFilter,
  onPersonFilter,
  photosOnly,
  onPhotosOnly,
  className,
}: {
  members: ProfileLike[];
  userId: string;
  personFilter: string | null;
  onPersonFilter: (id: string | null) => void;
  photosOnly: boolean;
  onPhotosOnly: (v: boolean) => void;
  className?: string;
}) {
  const chip = (active: boolean) =>
    cn(
      "memory-filter-chip inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-300",
      active
        ? "memory-filter-chip--active text-foreground"
        : "text-muted-foreground hover:text-foreground",
    );

  return (
    <div className={cn("mb-8 flex flex-wrap items-center gap-2", className)}>
      <button
        type="button"
        onClick={() => onPersonFilter(null)}
        aria-pressed={personFilter === null}
        className={chip(personFilter === null)}
      >
        Everyone
      </button>
      {members.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onPersonFilter(personFilter === p.id ? null : p.id)}
          aria-pressed={personFilter === p.id}
          className={chip(personFilter === p.id)}
        >
          <UserAvatar profile={p} size="xs" />
          {p.id === userId ? "You" : p.full_name?.split(" ")[0] || p.email}
        </button>
      ))}
      <span className="mx-1 h-5 w-px bg-border/60" aria-hidden />
      <button
        type="button"
        onClick={() => onPhotosOnly(!photosOnly)}
        aria-pressed={photosOnly}
        className={chip(photosOnly)}
      >
        <Camera className="h-3.5 w-3.5" />
        Photos
      </button>
    </div>
  );
}
