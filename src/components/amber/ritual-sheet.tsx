import { motion } from "framer-motion";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import { EmberButton } from "./ember-button";
import { MoodOrbit } from "./mood-orbit";
import { Whisper } from "./typography";

/**
 * Content staggers in after the drawer slides up — each section arrives
 * 75ms after the last, giving a sense of the compose surface assembling
 * itself around the question.
 */
const sheetStagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.075, delayChildren: 0.12 },
  },
};

const sheetItem = {
  hidden: { opacity: 0, y: 11 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function RitualSheet({
  open,
  onOpenChange,
  prompt,
  mood,
  onMoodChange,
  body,
  onBodyChange,
  onSave,
  saving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: string;
  mood: string | null;
  onMoodChange: (v: string | null) => void;
  body: string;
  onBodyChange: (v: string) => void;
  onSave: () => void;
  saving?: boolean;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[88vh] rounded-t-[28px] border-border/50 bg-background px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" aria-hidden />

        {/* Stagger wrapper — re-mounts fresh each open, so animations replay */}
        <motion.div variants={sheetStagger} initial="hidden" animate="show">
          <motion.div variants={sheetItem}>
            <DrawerHeader className="px-0 pt-4 text-left">
              <DrawerTitle className="sr-only">Answer today&apos;s question</DrawerTitle>
              <DrawerDescription asChild>
                <div>
                  <Whisper className="mb-2">your answer</Whisper>
                  <p className="text-moment text-foreground/90 line-clamp-2">{prompt}</p>
                </div>
              </DrawerDescription>
            </DrawerHeader>
          </motion.div>

          <motion.div variants={sheetItem}>
            <MoodOrbit value={mood} onChange={onMoodChange} />
          </motion.div>

          <motion.div variants={sheetItem}>
            <Textarea
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              placeholder="A line, a thought, a small true thing…"
              className="min-h-[7rem] resize-none rounded-2xl border-transparent bg-secondary/50 text-base leading-relaxed focus-visible:ring-hearth"
              maxLength={1000}
              autoFocus
            />
          </motion.div>

          <motion.div variants={sheetItem}>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Only they can see this — once you share, you&apos;ll see theirs.
            </p>
          </motion.div>

          <motion.div variants={sheetItem}>
            <div className="mt-5 flex justify-center">
              <EmberButton size="lg" loading={saving} onClick={onSave} className="w-full max-w-xs">
                Keep it
              </EmberButton>
            </div>
          </motion.div>
        </motion.div>
      </DrawerContent>
    </Drawer>
  );
}
