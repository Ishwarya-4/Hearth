import { supabase } from "@/integrations/supabase/client";

const MEMORIES_BUCKET = "memories";
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8 MB

/** Upload a memory photo into the space's folder and return its public URL. */
export async function uploadMemoryPhoto(spaceId: string, file: File): Promise<string> {
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error("That image is a bit large — keep it under 8 MB.");
  }
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${spaceId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(MEMORIES_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  return supabase.storage.from(MEMORIES_BUCKET).getPublicUrl(path).data.publicUrl;
}
