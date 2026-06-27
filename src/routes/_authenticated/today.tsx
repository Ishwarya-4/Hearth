import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppFrame } from "@/components/app-frame";
import { Overline, EmptyState, Skeleton } from "@/components/hearth";
import {
  EmberButton,
  GhostButton,
  MomentReveal,
  PromptHero,
  RitualSheet,
  Seal,
  YourMoment,
} from "@/components/amber";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/calendar/user-avatar";
import { toast } from "sonner";
import {
  AheadEmptyActions,
  DashboardItem,
  DashboardStagger,
  EventRowVisual,
  FeaturedCountdown,
  LiveClock,
  QuietDayCard,
  SpotlightPanel,
  TodayEmptyActions,
  WeekStrip,
} from "@/components/today/dashboard-widgets";
import { CalendarPlus, ChevronRight, Mail, Sparkles, Users } from "lucide-react";
import { promptForDate, todayISODate } from "@/lib/prompts";
import { errorMessage, invitePartner } from "@/lib/space";
import { useSpace } from "@/lib/use-space";
import { haptic } from "@/lib/haptics";
import { addDays, expandRecurring, fmtTime, isSameDay, startOfDay, startOfWeek } from "@/lib/calendar-utils";
import type { EventRow } from "@/components/calendar/calendar-view";
import type { ProfileLike } from "@/components/calendar/user-avatar";
import type { Database } from "@/integrations/supabase/types";

type Moment = Database["public"]["Tables"]["moments"]["Row"];

export const Route = createFileRoute("/_authenticated/today")({
  head: () => ({ meta: [{ title: "Today — Hearth" }] }),
  validateSearch: (search: Record<string, unknown>): { compose?: boolean } => ({
    compose: search.compose === true || search.compose === "true",
  }),
  component: TodayPage,
});

function dateMinusYear(d = new Date()) {
  const x = new Date(d);
  x.setFullYear(x.getFullYear() - 1);
  return x;
}

function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function daysUntil(target: Date, now = new Date()) {
  return Math.round((startOfDay(target).getTime() - startOfDay(now).getTime()) / 86_400_000);
}

function countdownLabel(n: number) {
  if (n <= 0) return "Today";
  if (n === 1) return "Tomorrow";
  return `${n} days`;
}

