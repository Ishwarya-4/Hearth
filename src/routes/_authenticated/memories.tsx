import { createFileRoute } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppFrame } from "@/components/app-frame";
import { Overline, Skeleton } from "@/components/hearth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { MemoryDetailSheet } from "@/components/memories/memory-detail-sheet";
import { MemoriesHero, MemoryFilterBar } from "@/components/memories/memories-hero";
import { MemoriesTimeline } from "@/components/memories/memories-timeline";
import { OnThisDaySpotlight } from "@/components/memories/on-this-day-spotlight";
import { ScrapbookView } from "@/components/memories/scrapbook-view";
import { ViewSwitcher, useMemoryView } from "@/components/memories/view-switcher";
import type { Moment } from "@/components/memories/memory-card";
import type { MemoryView } from "@/components/memories/view-switcher";
import type { ProfileLike } from "@/components/calendar/user-avatar";
import { toast } from "sonner";
import {
  Heart,
  ImagePlus,
  Loader2,
  MapPin,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { MOODS, todayISODate } from "@/lib/prompts";
import { useSpace } from "@/lib/use-space";
import { uploadMemoryPhoto } from "@/lib/storage";
import { geocode } from "@/lib/geocode";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

const MapView = lazy(() => import("@/components/memories/map-view"));

export const Route = createFileRoute("/_authenticated/memories")({
  head: () => ({ meta: [{ title: "Memories — Hearth" }] }),
  component: MemoriesPage,
});

function MemoriesPage() {
  const { user } = Route.useRouteContext();
  const { space, members, profileById } = useSpace(user.id);
  const [composing, setComposing] = useState(false);
  const [view, setView] = useMemoryView();
  const [selected, setSelected] = useState<Moment | null>(null);
  const [personFilter, setPersonFilter] = useState<string | null>(null);
  const [photosOnly, setPhotosOnly] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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

  const filtered = useMemo(
    () =>
      moments.filter(
        (m) => (!personFilter || m.created_by === personFilter) && (!photosOnly || !!m.photo_url),
      ),
    [moments, personFilter, photosOnly],
  );

  const groups = useMemo(() => {
    const m = new Map<string, Moment[]>();
    filtered.forEach((mo) => {
      const arr = m.get(mo.happened_on) ?? [];
      arr.push(mo);
      m.set(mo.happened_on, arr);
    });
    return Array.from(m.entries());
  }, [filtered]);

  const onThisDay = useMemo(() => {
    const now = new Date();
    const md = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    return filtered.filter(
      (mo) =>
        mo.happened_on.slice(5) === md && Number(mo.happened_on.slice(0, 4)) < now.getFullYear(),
    );
  }, [filtered]);

  const hasMoments = moments.length > 0;
  const noResults = hasMoments && filtered.length === 0;

  const headerAction = space ? (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      {hasMoments && <ViewSwitcher view={view} onChange={setView} />}
      <Button onClick={() => setComposing(true)} className="gap-1.5 rounded-full">
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Add memory</span>
        <span className="sm:hidden">Add</span>
      </Button>
    </div>
  ) : undefined;

  return (
    <AppFrame userId={user.id} maxWidth="wide">
      {momentsQ.isLoading && (
        <div aria-busy="true" aria-label="Loading memories">
          <Skeleton className="mb-6 h-4 w-32" />
          <Skeleton className="mb-3 h-12 w-72 rounded-lg" />
          <Skeleton className="mb-8 h-5 w-96 max-w-full" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-56 rounded-2xl" />
            <Skeleton className="h-56 rounded-2xl" />
          </div>
        </div>
      )}

      {!momentsQ.isLoading && (
        <MemoriesHero
          moments={moments}
          members={members}
          spaceName={space?.name}
          action={headerAction}
        />
      )}

      {momentsQ.isSuccess && !hasMoments && (
        <PremiumEmpty onAdd={() => setComposing(true)} />
      )}

      {hasMoments && (
        <MemoryFilterBar
          members={members}
          userId={user.id}
          personFilter={personFilter}
          onPersonFilter={setPersonFilter}
          photosOnly={photosOnly}
          onPhotosOnly={setPhotosOnly}
        />
      )}

      {noResults && (
        <motion.p
          className="py-20 text-center text-caption"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          No memories match these filters.
        </motion.p>
      )}

      {hasMoments && !noResults && (
        <MemoryViewPanel
          view={view}
          mounted={mounted}
          onThisDay={onThisDay}
          groups={groups}
          filtered={filtered}
          profileById={profileById}
          onSelect={setSelected}
        />
      )}

      <MemoryDetailSheet
        moment={selected}
        who={selected ? profileById[selected.created_by] : undefined}
        onClose={() => setSelected(null)}
      />

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

function MemoryViewPanel({
  view,
  mounted,
  onThisDay,
  groups,
  filtered,
  profileById,
  onSelect,
}: {
  view: MemoryView;
  mounted: boolean;
  onThisDay: Moment[];
  groups: [string, Moment[]][];
  filtered: Moment[];
  profileById: Record<string, ProfileLike>;
  onSelect: (m: Moment) => void;
}) {
  if (view === "timeline") {
    return (
      <>
        {onThisDay.length > 0 && (
          <OnThisDaySpotlight moments={onThisDay} profileById={profileById} onSelect={onSelect} />
        )}
        <MemoriesTimeline groups={groups} profileById={profileById} onSelect={onSelect} />
      </>
    );
  }

  if (view === "scrapbook") {
    return <ScrapbookView moments={filtered} profileById={profileById} onSelect={onSelect} />;
  }

  if (!mounted) return <MapLoading />;

  return (
    <Suspense fallback={<MapLoading />}>
      <MapView moments={filtered} profileById={profileById} onSelect={onSelect} />
    </Suspense>
  );
}

function PremiumEmpty({ onAdd }: { onAdd: () => void }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className="memory-empty-state relative mx-auto max-w-lg py-16 text-center sm:py-24"
      initial={reduced ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-40 w-40 rounded-full bg-hearth/12 blur-[70px]"
      />
      <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-hearth-muted text-hearth shadow-[0_0_40px_oklch(0.52_0.18_286/0.2)]">
        <Heart className="h-7 w-7" />
      </div>
      <h2 className="font-display text-2xl font-semibold text-foreground">Nothing kept yet</h2>
      <p className="mx-auto mt-3 max-w-sm text-caption leading-relaxed">
        Save a photo, a note, or answer today&apos;s question. Everything you keep becomes part of
        your shared story.
      </p>
      <button type="button" onClick={onAdd} className="btn-glow mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium">
        <Sparkles className="h-4 w-4" />
        Add your first memory
      </button>
    </motion.div>
  );
}

function MapLoading() {
  return (
    <div className="memory-map-loading flex h-[60vh] min-h-[420px] items-center justify-center rounded-2xl">
      <Loader2 className="mr-2 h-5 w-5 animate-spin text-hearth" />
      <span className="text-caption">Loading map…</span>
    </div>
  );
}

function AddMemorySheet({
  open,
  onOpenChange,
  spaceId,
  userId,
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
  const [where, setWhere] = useState("");
  const [when, setWhen] = useState(todayISODate());
  const [saving, setSaving] = useState(false);

  function reset() {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setBody("");
    setMood(null);
    setWhere("");
    setWhen(todayISODate());
  }

  function pickFile(f: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  }

  async function save() {
    if (!file && !body.trim() && !mood && !where.trim()) {
      return toast.error("Add a photo, a few words, a feeling, or a place.");
    }
    setSaving(true);
    try {
      let photoUrl: string | null = null;
      if (file) photoUrl = await uploadMemoryPhoto(spaceId, file);

      const location = where.trim() || null;
      let lat: number | null = null;
      let lng: number | null = null;
      if (location) {
        const coords = await geocode(location);
        if (coords) {
          lat = coords.lat;
          lng = coords.lng;
        }
      }

      const { error } = await supabase.from("moments").insert({
        calendar_id: spaceId,
        created_by: userId,
        kind: "note",
        body: body.trim() || null,
        mood,
        photo_url: photoUrl,
        location,
        lat,
        lng,
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
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <SheetContent side="right" className="flex w-full flex-col gap-0 border-l-0 p-0 sm:max-w-md">
        <div className="memory-compose-header border-b border-border/40 px-6 py-5">
          <h2 className="font-display text-xl font-semibold text-foreground">Keep a memory</h2>
          <p className="mt-1 text-sm text-muted-foreground">A photo, a note, a small true thing.</p>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
          {previewUrl ? (
            <div className="relative overflow-hidden rounded-2xl">
              <img src={previewUrl} alt="Selected" className="aspect-[4/3] w-full object-cover" />
              <button
                type="button"
                onClick={() => pickFile(null)}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur transition-colors hover:bg-background"
                aria-label="Remove photo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="memory-compose-photo-drop flex w-full flex-col items-center justify-center gap-2 rounded-2xl py-10 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ImagePlus className="h-7 w-7 text-hearth" />
              <span className="text-sm font-medium">Add a photo</span>
            </button>
          )}

          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What happened? What do you want to remember?"
            rows={4}
            maxLength={1000}
            className="resize-none rounded-xl border-border/60 bg-background/60"
          />

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
                    mood === mo.key
                      ? "bg-hearth/12 text-foreground ring-1 ring-hearth/35"
                      : "bg-secondary/70 text-muted-foreground hover:bg-secondary",
                  )}
                >
                  {mo.emoji} {mo.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Overline>Where</Overline>
            <div className="relative mt-2">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={where}
                onChange={(e) => setWhere(e.target.value)}
                placeholder="Add a place, e.g. Verona, Italy"
                maxLength={120}
                className="h-10 rounded-xl border-border/60 bg-background/60 pl-9"
              />
            </div>
          </div>

          <div>
            <Overline>When</Overline>
            <Input
              type="date"
              value={when}
              max={todayISODate()}
              onChange={(e) => setWhen(e.target.value)}
              className="mt-2 h-10 rounded-xl border-border/60 bg-background/60"
            />
          </div>
        </div>

        <div className="flex gap-2 border-t border-border/40 px-6 py-4">
          <Button onClick={save} disabled={saving} className="flex-1 rounded-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Keep it"}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving} className="rounded-full">
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
