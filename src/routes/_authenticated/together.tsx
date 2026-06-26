import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppFrame } from "@/components/app-frame";
import { Panel, Overline, PageHeader, EmptyState, Skeleton } from "@/components/hearth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CalendarPlus, Check, ListChecks, Plus, Sparkles, Trash2, X } from "lucide-react";
import { useSpace } from "@/lib/use-space";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type List = Database["public"]["Tables"]["lists"]["Row"];
type ListItem = Database["public"]["Tables"]["list_items"]["Row"];

export const Route = createFileRoute("/_authenticated/together")({
  head: () => ({ meta: [{ title: "Together — Hearth" }] }),
  component: TogetherPage,
});

function TogetherPage() {
  const { user } = Route.useRouteContext();
  const { space } = useSpace(user.id);
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);

  const listsQ = useQuery({
    queryKey: ["lists", space?.id],
    enabled: !!space,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lists")
        .select("*")
        .eq("calendar_id", space!.id)
        .order("created_at");
      if (error) throw error;
      return data as List[];
    },
  });
  const lists = listsQ.data ?? [];
  const listIds = useMemo(() => lists.map((l) => l.id), [lists]);

  const itemsQ = useQuery({
    queryKey: ["list-items", listIds.join(",")],
    enabled: listIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("list_items")
        .select("*")
        .in("list_id", listIds)
        .order("position")
        .order("created_at");
      if (error) throw error;
      return data as ListItem[];
    },
  });
  const itemsByList = useMemo(() => {
    const m: Record<string, ListItem[]> = {};
    (itemsQ.data ?? []).forEach((it) => { (m[it.list_id] ??= []).push(it); });
    return m;
  }, [itemsQ.data]);

  async function createList(title: string, kind: "list" | "bucket") {
    if (!space) return;
    const { error } = await supabase.from("lists").insert({
      calendar_id: space.id, created_by: user.id, title: title.trim(), kind,
    });
    if (error) return toast.error(error.message);
    haptic("success");
    setCreating(false);
    qc.invalidateQueries({ queryKey: ["lists"] });
  }

  async function deleteList(id: string) {
    const { error } = await supabase.from("lists").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["lists"] });
    qc.invalidateQueries({ queryKey: ["list-items"] });
  }

  async function addItem(listId: string, body: string) {
    const { error } = await supabase.from("list_items").insert({
      list_id: listId, created_by: user.id, body: body.trim(), position: Date.now(),
    });
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["list-items"] });
  }

  async function toggleItem(it: ListItem) {
    const next = !it.done;
    const { error } = await supabase
      .from("list_items")
      .update({ done: next, done_by: next ? user.id : null })
      .eq("id", it.id);
    if (error) return toast.error(error.message);
    if (next) haptic("success");
    qc.invalidateQueries({ queryKey: ["list-items"] });
  }

  async function deleteItem(id: string) {
    const { error } = await supabase.from("list_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["list-items"] });
  }

  const isEmpty = listsQ.isSuccess && lists.length === 0;

  return (
    <AppFrame userId={user.id}>
      <PageHeader
        title="Together"
        description="Shared lists for the little logistics and the big dreams."
        action={space ? <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" />New list</Button> : undefined}
      />

      {listsQ.isLoading && (
        <div className="grid items-start gap-4 sm:grid-cols-2" aria-busy="true">
          <Skeleton className="h-52 rounded-xl" />
          <Skeleton className="h-52 rounded-xl" />
        </div>
      )}

      {isEmpty && !creating && (
        <EmptyState
          icon={<ListChecks className="h-6 w-6" />}
          title="Start something together"
          description="A bucket list of dreams, a packing list for the trip, a running list of gift ideas — keep them all here."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button size="lg" onClick={() => createList("Bucket list", "bucket")}>
                <Sparkles className="h-4 w-4" />Start a bucket list
              </Button>
              <Button size="lg" variant="outline" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" />New list
              </Button>
            </div>
          }
        />
      )}

      {creating && (
        <div className="mb-6">
          <NewListForm onCreate={createList} onCancel={() => setCreating(false)} />
        </div>
      )}

      <div className="grid items-start gap-4 sm:grid-cols-2">
        {lists.map((list) => (
          <ListCard
            key={list.id}
            list={list}
            items={itemsByList[list.id] ?? []}
            onAdd={(body) => addItem(list.id, body)}
            onToggle={toggleItem}
            onDeleteItem={deleteItem}
            onDeleteList={() => deleteList(list.id)}
          />
        ))}
      </div>
    </AppFrame>
  );
}

