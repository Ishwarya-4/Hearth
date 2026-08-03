import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Album, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Overline } from "@/components/hearth";
import {
  addMomentToCollection,
  createCollection,
  removeMomentFromCollection,
  type Collection,
} from "@/lib/collections";
import type { Moment } from "./memory-card";

export function AddToCollectionMenu({
  moment,
  collections,
  spaceId,
  userId,
}: {
  moment: Moment;
  collections: Collection[];
  spaceId: string;
  userId: string;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  const membershipQ = useQuery({
    queryKey: ["collection-items-for-moment", moment.id],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collection_items")
        .select("collection_id")
        .eq("moment_id", moment.id);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.collection_id));
    },
  });

  const memberOf = membershipQ.data ?? new Set<string>();

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["collection-items-for-moment", moment.id] });
    qc.invalidateQueries({ queryKey: ["collections"] });
    qc.invalidateQueries({ queryKey: ["collection-items"] });
  }

  async function toggle(collectionId: string, checked: boolean) {
    setPending(collectionId);
    try {
      if (checked) {
        await addMomentToCollection(collectionId, userId, moment.id, moment.photo_url);
      } else {
        await removeMomentFromCollection(collectionId, moment.id);
      }
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update that collection");
    } finally {
      setPending(null);
    }
  }

  async function quickCreate() {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const id = await createCollection(spaceId, userId, { title: newTitle });
      await addMomentToCollection(id, userId, moment.id, moment.photo_url);
      setNewTitle("");
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't start that collection");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Add to collection" className="h-8 w-8 rounded-full">
          <Album className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 rounded-xl p-3">
        <Overline>Add to collection</Overline>
        <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
          {collections.length === 0 && (
            <p className="py-2 text-xs text-muted-foreground">Not in any collection yet.</p>
          )}
          {collections.map((c) => (
            <label
              key={c.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1.5 hover:bg-accent/50"
            >
              <Checkbox
                checked={memberOf.has(c.id)}
                disabled={pending === c.id}
                onCheckedChange={(v) => toggle(c.id, v === true)}
              />
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">{c.title}</span>
            </label>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-1.5 border-t border-border/40 pt-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && quickCreate()}
            placeholder="New collection…"
            maxLength={80}
            className="h-8 flex-1 rounded-lg text-sm"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={quickCreate}
            disabled={!newTitle.trim() || creating}
            aria-label="Create collection"
            className="h-8 w-8 shrink-0"
          >
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Album className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
