import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Album } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Collection } from "@/lib/collections";

const SLIDESHOW_INTERVAL_MS = 1500;

export function CollectionCard({
  collection,
  itemCount,
  photoUrls,
  onSelect,
}: {
  collection: Collection;
  itemCount: number;
  photoUrls: string[];
  onSelect: () => void;
}) {
  const reduced = useReducedMotion();
  const isSlideshow = collection.cover_mode === "slideshow" && photoUrls.length > 0;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!isSlideshow || reduced || photoUrls.length < 2) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % photoUrls.length);
    }, SLIDESHOW_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isSlideshow, reduced, photoUrls.length]);

  const staticUrl = collection.cover_mode === "static" ? collection.cover_url : null;
  const hasCover = isSlideshow || !!staticUrl;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "memory-card memory-card--compact group block w-full overflow-hidden rounded-xl text-left",
        !hasCover && "memory-card--text",
      )}
    >
      <div
        className={cn(
          "memory-card-photo relative flex items-center justify-center overflow-hidden bg-muted/35 p-2",
          isSlideshow && "h-40",
        )}
      >
        {isSlideshow ? (
          <AnimatePresence initial={false}>
            <motion.img
              key={index}
              src={photoUrls[index]}
              alt=""
              loading="lazy"
              initial={reduced ? {} : { x: "100%" }}
              animate={{ x: 0 }}
              exit={reduced ? {} : { x: "-100%" }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-2 h-[calc(100%-1rem)] w-[calc(100%-1rem)] rounded-lg object-contain"
            />
          </AnimatePresence>
        ) : staticUrl ? (
          <img
            src={staticUrl}
            alt=""
            loading="lazy"
            className="max-h-40 w-auto max-w-full rounded-lg object-contain transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <Album className="h-8 w-8 text-hearth" />
        )}
      </div>
      <div className="px-2.5 py-2.5">
        <p className="truncate font-display text-sm font-medium text-foreground">{collection.title}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {itemCount === 0 ? "Empty" : `${itemCount} photo${itemCount === 1 ? "" : "s"}`}
        </p>
      </div>
    </button>
  );
}
