import { getCurrentUser } from "@/lib/auth";
import { getCasesByHearingDateAction } from "@/actions/case.actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CaseNavTabs } from "@/components/cases/case-nav-tabs";
import { CinSearchBar } from "@/components/cases/cin-search-bar";
import { CasesHearingDateFilter } from "@/components/cases/cases-hearing-date-filter";
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
import { format } from "date-fns";
import { ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

interface CasesByHearingDatePageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function CasesByHearingDatePage({
  searchParams,
}: CasesByHearingDatePageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "REGISTRAR") {
    redirect(`/${currentUser.role.toLowerCase()}`);
  }

  const { date } = await searchParams;
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const selectedDateStr = date || todayStr;

  const res = await getCasesByHearingDateAction(selectedDateStr);
  const cases = res.success && res.data ? res.data : [];

  const renderStatus = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return (
          <span className="font-mono text-[10px] uppercase font-semibold text-accent px-1.5 py-0.5 rounded border border-accent/40 bg-accent/10">
            Scheduled
          </span>
        );
      case "COMPLETED":
        return (
          <span className="font-mono text-[10px] uppercase font-semibold text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-600/30 bg-emerald-50 dark:bg-emerald-950/20">
            Completed
          </span>
        );
      case "ADJOURNED":
        return (
          <span className="font-mono text-[10px] uppercase font-semibold text-destructive px-1.5 py-0.5 rounded border border-destructive/30 bg-destructive/10">
            Adjourned
          </span>
        );
      default:
        return (
          <span className="font-mono text-[10px] uppercase text-muted-foreground">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Cases by Scheduled Hearing Date
            </h1>
            <Badge
              variant="outline"
              className="text-[10px] uppercase font-mono py-0 px-1.5 rounded-sm"
            >
              {cases.length} {cases.length === 1 ? "Case" : "Cases"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Query cases with active hearings, proceedings, or adjournments scheduled on a specific calendar day.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <CaseNavTabs />
        <div className="pt-1">
          <CinSearchBar />
        </div>
      </div>

      <CasesHearingDateFilter currentDate={selectedDateStr} />

      {cases.length === 0 ? (
        <div className="border border-border rounded-sm p-12 text-center text-xs text-muted-foreground bg-card">
          <p className="font-medium text-foreground">
            No hearing proceedings found for {format(new Date(selectedDateStr), "dd MMMM yyyy")}
          </p>
          <p className="mt-1">
            Choose a different date using the calendar filter above.
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
                  Defendant
                </TableHead>
                <TableHead className="font-semibold text-foreground h-9 px-3">
                  Courtroom
                </TableHead>
                <TableHead className="font-semibold text-foreground h-9 px-3">
                  Hearing Status
                </TableHead>
                <TableHead className="font-semibold text-foreground h-9 px-3">
                  Presiding Judge
                </TableHead>
                <TableHead className="font-semibold text-foreground h-9 px-3">
                  Proceedings / Notes
                </TableHead>
                <TableHead className="h-9 px-3 w-8" />
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {cases.map((c) => {
                const hearing = c.hearings[0];
                return (
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
                    <TableCell className="text-foreground py-2.5 px-3">
                      <Link href={`/registrar/cases/${c.cin}`} className="block">
                        {hearing?.courtroom?.name || "Unassigned"}
                      </Link>
                    </TableCell>
                    <TableCell className="py-2.5 px-3">
                      <Link href={`/registrar/cases/${c.cin}`} className="block">
                        {hearing ? renderStatus(hearing.hearingStatus) : "—"}
                      </Link>
                    </TableCell>
                    <TableCell className="text-foreground py-2.5 px-3">
                      <Link href={`/registrar/cases/${c.cin}`} className="block">
                        {c.judge.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground py-2.5 px-3 max-w-xs truncate">
                      <Link href={`/registrar/cases/${c.cin}`} className="block">
                        {hearing?.proceedingSummary ||
                          hearing?.adjournmentReason ||
                          "Awaiting session..."}
                      </Link>
                    </TableCell>
                    <TableCell className="py-2.5 px-3 text-right">
                      <Link href={`/registrar/cases/${c.cin}`}>
                        <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
