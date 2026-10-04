import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLawyerBillingAction } from "@/actions/caseView.actions";
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
import {
  CreditCard,
  History,
  Info,
  Scale,
  Calendar,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export const revalidate = 15;

export default async function LawyerDashboardPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "LAWYER") {
    redirect(`/${currentUser.role.toLowerCase()}`);
  }

  const [billingRes, assignedCases, upcomingHearings] = await Promise.all([
    getLawyerBillingAction(),
    prisma.case.findMany({
      where: {
        OR: [
          { lawyerId: currentUser.id },
          { prosecutorId: currentUser.id },
        ],
        status: { in: ["REGISTERED", "PENDING", "ADJOURNED"] },
      },
      include: {
        judge: true,
        prosecutor: true,
        lawyer: true,
        hearings: {
          where: { hearingStatus: "SCHEDULED" },
          orderBy: { hearingDate: "asc" },
          take: 1,
          include: { courtroom: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.hearing.findMany({
      where: {
        hearingStatus: "SCHEDULED",
        hearingDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        case: {
          OR: [
            { lawyerId: currentUser.id },
            { prosecutorId: currentUser.id },
          ],
        },
      },
      include: {
        case: true,
        courtroom: true,
      },
      orderBy: { hearingDate: "asc" },
      take: 5,
    }),
  ]);

  const billingData = billingRes.success && billingRes.data
    ? billingRes.data
    : { views: [], totalCharges: 0, viewCount: 0, monthlyCharges: 0, monthlyViewCount: 0 };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Advocate & Legal Counsel Practice Portal
            </h1>
            <Badge variant="outline" className="text-xs font-mono rounded-sm">
              LEGAL COUNSEL: {currentUser.name}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Active trial representations, listed court appearances, and statutory case law research.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/lawyer/history"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-8 text-xs font-medium rounded-sm inline-flex items-center"
            )}
          >
            <History className="size-3.5 mr-1" />
            Case Law Search
          </Link>
          <Link
            href="/lawyer/billing"
            className={cn(
              buttonVariants({ size: "sm" }),
              "h-8 text-xs font-medium rounded-sm inline-flex items-center"
            )}
          >
            <CreditCard className="size-3.5 mr-1" />
            Billing Statements
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-sm border border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center justify-between">
              <span>Active Represented Briefs</span>
              <Briefcase className="size-3.5 text-accent" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight text-foreground">
              {assignedCases.length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Ongoing trials where you are counsel of record
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-sm border border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center justify-between">
              <span>Upcoming Court Appearances</span>
              <Calendar className="size-3.5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight text-foreground">
              {upcomingHearings.length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Scheduled chamber hearings on your court calendar
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-sm border border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center justify-between">
              <span>Precedent Inspections (This Month)</span>
              <History className="size-3.5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight text-foreground">
              {billingData.monthlyViewCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Archived files inspected (₹{billingData.monthlyCharges.toFixed(2)} accrued)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Matters & Appearances Section */}
      <Card className="rounded-sm border border-border bg-card">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Scale className="size-4 text-accent" />
                <span>My Represented Cases & Listed Appearances</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Active trial briefs where you represent the State or Defense.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[11px] font-mono rounded-sm">
              {assignedCases.length} Active Docket{assignedCases.length === 1 ? "" : "s"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {assignedCases.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground space-y-1">
              <Scale className="size-5 mx-auto text-muted-foreground/60 mb-2" />
              <p className="font-medium text-foreground">No active trial dockets currently assigned.</p>
              <p>
                When the Registrar registers a case assigning you as Public Prosecutor or Defense Counsel, it will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-border/60 bg-muted/40 text-[11px]">
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead className="w-36">Docket CIN</TableHead>
                    <TableHead className="w-32">Counsel Role</TableHead>
                    <TableHead>Defendant & Charge</TableHead>
                    <TableHead>Presiding Judge</TableHead>
                    <TableHead className="w-44">Next Listed Sitting</TableHead>
                    <TableHead className="w-24 text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {assignedCases.map((c, idx) => {
                    const isProsecutor = c.prosecutorId === currentUser.id;
                    const nextHearing = c.hearings[0];

                    return (
                      <TableRow key={c.cin} className="border-b border-border/40 hover:bg-muted/30">
                        <TableCell className="text-center font-mono text-[11px] text-muted-foreground">
                          {idx + 1}
                        </TableCell>
                        <TableCell>
                          <CinBadge cin={c.cin} />
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-mono uppercase rounded-sm",
                              isProsecutor
                                ? "text-blue-600 border-blue-600/30 bg-blue-500/10"
                                : "text-amber-600 border-amber-600/30 bg-amber-500/10"
                            )}
                          >
                            {isProsecutor ? "Prosecution" : "Defense"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-foreground">{c.defendantName}</div>
                          <div className="text-[11px] text-muted-foreground">{c.crimeType}</div>
                        </TableCell>
                        <TableCell className="text-[11px] text-muted-foreground">
                          {c.judge.name}
                        </TableCell>
                        <TableCell className="text-[11px]">
                          {nextHearing ? (
                            <div>
                              <div className="font-medium text-foreground">
                                {format(new Date(nextHearing.hearingDate), "dd MMM yyyy")}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                {nextHearing.courtroom?.name || "Court Chamber"}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">No sitting scheduled</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-mono text-[10px] uppercase text-muted-foreground font-semibold px-1.5 py-0.5 rounded border border-border bg-muted/30">
                            {c.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statutory Fee Notice Banner */}
      <div className="flex items-start gap-3 p-3 bg-muted/40 border border-border rounded-sm text-xs">
        <Info className="size-4 text-accent shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-foreground">
            Statutory Judicial Record Access: ₹50.00 per 24-hour docket pass
          </p>
          <p className="text-muted-foreground text-[11px]">
            In accordance with judicial records disclosure regulations, viewing closed third-party case precedents incurs a statutory inspection fee of ₹50.00 (valid for 24 hours). Cases where you served as counsel of record are complimentary.
          </p>
        </div>
      </div>

      {/* Precedent Search Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <History className="size-4 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">
            Search Case Law & Precedents
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Query closed case files by party name, crime type, arresting officer, or judgment text.
        </p>

        <div className="pt-2">
          <CaseSearch role="LAWYER" />
        </div>
      </div>
    </div>
  );
}
