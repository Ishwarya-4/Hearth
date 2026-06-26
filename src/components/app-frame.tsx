import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Wordmark } from "@/components/wordmark";
import { UserAvatar, type ProfileLike } from "@/components/calendar/user-avatar";
import { QuickAddSheet } from "@/components/hearth";
import { useSpace } from "@/lib/use-space";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CalendarDays, Heart, Home, LogOut, type LucideIcon,
  Moon, Plus, Sun, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type Destination = { to: string; label: string; icon: LucideIcon; description: string };

export const DESTINATIONS: Destination[] = [
  { to: "/today", label: "Today", icon: Home, description: "Your dashboard" },
  { to: "/calendar", label: "Calendar", icon: CalendarDays, description: "Plan together" },
  { to: "/memories", label: "Memories", icon: Heart, description: "What you've kept" },
  { to: "/together", label: "Together", icon: Users, description: "Lists & goals" },
];

export function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.classList.contains("dark")); }, []);
  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("warm-theme", next ? "dark" : "light"); } catch { /* ignore */ }
    setDark(next);
  }
  return { dark, toggle };
}

function useActive() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (to: string) => pathname === to || pathname.startsWith(`${to}/`);
}

export function ProfileMenu({ userId, align = "end" }: { userId: string; align?: "start" | "end" }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { dark, toggle } = useTheme();

  const profileQ = useQuery({
    queryKey: ["me", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (error) throw error;
      return data as ProfileLike;
    },
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Account menu"
        >
          {profileQ.data && <UserAvatar profile={profileQ.data} size="md" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-56 rounded-xl">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate font-medium">{profileQ.data?.full_name || "Account"}</span>
          <span className="block truncate text-xs font-normal text-muted-foreground">{profileQ.data?.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); toggle(); }}>
          {dark ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
          {dark ? "Light mode" : "Dark mode"}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={signOut}>
          <LogOut className="mr-2 h-4 w-4" />Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DesktopSidebar({ userId }: { userId: string }) {
  const isActive = useActive();
  const { space } = useSpace(userId);

  return (
    <aside className="sticky top-0 z-20 hidden h-[100dvh] w-64 shrink-0 flex-col border-r border-border/40 bg-sidebar/80 backdrop-blur-xl lg:flex">
      <div className="flex h-16 items-center px-5">
        <Link to="/today" aria-label="Hearth home">
          <Wordmark size="md" />
        </Link>
      </div>

      {space && (
        <div className="mx-4 mb-4 flex items-center gap-2.5 rounded-xl hearth-glass px-3 py-2.5">
          <span
            className="h-3 w-3 shrink-0 rounded-full shadow-[0_0_8px_currentColor]"
            style={{ backgroundColor: space.color, color: space.color }}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{space.name}</p>
            <p className="text-xs text-muted-foreground">Your space</p>
          </div>
        </div>
      )}

      <nav className="flex flex-1 flex-col gap-0.5 px-3" aria-label="Main navigation">
        {DESTINATIONS.map(({ to, label, icon: Icon, description }) => {
          const active = isActive(to);
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
              )}
            >
              {/* Pill glides between nav items via shared layoutId */}
              {active && (
                <motion.span
                  className="absolute inset-0 rounded-xl bg-hearth-muted"
                  layoutId="desktop-nav-pill"
                  transition={{ type: "spring", stiffness: 380, damping: 34 }}
                />
              )}
              <Icon
                className={cn("relative z-10 h-[18px] w-[18px] shrink-0", active && "text-hearth")}
                strokeWidth={active ? 2.25 : 1.75}
              />
              <span className="relative z-10 min-w-0">
                <span className="block text-sm font-medium leading-none">{label}</span>
                <span className="mt-0.5 block text-[11px] leading-none opacity-70">{description}</span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <ProfileMenu userId={userId} align="start" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">Your account</p>
            <p className="text-xs text-muted-foreground">Settings & sign out</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function TabletRail({ userId }: { userId: string }) {
  const isActive = useActive();
  return (
    <aside className="sticky top-0 z-20 hidden h-[100dvh] w-[72px] shrink-0 flex-col items-center border-r border-border/40 bg-sidebar/80 py-5 backdrop-blur-xl md:flex lg:hidden">
      <Link to="/today" className="mb-6" aria-label="Hearth home">
        <Wordmark size="sm" withName={false} />
      </Link>
      <nav className="flex flex-1 flex-col items-center gap-1" aria-label="Main">
        {DESTINATIONS.map(({ to, label, icon: Icon }) => {
          const active = isActive(to);
          return (
            <Link
              key={to}
              to={to}
              title={label}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
                active ? "text-hearth" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
              )}
            >
              {active && (
                <motion.span
                  className="absolute inset-0 rounded-xl bg-hearth-muted"
                  layoutId="tablet-nav-pill"
                  transition={{ type: "spring", stiffness: 380, damping: 34 }}
                />
              )}
              <Icon className="relative z-10 h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
            </Link>
          );
        })}
      </nav>
      <ProfileMenu userId={userId} align="start" />
    </aside>
  );
}

function MobileNav({
  onQuickAdd,
}: {
  onQuickAdd: () => void;
}) {
  const isActive = useActive();
  const [left, right] = [DESTINATIONS.slice(0, 2), DESTINATIONS.slice(2)];

  function tab({ to, label, icon: Icon }: Destination) {
    const active = isActive(to);
    return (
      <Link
        key={to}
        to={to}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors",
          active ? "text-hearth" : "text-muted-foreground",
        )}
      >
        {active && (
          <motion.span
            className="absolute inset-x-1 inset-y-0.5 rounded-lg bg-hearth-muted"
            layoutId="mobile-nav-pill"
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
          />
        )}
        <Icon className="relative z-10 h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
        <span className="relative z-10">{label}</span>
      </Link>
    );
  }

  return (
    <nav
      className="fixed inset-x-4 bottom-4 z-40 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-lg items-stretch rounded-2xl hearth-glass px-2 py-1.5 shadow-elevated">
        {left.map(tab)}
        <div className="flex flex-1 items-center justify-center">
          <motion.button
            type="button"
            aria-label="Quick add"
            onClick={onQuickAdd}
            className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full btn-ember shadow-elevated"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 500, damping: 24 }}
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          </motion.button>
        </div>
        {right.map(tab)}
      </div>
    </nav>
  );
}

/** Gentle rise + fade on each route mount. */
function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const reduced = useReducedMotion();
  if (reduced) return <>{children}</>;
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function MobileTopBar({
  userId,
  trailing,
}: {
  userId: string;
  trailing?: ReactNode;
}) {
  const { space } = useSpace(userId);
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/40 bg-background/80 px-4 backdrop-blur-xl md:hidden">
      <Link to="/today" aria-label="Hearth home">
        <Wordmark size="sm" withName={false} />
      </Link>
      {space && (
        <span className="truncate text-sm font-medium text-muted-foreground">{space.name}</span>
      )}
      <div className="ml-auto flex items-center gap-2">
        {trailing}
        <ProfileMenu userId={userId} />
      </div>
    </header>
  );
}

export function AppFrame({
  userId,
  children,
  fullBleed = false,
  maxWidth = "reading",
  header,
  mobileTrailing,
  contentClassName,
  onQuickAddQuestion,
}: {
  userId: string;
  children: ReactNode;
  fullBleed?: boolean;
  maxWidth?: "reading" | "wide" | "full";
  header?: ReactNode;
  mobileTrailing?: ReactNode;
  contentClassName?: string;
  /** Called when user picks "Answer today's question" from quick-add */
  onQuickAddQuestion?: () => void;
}) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  return (
    <div className={cn("relative flex bg-background", fullBleed ? "h-[100dvh] overflow-hidden" : "min-h-[100dvh]")}>
      {!fullBleed && <div className="app-ambient" aria-hidden />}
      <DesktopSidebar userId={userId} />
      <TabletRail userId={userId} />

      <div className={cn("relative z-10 flex min-w-0 flex-1 flex-col", fullBleed && "h-[100dvh]")}>
        {header ?? <MobileTopBar userId={userId} trailing={mobileTrailing} />}
        <main
          className={cn(
            fullBleed
              ? "flex min-h-0 flex-1 flex-col overflow-hidden"
              : cn(
                  "mx-auto w-full flex-1 px-4 pb-28 pt-5 sm:px-6 md:pb-8 md:pt-8 lg:px-8",
                  maxWidth === "full" && "max-w-none",
                  maxWidth === "wide" && "max-w-7xl",
                  maxWidth === "reading" && "max-w-3xl",
                  contentClassName,
                ),
          )}
        >
          {fullBleed ? children : <PageTransition>{children}</PageTransition>}
        </main>
      </div>

      <MobileNav onQuickAdd={() => setQuickAddOpen(true)} />
      <QuickAddSheet
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        onAnswerQuestion={onQuickAddQuestion}
      />
    </div>
  );
}
