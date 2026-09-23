import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { CinBadge } from "@/components/shared/cin-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Building2,
  Calendar,
  Clock,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RegistrarPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "REGISTRAR") {
    redirect(`/${currentUser.role.toLowerCase()}`);
  }

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    pendingCasesCount,
    todayHearings,
    activeUsersCount,
    closedThisMonthCount,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.case.count({
      where: {
        status: { in: ["REGISTERED", "PENDING", "ADJOURNED"] },
      },
    }),
    prisma.hearing.findMany({
      where: {
        hearingDate: { gte: todayStart, lte: todayEnd },
      },
      include: {
        case: { include: { judge: true } },
        courtroom: true,
      },
      orderBy: { hearingDate: "asc" },
    }),
    prisma.user.count({
      where: { isActive: true },
    }),
    prisma.case.count({
      where: {
        status: { in: ["CLOSED", "RESOLVED"] },
        judgment: { judgmentDate: { gte: monthStart } },
      },
    }),
    prisma.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { actor: true },
    }),
  ]);

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Registrar Administrative Portal
            </h1>
            <Badge variant="outline" className="text-xs font-mono rounded-sm">
              ROLE: REGISTRAR
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Operational overview for court administration, hearing calendars, and statutory dockets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/registrar/hearings"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-8 text-xs font-medium rounded-sm inline-flex items-center"
            )}
          >
            <Calendar className="size-3.5 mr-1" />
            Hearing Docket
          </Link>
          <Link
            href="/registrar/courtrooms"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-8 text-xs font-medium rounded-sm inline-flex items-center"
            )}
          >
            <Building2 className="size-3.5 mr-1" />
            Courtrooms
          </Link>
          <Link
            href="/registrar/cases/new"
            className={cn(
              buttonVariants({ size: "sm" }),
              "h-8 text-xs font-medium rounded-sm inline-flex items-center"
            )}
          >
            <Plus className="size-3.5 mr-1" />
            Register Case
          </Link>
        </div>
      </div>

      {/* Wide Stats Strip (Horizontal 4-metric row, no card backgrounds, clean typography) */}
      <div className="border border-border rounded-sm bg-card p-4 grid grid-cols-2 lg:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
        <div className="px-3 pt-2 sm:pt-0">
          <div className="text-3xl font-semibold tracking-tight text-foreground">
            {pendingCasesCount}
          </div>
          <div className="text-xs text-muted-foreground uppercase font-mono tracking-wider mt-1">
            Active Pending Cases
          </div>
          <Link
            href="/registrar/cases/pending"
            className="text-[11px] text-muted-foreground hover:text-foreground hover:underline transition-colors mt-1 block"
          >
            Open pending dockets &rarr;
          </Link>
        </div>

        <div className="px-3 pt-2 sm:pt-0">
          <div className="text-3xl font-semibold tracking-tight text-foreground">
            {todayHearings.length}
          </div>
          <div className="text-xs text-muted-foreground uppercase font-mono tracking-wider mt-1">
            Today&apos;s Scheduled Hearings
          </div>
          <Link
            href="/registrar/hearings"
            className="text-[11px] text-muted-foreground hover:text-foreground hover:underline transition-colors mt-1 block"
          >
            View daily hearing calendar &rarr;
          </Link>
        </div>

        <div className="px-3 pt-2 sm:pt-0">
          <div className="text-3xl font-semibold tracking-tight text-foreground">
            {activeUsersCount}
          </div>
          <div className="text-xs text-muted-foreground uppercase font-mono tracking-wider mt-1">
            Enrolled Personnel
          </div>
          <Link
            href="/registrar/accounts"
            className="text-[11px] text-muted-foreground hover:text-foreground hover:underline transition-colors mt-1 block"
          >
            Manage judicial staff &rarr;
          </Link>
        </div>

        <div className="px-3 pt-2 sm:pt-0">
          <div className="text-3xl font-semibold tracking-tight text-foreground">
            {closedThisMonthCount}
          </div>
          <div className="text-xs text-muted-foreground uppercase font-mono tracking-wider mt-1">
            Cases Closed This Month
          </div>
          <Link
            href="/registrar/cases/resolved"
            className="text-[11px] text-muted-foreground hover:text-foreground hover:underline transition-colors mt-1 block"
          >
            View resolved registry &rarr;
          </Link>
        </div>
      </div>

      {/* Today's Hearings Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-accent" />
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Today&apos;s Courtroom Sessions & Docket Schedule
            </h2>
            <span className="font-mono text-xs text-muted-foreground">
              ({format(new Date(), "dd MMMM yyyy")})
            </span>
          </div>
          <Link
            href="/registrar/hearings"
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            Full calendar &rarr;
          </Link>
        </div>

        {todayHearings.length === 0 ? (
          <div className="border border-border rounded-sm p-6 text-center text-xs text-muted-foreground bg-card">
            No courtroom hearings or proceedings scheduled for today.
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
                    Presiding Judge
                  </TableHead>
                  <TableHead className="font-semibold text-foreground h-9 px-3">
                    Status
                  </TableHead>
                  <TableHead className="h-9 px-3 w-8" />
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {todayHearings.map((h) => (
                  <TableRow
                    key={h.id}
                    className="border-b border-border/60 hover:bg-muted/30 transition-colors"
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
                    <TableCell className="text-foreground py-2.5 px-3">
                      {h.courtroom?.name || "Unassigned"}
                    </TableCell>
                    <TableCell className="text-foreground py-2.5 px-3">
                      {h.case.judge.name}
                    </TableCell>
                    <TableCell className="py-2.5 px-3">
                      {renderStatus(h.hearingStatus)}
                    </TableCell>
                    <TableCell className="py-2.5 px-3 text-right">
                      <Link href={`/registrar/cases/${h.cin}`}>
                        <ArrowRight className="size-3.5 text-muted-foreground hover:text-foreground" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Recent Activity (Last 5 AuditLog entries) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Recent Administrative Activity Log
          </h2>
        </div>

        <div className="border border-border rounded-sm bg-card divide-y divide-border/60 overflow-hidden">
          {recentAuditLogs.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No audit records recorded yet.
            </div>
          ) : (
            recentAuditLogs.map((log) => (
              <div
                key={log.id}
                className="px-3.5 py-2.5 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded border border-border bg-muted/30 text-foreground">
                      {log.action}
                    </span>
                    <span className="font-medium text-foreground">
                      {log.actor.name} ({log.actor.role})
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    Entity: {log.entity} #{log.entityId}
                  </div>
                </div>
                <div className="font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                  {format(new Date(log.createdAt), "dd MMM, HH:mm")}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
