import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inviteInput = z.object({
  calendarId: z.string().uuid(),
  email: z.string().trim().email("Enter a valid email").max(255),
});

function siteUrl() {
  return (
    process.env.SITE_URL ||
    process.env.VITE_SITE_URL ||
    process.env.VITE_PUBLIC_SITE_URL ||
    "http://localhost:8080"
  ).replace(/\/$/, "");
}

async function sendAuthEmail(email: string, redirectTo: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
  });

  if (!inviteErr) return;

  const alreadyRegistered =
    inviteErr.status === 422 ||
    /already (registered|exists|been invited)/i.test(inviteErr.message ?? "");

  if (!alreadyRegistered) throw inviteErr;

  // Existing account — send a magic-link email so they can sign in and accept the invite.
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !anonKey) {
    throw new Error("Email could not be sent — Supabase auth is not configured on the server.");
  }

  const res = await fetch(`${url}/auth/v1/otp`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      options: { emailRedirectTo: redirectTo },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Could not send sign-in email (${res.status}): ${body}`);
  }
}

export const sendSpaceInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(inviteInput)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as {
      supabase: import("@supabase/supabase-js").SupabaseClient;
      userId: string;
    };

    const email = data.email.toLowerCase();

    const { data: cal, error: calErr } = await supabase
      .from("calendars")
      .select("id, name, owner_id")
      .eq("id", data.calendarId)
      .single();
    if (calErr || !cal) throw new Error("Calendar not found");
    if (cal.owner_id !== userId) throw new Error("Only the owner can invite people to this space");

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    if (existingProfile) {
      const { data: existingMember } = await supabase
        .from("calendar_members")
        .select("id")
        .eq("calendar_id", data.calendarId)
        .eq("user_id", existingProfile.id)
        .maybeSingle();
      if (existingMember) throw new Error("They're already in this space");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error: invErr } = await supabaseAdmin.from("invitations").upsert(
      {
        calendar_id: data.calendarId,
        invited_email: email,
        role: "editor",
        invited_by: userId,
        accepted: false,
      },
      { onConflict: "calendar_id,invited_email" },
    );
    if (invErr) throw invErr;

    const redirectTo = `${siteUrl()}/auth`;
    await sendAuthEmail(email, redirectTo);

    return { kind: "invited" as const, email, spaceName: cal.name };
  });
