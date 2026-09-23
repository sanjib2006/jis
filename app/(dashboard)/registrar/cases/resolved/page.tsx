import { getCurrentUser } from "@/lib/auth";
import { getResolvedCasesAction } from "@/actions/case.actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CaseNavTabs } from "@/components/cases/case-nav-tabs";
import { CinSearchBar } from "@/components/cases/cin-search-bar";
import { ResolvedDateFilter } from "@/components/cases/resolved-date-filter";
import { CinBadge } from "@/components/shared/cin-badge";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, subDays } from "date-fns";
import { ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

interface ResolvedCasesPageProps {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function ResolvedCasesPage({
  searchParams,
}: ResolvedCasesPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "REGISTRAR") {
    redirect(`/${currentUser.role.toLowerCase()}`);
  }

  const { from, to } = await searchParams;

  const defaultTo = format(new Date(), "yyyy-MM-dd");
  const defaultFrom = format(subDays(new Date(), 30), "yyyy-MM-dd");

  const fromDateStr = from || defaultFrom;
  const toDateStr = to || defaultTo;

  const res = await getResolvedCasesAction(fromDateStr, toDateStr);
  const resolvedCases = res.success && res.data ? res.data : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Resolved Cases & Judgments Registry
            </h1>
            <Badge
              variant="outline"
              className="text-[10px] uppercase font-mono py-0 px-1.5 rounded-sm"
            >
              {resolvedCases.length}{" "}
              {resolvedCases.length === 1 ? "Judgment" : "Judgments"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Permanent judicial decisions and case closures queried by judgment date range.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <CaseNavTabs />
        <div className="pt-1">
          <CinSearchBar />
        </div>
      </div>

      <ResolvedDateFilter
        initialFrom={fromDateStr}
        initialTo={toDateStr}
      />

      {resolvedCases.length === 0 ? (
        <div className="border border-border rounded-sm p-12 text-center text-xs text-muted-foreground bg-card">
          <p className="font-medium text-foreground">
            No resolved cases in this date range.
          </p>
          <p className="mt-1">
            {format(new Date(fromDateStr), "dd MMM yyyy")} to{" "}
            {format(new Date(toDateStr), "dd MMM yyyy")}
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-sm overflow-hidden bg-card">
          <Table>
            <TableHeader className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="font-semibold text-foreground h-9 px-3">
                  Commencement Date
                </TableHead>
                <TableHead className="font-semibold text-foreground h-9 px-3">
                  CIN
                </TableHead>
                <TableHead className="font-semibold text-foreground h-9 px-3">
                  Defendant Name
                </TableHead>
                <TableHead className="font-semibold text-foreground h-9 px-3">
                  Judgment Date
                </TableHead>
                <TableHead className="font-semibold text-foreground h-9 px-3">
                  Presiding Judge
                </TableHead>
                <TableHead className="font-semibold text-foreground h-9 px-3">
                  Judgment Decision & Summary
                </TableHead>
                <TableHead className="h-9 px-3 w-8" />
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {resolvedCases.map((c) => (
                <TableRow
                  key={c.cin}
                  className="border-b border-border/60 hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <TableCell className="font-mono text-[11px] text-muted-foreground py-2.5 px-3 whitespace-nowrap">
                    <Link href={`/registrar/cases/${c.cin}`} className="block">
                      {format(new Date(c.trialStartDate), "dd MMM yyyy")}
                    </Link>
                  </TableCell>
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
                  <TableCell className="font-mono text-[11px] font-semibold text-foreground py-2.5 px-3 whitespace-nowrap">
                    <Link href={`/registrar/cases/${c.cin}`} className="block">
                      {format(new Date(c.judgment.judgmentDate), "dd MMM yyyy")}
                    </Link>
                  </TableCell>
                  <TableCell className="text-foreground py-2.5 px-3">
                    <Link href={`/registrar/cases/${c.cin}`} className="block">
                      {c.judge.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground py-2.5 px-3 max-w-xs truncate">
                    <Link href={`/registrar/cases/${c.cin}`} className="block">
                      {c.judgment.summary}
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
      )}
    </div>
  );
}
