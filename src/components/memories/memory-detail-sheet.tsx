import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { MapPin, X } from "lucide-react";
import { Overline } from "@/components/hearth";
import { UserAvatar, type ProfileLike } from "@/components/calendar/user-avatar";
import { moodMeta } from "@/lib/prompts";
import type { Moment } from "./memory-card";

export function MemoryDetailSheet({
  moment,
  who,
  onClose,
}: {
  moment: Moment | null;
  who?: ProfileLike;
  onClose: () => void;
}) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!moment) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [moment, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {moment && (
        <MemoryDetailModal
          key={moment.id}
          moment={moment}
          who={who}
          onClose={onClose}
          reduced={!!reduced}
        />
      )}
    </AnimatePresence>,
    document.body,
  );
}

function MemoryDetailModal({
  moment,
  who,
  onClose,
  reduced,
}: {
  moment: Moment;
  who?: ProfileLike;
  onClose: () => void;
  reduced: boolean;
}) {
  const mood = moodMeta(moment.mood);
  const dateLabel = new Date(moment.happened_on + "T00:00:00").toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const backdrop = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.25 },
  };

  const panel = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, scale: 0.9, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.94, y: 12 },
        transition: { type: "spring" as const, stiffness: 380, damping: 32 },
      };

  return (
    <>
      <motion.button
        type="button"
        aria-label="Close memory"
        className="memory-modal-backdrop fixed inset-0 z-[100] cursor-default"
        {...backdrop}
        onClick={onClose}
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Memory detail"
        className="memory-modal-panel fixed left-1/2 top-1/2 z-[101] flex max-h-[min(88dvh,720px)] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl sm:max-w-lg"
        {...panel}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {moment.photo_url && (
            <div className="memory-modal-photo flex items-center justify-center bg-muted/25 p-4 sm:p-5">
              <motion.img
                src={moment.photo_url}
                alt=""
                className="max-h-[min(50dvh,420px)] w-auto max-w-full object-contain"
                initial={reduced ? {} : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          )}

          <div className="space-y-4 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
            <div>
              <Overline>{dateLabel}</Overline>
              {moment.prompt_text && (
                <p className="mt-1.5 text-sm italic leading-snug text-muted-foreground">
                  {moment.prompt_text}
                </p>
              )}
            </div>

            {moment.body && (
              <p className="whitespace-pre-wrap font-display text-lg font-medium leading-snug text-foreground">
                {moment.body}
              </p>
            )}

            {moment.location && (
              <p className="inline-flex items-center gap-2 rounded-full bg-hearth-muted px-3 py-1.5 text-sm font-medium text-foreground">
                <MapPin className="h-3.5 w-3.5 text-hearth" />
                {moment.location}
              </p>
            )}

            <div className="flex items-center gap-2.5 border-t border-border/50 pt-4">
              {who && <UserAvatar profile={who} size="sm" />}
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {who?.full_name?.split(" ")[0] ?? "Someone"}
                </p>
                <p className="text-xs text-muted-foreground">Kept this memory</p>
              </div>
              {mood && (
                <span className="memory-mood-pill ml-auto text-xs" title={mood.label}>
                  {mood.emoji} {mood.label}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
