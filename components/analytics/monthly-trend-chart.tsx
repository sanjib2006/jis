"use client";

import { useState } from "react";
import type { MonthlyTrendData } from "@/actions/analytics.actions";
import { cn } from "@/lib/utils";

interface MonthlyTrendChartProps {
  data: MonthlyTrendData[];
  className?: string;
}

export function MonthlyTrendChart({ data, className }: MonthlyTrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Compute maximum value for scaling
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.registered, d.closed)),
    5
  );

  // Round maxVal up to a nice number
  const yMax = Math.ceil(maxVal / 5) * 5;
  const yTicks = [yMax, Math.round((yMax * 3) / 4), Math.round(yMax / 2), Math.round(yMax / 4), 0];

  const svgWidth = 600;
  const svgHeight = 260;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const barGroupWidth = chartWidth / data.length;
  const barWidth = Math.min(22, (barGroupWidth - 16) / 2);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Legend & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div>
          <span className="font-semibold text-foreground">
            Caseload Trend (Last 6 Months)
          </span>
          <span className="text-muted-foreground block text-[11px]">
            Comparative volume of cases registered vs. officially closed
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-xs bg-[#0f172a] dark:bg-slate-300 inline-block border border-border" />
            <span className="text-foreground">Cases Registered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-xs bg-[#c2410c] inline-block border border-border" />
            <span className="text-foreground">Cases Closed/Resolved</span>
          </div>
        </div>
      </div>

      {/* SVG Bar Chart Container */}
      <div className="relative border border-border rounded-sm bg-card p-4 overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto max-h-[300px] select-none"
        >
          {/* Grid lines and Y-axis labels */}
          {yTicks.map((tick) => {
            const y =
              paddingTop + chartHeight - (tick / yMax) * chartHeight;
            return (
              <g key={tick}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="currentColor"
                  className="text-border"
                  strokeDasharray={tick === 0 ? "none" : "3 3"}
                  strokeWidth={tick === 0 ? 1.5 : 1}
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-muted-foreground text-[10px] font-mono"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Bars and X-axis labels */}
          {data.map((item, index) => {
            const groupX = paddingLeft + index * barGroupWidth;
            const centerX = groupX + barGroupWidth / 2;

            const regHeight = (item.registered / yMax) * chartHeight;
            const regY = paddingTop + chartHeight - regHeight;
            const regX = centerX - barWidth - 2;

            const closedHeight = (item.closed / yMax) * chartHeight;
            const closedY = paddingTop + chartHeight - closedHeight;
            const closedX = centerX + 2;

            const isHovered = hoveredIndex === index;

            return (
              <g
                key={item.monthKey}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer group"
              >
                {/* Background hover highlight */}
                <rect
                  x={groupX + 4}
                  y={paddingTop}
                  width={barGroupWidth - 8}
                  height={chartHeight}
                  className={cn(
                    "transition-colors",
                    isHovered ? "fill-muted/50" : "fill-transparent"
                  )}
                  rx={2}
                />

                {/* Bar 1: Registered (Navy / Charcoal) */}
                <rect
                  x={regX}
                  y={regY}
                  width={barWidth}
                  height={regHeight}
                  className={cn(
                    "fill-[#0f172a] dark:fill-slate-300 transition-opacity",
                    isHovered ? "opacity-100" : "opacity-90"
                  )}
                  rx={1}
                />

                {/* Bar 2: Closed (Burnt Sienna Accent) */}
                <rect
                  x={closedX}
                  y={closedY}
                  width={barWidth}
                  height={closedHeight}
                  className={cn(
                    "fill-[#c2410c] transition-opacity",
                    isHovered ? "opacity-100" : "opacity-90"
                  )}
                  rx={1}
                />

                {/* X-axis Label */}
                <text
                  x={centerX}
                  y={svgHeight - 14}
                  textAnchor="middle"
                  className={cn(
                    "text-[11px] font-mono transition-colors",
                    isHovered
                      ? "fill-foreground font-semibold"
                      : "fill-muted-foreground"
                  )}
                >
                  {item.month}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Dynamic Tooltip */}
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div className="mt-2 pt-2 border-t border-border flex items-center justify-between text-xs bg-muted/20 px-3 py-1.5 rounded-sm">
            <span className="font-semibold text-foreground font-mono">
              Month: {data[hoveredIndex].month}
            </span>
            <div className="flex items-center gap-4 font-mono">
              <span className="text-[#0f172a] dark:text-slate-300">
                Registered: <strong>{data[hoveredIndex].registered}</strong>
              </span>
              <span className="text-[#c2410c]">
                Closed/Resolved: <strong>{data[hoveredIndex].closed}</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
