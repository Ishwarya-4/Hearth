import { motion, useReducedMotion } from "framer-motion";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export function Seal({
  partnerName,
  waiting,
  className,
}: {
  partnerName: string;
  waiting?: boolean;
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-muted/50 px-5 py-6 text-center",
        className,
      )}
      aria-live="polite"
    >
      <div className="relative mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-background text-muted-foreground">
        {/* Expanding ring pulse — only when partner has answered */}
        {waiting && !reduced && (
          <motion.span
            className="absolute inset-0 rounded-xl bg-hearth"
            animate={{ scale: [1, 1.6], opacity: [0.32, 0] }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeOut",
              repeatDelay: 0.8,
            }}
          />
        )}
        {/* Lock breathes softly — alive, not static */}
        <motion.span
          className="relative flex items-center justify-center"
          animate={
            reduced
              ? {}
              : { scale: [1, 1.06, 1] }
          }
          transition={{
            duration: 2.6,
            repeat: Infinity,
            ease: "easeInOut",
            repeatDelay: 1.2,
          }}
        >
          <Lock className="h-4 w-4" strokeWidth={1.75} />
        </motion.span>
      </div>
      <p className="text-sm font-medium">
        {waiting ? `${partnerName} left something` : "Sealed until you share"}
      </p>
      <p className="mx-auto mt-1.5 max-w-xs text-caption leading-relaxed">
        {waiting
          ? "Share yours first — then theirs will open."
          : `When you both answer, you'll see what ${partnerName} kept.`}
      </p>
    </div>
  );
}
