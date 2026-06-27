import { animate, motion, useReducedMotion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, CalendarHeart, ChevronRight, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";

// Pointer-tracking glow: feeds the `.spotlight-card::before` radial via CSS vars.
function trackSpotlight(e: MouseEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - r.left}px`);
  el.style.setProperty("--my", `${e.clientY - r.top}px`);
}

// ─── Cinematic settle-in: expo-out easing, scale collapses on arrival ────────
const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.04 },
  },
};

const settleIn = {
  hidden: { opacity: 0, y: 22, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.62,
      ease: [0.16, 1, 0.3, 1] as const,
      opacity: { duration: 0.38, ease: "easeOut" },
    },
  },
};

export function DashboardStagger({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className={className}>
      {children}
    </motion.div>
  );
}

export function DashboardItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div variants={settleIn} className={className}>
      {children}
    </motion.div>
  );
}

// ─── Time-of-day wash: cinematic ember + periwinkle bloom ─────────────
export function TimeOfDayBanner() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-x-0 -top-10 h-52 opacity-70"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 10% 0%, oklch(0.56 0.19 280 / 0.14) 0%, transparent 65%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 -top-10 h-40 opacity-50"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 85% 5%, oklch(0.72 0.16 55 / 0.10) 0%, transparent 70%)",
          filter: "blur(32px)",
        }}
      />
    </>
  );
}

export type MoonstoneVariant = "today" | "calendar" | "memories" | "together";

export const MOONSTONE_ROUTES = ["/today", "/calendar", "/memories", "/together"] as const;

export function isMoonstoneRoute(pathname: string) {
  return MOONSTONE_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function moonstoneVariant(pathname: string): MoonstoneVariant {
  if (pathname.startsWith("/calendar")) return "calendar";
  if (pathname.startsWith("/memories")) return "memories";
  if (pathname.startsWith("/together")) return "together";
  return "today";
}

// ─── Moonstone stage: full-bleed "pale dawn" atmosphere for the main app ─────
// A fixed lavender sky — soft periwinkle/blue blooms that drift and breathe,
// a whisper of dawn warmth low on the horizon, fine grain. Offset by the
// sidebar/rail width so it fills only the content column. Subtle per-route
// tints keep each destination feeling like the same world, different room.
export function MoonstoneAtmosphere({ variant = "today" }: { variant?: MoonstoneVariant }) {
  const reduced = useReducedMotion();
  return (
    <div
      aria-hidden
      data-moonstone={variant}
      className="pointer-events-none fixed inset-y-0 left-0 right-0 z-0 overflow-hidden md:left-[72px] lg:left-64"
    >
      <div className="moonstone-sky absolute inset-0" />
      <div className="aurora" />

      {/* Soft drifting light blooms */}
      <div
        className={cn(
          "moonstone-bloom-left absolute -left-12 top-[12%] h-72 w-72 rounded-full bg-[oklch(0.7_0.14_286)]/20 blur-[90px]",
          !reduced && "animate-float-y",
        )}
      />
      <div
        className={cn(
          "moonstone-bloom-right absolute right-[5%] top-[2%] h-80 w-80 rounded-full bg-[oklch(0.74_0.1_250)]/18 blur-[100px]",
          !reduced && "animate-breathe",
        )}
      />

      {/* A whisper of dawn warmth low on the horizon */}
      <div className={cn("moonstone-dawn absolute inset-x-0 bottom-0 h-1/2", !reduced && "animate-breathe")} />

      {/* Fine grain to kill gradient banding */}
      <div className="grain absolute inset-0" />

      {/* Soft top fade so the sticky mobile chrome blends into the sky */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[oklch(0.95_0.02_284)] to-transparent" />
    </div>
  );
}

// ─── Spotlight glass panel: pointer-following glow + hover lift ───────────────
export function SpotlightPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.section
      onMouseMove={trackSpotlight}
      whileHover={reduced ? undefined : { y: -4 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className={cn("spotlight-card hearth-glass rounded-2xl", className)}
    >
      {children}
    </motion.section>
  );
}

// ─── Live clock: current time, refreshed each half-minute ────────────────────
export function LiveClock({ className }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  if (!now) return null;
  return (
    <span className={cn("tabular-nums", className)}>
      {now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
    </span>
  );
}

// ─── Featured countdown: the dashboard's hero spotlight ──────────────────────
export function FeaturedCountdown({
  days,
  label,
  title,
  dateLabel,
  color = "oklch(0.56 0.19 280)",
  goingCount = 0,
}: {
  days: number;
  label: string;
  title: string;
  dateLabel: string;
  color?: string;
  goingCount?: number;
}) {
  return (
    <Link to="/calendar" className="group block">
      <div
        onMouseMove={trackSpotlight}
        className="spotlight-card relative overflow-hidden rounded-3xl border border-hearth/15 p-6 shadow-[0_40px_100px_-58px_oklch(0.5_0.16_286/0.5)] sm:p-8"
        style={{
          background:
            "linear-gradient(140deg, oklch(0.985 0.018 288) 0%, oklch(0.965 0.03 300) 55%, oklch(0.98 0.022 250) 100%)",
        }}
      >
        {/* floating glow */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-[oklch(0.7_0.17_288)]/30 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-16 left-1/4 h-40 w-40 rounded-full bg-[oklch(0.85_0.12_70)]/30 blur-3xl" aria-hidden />

        <div className="relative flex flex-col items-start gap-7 sm:flex-row sm:items-center sm:gap-9">
          <div className="relative shrink-0">
            <CountdownRing days={days} color={color} size={140} />
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-background/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur">
              {days <= 0 ? "happening" : days === 1 ? "day to go" : "days to go"}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-2 text-overline text-hearth">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-hearth-muted">
                <CalendarHeart className="h-3.5 w-3.5" />
              </span>
              Looking forward to
            </span>
            <p className="mt-3 truncate font-display text-[1.65rem] font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
              {title}
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">{dateLabel}</p>
            <div className="mt-5 flex items-center gap-3">
              <span className="rounded-full bg-hearth px-3 py-1 text-xs font-semibold text-primary-foreground shadow-[0_4px_14px_-4px_oklch(0.56_0.19_285/0.6)]">
                {label}
              </span>
              {goingCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <Users className="h-3.5 w-3.5" /> {goingCount} going
                </span>
              )}
              <span className="ml-auto inline-flex translate-x-0 items-center gap-1 text-sm font-medium text-hearth transition-transform duration-300 group-hover:translate-x-1">
                View in calendar <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Countdown ring: spring number counter + outer breathing glow ring ────────
export function CountdownRing({
  days,
  maxDays = 30,
  color = "oklch(0.56 0.19 280)",
  size = 88,
}: {
  days: number;
  maxDays?: number;
  color?: string;
  /** Outer diameter in px — the ring scales proportionally. */
  size?: number;
}) {
  const reduced = useReducedMotion();
  const k = size / 88;
  const r = 36 * k;
  const sw = 5 * k;
  const center = size / 2;
  const c = 2 * Math.PI * r;
  const progress = Math.min(days / maxDays, 1);
  const offset = c * (1 - progress);

  // Spring-driven number that counts up from 0 to `days`
  const [displayNum, setDisplayNum] = useState(reduced ? days : 0);
  useEffect(() => {
    if (reduced) { setDisplayNum(days); return; }
    const ctrl = animate(0, days, {
      type: "spring",
      stiffness: 72,
      damping: 14,
      mass: 0.55,
      onUpdate: (v) => setDisplayNum(Math.round(v)),
    });
    return () => ctrl.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ height: size, width: size }}
    >
      <svg className="h-full w-full -rotate-90" viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <defs>
          <linearGradient id="cd-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.68 0.19 286)" />
            <stop offset="55%" stopColor="oklch(0.6 0.2 298)" />
            <stop offset="100%" stopColor="oklch(0.62 0.16 250)" />
          </linearGradient>
        </defs>
        {/* Outer glow ring breathes at rest */}
        {!reduced && (
          <motion.circle
            cx={center} cy={center}
            r={r + 7 * k}
            fill="none"
            stroke={color}
            strokeWidth={1.5 * k}
            animate={{
              strokeOpacity: [0.1, 0.28, 0.1],
              r: [r + 7 * k, r + 9.5 * k, r + 7 * k],
            }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        {/* Track */}
        <circle
          cx={center} cy={center} r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={sw}
          className="text-muted/70"
        />
        {/* Progress arc draws in with expo-out spring */}
        <motion.circle
          cx={center} cy={center} r={r}
          fill="none"
          stroke="url(#cd-grad)"
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={reduced ? { strokeDashoffset: offset } : { strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.25, ease: [0.16, 1, 0.3, 1] as const }}
        />
      </svg>
      {/* Spring-counted number */}
      <span
        className="absolute font-semibold tabular-nums tracking-tight leading-none"
        style={{ fontSize: 26 * k }}
      >
        {displayNum}
      </span>
    </div>
  );
}

// ─── Action chips ─────────────────────────────────────────────────────────────
export function ActionChip({
  label,
  to,
  search,
  onClick,
  variant = "default",
}: {
  label: string;
  to?: "/calendar";
  search?: { new: string; title?: string };
  onClick?: () => void;
  variant?: "default" | "hearth";
}) {
  const cls = cn(
    "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium",
    "transition-all duration-200",
    "hover:scale-[1.04] active:scale-[0.97]",
    variant === "hearth"
      ? "border-hearth/30 bg-hearth-muted text-hearth hover:bg-hearth/15"
      : "border-border bg-background hover:border-hearth/25 hover:bg-accent",
  );
  if (to) return <Link to={to} search={search} className={cls}>{label}</Link>;
  return <button type="button" onClick={onClick} className={cls}>{label}</button>;
}

// ─── Empty states ─────────────────────────────────────────────────────────────
export function TodayEmptyActions({ onCheckIn }: { onCheckIn: () => void }) {
  return (
    <div className="mt-4 space-y-3">
      <p className="text-caption">A calm day — fill it or just check in.</p>
      <div className="flex flex-wrap gap-2">
        <ActionChip label="Dinner tonight" to="/calendar" search={{ new: "today", title: "Dinner" }} />
        <ActionChip label="Add to today" to="/calendar" search={{ new: "today" }} variant="hearth" />
        <ActionChip label="Share how you feel" onClick={onCheckIn} />
      </div>
    </div>
  );
}

export function AheadEmptyActions() {
  return (
    <div className="mt-4 space-y-3">
      <p className="text-caption">Give yourselves something to look forward to.</p>
      <div className="flex flex-wrap gap-2">
        <ActionChip label="Plan a trip" to="/calendar" search={{ new: "ahead", title: "Trip" }} />
        <ActionChip label="Anniversary" to="/calendar" search={{ new: "ahead", title: "Anniversary" }} />
        <ActionChip label="Birthday" to="/calendar" search={{ new: "ahead", title: "Birthday" }} variant="hearth" />
      </div>
    </div>
  );
}

// ─── Quiet day card: slow light sweep across the surface ─────────────────────
export function QuietDayCard({ onCheckIn }: { onCheckIn: () => void }) {
  const reduced = useReducedMotion();
  return (
    <div className="relative overflow-hidden rounded-xl border border-dashed border-hearth/25 bg-hearth-muted/30 p-6 sm:p-8">
      {/* Slow periwinkle light beam sweeping left → right */}
      {!reduced && (
        <motion.div
          className="pointer-events-none absolute inset-y-0 w-[55%]"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, oklch(0.56 0.19 280 / 0.07) 50%, transparent 100%)",
          }}
          animate={{ left: ["-55%", "155%"] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "linear", repeatDelay: 3.5 }}
          aria-hidden
        />
      )}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-hearth/10 blur-2xl"
        aria-hidden
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 text-[11px] font-medium text-hearth">
            <Sparkles className="h-3 w-3" /> Quiet day
          </div>
          <p className="text-title">Nothing planned yet</p>
          <p className="mt-1 max-w-md text-caption">
            Add something for today, plan ahead, or share a moment with your people.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <ActionChip label="Add to today" to="/calendar" search={{ new: "today" }} variant="hearth" />
          <ActionChip label="Plan ahead" to="/calendar" search={{ new: "ahead" }} />
          <button
            type="button"
            onClick={onCheckIn}
            className="text-xs font-medium text-hearth underline-offset-2 hover:underline"
          >
            Answer today&apos;s question instead
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Week strip: days spring-land in sequence, today pulses once ──────────────
export function WeekStrip({
  days,
}: {
  days: { date: Date; has: boolean; isToday: boolean }[];
}) {
  const reduced = useReducedMotion();
  return (
    <div className="mt-4 grid grid-cols-7 gap-1 text-center">
      {days.map(({ date, has, isToday }, i) => (
        <motion.div
          key={date.toISOString()}
          className="flex flex-col items-center gap-1.5"
          initial={reduced ? false : { opacity: 0, y: 16, scale: 0.88 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={
            reduced
              ? {}
              : {
                  delay: i * 0.065,
                  type: "spring",
                  stiffness: 370,
                  damping: 24,
                  opacity: { duration: 0.26, delay: i * 0.065, ease: "easeOut" },
                }
          }
        >
          <span className="text-[10px] font-medium uppercase text-muted-foreground">
            {date.toLocaleDateString([], { weekday: "narrow" })}
          </span>
          <motion.span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg text-sm",
              isToday
                ? "bg-primary font-semibold text-primary-foreground shadow-glow"
                : "text-foreground transition-colors hover:bg-accent",
            )}
            // Today's marker: single spring overshoot to call attention
            animate={isToday && !reduced ? { scale: [1, 1.12, 0.96, 1.04, 1] } : {}}
            transition={{ delay: 0.55 + i * 0.065, duration: 0.65, ease: "easeOut" }}
          >
            {date.getDate()}
          </motion.span>
          <span className="flex h-1.5 w-1.5 items-center justify-center">
            {has ? (
              <motion.span
                className="h-1.5 w-1.5 rounded-full bg-hearth"
                initial={reduced ? false : { scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: 0.32 + i * 0.065,
                  type: "spring",
                  stiffness: 520,
                  damping: 18,
                }}
              />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-transparent" />
            )}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Event row: variant propagation — dot expands, chevron slides in ──────────
const rowVariants = {
  rest: {},
  hovered: {},
};
const dotVariants = {
  rest: { scale: 1 },
  hovered: { scale: 1.55 },
};
const chevronVariants = {
  rest:    { opacity: 0, x: -9 },
  hovered: { opacity: 1, x: 0 },
};

export function EventRowVisual({
  time,
  title,
  color,
  goingCount = 0,
  to = "/calendar",
}: {
  time: string;
  title: string;
  color: string;
  goingCount?: number;
  to?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <li>
        <Link
          to={to}
          className="group flex items-center gap-3 rounded-lg px-2 py-2 -mx-2 transition-colors hover:bg-accent/60"
        >
          <span className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-background" style={{ backgroundColor: color }} />
          <span className="w-16 shrink-0 text-sm tabular-nums text-muted-foreground">{time}</span>
          <span className="flex-1 truncate text-sm font-medium">{title}</span>
          {goingCount > 0 && (
            <span className="shrink-0 rounded-full bg-hearth-muted px-2 py-0.5 text-[11px] font-medium text-hearth">
              {goingCount} going
            </span>
          )}
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </Link>
      </li>
    );
  }

  return (
    <motion.li
      variants={rowVariants}
      initial="rest"
      whileHover="hovered"
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
    >
      <Link
        to={to}
        className="flex items-center gap-3 rounded-lg px-2 py-2 -mx-2 transition-colors hover:bg-accent/60"
      >
        {/* Color dot expands to claim more space on hover */}
        <motion.span
          className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-background"
          style={{ backgroundColor: color }}
          variants={dotVariants}
          transition={{ type: "spring", stiffness: 520, damping: 22 }}
        />
        <span className="w-16 shrink-0 text-sm tabular-nums text-muted-foreground">{time}</span>
        <span className="flex-1 truncate text-sm font-medium">{title}</span>
        {goingCount > 0 && (
          <span className="shrink-0 rounded-full bg-hearth-muted px-2 py-0.5 text-[11px] font-medium text-hearth">
            {goingCount} going
          </span>
        )}
        {/* Chevron slides in from the left, not just fades in */}
        <motion.span
          variants={chevronVariants}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
          className="shrink-0 text-muted-foreground"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </motion.span>
      </Link>
    </motion.li>
  );
}
