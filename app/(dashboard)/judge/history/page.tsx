import { getCurrentUser } from "@/lib/auth";
import { getClosedCasesAction } from "@/actions/caseView.actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CinBadge } from "@/components/shared/cin-badge";
import { CaseSearch } from "@/components/shared/case-search";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const revalidate = 15;

export default async function JudgeHistoryPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "JUDGE") {
    redirect(`/${currentUser.role.toLowerCase()}`);
  }

  const res = await getClosedCasesAction();
  const closedCases = res.success && res.data ? res.data : [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/judge"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-xs" }),
              "h-7 w-7 text-muted-foreground hover:text-foreground"
            )}
          >
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back</span>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                Judicial Case Law Archive
              </h1>
              <Badge
                variant="outline"
                className="text-[10px] uppercase font-mono py-0 px-1.5 rounded-sm"
              >
                {closedCases.length}{" "}
                {closedCases.length === 1 ? "Closed Case" : "Closed Cases"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Complete historical record of resolved court litigations, statutory orders, and legal precedents.
            </p>
          </div>
        </div>
      </div>

      {/* Case Search at top */}
      <div className="space-y-1">
        <span className="text-[11px] font-mono text-muted-foreground uppercase">
          Quick Filter / Keyword Lookup:
        </span>
        <CaseSearch role="JUDGE" placeholder="Filter archive by keyword, party name, or charge section..." />
      </div>

      {/* Table of Closed Cases */}
      {closedCases.length === 0 ? (
        <div className="border border-border rounded-sm p-12 text-center text-xs text-muted-foreground bg-card">
          <p className="font-medium text-foreground">No closed cases available.</p>
          <p className="mt-1">
            Cases will appear here once judgments are recorded and cases are closed by the Registrar.
          </p>
        </div>
      ) : (
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
                  Offense / Crime
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
                <TableHead className="h-9 px-3 w-8" />
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {closedCases.map((c) => (
                <TableRow
                  key={c.cin}
                  className="border-b border-border/60 hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <TableCell className="py-2.5 px-3">
                    <Link href={`/judge/history/${c.cin}`} className="block">
                      <CinBadge cin={c.cin} />
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium text-foreground py-2.5 px-3">
                    <Link href={`/judge/history/${c.cin}`} className="block">
                      {c.defendantName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground py-2.5 px-3">
                    <Link href={`/judge/history/${c.cin}`} className="block">
                      {c.crimeType}
                    </Link>
                  </TableCell>
                  <TableCell className="text-foreground py-2.5 px-3">
                    <Link href={`/judge/history/${c.cin}`} className="block">
                      {c.judge.name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground py-2.5 px-3 whitespace-nowrap">
                    <Link href={`/judge/history/${c.cin}`} className="block">
                      {c.judgment
                        ? format(new Date(c.judgment.judgmentDate), "dd MMM yyyy")
                        : "—"}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground py-2.5 px-3 max-w-xs truncate">
                    <Link href={`/judge/history/${c.cin}`} className="block">
                      {c.judgment?.summary || "Judgment details archived"}
                    </Link>
                  </TableCell>
                  <TableCell className="py-2.5 px-3 text-right">
                    <Link href={`/judge/history/${c.cin}`}>
                      <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
