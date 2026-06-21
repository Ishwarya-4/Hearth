import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { toLocalInput, fromLocalInput, EVENT_COLORS, RECURRENCE_OPTIONS, type Recurrence } from "@/lib/calendar-utils";
import { Trash2, Loader2, MapPin, Repeat, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type DeleteScope = "one" | "all";

export type EventDraft = {
  id?: string;
  calendar_id: string;
  title: string;
  description: string;
  location: string;
  start_at: string; // ISO
  end_at: string;
  all_day: boolean;
  color: string | null;
  reminder_minutes: number | null;
  recurrence: Recurrence;
  recurrence_until: string | null; // ISO date or null
  recurrence_exdates: string[];
  occurrence_date?: string | null; // the clicked occurrence (for single-occurrence delete)
};

export type CalendarOption = { id: string; name: string; color: string };

export function EventDialog({
  open,
  onOpenChange,
  initial,
  calendars,
  onSave,
  onDelete,
  saving,
  canEdit = true,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: EventDraft;
  calendars: CalendarOption[];
  onSave: (draft: EventDraft) => void;
  onDelete?: (scope: DeleteScope) => void;
  saving?: boolean;
  canEdit?: boolean;
}) {
  const [draft, setDraft] = useState<EventDraft>(initial);
  useEffect(() => setDraft(initial), [initial, open]);

  const update = <K extends keyof EventDraft>(k: K, v: EventDraft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const isRecurring = draft.recurrence !== "none";
  const isExistingRecurring = !!initial.id && initial.recurrence !== "none";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{initial.id ? "Edit event" : "New event"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={draft.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Coffee with Sam"
              maxLength={200}
              disabled={!canEdit}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Calendar</Label>
              <Select value={draft.calendar_id} onValueChange={(v) => update("calendar_id", v)} disabled={!canEdit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {calendars.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {EVENT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`color ${c}`}
                    className={cn(
                      "h-6 w-6 rounded-full border-2 transition-transform",
                      draft.color === c ? "border-foreground scale-110" : "border-transparent",
                    )}
                    style={{ background: c }}
                    onClick={() => update("color", c)}
                    disabled={!canEdit}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="allday" className="cursor-pointer">All day</Label>
            <Switch id="allday" checked={draft.all_day} onCheckedChange={(v) => update("all_day", v)} disabled={!canEdit} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="start">Starts</Label>
              <Input
                id="start"
                type="datetime-local"
                value={toLocalInput(draft.start_at)}
                onChange={(e) => update("start_at", fromLocalInput(e.target.value))}
                disabled={!canEdit}
              />
            </div>
            <div>
              <Label htmlFor="end">Ends</Label>
              <Input
                id="end"
                type="datetime-local"
                value={toLocalInput(draft.end_at)}
                onChange={(e) => update("end_at", fromLocalInput(e.target.value))}
                disabled={!canEdit}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="loc"><span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />Location</span></Label>
            <Input id="loc" value={draft.location} onChange={(e) => update("location", e.target.value)} maxLength={200} disabled={!canEdit} />
          </div>

          <div>
            <Label htmlFor="desc">Notes</Label>
            <Textarea id="desc" value={draft.description} onChange={(e) => update("description", e.target.value)} rows={3} maxLength={1000} disabled={!canEdit} />
          </div>

          <div>
            <Label>Reminder</Label>
            <Select
              value={draft.reminder_minutes === null ? "none" : String(draft.reminder_minutes)}
              onValueChange={(v) => update("reminder_minutes", v === "none" ? null : Number(v))}
              disabled={!canEdit}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="5">5 minutes before</SelectItem>
                <SelectItem value="15">15 minutes before</SelectItem>
                <SelectItem value="30">30 minutes before</SelectItem>
                <SelectItem value="60">1 hour before</SelectItem>
                <SelectItem value="1440">1 day before</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label><span className="inline-flex items-center gap-1"><Repeat className="h-3.5 w-3.5" />Repeat</span></Label>
              <Select
                value={draft.recurrence}
                onValueChange={(v) => update("recurrence", v as Recurrence)}
                disabled={!canEdit}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RECURRENCE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isRecurring && (
              <div>
                <Label htmlFor="until">Repeat until</Label>
                <Input
                  id="until"
                  type="date"
                  value={draft.recurrence_until ? toLocalInput(draft.recurrence_until).slice(0, 10) : ""}
                  onChange={(e) =>
                    update("recurrence_until", e.target.value ? new Date(e.target.value + "T23:59:59").toISOString() : null)
                  }
                  disabled={!canEdit}
                />
                <p className="text-[11px] text-muted-foreground mt-1">Leave empty to repeat forever.</p>
              </div>
            )}
          </div>

          {isExistingRecurring && (
            <p className="text-[11px] text-muted-foreground -mt-1">
              This is a repeating event. Saving changes applies to the whole series.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2 flex-row justify-between sm:justify-between">
          <div>
            {initial.id && onDelete && canEdit && (
              isExistingRecurring ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4 mr-1.5" />Delete<ChevronDown className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onSelect={() => onDelete("one")}>This occurrence</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onDelete("all")}>All events in the series</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onDelete("all")}>
                  <Trash2 className="h-4 w-4 mr-1.5" />Delete
                </Button>
              )
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            {canEdit && (
              <Button onClick={() => onSave(draft)} disabled={saving || !draft.title.trim()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : initial.id ? "Save" : "Create"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
