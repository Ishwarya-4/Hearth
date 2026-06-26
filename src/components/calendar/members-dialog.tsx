import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail, UserX, Crown } from "lucide-react";
import { UserAvatar, type ProfileLike } from "./user-avatar";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

const emailSchema = z.string().trim().email("Enter a valid email").max(255);

export type MemberRow = {
  id: string;
  user_id: string;
  role: "owner" | "editor" | "viewer";
  profile: ProfileLike;
};

export function MembersDialog({
  open,
  onOpenChange,
  calendarId,
  calendarName,
  isOwner,
  members,
  pendingInvites,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  calendarId: string;
  calendarName: string;
  isOwner: boolean;
  members: MemberRow[];
  pendingInvites: { id: string; invited_email: string }[];
}) {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function invite() {
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not signed in");

      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", parsed.data)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("calendar_members")
          .insert({ calendar_id: calendarId, user_id: existing.id, role: "editor" });
        if (error && !error.message.includes("duplicate")) throw error;
        toast.success("Member added");
      } else {
        const { error } = await supabase
          .from("invitations")
          .insert({ calendar_id: calendarId, invited_email: parsed.data, role: "editor", invited_by: userData.user.id });
        if (error) throw error;
        toast.success("Invitation saved — they'll join automatically when they sign up");
      }
      setEmail("");
      qc.invalidateQueries({ queryKey: ["members", calendarId] });
      qc.invalidateQueries({ queryKey: ["invitations", calendarId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add");
    } finally {
      setLoading(false);
    }
  }

  async function removeMember(memberRowId: string) {
    const { error } = await supabase.from("calendar_members").delete().eq("id", memberRowId);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    qc.invalidateQueries({ queryKey: ["members", calendarId] });
  }

  async function cancelInvite(invId: string) {
    const { error } = await supabase.from("invitations").delete().eq("id", invId);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["invitations", calendarId] });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Share "{calendarName}"</DialogTitle>
        </DialogHeader>

        {isOwner && (
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="invite-email" className="sr-only">Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && invite()}
                maxLength={255}
              />
            </div>
            <Button onClick={invite} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Mail className="h-4 w-4 mr-1.5" />Invite</>}
            </Button>
          </div>
        )}

        <div className="space-y-1.5 max-h-72 overflow-y-auto">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">Members</p>
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/60">
              <UserAvatar profile={m.profile} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.profile.full_name || m.profile.email}</p>
                <p className="text-xs text-muted-foreground truncate">{m.profile.email}</p>
              </div>
              {m.role === "owner" ? (
                <span className="inline-flex items-center gap-1 text-xs text-hearth"><Crown className="h-3 w-3" />Owner</span>
              ) : (
                isOwner && (
                  <Button variant="ghost" size="icon" onClick={() => removeMember(m.id)} aria-label="Remove member">
                    <UserX className="h-4 w-4" />
                  </Button>
                )
              )}
            </div>
          ))}

          {pendingInvites.length > 0 && (
            <>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-3">Pending</p>
              {pendingInvites.map((inv) => (
                <div key={inv.id} className="flex items-center gap-3 p-2 rounded-lg">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </span>
                  <span className="flex-1 text-sm truncate">{inv.invited_email}</span>
                  {isOwner && (
                    <Button variant="ghost" size="sm" onClick={() => cancelInvite(inv.id)}>Cancel</Button>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
