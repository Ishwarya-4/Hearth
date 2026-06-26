import { motion, useReducedMotion } from "framer-motion";
import { UserAvatar, type ProfileLike } from "@/components/calendar/user-avatar";
import { moodMeta, promptByKey } from "@/lib/prompts";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type Moment = Database["public"]["Tables"]["moments"]["Row"];

/**
 * Unfolds from the top — like an envelope opening. The content settles from
 * a slight blur and scaleY collapse, origin pinned at the top edge.
 */
const unfold = {
  hidden: {
    opacity: 0,
    scaleY: 0.93,
    filter: "blur(3px)",
    y: -6,
  },
  show: {
    opacity: 1,
    scaleY: 1,
    filter: "blur(0px)",
    y: 0,
    transition: {
      duration: 0.52,
      ease: [0.16, 1, 0.3, 1],
      opacity: { duration: 0.32 },
    },
  },
};

export function MomentReveal({
  moment,
  who,
  faded,
  animate = true,
}: {
  moment: Moment;
  who?: ProfileLike;
  faded?: boolean;
  animate?: boolean;
}) {
  const reduced = useReducedMotion();
  const mood = moodMeta(moment.mood);
  const prompt = promptByKey(moment.prompt_key)?.text ?? moment.prompt_text;
  const name = who?.full_name?.split(" ")[0] || "Someone";

  const body = (
    <div className={cn(faded && "opacity-70")}>
      <div className="flex items-center gap-2">
        {who && <UserAvatar profile={who} size="xs" />}
        <span className="text-sm font-medium">{name}</span>
        {mood && (
          <span className="text-caption">
            {mood.emoji} {mood.label}
          </span>
        )}
      </div>
      {prompt && (
        <p className="mt-2 text-caption italic">&ldquo;{prompt}&rdquo;</p>
      )}
      {moment.body && <p className="text-moment mt-2 text-foreground">{moment.body}</p>}
    </div>
  );

  if (!animate || reduced) return body;

  return (
    <motion.div
      variants={unfold}
      initial="hidden"
      animate="show"
      style={{ transformOrigin: "top center" }}
    >
      {body}
    </motion.div>
  );
}

export function YourMoment({
  moment,
  you,
  onEdit,
}: {
  moment: Moment;
  you?: ProfileLike;
  onEdit: () => void;
}) {
  const mood = moodMeta(moment.mood);
  return (
    <div className="mt-5 rounded-lg border border-border bg-muted/40 p-4">
      <div className="flex items-center gap-2">
        {you && <UserAvatar profile={you} size="xs" />}
        <span className="text-caption font-medium">Your answer</span>
        {mood && (
          <span className="ml-auto text-caption">
            {mood.emoji} {mood.label}
          </span>
        )}
        <button
          type="button"
          onClick={onEdit}
          className="text-caption underline-offset-2 hover:underline"
        >
          Undo
        </button>
      </div>
      {moment.body && <p className="text-moment mt-2">{moment.body}</p>}
    </div>
  );
}
