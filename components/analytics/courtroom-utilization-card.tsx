import type { CourtroomUtilizationData } from "@/actions/analytics.actions";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CourtroomUtilizationCardProps {
  data: CourtroomUtilizationData[];
  className?: string;
}

export function CourtroomUtilizationCard({
  data,
  className,
}: CourtroomUtilizationCardProps) {
  const maxHearings = Math.max(...data.map((d) => d.totalHearings), 1);

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h3 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
          <Building2 className="size-4 text-accent" />
          Courtroom Bench Utilization
        </h3>
        <p className="text-muted-foreground text-xs">
          Session allocation and hearing workload across designated chambers
        </p>
      </div>

      <div className="border border-border rounded-sm bg-card p-4 divide-y divide-border/60">
        {data.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-4">
            No courtroom load data available.
          </div>
        ) : (
          data.map((cr) => {
            const percent = Math.round((cr.totalHearings / maxHearings) * 100);

            return (
              <div key={cr.courtroomId} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-medium text-foreground block">
                      {cr.courtroomName}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {cr.location || "Central Wing"}
                    </span>
                  </div>

                  <div className="text-right font-mono text-[11px]">
                    <span className="font-semibold text-foreground">
                      {cr.totalHearings} {cr.totalHearings === 1 ? "hearing" : "hearings"}
                    </span>
                    <div className="text-[10px] text-muted-foreground">
                      {cr.completedHearings} done &bull; {cr.scheduledHearings} pending
                    </div>
                  </div>
                </div>

                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