function TodayPage() {
  const { user } = Route.useRouteContext();
  const { compose } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const prompt = useMemo(() => promptForDate(), []);
  const today = todayISODate();

  const { space, spaceQ, peopleQ, me, others, profileById } = useSpace(user.id);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [mood, setMood] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  // Quick-add "Answer today's question" deep-links here with ?compose=1.
  useEffect(() => {
    if (compose) {
      setSheetOpen(true);
      navigate({ to: "/today", search: {}, replace: true });
    }
  }, [compose, navigate]);

  const eventsQ = useQuery({
    queryKey: ["space-events", space?.id],
    enabled: !!space,
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").eq("calendar_id", space!.id).order("start_at");
      if (error) throw error;
      return data as EventRow[];
    },
  });

  const now = new Date();
  const occurrences = useMemo(() => {
    const base = eventsQ.data ?? [];
    const winStart = startOfDay(now);
    const winEnd = addDays(winStart, 365);
    const oneoffs = base.filter((e) => (e.recurrence ?? "none") === "none");
    const recurring = base.filter((e) => (e.recurrence ?? "none") !== "none").flatMap((e) => expandRecurring(e, winStart, winEnd));
    return [...oneoffs, ...recurring]
      .filter((e) => new Date(e.end_at) >= winStart)
      .sort((a, b) => +new Date(a.start_at) - +new Date(b.start_at));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventsQ.data]);

  const todaysEvents = useMemo(
    () => occurrences.filter((e) => isSameDay(new Date(e.start_at), now) || (new Date(e.start_at) <= now && new Date(e.end_at) >= now)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [occurrences],
  );
  const nextEvent = useMemo(
    () => occurrences.find((e) => new Date(e.start_at) > now),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [occurrences],
  );
  const weekDays = useMemo(() => {
    const start = startOfWeek(now);
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(start, i);
      const has = occurrences.some((e) => isSameDay(new Date(e.start_at), d));
      return { date: d, has, isToday: isSameDay(d, now) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [occurrences]);

  // RSVP "going" counts for the space's events (keyed by base event id).
  const spaceEventIds = useMemo(() => (eventsQ.data ?? []).map((e) => e.id), [eventsQ.data]);
  const attendanceQ = useQuery({
    queryKey: ["attendance", [...spaceEventIds].sort((a, b) => a.localeCompare(b)).join(",")],
    enabled: spaceEventIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("event_attendance").select("event_id,status").in("event_id", spaceEventIds);
      if (error) throw error;
      return data as { event_id: string; status: string }[];
    },
  });
  const goingCountByEvent = useMemo(() => {
    const m: Record<string, number> = {};
    (attendanceQ.data ?? []).forEach((a) => {
      if (a.status === "going") m[a.event_id] = (m[a.event_id] ?? 0) + 1;
    });
    return m;
  }, [attendanceQ.data]);

  const todayQ = useQuery({
    queryKey: ["moments-today", space?.id, today],
    enabled: !!space,
    queryFn: async () => {
      const { data, error } = await supabase.from("moments").select("*").eq("calendar_id", space!.id).eq("kind", "reflection").eq("happened_on", today);
      if (error) throw error;
      return data as Moment[];
    },
  });

  const lastYear = todayISODate(dateMinusYear());
  const lastYearQ = useQuery({
    queryKey: ["moments-last-year", space?.id, lastYear],
    enabled: !!space,
    queryFn: async () => {
      const { data } = await supabase.from("moments").select("*").eq("calendar_id", space!.id).eq("happened_on", lastYear).order("created_at");
      return (data ?? []) as Moment[];
    },
  });

  const mine = (todayQ.data ?? []).find((m) => m.created_by === user.id) ?? null;
  const theirs = (todayQ.data ?? []).filter((m) => m.created_by !== user.id);
  const sharedTodayIds = useMemo(() => new Set((todayQ.data ?? []).map((m) => m.created_by)), [todayQ.data]);

  const dateLabel = now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  const firstName = me?.full_name?.split(" ")[0] ?? "";
  const bothEmpty = todaysEvents.length === 0 && !nextEvent;
  const countdownDays = nextEvent ? daysUntil(new Date(nextEvent.start_at)) : 0;
  const aheadPhrase =
    countdownDays <= 0 ? "later today" : countdownDays === 1 ? "tomorrow" : `in ${countdownDays} days`;
  const daySummary = bothEmpty
    ? "A calm, open day — fill it or just check in."
    : [
        todaysEvents.length > 0
          ? `${todaysEvents.length} ${todaysEvents.length === 1 ? "thing" : "things"} on today`
          : "Nothing scheduled today",
        nextEvent ? `${nextEvent.title} ${aheadPhrase}` : null,
      ]
        .filter(Boolean)
        .join("  ·  ");

  function refresh() { qc.invalidateQueries({ queryKey: ["moments-today"] }); }

  async function saveMoment() {
    if (!space) return;
    if (!body.trim() && !mood) return toast.error("Add a word or a feeling first");
    setSaving(true);
    const { error } = await supabase.from("moments").insert({
      calendar_id: space.id, created_by: user.id, kind: "reflection",
      prompt_key: prompt.key, prompt_text: prompt.text, mood,
      body: body.trim() || null, happened_on: today,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    haptic("success");
    toast.success("Kept");
    setSheetOpen(false);
    setBody("");
    setMood(null);
    refresh();
  }

  async function undoMine() {
    if (!mine) return;
    const { error } = await supabase.from("moments").delete().eq("id", mine.id);
    if (error) return toast.error(error.message);
    toast.success("Taken back");
    refresh();
  }

  function openCompose() {
    if (mine) return;
    haptic("light");
    setSheetOpen(true);
  }

  return (
    <AppFrame userId={user.id} maxWidth="wide">
      <div className="relative min-h-[calc(100dvh-7rem)]">
      {spaceQ.isLoading && (
        <div aria-label="Loading" aria-busy="true">
          <div className="mb-8 space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-56 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_280px]">
            <div className="flex flex-col gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Skeleton className="h-40 rounded-xl" />
                <Skeleton className="h-40 rounded-xl" />
              </div>
              <Skeleton className="h-60 rounded-xl" />
            </div>
            <div className="flex flex-col gap-5">
              <Skeleton className="h-44 rounded-xl" />
              <Skeleton className="h-44 rounded-xl" />
            </div>
          </div>
        </div>
      )}

      {!spaceQ.isLoading && !space && (
        <EmptyState
          title="Create your shared space"
          description="Name the home you'll keep together — then invite the people you want to share days with."
          action={<Link to="/welcome"><Button size="lg">Get started</Button></Link>}
        />
      )}

      {space && (
        <div className="relative">
          {/* Hero header */}
          <header className="relative z-10 mb-8 sm:mb-10">
            {/* Localized periwinkle bloom behind the greeting */}
            <div
              aria-hidden
              className="pointer-events-none absolute -left-8 -top-12 h-44 w-80 rounded-full bg-hearth/20 blur-[80px]"
            />
            <div className="relative flex flex-wrap items-end justify-between gap-5">
              <div className="min-w-0">
                <p className="flex items-center gap-2.5 text-overline text-hearth">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-hearth shadow-[0_0_10px_oklch(0.52_0.18_286/0.55)]"
                    aria-hidden
                  />
                  {dateLabel}
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/50" aria-hidden />
                  <LiveClock className="text-muted-foreground" />
                </p>
                <h1 className="mt-3 font-display text-[2.5rem] font-semibold leading-[1.02] tracking-tight text-foreground sm:text-[3.25rem]">
                  {greeting()}
                  {firstName ? <>, <span className="text-gradient-peri">{firstName}</span></> : ""}
                </h1>
                <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-muted-foreground">{daySummary}</p>
              </div>
              {me && (
                <div className="flex items-center -space-x-2.5">
                  {[me, ...others].map((p) => (
                    <span key={p.id} className="relative rounded-full ring-2 ring-background transition-transform hover:z-10 hover:-translate-y-0.5">
                      <UserAvatar profile={p} size="md" ring />
                      {sharedTodayIds.has(p.id) && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-hearth ring-2 ring-background" aria-label="Shared today" />
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </header>

          <DashboardStagger className="relative z-10 flex flex-col gap-5">
            {others.length === 0 && peopleQ.isSuccess && (
              <DashboardItem>
                <SpotlightPanel className="p-5">
                  <InviteStrip spaceId={space.id} />
                </SpotlightPanel>
              </DashboardItem>
            )}

            {/* Featured spotlight — the hero of the dashboard */}
            {bothEmpty ? (
              <DashboardItem>
                <QuietDayCard onCheckIn={openCompose} />
              </DashboardItem>
            ) : nextEvent ? (
              <DashboardItem>
                <FeaturedCountdown
                  days={countdownDays}
                  label={countdownLabel(countdownDays)}
                  title={nextEvent.title}
                  color={space.color}
                  goingCount={goingCountByEvent[nextEvent.base_id ?? nextEvent.id] ?? 0}
                  dateLabel={new Date(nextEvent.start_at).toLocaleDateString([], {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                />
              </DashboardItem>
            ) : null}

            {/* Main bento grid */}
            <div className="grid gap-5 xl:grid-cols-[1fr_300px] xl:items-start">
              <div className="flex flex-col gap-5">
                {!bothEmpty && (
                  <DashboardItem>
                    <SpotlightPanel className="p-5 sm:p-6">
                      <div className="flex items-center justify-between">
                        <Overline>Today</Overline>
                        <Link to="/calendar" className="text-xs font-medium text-hearth hover:underline">
                          Open calendar
                        </Link>
                      </div>
                      {todaysEvents.length === 0 ? (
                        <TodayEmptyActions onCheckIn={openCompose} />
                      ) : (
                        <ul className="mt-4 space-y-1">
                          {todaysEvents.map((e) => (
                            <EventRowVisual
                              key={e.id}
                              time={e.all_day ? "All day" : fmtTime(new Date(e.start_at))}
                              title={e.title}
                              color={e.color ?? space.color}
                              goingCount={goingCountByEvent[e.base_id ?? e.id] ?? 0}
                            />
                          ))}
                        </ul>
                      )}
                    </SpotlightPanel>
                  </DashboardItem>
                )}

                {!bothEmpty && !nextEvent && (
                  <DashboardItem>
                    <SpotlightPanel className="p-5 sm:p-6">
                      <Overline>Looking forward to</Overline>
                      <AheadEmptyActions />
                    </SpotlightPanel>
                  </DashboardItem>
                )}

                {/* Daily question */}
                <DashboardItem>
                  <SpotlightPanel className="relative overflow-hidden p-5 sm:p-6">
                    {!mine && (
                      <div className="pointer-events-none absolute -left-4 top-0 h-24 w-24 rounded-full bg-hearth/10 blur-2xl" aria-hidden />
                    )}
                    <div className="relative flex items-center justify-between">
                      <Overline>Today&apos;s question</Overline>
                      {!mine && (
                        <Button variant="ghost" size="sm" onClick={openCompose} className="text-hearth">
                          Answer <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    <PromptHero prompt={prompt.text} answered={!!mine} onTap={openCompose} />
                    {mine && <YourMoment moment={mine} you={profileById[user.id]} onEdit={undoMine} />}

                    {others.length > 0 && (
                      <section className="relative mt-6 border-t border-border pt-6">
                        {!mine ? (
                          <Seal partnerName={others[0]?.full_name?.split(" ")[0] || "them"} waiting={theirs.length > 0} />
                        ) : theirs.length > 0 ? (
                          <div className="space-y-4">
                            <Overline>What they kept</Overline>
                            {theirs.map((m) => (
                              <MomentReveal key={m.id} moment={m} who={profileById[m.created_by]} animate />
                            ))}
                          </div>
                        ) : (
                          <p className="text-caption">Nothing from them yet — you got here first.</p>
                        )}
                      </section>
                    )}
                  </SpotlightPanel>
                </DashboardItem>

                {(lastYearQ.data?.length ?? 0) > 0 && (
                  <DashboardItem>
                    <SpotlightPanel className="relative overflow-hidden p-5 sm:p-6">
                      <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-[oklch(0.72_0.13_305)]/15 blur-2xl" aria-hidden />
                      <Overline>One year ago today</Overline>
                      <div className="mt-4 space-y-4">
                        {lastYearQ.data!.map((m) => (
                          <MomentReveal key={m.id} moment={m} who={profileById[m.created_by]} faded animate={false} />
                        ))}
                      </div>
                    </SpotlightPanel>
                  </DashboardItem>
                )}
              </div>

              {/* Right rail */}
              <aside className="flex flex-col gap-5">
                <DashboardItem>
                  <SpotlightPanel className="p-5">
                    <Overline>This week</Overline>
                    <WeekStrip days={weekDays} />
                  </SpotlightPanel>
                </DashboardItem>

                <DashboardItem>
                  <SpotlightPanel className="p-5">
                    <Overline>Your people</Overline>
                    <ul className="mt-4 space-y-3">
                      {[me, ...others].filter(Boolean).map((p) => (
                        <li key={(p as ProfileLike).id} className="flex items-center gap-2.5">
                          <UserAvatar profile={p as ProfileLike} size="sm" ring />
                          <span className="flex-1 truncate text-sm">
                            {(p as ProfileLike).id === user.id ? "You" : (p as ProfileLike).full_name || (p as ProfileLike).email}
                          </span>
                          {sharedTodayIds.has((p as ProfileLike).id) && (
                            <span className="text-[11px] font-medium text-hearth">shared</span>
                          )}
                        </li>
                      ))}
                    </ul>
                    {others.length === 0 && (
                      <p className="mt-3 text-caption">Invite someone to make it warmer.</p>
                    )}
                  </SpotlightPanel>
                </DashboardItem>

                <DashboardItem>
                  <SpotlightPanel className="p-5">
                    <Overline>Explore</Overline>
                    <nav className="mt-3 space-y-1">
                      <QuickLink to="/calendar" icon={<CalendarPlus className="h-4 w-4" />} label="Full calendar" />
                      <QuickLink to="/memories" icon={<Sparkles className="h-4 w-4" />} label="All memories" />
                      <QuickLink to="/together" icon={<Users className="h-4 w-4" />} label="Lists & goals" />
                    </nav>
                  </SpotlightPanel>
                </DashboardItem>
              </aside>
            </div>
          </DashboardStagger>
        </div>
      )}
      </div>

      {space && (
        <RitualSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          prompt={prompt.text}
          mood={mood}
          onMoodChange={setMood}
          body={body}
          onBodyChange={setBody}
          onSave={saveMoment}
          saving={saving}
        />
      )}
    </AppFrame>
  );
}

function QuickLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-xl px-2 py-2 text-sm text-foreground transition-colors hover:bg-accent/70"
    >
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-hearth-muted text-hearth transition-transform duration-200 group-hover:scale-110">
        {icon}
      </span>
      <span className="flex-1 font-medium">{label}</span>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-hearth" />
    </Link>
  );
}


function InviteStrip({ spaceId }: { spaceId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!email.trim()) return;
    setBusy(true);
    try {
      const result = await invitePartner(spaceId, email);
      toast.success(`Invite email sent to ${result.email}`);
      qc.invalidateQueries({ queryKey: ["space-people"] });
      setOpen(false);
      setEmail("");
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't send invite"));
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center gap-3 text-left">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-hearth-muted text-hearth">
          <Mail className="h-4 w-4" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-medium">Invite your people</span>
          <span className="block text-caption">Hearth is warmer shared.</span>
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <Overline>Invite by email</Overline>
      <div className="relative">
        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="them@example.com"
          className="h-10 pl-10"
          onKeyDown={(e) => e.key === "Enter" && send()}
          autoFocus
        />
      </div>
      <div className="flex gap-2">
        <EmberButton size="sm" onClick={send} loading={busy} disabled={!email.trim()}>Send</EmberButton>
        <GhostButton onClick={() => setOpen(false)}>Not now</GhostButton>
      </div>
    </div>
  );
}
