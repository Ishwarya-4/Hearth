import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Sparkles, Bell, Search, LayoutGrid } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hearth — Shared calendars for the people you love" },
      { name: "description", content: "A warm, shared calendar for families, teams, and friends. Plan together with day, week, month and agenda views." },
      { property: "og:title", content: "Hearth — Shared Calendar" },
      { property: "og:description", content: "Plan together. A warm, shared calendar for families, teams, and friends." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary via-background to-background">
      <header className="px-5 sm:px-8 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <Calendar className="h-5 w-5" />
          </span>
          <span className="font-display text-2xl font-semibold">Hearth</span>
        </Link>
        {signedIn ? (
          <Button onClick={() => navigate({ to: "/app" })}>Open calendar</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate({ to: "/auth" })}>Sign in</Button>
            <Button onClick={() => navigate({ to: "/auth" })}>Get started</Button>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-5 sm:px-8 pt-12 pb-24">
        <section className="text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Made for plans that involve more than one person
          </span>
          <h1 className="font-display text-4xl sm:text-6xl font-semibold tracking-tight mt-5 leading-[1.05]">
            A warm, shared calendar for the people you love
          </h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Hearth keeps your family, team, or friend group in sync. Add events, invite people, and see who's doing what — at a glance, with a little face on every plan.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" className="h-12 px-7" onClick={() => navigate({ to: signedIn ? "/app" : "/auth" })}>
              {signedIn ? "Open your calendar" : "Get started — it's free"}
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-7" onClick={() => navigate({ to: "/auth" })}>
              Sign in
            </Button>
          </div>
        </section>

        <section className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Feature icon={<Users />} title="Share with anyone" desc="Invite by email. They join automatically when they sign up, and your plans appear on both calendars instantly." />
          <Feature icon={<LayoutGrid />} title="Every view you need" desc="Day, 3-day, week, month and agenda — switch with a tap, optimised for desktop and phone." />
          <Feature icon={<Calendar />} title="Color-coded by person" desc="Each event shows a small avatar of who created it, so you can scan a week and know what's whose." />
          <Feature icon={<Search />} title="Search across calendars" desc="Find any event by title, place or notes. Across personal and shared calendars at once." />
          <Feature icon={<Bell />} title="Reminders" desc="Set a heads-up 5 minutes, an hour, or a day before — so nothing slips." />
          <Feature icon={<Sparkles />} title="Private by default" desc="Email + password or Google sign-in. Only the people you invite can see what's on your calendar." />
        </section>
      </main>

      <footer className="border-t border-border/50 py-6 text-center text-sm text-muted-foreground">
        Made with care · Hearth
      </footer>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary mb-3">
        {icon}
      </div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}
