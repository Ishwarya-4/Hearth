import { Album } from "lucide-react";
import type { Collection } from "@/lib/collections";

export function CollectionCard({
  collection,
  itemCount,
  onSelect,
}: {
  collection: Collection;
  itemCount: number;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group block w-full overflow-hidden rounded-xl text-left"
    >
      <div className="aspect-square w-full overflow-hidden rounded-xl bg-hearth-muted">
        {collection.cover_url ? (
          <img
            src={collection.cover_url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-hearth">
            <Album className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="px-0.5 pt-2">
        <p className="truncate font-display text-sm font-medium text-foreground">{collection.title}</p>
        <p className="text-[11px] text-muted-foreground">
          {itemCount === 0 ? "Empty" : `${itemCount} photo${itemCount === 1 ? "" : "s"}`}
        </p>
      </div>
    </button>
  );
}
