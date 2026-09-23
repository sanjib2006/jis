import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/actions/audit.actions";
import { CHARGE_PER_VIEW } from "@/lib/constants";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CinBadge } from "@/components/shared/cin-badge";
import { CaseDetail } from "@/components/shared/case-detail";
import { HearingTimeline } from "@/components/shared/hearing-timeline";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft, CreditCard, Lock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface LawyerCaseDetailPageProps {
  params: Promise<{ cin: string }>;
}

export default async function LawyerCaseDetailPage({
  params,
}: LawyerCaseDetailPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "LAWYER") {
    redirect(`/${currentUser.role.toLowerCase()}`);
  }

  const { cin } = await params;

  const caseData = await prisma.case.findUnique({
    where: { cin: cin.trim() },
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
  });

  if (!caseData) {
    notFound();
  }

  if (caseData.status !== "CLOSED" && caseData.status !== "RESOLVED") {
    notFound();
  }

  // Find latest viewing record for this lawyer and case
  let latestView = await prisma.caseView.findFirst({
    where: {
      lawyerId: currentUser.id,
      cin: caseData.cin,
    },
    orderBy: { viewedAt: "desc" },
  });

  // If accessed directly via URL without prior confirmation log, record statutory view
  if (!latestView) {
    latestView = await prisma.caseView.create({
      data: {
        lawyerId: currentUser.id,
        cin: caseData.cin,
        chargeAmount: CHARGE_PER_VIEW,
      },
    });

    await logAudit(currentUser.id, "CASE_VIEWED", "CaseView", latestView.id, {
      cin: caseData.cin,
      chargeAmount: CHARGE_PER_VIEW,
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/lawyer/history"
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
                Archived Case Law Record
              </h1>
              <CinBadge cin={caseData.cin} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Closed litigation jurisprudence and decree order for Case #{caseData.cin}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/lawyer/billing"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-8 text-xs font-medium rounded-sm inline-flex items-center"
            )}
          >
            <CreditCard className="size-3.5 mr-1" />
            View Ledger
          </Link>
        </div>
      </div>

      {/* Charge Notice Strip */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border border-border rounded-sm text-xs font-mono text-muted-foreground">
        <div className="flex items-center gap-2 text-foreground">
          <CreditCard className="size-3.5 text-accent" />
          <span>
            Billed Access: ₹50.00 statutory inspection fee charged on{" "}
            {format(new Date(latestView.viewedAt), "dd MMM yyyy, HH:mm")}
          </span>
        </div>
        <span className="text-[11px] hidden sm:inline">
          View ID: {latestView.id.slice(0, 8)}
        </span>
      </div>

      {/* Case Details Card with Judgment Findings */}
      <CaseDetail caseData={caseData} />

      {/* Hearing Timeline Section (Read-Only) */}
      <div className="space-y-3 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              <span>Historical Proceedings Timeline</span>
              <Lock className="size-3.5 text-muted-foreground" />
            </h2>
            <p className="text-xs text-muted-foreground">
              Official courtroom minutes, depositions, and proceedings for this closed litigation.
            </p>
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {caseData.hearings.length}{" "}
            {caseData.hearings.length === 1 ? "Session" : "Sessions"}
          </span>
        </div>

        <HearingTimeline
          hearings={caseData.hearings}
          courtrooms={[]}
          canManage={false}
        />
      </div>
    </div>
  );
}
