import { createFileRoute, Outlet, redirect, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { hasSharedSpace, acceptPendingInvitations } from "@/lib/space";
import { AppShell } from "@/components/app-frame";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });

    // Block access until the email is actually confirmed. Without this, a stale
    // session or a signup made while confirmation was disabled would let an
    // unverified account into the app. OAuth users (e.g. Google) are confirmed
    // automatically, so this only gates unconfirmed email/password signups.
    if (!data.user.email_confirmed_at) {
      await supabase.auth.signOut();
      throw redirect({ to: "/auth", search: { unconfirmed: true } });
    }

    // Accept pending email invites before onboarding checks (existing accounts).
    // New signups are handled by handle_new_user; this covers magic-link / invite clicks.
    try {
      await acceptPendingInvitations();
    } catch {
      /* RPC may not exist until migration is applied */
    }

    const onWelcome = location.pathname === "/welcome" || location.pathname.startsWith("/welcome/");

    try {
      const onboarded = await hasSharedSpace(data.user.id);
      if (!onboarded && !onWelcome) throw redirect({ to: "/welcome" });
      if (onboarded && onWelcome) throw redirect({ to: "/today" });
    } catch (err) {
      // Don't block the app on a transient calendars fetch failure — welcome can still render.
      if (!onWelcome) throw err;
    }

    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const router = useRouter();

  // Re-accept after navigation (e.g. magic link) and refresh member lists.
  useEffect(() => {
    acceptPendingInvitations()
      .then(async () => {
        qc.invalidateQueries({ queryKey: ["space-people"] });
        qc.invalidateQueries({ queryKey: ["members"] });
        qc.invalidateQueries({ queryKey: ["invitations"] });
        qc.invalidateQueries({ queryKey: ["calendars"] });
        qc.invalidateQueries({ queryKey: ["space"] });
        // Re-run beforeLoad so invited users skip /welcome once membership exists.
        if (globalThis.location.pathname.startsWith("/welcome")) {
          const joined = await hasSharedSpace(user.id);
          if (joined) router.invalidate();
        }
      })
      .catch(() => {
        /* RPC may not exist until migration is applied */
      });
  }, [qc, router, user.id]);

  return (
    <AppShell userId={user.id}>
      <Outlet />
    </AppShell>
  );
}
