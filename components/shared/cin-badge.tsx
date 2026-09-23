import { cn } from "@/lib/utils";

interface CinBadgeProps {
  cin: string;
  className?: string;
}

export function CinBadge({ cin, className }: CinBadgeProps) {
  return (
    <span
      className={cn(
        "font-mono text-xs font-semibold tracking-wider bg-muted/80 text-foreground border border-border px-2 py-0.5 rounded-sm inline-block select-all",
        className
      )}
    >
      {cin}
    </span>
  );
}
