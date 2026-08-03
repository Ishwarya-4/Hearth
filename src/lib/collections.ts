import { supabase } from "@/integrations/supabase/client";
import { uploadMemoryPhoto } from "@/lib/storage";
import type { Database } from "@/integrations/supabase/types";

export type Collection = Database["public"]["Tables"]["collections"]["Row"];
export type CollectionItem = Database["public"]["Tables"]["collection_items"]["Row"];

export async function createCollection(
  spaceId: string,
  userId: string,
  opts: {
    title: string;
    coverFile?: File | null;
    startsOn?: string | null;
    endsOn?: string | null;
    description?: string | null;
  },
): Promise<string> {
  const coverUrl = opts.coverFile ? await uploadMemoryPhoto(spaceId, opts.coverFile) : null;
  const { data, error } = await supabase
    .from("collections")
    .insert({
      calendar_id: spaceId,
      created_by: userId,
      title: opts.title.trim(),
      cover_url: coverUrl,
      starts_on: opts.startsOn || null,
      ends_on: opts.endsOn || null,
      description: opts.description?.trim() || null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function deleteCollection(id: string): Promise<void> {
  const { error } = await supabase.from("collections").delete().eq("id", id);
  if (error) throw error;
}

export async function updateCollection(
  spaceId: string,
  collectionId: string,
  opts: {
    title: string;
    coverFile?: File | null;
    removeCover?: boolean;
    startsOn?: string | null;
    endsOn?: string | null;
    description?: string | null;
  },
): Promise<void> {
  const patch: Database["public"]["Tables"]["collections"]["Update"] = {
    title: opts.title.trim(),
    starts_on: opts.startsOn || null,
    ends_on: opts.endsOn || null,
    description: opts.description?.trim() || null,
  };
  if (opts.coverFile) {
    patch.cover_url = await uploadMemoryPhoto(spaceId, opts.coverFile);
  } else if (opts.removeCover) {
    patch.cover_url = null;
  }
  const { error } = await supabase.from("collections").update(patch).eq("id", collectionId);
  if (error) throw error;
}

/** Sets the collection's cover to `photoUrl` only if it doesn't have one yet, and always touches updated_at. */
async function bumpCoverIfEmpty(collectionId: string, photoUrl: string | null) {
  const patch: { cover_url?: string; updated_at: string } = { updated_at: new Date().toISOString() };
  if (photoUrl) {
    const { data: collection } = await supabase
      .from("collections")
      .select("cover_url")
      .eq("id", collectionId)
      .single();
    if (!collection?.cover_url) patch.cover_url = photoUrl;
  }
  const { error } = await supabase.from("collections").update(patch).eq("id", collectionId);
  if (error) throw error;
}

export async function addMomentToCollection(
  collectionId: string,
  userId: string,
  momentId: string,
  momentPhotoUrl: string | null,
): Promise<void> {
  const { error } = await supabase.from("collection_items").insert({
    collection_id: collectionId,
    created_by: userId,
    moment_id: momentId,
    position: Date.now(),
  });
  if (error) throw error;
  await bumpCoverIfEmpty(collectionId, momentPhotoUrl);
}

export async function removeMomentFromCollection(collectionId: string, momentId: string): Promise<void> {
  const { error } = await supabase
    .from("collection_items")
    .delete()
    .eq("collection_id", collectionId)
    .eq("moment_id", momentId);
  if (error) throw error;
}

export async function addStandalonePhotoToCollection(
  spaceId: string,
  collectionId: string,
  userId: string,
  file: File,
  caption?: string | null,
): Promise<void> {
  const photoUrl = await uploadMemoryPhoto(spaceId, file);
  const { error } = await supabase.from("collection_items").insert({
    collection_id: collectionId,
    created_by: userId,
    photo_url: photoUrl,
    caption: caption?.trim() || null,
    position: Date.now(),
  });
  if (error) throw error;
  await bumpCoverIfEmpty(collectionId, photoUrl);
}

export async function removeCollectionItem(itemId: string, collectionId: string): Promise<void> {
  const { error } = await supabase
    .from("collection_items")
    .delete()
    .eq("id", itemId)
    .eq("collection_id", collectionId);
  if (error) throw error;
}
