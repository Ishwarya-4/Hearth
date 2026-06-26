import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/* ── Scroll-triggered reveal: fade + rise, fires once on entry ────────────── */
export function ScrollReveal({
  children,
  className,
  delay = 0,
  y = 26,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-90px" }}
      transition={{ duration: 0.8, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/* ── Eyebrow pill ─────────────────────────────────────────────────────────── */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/60 px-3.5 py-1.5 text-eyebrow text-muted-foreground shadow-sm backdrop-blur-md",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.72_0.18_288)] shadow-[0_0_10px_oklch(0.66_0.2_288/0.9)]" />
      {children}
    </span>
  );
}

/* ── Spotlight glass card: pointer-following glow + tilt-lift on hover ────── */
export function SpotlightCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }

  return (
    <motion.div
      onMouseMove={onMove}
      whileHover={reduced ? undefined : { y: -6 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className={cn(
        "spotlight-card glass-dark rounded-3xl p-6",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

/* ── Marquee strip (seamless loop) ───────────────────────────────────────── */
export function Marquee({ items }: { items: string[] }) {
  const loop = [...items, ...items];
  return (
    <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
      <div className="flex w-max animate-marquee gap-12 pr-12">
        {loop.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-3 whitespace-nowrap text-sm font-medium text-muted-foreground"
          >
            <span className="h-1 w-1 rounded-full bg-primary/30" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Parallax wrapper: shifts y as it crosses the viewport ───────────────── */
export function Parallax({
  children,
  className,
  distance = 60,
}: {
  children: ReactNode;
  className?: string;
  distance?: number;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  return (
    <div ref={ref} className={className}>
      <motion.div style={reduced ? undefined : { y }}>{children}</motion.div>
    </div>
  );
}

/* ── App mock surface: a faux product screen rendered in glass ───────────── */
export function AppMock({
  title,
  badge,
  children,
  className,
  floating = false,
}: {
  title: string;
  badge?: string;
  children: ReactNode;
  className?: string;
  floating?: boolean;
}) {
  return (
    <div
      className={cn(
        "glass-dark overflow-hidden rounded-2xl",
        floating && "animate-float-y",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.72_0.18_288)] shadow-[0_0_10px_oklch(0.66_0.2_288/0.8)]" />
          <span className="text-xs font-semibold tracking-tight text-foreground">{title}</span>
        </div>
        {badge && (
          <span className="rounded-full bg-primary/5 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-border/70">
            {badge}
          </span>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/* Skeleton line used inside app mocks */
export function MockLine({ w = "100%", dim = false }: { w?: string; dim?: boolean }) {
  return (
    <div
      className={cn("h-2 rounded-full", dim ? "bg-muted" : "bg-primary/15")}
      style={{ width: w }}
    />
  );
}
