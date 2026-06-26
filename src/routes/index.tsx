import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useLenis } from "@/hooks/use-lenis";
import { MagneticButton } from "@/components/motion/magnetic-button";
import { HearthHeroCanvas } from "@/components/three/lazy-canvas";
import {
  LandingNav,
  ScrollReveal,
  Eyebrow,
  SpotlightCard,
  Marquee,
  Parallax,
  AppMock,
  MockLine,
} from "@/components/landing";
import {
  ArrowRight,
  CalendarDays,
  CalendarHeart,
  Heart,
  Lock,
  Sparkles,
  Clock,
  ChevronDown,
} from "lucide-react";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Hearth — the shared calendar for people you love" },
      {
        name: "description",
        content:
          "Plan your days together, look forward to what's next, and keep the moments worth remembering.",
      },
      { property: "og:title", content: "Hearth — the shared calendar for people you love" },
      {
        property: "og:description",
        content:
          "Plan together. Remember together. A private shared calendar for couples, families, and close friends.",
      },
    ],
  }),
  component: Landing,
});

const EASE = [0.16, 1, 0.3, 1] as const;

const STORY = [
  {
    no: "01",
    tag: "Ahead",
    title: "One calendar, everyone on it",
    body: "Birthdays, trips, date nights — the people you love see what's coming and add to it. No scattered texts, no three different apps.",
    icon: CalendarDays,
  },
  {
    no: "02",
    tag: "Today",
    title: "Count down to what matters",
    body: "Every trip and anniversary gets a shared countdown. Anticipation becomes something you feel together, not alone.",
    icon: Clock,
  },
  {
    no: "03",
    tag: "Behind",
    title: "Moments worth keeping",
    body: "Daily reflections and photos become a living timeline. Hearth quietly resurfaces what you were doing a year ago today.",
    icon: Heart,
  },
];

