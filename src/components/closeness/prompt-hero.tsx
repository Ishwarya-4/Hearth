import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Each word materialises from a soft blur — like the question arriving from
 * stillness, the way a morning thought surfaces. Apple "Introducing" cadence.
 */
function WordReveal({ text, className }: { text: string; className?: string }) {
  const reduced = useReducedMotion();
  const words = text.split(" ");

  if (reduced) return <p className={className}>{text}</p>;

  return (
    <p className={className}>
      {words.map((word, i) => (
        <motion.span
          // word + index avoids key collisions if two words are identical
          key={`${word}-${i}`}
          className="inline-block"
          initial={{ opacity: 0, filter: "blur(7px)", y: 5 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{
            delay: i * 0.042,
            duration: 0.58,
            ease: [0.16, 1, 0.3, 1] as const,
          }}
        >
          {word}
          {/* non-breaking space keeps words from collapsing together */}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </p>
  );
}

export function PromptHero({
  prompt,
  onTap,
  answered,
  className,
}: {
  prompt: string;
  onTap?: () => void;
  answered?: boolean;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const interactive = !answered && onTap;
  const wordCount = prompt.split(" ").length;

  return (
    <div className={cn("mt-4", className)}>
      <button
        type="button"
        onClick={interactive ? onTap : undefined}
        disabled={!interactive}
        className={cn(
          "block w-full text-left transition-opacity",
          interactive && "cursor-pointer hover:opacity-80 active:opacity-70",
          !interactive && "cursor-default",
        )}
      >
        <WordReveal text={prompt} className="text-prompt text-foreground text-balance" />
        {interactive && (
          <motion.p
            className="mt-3 text-sm font-medium text-hearth"
            initial={reduced ? {} : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            // Wait for the last word to land before the CTA appears
            transition={{ delay: wordCount * 0.042 + 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
          >
            Tap to answer
          </motion.p>
        )}
        {answered && (
          <p className="mt-3 text-caption">You shared today</p>
        )}
      </button>
    </div>
  );
}
