import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CinBadge } from "@/components/shared/cin-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, User, Shield, Gavel } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface CaseDetailPageProps {
  params: Promise<{ cin: string }>;
}

export default async function CaseDetailPage({ params }: CaseDetailPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "REGISTRAR") {
    redirect(`/${currentUser.role.toLowerCase()}`);
  }

  const { cin } = await params;

  const caseData = await prisma.case.findUnique({
    where: { cin },
    include: {
      judge: true,
      prosecutor: true,
      lawyer: true,
      hearings: {
        orderBy: { hearingDate: "desc" },
      },
      judgment: true,
    },
  });

  if (!caseData) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/registrar/cases"
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
                Case Docket Record
              </h1>
              <CinBadge cin={caseData.cin} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Statutory docket summary &bull; Status: {caseData.status}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="rounded-sm border border-border bg-card">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-sm font-semibold">
                Offense & Incident Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Defendant Name
                  </span>
                  <span className="font-medium text-foreground text-sm">
                    {caseData.defendantName}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Crime Classification
                  </span>
                  <span className="font-medium text-foreground text-sm">
                    {caseData.crimeType}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground block text-[11px]">
                  Defendant Address
                </span>
                <span className="text-foreground">{caseData.defendantAddress}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/40">
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Incident Location
                  </span>
                  <span className="text-foreground">{caseData.crimeLocation}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Date Crime Committed
                  </span>
                  <span className="font-mono text-foreground">
                    {format(new Date(caseData.crimeDate), "dd MMM yyyy")}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/40">
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Arresting Officer
                  </span>
                  <span className="text-foreground">{caseData.arrestingOfficer}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Arrest Date
                  </span>
                  <span className="font-mono text-foreground">
                    {format(new Date(caseData.arrestDate), "dd MMM yyyy")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-sm border border-border bg-card">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-sm font-semibold">
                Scheduled Proceedings (Phase 4 Module)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-xs text-muted-foreground">
              {caseData.hearings.length === 0 ? (
                <p>
                  No hearings scheduled for this case yet. The slot scheduling and adjournment engine will be connected in Phase 4.
                </p>
              ) : (
                <p>{caseData.hearings.length} hearings recorded.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-sm border border-border bg-card">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-sm font-semibold">
                Assigned Personnel
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5 text-xs">
              <div className="flex items-start gap-2.5">
                <Gavel className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="text-[11px] text-muted-foreground block">
                    Presiding Judge
                  </span>
                  <span className="font-medium text-foreground">
                    {caseData.judge.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono block">
                    {caseData.judge.email}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Shield className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="text-[11px] text-muted-foreground block">
                    Public Prosecutor
                  </span>
                  <span className="font-medium text-foreground">
                    {caseData.prosecutor.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono block">
                    {caseData.prosecutor.email}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <User className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="text-[11px] text-muted-foreground block">
                    Defense Counsel
                  </span>
                  <span className="font-medium text-foreground">
                    {caseData.lawyer.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono block">
                    {caseData.lawyer.email}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-sm border border-border bg-card">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-sm font-semibold">
                Trial Timetable
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground shrink-0" />
                <div>
                  <span className="text-[11px] text-muted-foreground block">
                    Commencement Date
                  </span>
                  <span className="font-mono text-foreground">
                    {format(new Date(caseData.trialStartDate), "dd MMM yyyy")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground shrink-0" />
                <div>
                  <span className="text-[11px] text-muted-foreground block">
                    Expected Completion
                  </span>
                  <span className="font-mono text-foreground">
                    {format(new Date(caseData.expectedCompletionDate), "dd MMM yyyy")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
