"use client";

import Link from "next/link";
import type { CaseWithPersonnel } from "@/actions/case.actions";
import { CinBadge } from "@/components/shared/cin-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { CheckCircle2, ChevronRight } from "lucide-react";

interface CaseTableProps {
  cases: CaseWithPersonnel[];
}

export function CaseTable({ cases }: CaseTableProps) {
  if (cases.length === 0) {
    return (
      <div className="border border-border rounded-sm p-12 text-center text-xs text-muted-foreground bg-card">
        <p className="font-medium text-foreground">No case dockets registered</p>
        <p className="mt-1">
          Select &ldquo;Register New Case&rdquo; to enroll the first judicial case.
        </p>
      </div>
    );
  }

  const renderStatus = (status: string) => {
    switch (status) {
      case "REGISTERED":
        return (
          <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wide">
            Registered
          </span>
        );
      case "PENDING":
        return (
          <span className="font-mono text-[11px] font-semibold text-foreground uppercase tracking-wide">
            Active / Pending
          </span>
        );
      case "ADJOURNED":
        return (
          <span className="font-mono text-[11px] italic text-muted-foreground uppercase tracking-wide">
            Adjourned
          </span>
        );
      case "RESOLVED":
        return (
          <span className="font-mono text-[11px] font-medium text-foreground uppercase tracking-wide inline-flex items-center gap-1">
            <CheckCircle2 className="size-3 text-emerald-600" />
            Resolved
          </span>
        );
      case "CLOSED":
        return (
          <span className="font-mono text-[11px] text-muted-foreground/60 uppercase tracking-wide line-through">
            Closed
          </span>
        );
      default:
        return (
          <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wide">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="border border-border rounded-sm overflow-hidden bg-card">
      <Table>
        <TableHeader className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
          <TableRow className="border-b border-border hover:bg-transparent">
            <TableHead className="font-semibold text-foreground h-9 px-3">
              Case Identification Number (CIN)
            </TableHead>
            <TableHead className="font-semibold text-foreground h-9 px-3">
              Defendant
            </TableHead>
            <TableHead className="font-semibold text-foreground h-9 px-3">
              Crime / Charges
            </TableHead>
            <TableHead className="font-semibold text-foreground h-9 px-3">
              Presiding Officer
            </TableHead>
            <TableHead className="font-semibold text-foreground h-9 px-3">
              Commencement
            </TableHead>
            <TableHead className="font-semibold text-foreground h-9 px-3">
              Status
            </TableHead>
            <TableHead className="h-9 px-3 w-8" />
          </TableRow>
        </TableHeader>
        <TableBody className="text-xs">
          {cases.map((c) => (
            <TableRow
              key={c.cin}
              className="border-b border-border/60 hover:bg-muted/30 transition-colors group cursor-pointer"
            >
              <TableCell className="py-2.5 px-3">
                <Link href={`/registrar/cases/${c.cin}`} className="block">
                  <CinBadge cin={c.cin} />
                </Link>
              </TableCell>
              <TableCell className="font-medium text-foreground py-2.5 px-3">
                <Link href={`/registrar/cases/${c.cin}`} className="block">
                  {c.defendantName}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground py-2.5 px-3">
                <Link href={`/registrar/cases/${c.cin}`} className="block truncate max-w-44">
                  {c.crimeType}
                </Link>
              </TableCell>
              <TableCell className="text-foreground py-2.5 px-3">
                <Link href={`/registrar/cases/${c.cin}`} className="block">
                  {c.judge.name}
                </Link>
              </TableCell>
              <TableCell className="font-mono text-[11px] text-muted-foreground py-2.5 px-3">
                <Link href={`/registrar/cases/${c.cin}`} className="block">
                  {format(new Date(c.trialStartDate), "dd MMM yyyy")}
                </Link>
              </TableCell>
              <TableCell className="py-2.5 px-3">
                <Link href={`/registrar/cases/${c.cin}`} className="block">
                  {renderStatus(c.status)}
                </Link>
              </TableCell>
              <TableCell className="py-2.5 px-3 text-right">
                <Link href={`/registrar/cases/${c.cin}`}>
                  <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
