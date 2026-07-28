import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Heart, Mail, PenLine, Send } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar, type ProfileLike } from "@/components/calendar/user-avatar";
import { MOODS, moodMeta } from "@/lib/prompts";
import { cn } from "@/lib/utils";
import { PrimaryButton } from "./primary-button";
import type { Database } from "@/integrations/supabase/types";

type Moment = Database["public"]["Tables"]["moments"]["Row"];

/**
 * Love notes are `moments` of kind `note` tagged with this prompt_key. The tag
 * lets Today surface "the little messages between you" while the note still
 * lives on in Memories as something kept — closing the loop by design.
 */
export const LOVE_NOTE_PROMPT_KEY = "love-note";
export const LOVE_NOTE_MAX = 280;

export function isLoveNote(m: Pick<Moment, "kind" | "prompt_key">) {
  return m.kind === "note" && m.prompt_key === LOVE_NOTE_PROMPT_KEY;
}

function firstName(p?: ProfileLike | null) {
  return p?.full_name?.split(" ")[0] || p?.email?.split("@")[0] || "them";
}

function timeAgo(iso: string) {
  const d = new Date(iso);
  const min = Math.round((Date.now() - d.getTime()) / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day === 1) return "yesterday";
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

// ─── Composer ─────────────────────────────────────────────────────────────────
export function LoveNoteComposer({
  open,
  onOpenChange,
  toName,
  onSend,
  sending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toName: string;
  onSend: (body: string, mood: string | null) => void;
  sending?: boolean;
}) {
  const [body, setBody] = useState("");
  const [mood, setMood] = useState<string | null>(null);

  // Fresh each open — a note is a single small gesture, not a saved draft.
  useEffect(() => {
    if (open) {
      setBody("");
      setMood(null);
    }
  }, [open]);

  const remaining = LOVE_NOTE_MAX - body.length;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] rounded-t-[28px] border-border/50 bg-background px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" aria-hidden />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <DrawerHeader className="px-0 pb-2 pt-4 text-left">
            <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-hearth-muted text-hearth">
              <Mail className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <DrawerTitle className="font-display text-xl font-semibold tracking-tight">
              A little note
            </DrawerTitle>
            <DrawerDescription className="text-sm text-muted-foreground">
              It&apos;ll land on {toName}&apos;s Today — and stay in your memories.
            </DrawerDescription>
          </DrawerHeader>

          {/* Letter paper */}
          <div className="relative overflow-hidden rounded-2xl border border-hearth/15 bg-gradient-to-br from-[oklch(0.99_0.01_288)] to-[oklch(0.97_0.02_300)] p-1 shadow-[0_20px_50px_-30px_oklch(0.5_0.16_286/0.4)]">
            <div
              className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-hearth/10 blur-2xl"
              aria-hidden
            />
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, LOVE_NOTE_MAX))}
              placeholder={`Dear ${toName}…`}
              className="min-h-[8rem] resize-none border-transparent bg-transparent font-serif text-lg italic leading-relaxed text-foreground shadow-none focus-visible:ring-0"
              maxLength={LOVE_NOTE_MAX}
              autoFocus
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {MOODS.map((mo) => (
              <button
                key={mo.key}
                type="button"
                onClick={() => setMood((cur) => (cur === mo.key ? null : mo.key))}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-all active:scale-95",
                  mood === mo.key
                    ? "bg-hearth/12 text-foreground ring-1 ring-hearth/35"
                    : "bg-secondary/70 text-muted-foreground hover:bg-secondary",
                )}
              >
                <span aria-hidden>{mo.emoji}</span> {mo.label}
              </button>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <PrimaryButton
              size="lg"
              loading={sending}
              disabled={!body.trim()}
              onClick={() => onSend(body.trim(), mood)}
              className="flex-1"
            >
              <Send className="mr-1.5 h-4 w-4" /> Send it
            </PrimaryButton>
            <span
              className={cn(
                "w-10 shrink-0 text-right text-xs tabular-nums",
                remaining < 40 ? "text-hearth" : "text-muted-foreground/60",
              )}
            >
              {remaining}
            </span>
          </div>
        </motion.div>
      </DrawerContent>
    </Drawer>
  );
}

