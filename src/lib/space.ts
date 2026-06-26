import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { sendSpaceInvite } from "@/lib/send-space-invite.server";
import { z } from "zod";

export type Space = Database["public"]["Tables"]["calendars"]["Row"];

const emailSchema = z.string().trim().email("Enter a valid email").max(255);

/** Pull a human-readable message from Supabase/PostgREST errors. */
export function errorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err && typeof err.message === "string") {
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

/** Pick the active shared space: prefer a host space you joined over one you own. */
export function pickSharedSpace(calendars: Space[], userId: string): Space | null {
  const shared = calendars.filter((c) => !c.is_personal);
  if (shared.length === 0) return null;

  const byAge = (a: Space, b: Space) => a.created_at.localeCompare(b.created_at);

  const joined = shared.filter((c) => c.owner_id !== userId).sort(byAge);
  if (joined.length > 0) return joined[0];

  const owned = shared.filter((c) => c.owner_id === userId).sort(byAge);
  return owned[0] ?? shared.sort(byAge)[0];
}

/** The couple's shared space — a non-personal calendar, if one exists. */
export async function getSharedSpace(userId?: string): Promise<Space | null> {
  const { data, error } = await supabase
    .from("calendars")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  if (!data?.length) return null;

  const uid = userId ?? (await supabase.auth.getUser()).data.user?.id;
  if (!uid) return data.find((c) => !c.is_personal) ?? null;

  return pickSharedSpace(data, uid);
}

export async function hasSharedSpace(userId?: string): Promise<boolean> {
  return (await getSharedSpace(userId)) !== null;
}

/** Create the couple's shared space + set accent color. Returns the space id. */
export async function createSharedSpace(userId: string, name: string, color: string): Promise<string> {
  const existing = await getSharedSpace(userId);
  if (existing) return existing.id;

  // Prefer the security-definer RPC when the migration has been applied.
  const { data: rpcId, error: rpcErr } = await supabase.rpc("create_shared_space", {
    p_name: name,
    p_color: color,
  });
  if (!rpcErr && rpcId) return rpcId as string;

  const rpcMissing =
    rpcErr?.code === "PGRST202" ||
    (rpcErr?.message?.includes("create_shared_space") ?? false);

  // Client fallback: insert without RETURNING (RLS blocks .select() on insert).
  const { error: profileErr } = await supabase.from("profiles").update({ color }).eq("id", userId);
  if (profileErr) throw profileErr;

  const { error: calErr } = await supabase.from("calendars").insert({
    name,
    color,
    owner_id: userId,
    is_personal: false,
  });
  if (calErr) throw calErr;

  // on_calendar_created trigger should add owner membership; then the space is visible.
  const space = await getSharedSpace(userId);
  if (space) return space.id;

  if (rpcErr && !rpcMissing) throw rpcErr;
  throw new Error(
    rpcMissing
      ? "Couldn't finish setup — run the latest Supabase migrations (create_shared_space), then try again."
      : "Place was created but couldn't be loaded — refresh and try again.",
  );
}

/** Accept any pending invitations for the signed-in user (existing accounts). */
export async function acceptPendingInvitations() {
  const { error } = await supabase.rpc("accept_pending_invitations" as never);
  if (error && error.code !== "PGRST202") throw error;
}

/**
 * Invite someone by email — saves a pending invitation and sends a Supabase auth
 * email (invite for new accounts, magic link for existing ones). They join the
 * space after signing up or signing in.
 */
export async function invitePartner(calendarId: string, rawEmail: string) {
  const parsed = emailSchema.safeParse(rawEmail);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  return sendSpaceInvite({ data: { calendarId, email: parsed.data } });
}