function NewListForm({ onCreate, onCancel }: { onCreate: (title: string, kind: "list" | "bucket") => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<"list" | "bucket">("list");
  return (
    <Panel raised className="p-5">
      <Overline>New list</Overline>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Packing for Italy, Gift ideas…"
          maxLength={80}
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && title.trim() && onCreate(title, kind)}
          className="flex-1"
        />
        <div className="inline-flex rounded-full border border-border bg-secondary/60 p-1">
          {(["list", "bucket"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                kind === k ? "bg-background text-foreground shadow-elevated" : "text-muted-foreground",
              )}
            >
              {k === "bucket" ? "Bucket list" : "List"}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={() => title.trim() && onCreate(title, kind)} disabled={!title.trim()}>Create</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </Panel>
  );
}

function ListCard({
  list, items, onAdd, onToggle, onDeleteItem, onDeleteList,
}: {
  list: List;
  items: ListItem[];
  onAdd: (body: string) => void;
  onToggle: (it: ListItem) => void;
  onDeleteItem: (id: string) => void;
  onDeleteList: () => void;
}) {
  const [draft, setDraft] = useState("");
  const isBucket = list.kind === "bucket";
  const done = items.filter((i) => i.done).length;

  function submit() {
    if (!draft.trim()) return;
    onAdd(draft);
    setDraft("");
  }

  return (
    <Panel className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", isBucket ? "bg-hearth-muted text-hearth" : "bg-muted text-muted-foreground")}>
            {isBucket ? <Sparkles className="h-4 w-4" /> : <ListChecks className="h-4 w-4" />}
          </span>
          <div>
            <h2 className="text-title leading-tight">{list.title}</h2>
            <p className="text-caption">{items.length === 0 ? "Empty" : `${done} of ${items.length} done`}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDeleteList}
          aria-label="Delete list"
          className="rounded-md p-1.5 text-muted-foreground opacity-60 transition-colors hover:bg-muted hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <ul className="mt-4 space-y-1">
        {items.map((it) => (
          <li key={it.id} className="group flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 hover:bg-accent/50">
            <button
              type="button"
              onClick={() => onToggle(it)}
              aria-pressed={it.done}
              aria-label={it.done ? "Mark not done" : "Mark done"}
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                it.done ? "border-hearth bg-hearth text-primary-foreground" : "border-muted-foreground/40 hover:border-hearth",
              )}
            >
              {it.done && <Check className="h-3 w-3" strokeWidth={3} />}
            </button>
            <span className={cn("flex-1 text-sm", it.done && "text-muted-foreground line-through")}>{it.body}</span>
            {isBucket && !it.done && (
              <Link
                to="/calendar"
                search={{ new: "ahead", title: it.body }}
                aria-label="Plan it"
                className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:text-hearth group-hover:opacity-100"
                title="Plan it on the calendar"
              >
                <CalendarPlus className="h-3.5 w-3.5" />
              </Link>
            )}
            <button
              type="button"
              onClick={() => onDeleteItem(it.id)}
              aria-label="Remove"
              className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={isBucket ? "Add a dream…" : "Add an item…"}
          maxLength={200}
          className="h-9"
        />
        <Button size="icon" variant="ghost" onClick={submit} disabled={!draft.trim()} aria-label="Add" className="h-9 w-9 shrink-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </Panel>
  );
}
