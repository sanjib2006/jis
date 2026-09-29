"use client";

import type { HearingEfficiencyData } from "@/actions/analytics.actions";
import { CheckCircle2, AlertCircle, CalendarClock, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface HearingEfficiencyCardProps {
  data: HearingEfficiencyData;
  className?: string;
}

export function HearingEfficiencyCard({
  data,
  className,
}: HearingEfficiencyCardProps) {
  const radius = 54;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const completedOffset =
    circumference - (data.completionRate / 100) * circumference;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
            <Activity className="size-4 text-accent" />
            Hearing Disposition & Completion
          </h3>
          <p className="text-muted-foreground text-xs">
            Efficiency metrics on trial sessions conducted versus adjourned
          </p>
        </div>
      </div>

      <div className="border border-border rounded-sm bg-card p-4 space-y-5">
        {/* Radial Completion Meter */}
        <div className="flex items-center justify-between gap-4 border-b border-border/70 pb-4">
          <div className="space-y-1">
            <div className="text-3xl font-semibold tracking-tight text-foreground font-mono">
              {data.completionRate.toFixed(1)}%
            </div>
            <div className="text-xs uppercase font-mono tracking-wider text-muted-foreground">
              Overall Completion Rate
            </div>
            <p className="text-[11px] text-muted-foreground pt-1">
              Percentage of scheduled court sessions concluded with proceedings entered
            </p>
          </div>

          <div className="relative size-24 shrink-0 flex items-center justify-center">
            <svg className="size-full -rotate-90" viewBox="0 0 128 128">
              {/* Background circle */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                fill="transparent"
                stroke="currentColor"
                className="text-muted/40"
                strokeWidth={strokeWidth}
              />
              {/* Completed stroke */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                fill="transparent"
                stroke="#059669"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={completedOffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <CheckCircle2 className="size-6 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Rows */}
        <div className="space-y-3 text-xs">
          {/* Completed */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-foreground font-medium">
                <CheckCircle2 className="size-3.5 text-emerald-600" />
                Completed Sessions
              </span>
              <span className="font-mono text-[11px] text-foreground font-semibold">
                {data.completed} ({data.completionRate.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full"
                style={{ width: `${data.completionRate}%` }}
              />
            </div>
          </div>

          {/* Adjourned */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-foreground font-medium">
                <AlertCircle className="size-3.5 text-rose-600" />
                Adjourned Hearings
              </span>
              <span className="font-mono text-[11px] text-foreground font-semibold">
                {data.adjourned} ({data.adjournmentRate.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-600 rounded-full"
                style={{ width: `${data.adjournmentRate}%` }}
              />
            </div>
          </div>

          {/* Scheduled */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-foreground font-medium">
                <CalendarClock className="size-3.5 text-accent" />
                Scheduled / Pending Sessions
              </span>
              <span className="font-mono text-[11px] text-foreground font-semibold">
                {data.scheduled} ({data.scheduledRate.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full"
                style={{ width: `${data.scheduledRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Total Summary Footer */}
        <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] font-mono text-muted-foreground">
          <span>Total Recorded Hearings</span>
          <span className="font-semibold text-foreground">{data.totalHearings} sessions</span>
        </div>
      </div>
    </div>
  );
}