// ─── A single note, rendered as an opened letter ─────────────────────────────
function OpenLetter({
  note,
  author,
  mine,
  featured,
}: {
  note: Moment;
  author?: ProfileLike;
  mine: boolean;
  featured?: boolean;
}) {
  const reduced = useReducedMotion();
  const mood = moodMeta(note.mood);
  const name = mine ? "You" : firstName(author);
  const today = note.happened_on === new Date().toISOString().slice(0, 10);

  return (
    <motion.article
      initial={reduced ? false : { opacity: 0, y: 10, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4 sm:p-5",
        mine
          ? "border-border/60 bg-secondary/40"
          : "border-hearth/20 bg-gradient-to-br from-[oklch(0.99_0.012_288)] to-[oklch(0.975_0.022_300)] shadow-[0_18px_44px_-32px_oklch(0.5_0.16_286/0.45)] dark:from-[oklch(0.24_0.02_288)] dark:to-[oklch(0.22_0.02_300)]",
      )}
    >
      {/* Left ribbon accent — warmer for notes addressed to you */}
      <span
        className={cn("absolute inset-y-0 left-0 w-1", mine ? "bg-border" : "bg-hearth/50")}
        aria-hidden
      />
      <div className="relative flex items-center gap-2">
        {author && <UserAvatar profile={author} size="xs" />}
        <span className="text-sm font-medium">{mine ? "You wrote" : `From ${name}`}</span>
        {!mine && today && (
          <span className="inline-flex items-center gap-1 rounded-full bg-hearth/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-hearth">
            <span className="h-1.5 w-1.5 rounded-full bg-hearth" aria-hidden />
            new
          </span>
        )}
        <span className="ml-auto text-caption">{timeAgo(note.created_at)}</span>
      </div>

      {note.body && (
        <p
          className={cn(
            "relative mt-3 font-serif italic leading-relaxed text-foreground",
            featured ? "text-lg sm:text-xl" : "text-base",
          )}
        >
          &ldquo;{note.body}&rdquo;
        </p>
      )}

      {mood && (
        <p className="relative mt-2.5 text-caption">
          {mood.emoji} {mood.label}
        </p>
      )}
    </motion.article>
  );
}

// ─── Today surface: the little notes between you ──────────────────────────────
export function LoveNotesPanel({
  notes,
  userId,
  partnerName,
  profileById,
  onCompose,
}: {
  notes: Moment[];
  userId: string;
  partnerName: string;
  profileById: Record<string, ProfileLike>;
  onCompose: () => void;
}) {
  // Newest first.
  const sorted = [...notes].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  const latest = sorted[0];
  const earlier = sorted.slice(1, 4);
  const latestFromThem = latest && latest.created_by !== userId;

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-overline text-hearth">
          <Heart className="h-3.5 w-3.5" /> Between you
        </span>
        <button
          type="button"
          onClick={onCompose}
          className="inline-flex items-center gap-1 text-xs font-medium text-hearth transition-colors hover:text-hearth/80"
        >
          <PenLine className="h-3.5 w-3.5" />
          {latestFromThem ? "Write back" : "Leave a note"}
        </button>
      </div>

      {!latest ? (
        <button
          type="button"
          onClick={onCompose}
          className="group mt-4 flex w-full flex-col items-center gap-3 rounded-2xl border border-dashed border-hearth/25 bg-hearth-muted/20 px-5 py-8 text-center transition-colors hover:bg-hearth-muted/35"
        >
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-background/70 text-hearth transition-transform group-hover:-translate-y-0.5">
            <Mail className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <span>
            <span className="block text-sm font-medium text-foreground">
              Leave {partnerName} a little note
            </span>
            <span className="mt-0.5 block text-caption">
              A line that lands on their Today — and stays in your memories.
            </span>
          </span>
        </button>
      ) : (
        <div className="mt-4 space-y-2.5">
          <AnimatePresence mode="popLayout">
            <OpenLetter
              key={latest.id}
              note={latest}
              author={profileById[latest.created_by]}
              mine={latest.created_by === userId}
              featured
            />
          </AnimatePresence>

          {earlier.length > 0 && (
            <div className="space-y-2 pt-1">
              {earlier.map((n) => (
                <OpenLetter
                  key={n.id}
                  note={n}
                  author={profileById[n.created_by]}
                  mine={n.created_by === userId}
                />
              ))}
            </div>
          )}

          <p className="pt-1 text-center text-[11px] text-muted-foreground/70">
            Kept in your memories, always.
          </p>
        </div>
      )}
    </div>
  );
}
