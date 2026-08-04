import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Overline } from "@/components/hearth";
import { createCollection, updateCollection, type Collection, type CoverMode } from "@/lib/collections";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

const COVER_MODES: { key: CoverMode; label: string }[] = [
  { key: "static", label: "Static image" },
  { key: "slideshow", label: "Slideshow" },
  { key: "none", label: "No cover" },
];

/** Create-or-edit sheet: pass `collection` to edit it, omit it to create a new one. */
export function CollectionFormSheet({
  open,
  onOpenChange,
  spaceId,
  userId,
  collection,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  spaceId: string;
  userId: string;
  collection?: Collection | null;
}) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const isEditing = !!collection;
  const [title, setTitle] = useState("");
  const [coverMode, setCoverMode] = useState<CoverMode>("static");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [coverRemoved, setCoverRemoved] = useState(false);
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(collection?.title ?? "");
    setCoverMode((collection?.cover_mode as CoverMode) ?? "static");
    setFile(null);
    setPreviewUrl(collection?.cover_url ?? null);
    setCoverRemoved(false);
    setDate(collection?.starts_on ?? "");
    setDescription(collection?.description ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, collection?.id]);

  function reset() {
    setTitle("");
    setCoverMode("static");
    setFile(null);
    setPreviewUrl(null);
    setCoverRemoved(false);
    setDate("");
    setDescription("");
  }

  function pickFile(f: File | null) {
    if (file && previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
    setCoverRemoved(!f);
  }

  async function save() {
    if (!title.trim()) return toast.error("Give the collection a name.");
    setSaving(true);
    try {
      if (isEditing) {
        await updateCollection(spaceId, collection!.id, {
          title,
          coverMode,
          coverFile: file,
          removeCover: coverRemoved,
          startsOn: date || null,
          endsOn: null,
          description,
        });
        toast.success("Collection updated");
      } else {
        await createCollection(spaceId, userId, {
          title,
          coverMode,
          coverFile: file,
          startsOn: date || null,
          endsOn: null,
          description,
        });
        haptic("success");
        toast.success("Collection started");
      }
      qc.invalidateQueries({ queryKey: ["collections"] });
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save that collection");
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
          <h2 className="font-display text-xl font-semibold text-foreground">
            {isEditing ? "Edit collection" : "New collection"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">A trip, a season, a running favorite.</p>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Bali 2026, Our first year…"
            maxLength={80}
            autoFocus
            className="h-10 rounded-xl border-border/60 bg-background/60"
          />

          <div>
            <Overline>Cover</Overline>
            <div className="mt-2 inline-flex rounded-full border border-border bg-secondary/60 p-1">
              {COVER_MODES.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setCoverMode(m.key)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                    coverMode === m.key ? "bg-background text-foreground shadow-elevated" : "text-muted-foreground",
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {coverMode === "slideshow" && (
            <p className="text-sm text-muted-foreground">
              The cover will cycle through this collection's own photos automatically.
            </p>
          )}

          {coverMode === "static" && (
            <>
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
                    aria-label="Remove photo"
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur transition-colors hover:bg-background"
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
                  <span className="text-sm font-medium">Add a cover photo (optional)</span>
                </button>
              )}
            </>
          )}

          <div>
            <Overline>Date (optional)</Overline>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-2 h-10 rounded-xl border-border/60 bg-background/60"
            />
          </div>

          <div>
            <Overline>Comments (optional)</Overline>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this collection about?"
              rows={3}
              maxLength={500}
              className="mt-2 resize-none rounded-xl border-border/60 bg-background/60"
            />
          </div>
        </div>

        <div className="flex gap-2 border-t border-border/40 px-6 py-4">
          <Button onClick={save} disabled={saving} className="flex-1 rounded-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : isEditing ? "Save changes" : "Start collection"}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving} className="rounded-full">
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
