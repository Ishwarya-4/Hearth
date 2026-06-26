import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

/**
 * Shimmer variants: a diagonal light sweep that crosses left → right on hover.
 * Only the inner span moves; the button container stays still.
 */
const shimmerVariants = {
  idle: { x: "-115%" },
  hovered: {
    x: "115%",
    transition: { duration: 0.62, ease: [0.4, 0, 0.2, 1] as const },
  },
};

export function EmberButton({
  className,
  children,
  loading,
  size = "default",
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  size?: "default" | "lg" | "sm";
}) {
  const sizes = {
    sm: "h-8 px-3 text-xs",
    default: "h-10 px-4 text-sm",
    lg: "h-11 px-6 text-base",
  };

  const isDisabled = disabled || loading;

  return (
    <motion.button
      type="button"
      className={cn(
        "relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-lg font-medium",
        "bg-primary text-primary-foreground shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        sizes[size],
        className,
      )}
      disabled={isDisabled}
      initial="idle"
      // Shimmer only when interactive
      whileHover={isDisabled ? undefined : "hovered"}
      // Spring press — more physical than a flat CSS active:scale
      whileTap={isDisabled ? undefined : { scale: 0.965 }}
      transition={{ type: "spring", stiffness: 520, damping: 28 }}
      {...(rest as object)}
    >
      {/* Light sweep */}
      <motion.span
        variants={shimmerVariants}
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, oklch(1 0 0 / 0.1) 50%, transparent 100%)",
        }}
        aria-hidden
      />
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </motion.button>
  );
}

export function GhostButton({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <motion.button
      type="button"
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground",
        "transition-colors hover:bg-accent hover:text-foreground",
        className,
      )}
      whileTap={{ scale: 0.965 }}
      transition={{ type: "spring", stiffness: 520, damping: 28 }}
      {...(props as object)}
    >
      {children}
    </motion.button>
  );
}
