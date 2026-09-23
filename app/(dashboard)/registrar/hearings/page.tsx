import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CinBadge } from "@/components/shared/cin-badge";
import { HearingsDateFilter } from "@/components/hearings/hearings-date-filter";
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

interface HearingsPageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function HearingsPage({ searchParams }: HearingsPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "REGISTRAR") {
    redirect(`/${currentUser.role.toLowerCase()}`);
  }

  const { date: dateQuery } = await searchParams;

  // Default to today in YYYY-MM-DD
  const todayStr = new Date().toISOString().split("T")[0];
  const selectedDateStr = dateQuery || todayStr;

  const targetDate = new Date(selectedDateStr);
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const hearings = await prisma.hearing.findMany({
    where: {
      hearingDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      case: {
        include: {
          judge: true,
          prosecutor: true,
          lawyer: true,
        },
      },
      courtroom: true,
    },
    orderBy: { hearingDate: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Daily Court Hearing Docket
            </h1>
            <Badge
              variant="outline"
              className="text-[10px] uppercase font-mono py-0 px-1.5 rounded-sm"
            >
              {hearings.length} {hearings.length === 1 ? "Hearing" : "Hearings"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Courtroom schedules, bench assignments, and proceeding logs for{" "}
            <span className="font-semibold text-foreground">
              {format(targetDate, "dd MMMM yyyy")}
            </span>
          </p>
        </div>

        <HearingsDateFilter currentDate={selectedDateStr} />
      </div>

      {hearings.length === 0 ? (
        <div className="border border-border rounded-sm p-12 text-center text-xs text-muted-foreground bg-card">
          <p className="font-medium text-foreground">
            No hearings scheduled for this date
          </p>
          <p className="mt-1">
            Select another date or navigate to a case docket to assign a hearing slot.
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
                  Courtroom Chamber
                </TableHead>
                <TableHead className="font-semibold text-foreground h-9 px-3">
                  Presiding Judge
                </TableHead>
                <TableHead className="font-semibold text-foreground h-9 px-3">
                  Session Status
                </TableHead>
                <TableHead className="h-9 px-3 w-8" />
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {hearings.map((h) => (
                <TableRow
                  key={h.id}
                  className="border-b border-border/60 hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <TableCell className="py-2.5 px-3">
                    <Link href={`/registrar/cases/${h.cin}`} className="block">
                      <CinBadge cin={h.cin} />
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium text-foreground py-2.5 px-3">
                    <Link href={`/registrar/cases/${h.cin}`} className="block">
                      {h.case.defendantName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-foreground py-2.5 px-3 font-mono">
                    <Link href={`/registrar/cases/${h.cin}`} className="block">
                      {h.courtroom?.name || "Chambers Unassigned"}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground py-2.5 px-3">
                    <Link href={`/registrar/cases/${h.cin}`} className="block">
                      {h.case.judge.name}
                    </Link>
                  </TableCell>
                  <TableCell className="py-2.5 px-3">
                    <Link href={`/registrar/cases/${h.cin}`} className="block">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono uppercase tracking-wider py-0 px-1.5 rounded-sm ${
                          h.hearingStatus === "SCHEDULED"
                            ? "border-accent text-accent font-semibold"
                            : h.hearingStatus === "ADJOURNED"
                            ? "border-destructive text-destructive font-semibold"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {h.hearingStatus}
                      </Badge>
                    </Link>
                  </TableCell>
                  <TableCell className="py-2.5 px-3 text-right">
                    <Link href={`/registrar/cases/${h.cin}`}>
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
