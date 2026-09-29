"use client";

import { useState } from "react";
import type { StatusBreakdownData } from "@/actions/analytics.actions";
import { cn } from "@/lib/utils";

interface StatusBreakdownChartProps {
  data: StatusBreakdownData[];
  totalCases: number;
  className?: string;
}

export function StatusBreakdownChart({
  data,
  totalCases,
  className,
}: StatusBreakdownChartProps) {
  const [hoveredStatus, setHoveredStatus] = useState<string | null>(null);

  const radius = 62;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  // Compute stroke offsets for each slice
  let accumulatedPercent = 0;
  const slices = data.map((item) => {
    const dashLength = (item.percentage / 100) * circumference;
    const offset = -(accumulatedPercent / 100) * circumference;
    accumulatedPercent += item.percentage;

    return {
      ...item,
      dashLength,
      offset,
    };
  });

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h3 className="font-semibold text-foreground text-sm">
          Caseload Status Distribution
        </h3>
        <p className="text-muted-foreground text-xs">
          Categorical breakdown of court dockets by procedural stage
        </p>
      </div>

      <div className="border border-border rounded-sm bg-card p-4 flex flex-col md:flex-row items-center gap-6">
        {/* Donut Chart View */}
        <div className="relative size-48 shrink-0 flex items-center justify-center">
          <svg className="size-full -rotate-90" viewBox="0 0 160 160">
            {/* Background Track */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke="currentColor"
              className="text-muted/30"
              strokeWidth={strokeWidth}
            />

            {/* Slices */}
            {slices.map((slice) => {
              const isHovered = hoveredStatus === slice.status;
              return (
                <circle
                  key={slice.status}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={`${slice.dashLength} ${circumference}`}
                  strokeDashoffset={slice.offset}
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredStatus(slice.status)}
                  onMouseLeave={() => setHoveredStatus(null)}
                />
              );
            })}
          </svg>

          {/* Center Metric */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none">
            <span className="text-2xl font-semibold tracking-tight text-foreground font-mono">
              {totalCases}
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
              Total Cases
            </span>
          </div>
        </div>

        {/* Dense Status Ledger Table */}
        <div className="flex-1 w-full space-y-2">
          {data.map((item) => {
            const isHovered = hoveredStatus === item.status;
            return (
              <div
                key={item.status}
                onMouseEnter={() => setHoveredStatus(item.status)}
                onMouseLeave={() => setHoveredStatus(null)}
                className={cn(
                  "flex items-center justify-between p-2 rounded-xs border text-xs transition-colors cursor-pointer",
                  isHovered
                    ? "border-foreground/30 bg-muted/40"
                    : "border-border/60 hover:bg-muted/20"
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-xs shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span
                    className={cn(
                      "font-medium",
                      isHovered ? "text-foreground font-semibold" : "text-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                </div>

                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-muted-foreground">
                    {item.percentage.toFixed(1)}%
                  </span>
                  <span className="font-semibold text-foreground bg-muted/60 px-1.5 py-0.5 rounded-xs border border-border">
                    {item.count} {item.count === 1 ? "case" : "cases"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
