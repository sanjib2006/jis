import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CinBadge } from "@/components/shared/cin-badge";
import { CaseDetail } from "@/components/shared/case-detail";
import { HearingTimeline } from "@/components/shared/hearing-timeline";
import { ScheduleHearingDialog } from "@/components/hearings/schedule-dialog";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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

  const [caseData, courtrooms] = await Promise.all([
    prisma.case.findUnique({
      where: { cin },
      include: {
        judge: true,
        prosecutor: true,
        lawyer: true,
        hearings: {
          include: { courtroom: true },
          orderBy: { hearingDate: "desc" },
        },
        judgment: true,
      },
    }),
    prisma.courtroom.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!caseData) {
    notFound();
  }

  const isCaseClosed =
    caseData.status === "CLOSED" || caseData.status === "RESOLVED";

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
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
              Official judicial proceedings and timeline for Case #{caseData.cin}
            </p>
          </div>
        </div>

        {/* Action Bar */}
        {!isCaseClosed && (
          <div className="flex items-center gap-2">
            <ScheduleHearingDialog
              cin={caseData.cin}
              judgeId={caseData.judgeId}
            />
          </div>
        )}
      </div>

      {/* Case Details Card */}
      <CaseDetail caseData={caseData} />

      {/* Hearing Timeline Section */}
      <div className="space-y-3 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Official Hearings & Proceedings Timeline
            </h2>
            <p className="text-xs text-muted-foreground">
              Chronological log of courtroom sessions, adjournments, and recorded summaries.
            </p>
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {caseData.hearings.length} {caseData.hearings.length === 1 ? "Session" : "Sessions"}
          </span>
        </div>

        <HearingTimeline
          hearings={caseData.hearings}
          courtrooms={courtrooms}
          canManage={true}
        />
      </div>
    </div>
  );
}
