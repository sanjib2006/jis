import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { CaseSearch } from "@/components/shared/case-search";
import { CinBadge } from "@/components/shared/cin-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { History, FileText, Gavel, Calendar, Scale, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export const revalidate = 15;

export default async function JudgeDashboardPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "JUDGE") {
    redirect(`/${currentUser.role.toLowerCase()}`);
  }

  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const [todayHearings, activeCasesCount, closedCasesCount] = await Promise.all([
    prisma.hearing.findMany({
      where: {
        hearingDate: { gte: startOfDay, lte: endOfDay },
        case: { judgeId: currentUser.id },
      },
      include: {
        case: {
          include: {
            prosecutor: true,
            lawyer: true,
          },
        },
        courtroom: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.case.count({
      where: {
        judgeId: currentUser.id,
        status: { in: ["REGISTERED", "PENDING", "ADJOURNED"] },
      },
    }),
    prisma.case.count({
      where: {
        status: { in: ["CLOSED", "RESOLVED"] },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Judicial Bench & Chambers Portal
            </h1>
            <Badge variant="outline" className="text-xs font-mono rounded-sm">
              PRESIDING OFFICER: {currentUser.name}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Active chamber cause list, trial docket management, and complimentary jurisprudence archive.
          </p>
        </div>

        <Link
          href="/judge/history"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-8 text-xs font-medium rounded-sm inline-flex items-center"
          )}
        >
          <History className="size-3.5 mr-1" />
          Browse Archive Register
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-sm border border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center justify-between">
              <span>Today&apos;s Listed Hearings</span>
              <Calendar className="size-3.5 text-accent" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight text-foreground">
              {todayHearings.length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Matters scheduled before your bench today
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-sm border border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center justify-between">
              <span>Active Trial Dockets</span>
              <Scale className="size-3.5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight text-foreground">
              {activeCasesCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Ongoing cases allocated to your court
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-sm border border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center justify-between">
              <span>Historical Precedents</span>
              <History className="size-3.5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight text-foreground">
              {closedCasesCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Adjudicated dockets available for research
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Bench & Cause List Section */}
      <Card className="rounded-sm border border-border bg-card">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Gavel className="size-4 text-accent" />
                <span>Today&apos;s Chamber Cause List</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Official court sitting schedule and cause list for your assigned bench.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[11px] font-mono rounded-sm">
              {today.toLocaleDateString("en-IN", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {todayHearings.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground space-y-1">
              <Clock className="size-5 mx-auto text-muted-foreground/60 mb-2" />
              <p className="font-medium text-foreground">No hearings scheduled on your bench today.</p>
              <p>
                You have <span className="font-semibold text-foreground">{activeCasesCount}</span> active trial docket{activeCasesCount === 1 ? "" : "s"} currently pending in your court.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-border/60 bg-muted/40 text-[11px]">
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead className="w-36">Docket CIN</TableHead>
                    <TableHead>Defendant & Charge</TableHead>
                    <TableHead className="w-36">Courtroom</TableHead>
                    <TableHead>Public Prosecutor</TableHead>
                    <TableHead>Defense Counsel</TableHead>
                    <TableHead className="w-24 text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {todayHearings.map((h, idx) => (
                    <TableRow key={h.id} className="border-b border-border/40 hover:bg-muted/30">
                      <TableCell className="text-center font-mono text-[11px] text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <CinBadge cin={h.case.cin} />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{h.case.defendantName}</div>
                        <div className="text-[11px] text-muted-foreground">{h.case.crimeType}</div>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {h.courtroom?.name || "Unassigned"}
                        {h.courtroom?.location && (
                          <div className="text-[10px] text-muted-foreground">{h.courtroom.location}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground">
                        {h.case.prosecutor.name}
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground">
                        {h.case.lawyer.name}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] uppercase font-mono rounded-sm",
                            h.hearingStatus === "SCHEDULED" && "text-accent border-accent/40 bg-accent/10",
                            h.hearingStatus === "COMPLETED" && "text-emerald-600 border-emerald-600/30 bg-emerald-500/10",
                            h.hearingStatus === "ADJOURNED" && "text-destructive border-destructive/30 bg-destructive/10"
                          )}
                        >
                          {h.hearingStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Precedent Keyword Search Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">
            Universal Jurisprudence & Precedent Search
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Instant multi-field search across Case Identification Numbers, defendants, crime sections, and recorded judgment decrees.
        </p>

        <div className="pt-2">
          <CaseSearch role="JUDGE" />
        </div>
      </div>
    </div>
  );
}
