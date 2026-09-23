"use client";

import { useState } from "react";
import type { CaseWithJudgment } from "@/actions/caseView.actions";
import { CinBadge } from "@/components/shared/cin-badge";
import { LawyerChargeDialog } from "@/components/lawyer/lawyer-charge-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ChevronRight } from "lucide-react";

interface LawyerHistoryTableProps {
  cases: CaseWithJudgment[];
}

export function LawyerHistoryTable({ cases }: LawyerHistoryTableProps) {
  const [selectedCin, setSelectedCin] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleRowClick = (cin: string) => {
    setSelectedCin(cin);
    setDialogOpen(true);
  };

  if (cases.length === 0) {
    return (
      <div className="border border-border rounded-sm p-12 text-center text-xs text-muted-foreground bg-card">
        <p className="font-medium text-foreground">
          No closed cases in the judicial archive
        </p>
        <p className="mt-1">
          Archived dockets will appear here as judgments are finalized.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="border border-border rounded-sm overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="font-semibold text-foreground h-9 px-3">
                CIN
              </TableHead>
              <TableHead className="font-semibold text-foreground h-9 px-3">
                Defendant Name
              </TableHead>
              <TableHead className="font-semibold text-foreground h-9 px-3">
                Statutory Offense
              </TableHead>
              <TableHead className="font-semibold text-foreground h-9 px-3">
                Presiding Officer
              </TableHead>
              <TableHead className="font-semibold text-foreground h-9 px-3">
                Judgment Date
              </TableHead>
              <TableHead className="font-semibold text-foreground h-9 px-3">
                Decision Summary
              </TableHead>
              <TableHead className="font-semibold text-foreground h-9 px-3 text-right">
                Access Fee
              </TableHead>
              <TableHead className="h-9 px-3 w-8" />
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {cases.map((c) => (
              <TableRow
                key={c.cin}
                onClick={() => handleRowClick(c.cin)}
                className="border-b border-border/60 hover:bg-muted/30 transition-colors group cursor-pointer"
              >
                <TableCell className="py-2.5 px-3">
                  <CinBadge cin={c.cin} />
                </TableCell>
                <TableCell className="font-medium text-foreground py-2.5 px-3">
                  {c.defendantName}
                </TableCell>
                <TableCell className="text-muted-foreground py-2.5 px-3">
                  {c.crimeType}
                </TableCell>
                <TableCell className="text-foreground py-2.5 px-3">
                  {c.judge.name}
                </TableCell>
                <TableCell className="font-mono text-[11px] text-muted-foreground py-2.5 px-3 whitespace-nowrap">
                  {c.judgment
                    ? format(new Date(c.judgment.judgmentDate), "dd MMM yyyy")
                    : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground py-2.5 px-3 max-w-xs truncate">
                  {c.judgment?.summary || "Archived"}
                </TableCell>
                <TableCell className="font-mono text-[11px] text-right text-muted-foreground py-2.5 px-3 font-semibold whitespace-nowrap">
                  ₹50.00
                </TableCell>
                <TableCell className="py-2.5 px-3 text-right">
                  <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <LawyerChargeDialog
        cin={selectedCin}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
