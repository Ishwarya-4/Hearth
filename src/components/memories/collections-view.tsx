import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Album, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/hearth";
import { Button } from "@/components/ui/button";
import { CollectionCard } from "./collection-card";
import { CollectionDetail } from "./collection-detail";
import type { Moment } from "./memory-card";
import type { ProfileLike } from "@/components/calendar/user-avatar";
import { deleteCollection, type Collection, type CollectionItem } from "@/lib/collections";

export function CollectionsView({
  collections,
  momentById,
  profileById,
  spaceId,
  userId,
  onSelectMoment,
  openCollectionId,
  onOpenCollectionChange,
  onCreateCollection,
  onEditCollection,
}: {
  collections: Collection[];
  momentById: Record<string, Moment>;
  profileById: Record<string, ProfileLike>;
  spaceId: string;
  userId: string;
  onSelectMoment: (m: Moment) => void;
  openCollectionId: string | null;
  onOpenCollectionChange: (id: string | null) => void;
  onCreateCollection: () => void;
  onEditCollection: (c: Collection) => void;
}) {
  const qc = useQueryClient();
  const collectionIds = useMemo(() => collections.map((c) => c.id), [collections]);

  const itemsQ = useQuery({
    queryKey: ["collection-items", collectionIds.join(",")],
    enabled: collectionIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collection_items")
        .select("*")
        .in("collection_id", collectionIds)
        .order("position");
      if (error) throw error;
      return data as CollectionItem[];
    },
  });

  const itemsByCollection = useMemo(() => {
    const m: Record<string, CollectionItem[]> = {};
    (itemsQ.data ?? []).forEach((it) => {
      (m[it.collection_id] ??= []).push(it);
    });
    return m;
  }, [itemsQ.data]);

  const openCollection = collections.find((c) => c.id === openCollectionId) ?? null;

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["collections"] });
    qc.invalidateQueries({ queryKey: ["collection-items"] });
  }

  async function handleDelete(id: string) {
    try {
      await deleteCollection(id);
      onOpenCollectionChange(null);
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete that collection");
    }
  }

  if (openCollection) {
    return (
      <CollectionDetail
        collection={openCollection}
        items={itemsByCollection[openCollection.id] ?? []}
        momentById={momentById}
        profileById={profileById}
        spaceId={spaceId}
        userId={userId}
        onBack={() => onOpenCollectionChange(null)}
        onDeleteCollection={() => handleDelete(openCollection.id)}
        onEdit={() => onEditCollection(openCollection)}
        onSelectMoment={onSelectMoment}
        onChanged={invalidate}
      />
    );
  }

  if (collections.length === 0) {
    return (
      <EmptyState
        icon={<Album className="h-6 w-6" />}
        title="No collections yet"
        description="Group the photos that belong together — a trip, a season, a running favorite — into one place you can return to."
        action={
          <Button onClick={onCreateCollection}>
            <Plus className="h-4 w-4" />
            Start a collection
          </Button>
        }
      />
    );
  }

  return (
    <div className="columns-2 gap-2.5 sm:columns-3 lg:columns-4 xl:columns-5 [column-fill:_balance]">
      {collections.map((c) => (
        <div key={c.id} className="mb-2.5 break-inside-avoid">
          <CollectionCard
            collection={c}
            itemCount={(itemsByCollection[c.id] ?? []).length}
            onSelect={() => onOpenCollectionChange(c.id)}
          />
        </div>
      ))}
    </div>
  );
}
