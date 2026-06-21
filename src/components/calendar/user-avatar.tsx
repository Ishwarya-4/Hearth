import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { initialsFromName } from "@/lib/calendar-utils";
import { cn } from "@/lib/utils";

export type ProfileLike = {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  color: string;
};

export function UserAvatar({
  profile,
  size = "md",
  ring = false,
  className,
}: {
  profile: ProfileLike;
  size?: "xs" | "sm" | "md" | "lg";
  ring?: boolean;
  className?: string;
}) {
  const sizes = { xs: "h-5 w-5 text-[9px]", sm: "h-6 w-6 text-[10px]", md: "h-8 w-8 text-xs", lg: "h-10 w-10 text-sm" };
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Avatar
            className={cn(sizes[size], ring && "ring-2 ring-background", className)}
            style={{ backgroundColor: profile.color }}
          >
            {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name ?? profile.email} />}
            <AvatarFallback
              className="text-white font-semibold"
              style={{ backgroundColor: profile.color }}
            >
              {initialsFromName(profile.full_name, profile.email)}
            </AvatarFallback>
          </Avatar>
        </TooltipTrigger>
        <TooltipContent>{profile.full_name || profile.email}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function AvatarStack({ profiles, max = 3, size = "sm" }: { profiles: ProfileLike[]; max?: number; size?: "xs" | "sm" | "md" }) {
  const shown = profiles.slice(0, max);
  const extra = profiles.length - shown.length;
  return (
    <div className="flex -space-x-1.5">
      {shown.map((p) => (
        <UserAvatar key={p.id} profile={p} size={size} ring />
      ))}
      {extra > 0 && (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold ring-2 ring-background">
          +{extra}
        </span>
      )}
    </div>
  );
}