function Landing() {
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const reduced = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const progress = useRef(0);

  useLenis(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);

  // Map hero scroll → a 0..1 value the 3D scene reads each frame for its dolly.
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    progress.current = v;
  });
  const heroFade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroLift = useTransform(scrollYProgress, [0, 1], [0, -60]);

  function goAuth() {
    navigate({ to: signedIn ? "/today" : "/auth" });
  }

  return (
    <div className="cinema-void grain relative min-h-screen overflow-x-clip text-foreground">
      <LandingNav signedIn={signedIn} onCta={goAuth} />

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section ref={heroRef} className="relative flex min-h-[94svh] items-center">
        {/* Drifting aurora wash */}
        <div className="aurora" />
        {/* 3D constellation — anchored to the right on desktop, full-bleed dimmed on mobile */}
        <motion.div
          style={reduced ? undefined : { opacity: heroFade }}
          className="pointer-events-none absolute inset-0 lg:left-[34%]"
        >
          <HearthHeroCanvas className="h-full w-full opacity-60 lg:opacity-100" progress={progress} />
        </motion.div>

        <motion.div
          style={reduced ? undefined : { y: heroLift }}
          className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-8 px-6 pt-36 pb-16 sm:pt-40 lg:grid-cols-[1.05fr_0.95fr] lg:pt-34"
        >
          {/* Headline column */}
          <div className="max-w-[35rem]">
            <h1 className="text-hero">
              <RevealLine delay={0.25}>Life together,</RevealLine>
              <RevealLine delay={0.37}>
                <span className="text-gradient-peri">beautifully kept.</span>
              </RevealLine>
            </h1>

            <motion.p
              className="text-hero-sub mt-5 max-w-[31rem] text-muted-foreground"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.55 }}
            >
              Plan what&apos;s ahead, savor the countdown, and keep the life you&apos;re building
              together — a private home for the people you love.
            </motion.p>

            <motion.div
              className="mt-7 flex flex-wrap items-center gap-3"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.7 }}
            >
              <MagneticButton
                onClick={goAuth}
                className="btn-glow inline-flex h-13 items-center gap-2 rounded-full px-7 text-[15px] font-semibold"
              >
                {signedIn ? "Open your Hearth" : "Start free"}
                <ArrowRight className="h-4 w-4" />
              </MagneticButton>
              <MagneticButton
                strength={0.15}
                onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}
                className="btn-ghost-glass inline-flex h-13 items-center gap-2 rounded-full px-7 text-[15px] font-medium"
              >
                See how it works
              </MagneticButton>
            </motion.div>

            <motion.p
              className="mt-4 text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.95 }}
            >
              No ads. No feed. Just the people you choose.
            </motion.p>
          </div>

          {/* Floating product mock suspended over the constellation */}
          <motion.div
            className="relative hidden justify-self-end lg:block"
            initial={{ opacity: 0, y: 40, rotateX: 12, rotateY: -14 }}
            animate={{ opacity: 1, y: 0, rotateX: 0, rotateY: 0 }}
            transition={{ duration: 1.1, ease: EASE, delay: 0.5 }}
            style={{ perspective: 1200 }}
          >
            <HeroPreviewCard />
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <div className="absolute bottom-7 left-1/2 -translate-x-1/2">
          <div className="flex h-9 w-5 items-start justify-center rounded-full border border-border bg-white/55 pt-1.5 shadow-sm">
            <ChevronDown className="h-3.5 w-3.5 animate-scroll-cue text-muted-foreground" />
          </div>
        </div>
      </section>

      {/* ═══════════════════ MARQUEE ═══════════════════ */}
      <div className="relative border-y border-border/70 bg-white/25 py-4">
        <Marquee
          items={[
            "For couples",
            "For families",
            "For roommates",
            "For close friends",
            "For long distance",
            "For the people you choose",
          ]}
        />
      </div>

      {/* ═══════════════════ STORY / HOW IT WORKS ═══════════════════ */}
      <section id="how" className="relative mx-auto max-w-6xl scroll-mt-24 px-6 py-16 sm:py-20">
        <ScrollReveal className="mb-12 max-w-2xl">
          <Eyebrow>How Hearth works</Eyebrow>
          <h2 className="mt-4 text-balance font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            The calendar is the spine of it all
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Plans ahead, the day you&apos;re in, and memories behind — one warm surface for the
            people you love.
          </p>
        </ScrollReveal>

        <div className="flex flex-col gap-10 sm:gap-14">
          {STORY.map((s, i) => (
            <StoryRow key={s.no} {...s} flip={i % 2 === 1} index={i} />
          ))}
        </div>
      </section>

      {/* ═══════════════════ FEATURES BENTO ═══════════════════ */}
      <section id="features" className="relative mx-auto max-w-6xl scroll-mt-24 px-6 py-16 sm:py-20">
        <ScrollReveal className="mb-10 max-w-2xl">
          <Eyebrow>Why Hearth</Eyebrow>
          <h2 className="mt-4 text-balance font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            A calendar that cares about connection
          </h2>
        </ScrollReveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ScrollReveal className="sm:col-span-2" delay={0}>
            <SpotlightCard className="flex h-full flex-col justify-between">
              <FeatureIcon icon={CalendarDays} />
              <div className="mt-7">
                <h3 className="text-xl font-semibold tracking-tight">One calendar, together</h3>
                <p className="mt-2 max-w-md text-muted-foreground">
                  Birthdays, trips, date nights — everyone sees what&apos;s coming and adds to it.
                  Shared, in real time, the moment it changes.
                </p>
              </div>
            </SpotlightCard>
          </ScrollReveal>

          <ScrollReveal delay={0.06}>
            <SpotlightCard className="h-full">
              <FeatureIcon icon={Sparkles} />
              <h3 className="mt-7 text-xl font-semibold tracking-tight">Countdown to joy</h3>
              <p className="mt-2 text-muted-foreground">
                Every trip and anniversary gets a countdown, so anticipation is shared.
              </p>
            </SpotlightCard>
          </ScrollReveal>

          <ScrollReveal delay={0.06}>
            <SpotlightCard className="h-full">
              <FeatureIcon icon={Heart} />
              <h3 className="mt-7 text-xl font-semibold tracking-tight">Moments worth keeping</h3>
              <p className="mt-2 text-muted-foreground">
                Daily reflections become a timeline of your life together.
              </p>
            </SpotlightCard>
          </ScrollReveal>

          <ScrollReveal className="sm:col-span-2" delay={0.12}>
            <SpotlightCard className="flex h-full flex-col justify-between">
              <FeatureIcon icon={CalendarHeart} />
              <div className="mt-7">
                <h3 className="text-xl font-semibold tracking-tight">This day, last year</h3>
                <p className="mt-2 max-w-md text-muted-foreground">
                  Hearth quietly resurfaces what you were doing a year ago today — the small moments
                  you&apos;d otherwise forget.
                </p>
              </div>
            </SpotlightCard>
          </ScrollReveal>
        </div>

        <ScrollReveal className="mt-4" delay={0.06}>
          <SpotlightCard className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <FeatureIcon icon={Lock} />
              <div>
                <h3 className="text-xl font-semibold tracking-tight">Truly private</h3>
                <p className="mt-1 text-muted-foreground">
                  Your space, your people. Protected at the database level — no followers, no ads.
                </p>
              </div>
            </div>
          </SpotlightCard>
        </ScrollReveal>
      </section>

      {/* ═══════════════════ SHOWCASE ═══════════════════ */}
      <section id="showcase" className="relative scroll-mt-24 overflow-hidden px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal className="mb-10 max-w-2xl">
            <Eyebrow>A glimpse inside</Eyebrow>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Built for daily life
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Today, Calendar, and Memories — three views of the same shared life.
            </p>
          </ScrollReveal>

          <div className="grid items-start gap-6 sm:grid-cols-3">
            <Parallax distance={18}>
              <AppMock title="Today" badge="Live">
                <p className="text-sm font-semibold text-foreground">Good evening, Sam</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Monday, June 23</p>
                <div className="mt-4 space-y-2.5">
                  <MockCard label="Next up" value="Dinner with Mom" sub="7:00 PM · tonight" />
                  <MockCard label="Looking forward to" value="24 days" sub="Anniversary trip" big />
                </div>
              </AppMock>
            </Parallax>

            <Parallax distance={28} className="sm:mt-6">
              <AppMock title="Calendar" badge="Shared">
                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: 28 }, (_, i) => (
                    <div
                      key={i}
                      className={
                        i === 14
                          ? "aspect-square rounded-md bg-[oklch(0.62_0.2_288)]/80"
                          : i === 9 || i === 20
                            ? "aspect-square rounded-md bg-primary/10"
                            : "aspect-square rounded-md bg-muted"
                      }
                    />
                  ))}
                </div>
                <div className="mt-4 space-y-2">
                  <MockLine w="70%" />
                  <MockLine w="45%" dim />
                </div>
              </AppMock>
            </Parallax>

            <Parallax distance={18}>
              <AppMock title="Memories" badge="On this day">
                <div className="space-y-3">
                  <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-[oklch(0.5_0.18_290)]/40 to-[oklch(0.6_0.14_250)]/30" />
                  <p className="text-sm font-medium text-foreground">&ldquo;What made you smile?&rdquo;</p>
                  <MockLine w="80%" dim />
                  <MockLine w="55%" dim />
                </div>
              </AppMock>
            </Parallax>
          </div>
        </div>
      </section>

      {/* ═══════════════════ CTA ═══════════════════ */}
      <section className="relative px-6 py-16 sm:py-20">
        <ScrollReveal className="mx-auto max-w-4xl">
          <div className="glass-dark glow-soft relative overflow-hidden rounded-[2rem] px-8 py-12 text-center sm:px-16 sm:py-14">
            <div className="aurora opacity-70" />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl font-display text-4xl font-semibold tracking-tight sm:text-6xl">
                Ready to plan <span className="text-gradient-peri">together?</span>
              </h2>
              <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground">
                Create your shared space in under a minute. Invite your people when you&apos;re ready.
              </p>
              <div className="mt-7 flex justify-center">
                <MagneticButton
                  onClick={goAuth}
                  className="btn-glow inline-flex h-14 items-center gap-2 rounded-full px-9 text-base font-semibold"
                >
                  {signedIn ? "Go to Today" : "Create your Hearth"}
                  <ArrowRight className="h-4 w-4" />
                </MagneticButton>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="relative border-t border-border/70 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="inline-flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.72_0.18_288)] shadow-[0_0_12px_oklch(0.66_0.2_288/0.9)]" />
            <span className="text-lg font-semibold tracking-tight">Hearth</span>
          </span>
          <p className="text-sm text-muted-foreground">Made for people who care · © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}

