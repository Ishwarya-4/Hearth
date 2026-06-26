import { motion, useReducedMotion } from "framer-motion";
import { MemoryCard, type Moment } from "./memory-card";
import type { ProfileLike } from "@/components/calendar/user-avatar";

/**
 * Editorial masonry: CSS columns with varied card layouts.
 * Photo memories get tall editorial crops; text memories breathe wide.
 */
export function ScrapbookView({
  moments,
  profileById,
  onSelect,
}: {
  moments: Moment[];
  profileById: Record<string, ProfileLike>;
  onSelect: (m: Moment) => void;
}) {
  const reduced = useReducedMotion();

  return (
    <div className="columns-2 gap-2.5 sm:columns-3 lg:columns-4 xl:columns-5 [column-fill:_balance]">
      {moments.map((m, i) => (
        <motion.div
          key={m.id}
          className="mb-2.5 break-inside-avoid"
          initial={reduced ? {} : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-30px" }}
          transition={{ duration: 0.5, delay: Math.min(i * 0.03, 0.2), ease: [0.16, 1, 0.3, 1] }}
        >
          <MemoryCard
            m={m}
            who={profileById[m.created_by]}
            showYear
            onSelect={onSelect}
          />
        </motion.div>
      ))}
    </div>
  );
}
