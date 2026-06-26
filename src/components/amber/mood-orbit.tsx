import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MOODS } from "@/lib/prompts";
import { cn } from "@/lib/utils";
import { Whisper } from "./typography";

/** Feelings arranged on a soft arc — physics selection, emoji bounce, de-emphasis. */
export function MoodOrbit({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const reduced = useReducedMotion();
  const anySelected = value !== null;

  return (
    <div className="relative pt-2 pb-4">
      <Whisper className="mb-4 text-center">how does it feel?</Whisper>
      <div className="flex flex-wrap justify-center gap-2">
        {MOODS.map((m) => {
          const selected = value === m.key;
          const deemphasized = anySelected && !selected;

          return (
            <motion.button
              key={m.key}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(selected ? null : m.key)}
              className={cn(
                "relative flex h-14 min-w-[4.5rem] flex-col items-center justify-center gap-0.5 rounded-2xl px-3",
                selected
                  ? "bg-hearth/12 text-foreground"
                  : "bg-secondary/80 text-muted-foreground hover:bg-secondary",
              )}
              // Physics: selected springs up and scales, de-emphasized pull back
              animate={
                reduced
                  ? {}
                  : {
                      scale: selected ? 1.07 : deemphasized ? 0.95 : 1,
                      opacity: deemphasized ? 0.55 : 1,
                      y: selected ? -3 : 0,
                    }
              }
              whileTap={reduced ? {} : { scale: 0.93 }}
              transition={{ type: "spring", stiffness: 420, damping: 26 }}
            >
              {/* Selection ring draws in from 0 scale */}
              <AnimatePresence>
                {selected && (
                  <motion.span
                    className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-hearth/45"
                    initial={{ opacity: 0, scale: 0.82 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 500, damping: 28 }}
                  />
                )}
              </AnimatePresence>

              {/* Emoji bounces with wiggle on selection — kinetic delight */}
              <motion.span
                className="text-lg leading-none"
                aria-hidden
                animate={
                  reduced
                    ? {}
                    : selected
                    ? {
                        scale: [1, 1.4, 0.92, 1.1, 1],
                        rotate: [0, -8, 6, -3, 0],
                      }
                    : { scale: 1, rotate: 0 }
                }
                transition={
                  selected
                    ? { duration: 0.48, ease: "easeOut" }
                    : { type: "spring", stiffness: 400, damping: 25 }
                }
              >
                {m.emoji}
              </motion.span>
              <span className="text-[10px] font-medium">{m.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