/* ── Hero headline line reveal ───────────────────────────────────────────── */
function RevealLine({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <span className="block overflow-hidden pb-3">
      <motion.span
        className="block leading-[1.08]"
        initial={{ y: "104%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.9, ease: EASE, delay }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/* ── Hero floating product preview ───────────────────────────────────────── */
function HeroPreviewCard() {
  return (
    <div className="glass-dark glow-peri w-[300px] animate-float-y rounded-3xl p-2.5">
      <div className="rounded-2xl bg-white/72 p-4 shadow-sm ring-1 ring-border/70">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[oklch(0.72_0.18_288)]" />
            <span className="text-sm font-semibold text-foreground">Hearth</span>
          </span>
          <span className="rounded-full bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-border/70">
            Today
          </span>
        </div>
        <p className="mt-4 text-base font-semibold text-foreground">Good evening, Sam</p>
        <p className="text-xs text-muted-foreground">Monday, June 23</p>
        <div className="mt-4 space-y-2.5">
          <MockCard label="Next up" value="Dinner with Mom" sub="7:00 PM · tonight" />
          <MockCard label="Looking forward to" value="24 days" sub="Anniversary trip" big />
          <div className="rounded-xl border border-border/70 bg-white/70 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Today&apos;s question
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">What made you smile today?</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockCard({
  label,
  value,
  sub,
  big,
}: {
  label: string;
  value: string;
  sub: string;
  big?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-white/70 p-3 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={big ? "mt-0.5 text-xl font-semibold tracking-tight text-foreground" : "mt-0.5 text-sm font-medium text-foreground"}>
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function FeatureIcon({ icon: Icon }: { icon: typeof CalendarDays }) {
  return (
    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-border/70 bg-gradient-to-br from-[oklch(0.62_0.2_288)]/15 to-white/70 text-[oklch(0.48_0.16_288)] shadow-sm">
      <Icon className="h-5 w-5" />
    </span>
  );
}

/* ── Story row: alternating text + mock with parallax ────────────────────── */
function StoryRow({
  no,
  tag,
  title,
  body,
  icon: Icon,
  flip,
  index,
}: {
  no: string;
  tag: string;
  title: string;
  body: string;
  icon: typeof CalendarDays;
  flip?: boolean;
  index: number;
}) {
  return (
    <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
      <ScrollReveal className={flip ? "lg:order-2" : ""} delay={0.05}>
        <span className="font-display text-7xl font-semibold text-primary/10">{no}</span>
        <div className="-mt-6 flex items-center gap-3">
          <FeatureIcon icon={Icon} />
          <span className="text-eyebrow text-[oklch(0.8_0.12_288)]">{tag}</span>
        </div>
        <h3 className="mt-5 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h3>
        <p className="mt-4 max-w-md text-lg text-muted-foreground">{body}</p>
      </ScrollReveal>

      <Parallax distance={22} className={flip ? "lg:order-1" : ""}>
        <ScrollReveal y={36} delay={0.1}>
          <StoryVisual index={index} />
        </ScrollReveal>
      </Parallax>
    </div>
  );
}

function StoryVisual({ index }: { index: number }) {
  if (index === 0) {
    return (
      <AppMock title="June" badge="Shared">
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 35 }, (_, i) => (
            <div
              key={i}
              className={
                [10, 18, 24].includes(i)
                  ? "aspect-square rounded-md bg-[oklch(0.62_0.2_288)]/70"
                  : "aspect-square rounded-md bg-muted"
              }
            />
          ))}
        </div>
      </AppMock>
    );
  }
  if (index === 1) {
    return (
      <AppMock title="Countdown" badge="Together">
        <p className="font-display text-5xl font-semibold tracking-tight text-foreground">24 days</p>
        <p className="mt-1 text-sm text-muted-foreground">until your anniversary trip</p>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[oklch(0.62_0.2_288)] to-[oklch(0.7_0.16_260)]" />
        </div>
      </AppMock>
    );
  }
  return (
    <AppMock title="On this day" badge="1 year ago">
      <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-[oklch(0.5_0.18_290)]/40 to-[oklch(0.6_0.14_250)]/25" />
      <p className="mt-3 text-sm font-medium text-foreground">A quiet morning, coffee on the porch.</p>
      <div className="mt-2 space-y-2">
        <MockLine w="75%" dim />
        <MockLine w="50%" dim />
      </div>
    </AppMock>
  );
}
