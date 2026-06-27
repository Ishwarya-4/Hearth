import { Sparkles } from "lucide-react";
import { Overline } from "@/components/hearth";
import { MemoryCard, type Moment } from "./memory-card";
import type { ProfileLike } from "@/components/calendar/user-avatar";

export function OnThisDaySpotlight({
  moments,
  profileById,
  onSelect,
}: {
  moments: Moment[];
  profileById: Record<string, ProfileLike>;
  onSelect: (m: Moment) => void;
}) {
  if (moments.length === 0) return null;

  const now = new Date();
  const dayLabel = now.toLocaleDateString([], { month: "long", day: "numeric" });

  return (
    <section className="mb-10 sm:mb-12">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-hearth-muted text-hearth">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <div>
          <Overline>On this day</Overline>
          <p className="text-xs text-muted-foreground">
            {moments.length} from past {dayLabel}s
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {moments.map((m) => (
          <MemoryCard
            key={`otd-${m.id}`}
            m={m}
            who={profileById[m.created_by]}
            showYear
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}
