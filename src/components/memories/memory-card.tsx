import { motion, useReducedMotion } from "framer-motion";
import { UserAvatar, type ProfileLike } from "@/components/calendar/user-avatar";
import { moodMeta } from "@/lib/prompts";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

export type Moment = Database["public"]["Tables"]["moments"]["Row"];

function trackSpotlight(e: React.MouseEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - r.left}px`);
  el.style.setProperty("--my", `${e.clientY - r.top}px`);
}

export function MemoryCard({
  m,
  who,
  showYear,
  onSelect,
}: {
  m: Moment;
  who?: ProfileLike;
  showYear?: boolean;
  onSelect?: (m: Moment) => void;
}) {
  const reduced = useReducedMotion();
  const mood = moodMeta(m.mood);
  const year = m.happened_on.slice(0, 4);
  const hasPhoto = !!m.photo_url;
  const isTextOnly = !hasPhoto;
  const interactive = !!onSelect;
  const preview = m.body || m.prompt_text;

  const card = (
    <article
      onMouseMove={trackSpotlight}
      className={cn(
        "memory-card memory-card--compact spotlight-card group relative overflow-hidden rounded-xl",
        interactive && "cursor-pointer",
        isTextOnly && "memory-card--text",
      )}
      {...(interactive
        ? {
            role: "button" as const,
            tabIndex: 0,
            onClick: () => onSelect!(m),
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect!(m);
              }
            },
          }
        : {})}
    >
      {hasPhoto && (
        <div className="memory-card-photo flex items-center justify-center bg-muted/35 p-2">
          <img
            src={m.photo_url!}
            alt=""
            loading="lazy"
            className="max-h-28 w-auto max-w-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        </div>
      )}

      <div className={cn("relative", hasPhoto ? "px-2.5 pb-2.5 pt-2" : "p-3")}>
        {preview && (
          <p
            className={cn(
              "line-clamp-2 leading-snug text-foreground",
              isTextOnly ? "font-display text-sm font-medium" : "text-xs",
            )}
          >
            {preview}
          </p>
        )}

        <div className={cn("flex items-center gap-1.5", preview && "mt-2")}>
          {who && <UserAvatar profile={who} size="xs" />}
          <span className="min-w-0 truncate text-[11px] font-medium text-muted-foreground">
            {who?.full_name?.split(" ")[0] ?? "Someone"}
          </span>
          {showYear && (
            <span className="shrink-0 text-[11px] text-muted-foreground/70">· {year}</span>
          )}
          {mood && (
            <span className="memory-mood-pill ml-auto shrink-0 px-1.5 py-0.5 text-[11px]" title={mood.label}>
              {mood.emoji}
            </span>
          )}
        </div>
      </div>
    </article>
  );

  if (reduced) return card;

  return (
    <motion.div
      whileHover={interactive ? { y: -2, scale: 1.01 } : undefined}
      whileTap={interactive ? { scale: 0.98 } : undefined}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
    >
      {card}
    </motion.div>
  );
}
