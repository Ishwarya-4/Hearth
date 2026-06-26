import { createFileRoute } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppFrame } from "@/components/app-frame";
import { Panel, Overline, PageHeader, EmptyState } from "@/components/hearth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { UserAvatar, type ProfileLike } from "@/components/calendar/user-avatar";
import { toast } from "sonner";
import { Heart, ImagePlus, Loader2, Plus, Sparkles, X } from "lucide-react";
import { MOODS, moodMeta, todayISODate } from "@/lib/prompts";
import { useSpace } from "@/lib/use-space";
import { uploadMemoryPhoto } from "@/lib/storage";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type Moment = Database["public"]["Tables"]["moments"]["Row"];

export const Route = createFileRoute("/_authenticated/memories")({
  head: () => ({ meta: [{ title: "Memories — Hearth" }] }),
  component: MemoriesPage,
});

function MemoriesPage() {
  const { user } = Route.useRouteContext();
  const { space, profileById } = useSpace(user.id);
  const [composing, setComposing] = useState(false);

  const momentsQ = useQuery({
    queryKey: ["thread", space?.id],
    enabled: !!space,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("moments")
        .select("*")
        .eq("calendar_id", space!.id)
        .order("happened_on", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Moment[];
    },
  });

  const moments = momentsQ.data ?? [];

  const groups = useMemo(() => {
    const m = new Map<string, Moment[]>();
    moments.forEach((mo) => {
      const arr = m.get(mo.happened_on) ?? [];
      arr.push(mo);
      m.set(mo.happened_on, arr);
    });
    return Array.from(m.entries());
  }, [moments]);

  const onThisDay = useMemo(() => {
    const now = new Date();
    const md = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    return moments.filter((mo) => mo.happened_on.slice(5) === md && Number(mo.happened_on.slice(0, 4)) < now.getFullYear());
  }, [moments]);

  const count = moments.length;

  return (
    <AppFrame userId={user.id}>
      <PageHeader
        title="Memories"
        description={count > 0 ? `${count} moment${count === 1 ? "" : "s"} kept together` : "Photos, notes, and the moments worth remembering"}
        action={
          space ? (
            <Button onClick={() => setComposing(true)}>
              <Plus className="h-4 w-4" />Add memory
            </Button>
          ) : undefined
        }
      />

      {momentsQ.isSuccess && groups.length === 0 && (
        <EmptyState
          icon={<Heart className="h-6 w-6" />}
          title="Nothing kept yet"
          description="Save a photo or a note — and answer today's question on Today. Everything you keep lands here as your shared timeline."
          action={<Button size="lg" onClick={() => setComposing(true)}><Plus className="h-4 w-4" />Add your first memory</Button>}
        />
      )}

      {onThisDay.length > 0 && (
        <section className="mb-10">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-hearth" />
            <Overline>On this day</Overline>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {onThisDay.map((m) => <MemoryCard key={`otd-${m.id}`} m={m} who={profileById[m.created_by]} showYear />)}
          </div>
        </section>
      )}

      <div className="relative space-y-10 pl-6 sm:pl-8">
        <div className="memory-timeline-line absolute bottom-0 left-2 top-0 w-px sm:left-3" aria-hidden />
        {groups.map(([day, items]) => (
          <DayGroup key={day} day={day} items={items} profileById={profileById} />
        ))}
      </div>

      {space && (
        <AddMemorySheet
          open={composing}
          onOpenChange={setComposing}
          spaceId={space.id}
          userId={user.id}
        />
      )}
    </AppFrame>
  );
}

