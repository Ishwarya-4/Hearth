import { Suspense, lazy, type RefObject } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const HearthHeroScene = lazy(() =>
  import("./hearth-scene").then((m) => ({ default: m.HearthHeroScene })),
);
const HearthAuthScene = lazy(() =>
  import("./hearth-scene").then((m) => ({ default: m.HearthAuthScene })),
);

/* Static CSS-only stand-in: a soft periwinkle bloom. Used as the Suspense
   fallback and as the full substitute when the user prefers reduced motion
   or WebGL is unavailable. */
function SceneFallback({ className }: { className?: string }) {
  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden", className)} aria-hidden>
      <div
        className="h-40 w-40 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.62 0.2 288 / 0.55), transparent 70%)" }}
      />
      <div
        className="absolute h-24 w-24 rounded-full blur-2xl"
        style={{ background: "radial-gradient(circle, oklch(0.7 0.16 300 / 0.5), transparent 70%)" }}
      />
    </div>
  );
}

/** Cinematic hero constellation. `progress` (0..1) drives the scroll dolly. */
export function HearthHeroCanvas({
  className,
  progress,
}: {
  className?: string;
  progress?: RefObject<number>;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <SceneFallback className={className} />;

  return (
    <div className={cn("relative", className)}>
      <Suspense fallback={<SceneFallback className="absolute inset-0" />}>
        <HearthHeroScene className="absolute inset-0" progress={progress} />
      </Suspense>
    </div>
  );
}

/** Compact constellation for the auth panel. */
export function HearthAuthCanvas({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  if (reduced) return <SceneFallback className={className} />;

  return (
    <div className={cn("relative", className)}>
      <Suspense fallback={<SceneFallback className="absolute inset-0" />}>
        <HearthAuthScene className="absolute inset-0" />
      </Suspense>
    </div>
  );
}

/* Legacy aliases kept so older imports don't break. */
export const HearthGatheringCanvas = HearthHeroCanvas;
export const HearthCoreMini = HearthAuthCanvas;
