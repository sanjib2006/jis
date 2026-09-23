"use client";

import { useState } from "react";
import type { Hearing, Courtroom } from "@/types";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileEdit, PauseCircle, ArrowRight } from "lucide-react";
import { AdjournmentDialog } from "@/components/hearings/adjournment-dialog";
import { SummaryDialog } from "@/components/hearings/summary-dialog";

interface HearingTimelineProps {
  hearings: (Hearing & { courtroom: Courtroom | null })[];
  courtrooms: Courtroom[];
  canManage?: boolean; // Only true for REGISTRAR
}

export function HearingTimeline({
  hearings,
  courtrooms,
  canManage = false,
}: HearingTimelineProps) {
  const [selectedHearingId, setSelectedHearingId] = useState<string | null>(null);
  const [adjournDialogOpen, setAdjournDialogOpen] = useState(false);
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);

  const handleOpenAdjourn = (id: string) => {
    setSelectedHearingId(id);
    setAdjournDialogOpen(true);
  };

  const handleOpenSummary = (id: string) => {
    setSelectedHearingId(id);
    setSummaryDialogOpen(true);
  };

  if (hearings.length === 0) {
    return (
      <div className="border border-border rounded-sm p-8 text-center text-xs text-muted-foreground bg-card">
        No formal hearings have been scheduled for this case docket yet.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {hearings.map((hearing, idx) => {
          const isScheduled = hearing.hearingStatus === "SCHEDULED";
          const isCompleted = hearing.hearingStatus === "COMPLETED";
          const isAdjourned = hearing.hearingStatus === "ADJOURNED";

          let borderClass = "border-border";
          if (isScheduled) borderClass = "border-accent";
          if (isAdjourned) borderClass = "border-destructive";

          return (
            <div
              key={hearing.id}
              className={`p-4 rounded-sm border bg-card border-l-4 ${borderClass} space-y-3 transition-colors`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/40 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs text-muted-foreground">
                    #{hearings.length - idx}
                  </span>
                  <span className="font-semibold text-sm text-foreground">
                    {format(new Date(hearing.hearingDate), "EEEE, dd MMMM yyyy")}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    &bull; {hearing.courtroom?.name || "Chambers Unassigned"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-mono uppercase tracking-wider py-0 px-1.5 rounded-sm ${
                      isScheduled
                        ? "border-accent text-accent font-semibold"
                        : isAdjourned
                        ? "border-destructive text-destructive font-semibold"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {hearing.hearingStatus}
                  </Badge>

                  {canManage && isScheduled && (
                    <div className="flex items-center gap-1.5 ml-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenSummary(hearing.id)}
                        className="h-7 text-xs px-2 rounded-sm"
                      >
                        <FileEdit className="size-3 mr-1" />
                        Record Summary
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenAdjourn(hearing.id)}
                        className="h-7 text-xs px-2 text-destructive hover:text-destructive rounded-sm"
                      >
                        <PauseCircle className="size-3 mr-1" />
                        Adjourn
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Proceeding Summary */}
              {isCompleted && hearing.proceedingSummary && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block font-semibold">
                    Judicial Proceeding Record
                  </span>
                  <p className="text-xs text-foreground bg-muted/30 p-2.5 rounded-sm border border-border/50 leading-relaxed font-normal whitespace-pre-wrap">
                    {hearing.proceedingSummary}
                  </p>
                </div>
              )}

              {/* Adjournment Reason */}
              {isAdjourned && hearing.adjournmentReason && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-destructive block font-semibold">
                    Statutory Ground for Adjournment
                  </span>
                  <p className="text-xs text-foreground bg-destructive/5 p-2.5 rounded-sm border border-destructive/20 leading-relaxed font-normal">
                    {hearing.adjournmentReason}
                  </p>
                </div>
              )}

              {/* Next Hearing Scheduled Marker */}
              {hearing.nextHearingDate && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono pt-1">
                  <ArrowRight className="size-3 text-accent" />
                  <span>Subsequent Hearing Ordered for:</span>
                  <span className="font-semibold text-foreground">
                    {format(new Date(hearing.nextHearingDate), "dd MMM yyyy")}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedHearingId && (
        <>
          <AdjournmentDialog
            hearingId={selectedHearingId}
            courtrooms={courtrooms}
            open={adjournDialogOpen}
            onOpenChange={(open) => {
              setAdjournDialogOpen(open);
              if (!open) setSelectedHearingId(null);
            }}
          />
          <SummaryDialog
            hearingId={selectedHearingId}
            courtrooms={courtrooms}
            open={summaryDialogOpen}
            onOpenChange={(open) => {
              setSummaryDialogOpen(open);
              if (!open) setSelectedHearingId(null);
            }}
          />
        </>
      )}
    </>
  );
}
