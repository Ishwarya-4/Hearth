import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, LayoutGrid, Map as MapIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type MemoryView = "timeline" | "scrapbook" | "map";

const STORAGE_KEY = "hearth.memories.view";

const VIEWS: { key: MemoryView; label: string; icon: typeof Clock }[] = [
  { key: "timeline", label: "Timeline", icon: Clock },
  { key: "scrapbook", label: "Scrapbook", icon: LayoutGrid },
  { key: "map", label: "Map", icon: MapIcon },
];

function readSavedView(): MemoryView {
  if (typeof window === "undefined") return "timeline";
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as MemoryView | null;
    if (saved && VIEWS.some((v) => v.key === saved)) return saved;
  } catch {
    /* ignore */
  }
  return "timeline";
}

/** Remembers the last view the user picked (defaults to timeline). */
export function useMemoryView() {
  const [view, setView] = useState<MemoryView>(readSavedView);

  const update = (v: MemoryView) => {
    setView(v);
    try {
      localStorage.setItem(STORAGE_KEY, v);
    } catch {
      /* ignore */
    }
  };

  return [view, update] as const;
}

export function ViewSwitcher({
  view,
  onChange,
}: {
  view: MemoryView;
  onChange: (v: MemoryView) => void;
}) {
  return (
    <div className="memory-view-switcher inline-flex items-center gap-0.5 rounded-full p-1">
      {VIEWS.map(({ key, label, icon: Icon }) => {
        const active = view === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={active}
            className={cn(
              "relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId="memory-view-pill"
                className="absolute inset-0 rounded-full bg-background/90 shadow-elevated"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <Icon className="relative h-4 w-4" strokeWidth={active ? 2.25 : 1.75} />
            <span className="relative hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
