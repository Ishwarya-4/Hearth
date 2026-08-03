import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { ChevronLeft, ImagePlus, Loader2, Pencil, Trash2, X } from "lucide-react";
import { MemoryCard, type Moment } from "./memory-card";
import type { ProfileLike } from "@/components/calendar/user-avatar";
import { EmptyState } from "@/components/hearth";
import {
  addStandalonePhotoToCollection,
  removeCollectionItem,
  removeMomentFromCollection,
  type Collection,
  type CollectionItem,
} from "@/lib/collections";

export function CollectionDetail({
  collection,
  items,
  momentById,
  profileById,
  spaceId,
  userId,
  onBack,
  onDeleteCollection,
  onEdit,
  onSelectMoment,
  onChanged,
}: {
  collection: Collection;
  items: CollectionItem[];
  momentById: Record<string, Moment>;
  profileById: Record<string, ProfileLike>;
  spaceId: string;
  userId: string;
  onBack: () => void;
  onDeleteCollection: () => void;
  onEdit: () => void;
  onSelectMoment: (m: Moment) => void;
  onChanged: () => void;
}) {
  const reduced = useReducedMotion();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<CollectionItem | null>(null);

  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  async function pickFiles(fileList: FileList | null) {
    const files = fileList ? Array.from(fileList) : [];
    if (files.length === 0) return;
    setUploading(true);
    let failed = 0;
    for (const file of files) {
      try {
        await addStandalonePhotoToCollection(spaceId, collection.id, userId, file);
      } catch {
        failed++;
      }
    }
    onChanged();
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (failed > 0) {
      toast.error(
        failed === files.length
          ? "Couldn't add those photos"
          : `${failed} photo${failed === 1 ? "" : "s"} didn't upload`,
      );
    }
  }

  async function removeLinked(momentId: string) {
    try {
      await removeMomentFromCollection(collection.id, momentId);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't remove that");
    }
  }

  async function removeStandalone(itemId: string) {
    try {
      await removeCollectionItem(itemId, collection.id);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't remove that");
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to collections"
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">{collection.title}</h2>
            <p className="text-caption">
              {items.length === 0 ? "Empty" : `${items.length} photo${items.length === 1 ? "" : "s"}`}
              {collection.starts_on ? ` · ${collection.starts_on}` : ""}
            </p>
            {collection.description && (
              <p className="mt-1.5 max-w-md whitespace-pre-wrap text-sm text-foreground">
                {collection.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => pickFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label="Add photos"
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground opacity-60 transition-colors hover:bg-muted hover:text-hearth disabled:opacity-40"
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={onEdit}
            aria-label="Edit collection"
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground opacity-60 transition-colors hover:bg-muted hover:text-foreground"
          >
            <Pencil className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onDeleteCollection}
            aria-label="Delete collection"
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground opacity-60 transition-colors hover:bg-muted hover:text-destructive"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<ImagePlus className="h-6 w-6" />}
          title="Nothing added here yet"
          description="Drop in a photo made just for this collection, or open any memory in your archive and add it here."
        />
      ) : (
        <div className="columns-2 gap-2.5 sm:columns-3 lg:columns-4 [column-fill:_balance]">
          {items.map((item, i) => {
            const moment = item.moment_id ? momentById[item.moment_id] : null;
            if (item.moment_id && !moment) return null;
            return (
              <motion.div
                key={item.id}
                className="group relative mb-2.5 break-inside-avoid"
                initial={reduced ? {} : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5, delay: Math.min(i * 0.03, 0.2), ease: [0.16, 1, 0.3, 1] }}
              >
                {moment ? (
                  <MemoryCard m={moment} who={profileById[moment.created_by]} onSelect={onSelectMoment} />
                ) : (
                  <button
                    type="button"
                    onClick={() => setLightbox(item)}
                    className="block w-full overflow-hidden rounded-xl"
                  >
                    <img
                      src={item.photo_url!}
                      alt={item.caption ?? ""}
                      loading="lazy"
                      className="w-full object-cover"
                    />
                    {item.caption && (
                      <p className="mt-1.5 line-clamp-2 px-0.5 text-xs text-muted-foreground">{item.caption}</p>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (moment) removeLinked(moment.id);
                    else removeStandalone(item.id);
                  }}
                  aria-label="Remove from collection"
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-muted-foreground opacity-0 backdrop-blur transition-opacity hover:text-destructive group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 p-6 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur-md"
          >
            <X className="h-4 w-4" />
          </button>
          <img
            src={lightbox.photo_url!}
            alt={lightbox.caption ?? ""}
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