function DayGroup({ day, items, profileById }: { day: string; items: Moment[]; profileById: Record<string, ProfileLike> }) {
  const reduced = useReducedMotion();
  const d = new Date(day + "T00:00:00");
  const label = d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  return (
    <motion.section
      className="relative"
      initial={reduced ? {} : { opacity: 0, x: -14 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Timeline node: outer pulse ring + inner solid dot */}
      <div className="absolute -left-6 top-1.5 flex h-4 w-4 items-center justify-center sm:-left-8">
        {!reduced && (
          <motion.span
            className="absolute h-4 w-4 rounded-full bg-hearth"
            animate={{ scale: [1, 1.9, 1], opacity: [0.35, 0, 0.35] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut", repeatDelay: 2 }}
          />
        )}
        <span className="relative h-2.5 w-2.5 rounded-full bg-hearth shadow-[0_0_8px_var(--color-hearth)]" />
      </div>
      <Overline>{label}</Overline>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {items.map((m) => <MemoryCard key={m.id} m={m} who={profileById[m.created_by]} />)}
      </div>
    </motion.section>
  );
}

function MemoryCard({ m, who, showYear }: { m: Moment; who?: ProfileLike; showYear?: boolean }) {
  const reduced = useReducedMotion();
  const mood = moodMeta(m.mood);
  const year = m.happened_on.slice(0, 4);
  return (
    // Spring hover lift replaces flat CSS translate — feels physical
    <motion.div
      whileHover={reduced ? {} : { y: -5, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
    >
      <Panel glass className="overflow-hidden">
        {m.photo_url && (
          <img
            src={m.photo_url}
            alt=""
            loading="lazy"
            className="aspect-[4/3] w-full bg-muted object-cover"
          />
        )}
        <div className="p-4">
          {m.prompt_text && <p className="text-caption italic leading-snug">{m.prompt_text}</p>}
          {m.body && (
            <p
              className={cn(
                "whitespace-pre-wrap text-[15px] leading-relaxed text-foreground",
                m.prompt_text && "mt-1.5",
              )}
            >
              {m.body}
            </p>
          )}
          <div className="mt-3 flex items-center gap-2">
            {who && <UserAvatar profile={who} size="xs" />}
            <span className="text-caption">{who?.full_name?.split(" ")[0] ?? "Someone"}</span>
            {showYear && <span className="text-caption">· {year}</span>}
            {mood && (
              <span className="ml-auto text-base" title={mood.label}>
                {mood.emoji}
              </span>
            )}
          </div>
        </div>
      </Panel>
    </motion.div>
  );
}

function AddMemorySheet({
  open, onOpenChange, spaceId, userId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  spaceId: string;
  userId: string;
}) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [when, setWhen] = useState(todayISODate());
  const [saving, setSaving] = useState(false);

  function reset() {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setBody("");
    setMood(null);
    setWhen(todayISODate());
  }

  function pickFile(f: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  }

  async function save() {
    if (!file && !body.trim() && !mood) {
      return toast.error("Add a photo, a few words, or a feeling.");
    }
    setSaving(true);
    try {
      let photoUrl: string | null = null;
      if (file) photoUrl = await uploadMemoryPhoto(spaceId, file);
      const { error } = await supabase.from("moments").insert({
        calendar_id: spaceId,
        created_by: userId,
        kind: "note",
        body: body.trim() || null,
        mood,
        photo_url: photoUrl,
        happened_on: when,
      });
      if (error) throw error;
      haptic("success");
      toast.success("Kept");
      qc.invalidateQueries({ queryKey: ["thread"] });
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save that memory");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-6 sm:max-w-md">
        <h2 className="font-display text-xl text-foreground">Keep a memory</h2>
        <p className="mt-1 text-caption">A photo, a note, a small true thing.</p>

        <div className="mt-5 flex-1 space-y-4 overflow-y-auto">
          {/* Photo */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
          {previewUrl ? (
            <div className="relative overflow-hidden rounded-xl border border-border">
              <img src={previewUrl} alt="Selected" className="aspect-[4/3] w-full object-cover" />
              <button
                type="button"
                onClick={() => pickFile(null)}
                className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur transition-colors hover:bg-background"
                aria-label="Remove photo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-8 text-muted-foreground transition-colors hover:border-hearth/40 hover:text-foreground"
            >
              <ImagePlus className="h-6 w-6" />
              <span className="text-sm font-medium">Add a photo</span>
            </button>
          )}

          {/* Note */}
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What happened? What do you want to remember?"
            rows={4}
            maxLength={1000}
            className="resize-none"
          />

          {/* Mood */}
          <div>
            <Overline>A feeling (optional)</Overline>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {MOODS.map((mo) => (
                <button
                  key={mo.key}
                  type="button"
                  onClick={() => setMood((cur) => (cur === mo.key ? null : mo.key))}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm transition-all active:scale-95",
                    mood === mo.key ? "bg-hearth/12 text-foreground ring-1 ring-hearth/35" : "bg-secondary/70 text-muted-foreground hover:bg-secondary",
                  )}
                >
                  {mo.emoji} {mo.label}
                </button>
              ))}
            </div>
          </div>

          {/* When */}
          <div>
            <Overline>When</Overline>
            <Input type="date" value={when} max={todayISODate()} onChange={(e) => setWhen(e.target.value)} className="mt-2 h-10" />
          </div>
        </div>

        <div className="mt-5 flex gap-2 border-t border-border pt-4">
          <Button onClick={save} disabled={saving} className="flex-1">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Keep it"}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
