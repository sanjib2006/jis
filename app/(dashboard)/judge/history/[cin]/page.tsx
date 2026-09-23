import { getCurrentUser } from "@/lib/auth";
import { viewCaseAsJudgeAction } from "@/actions/caseView.actions";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CinBadge } from "@/components/shared/cin-badge";
import { CaseDetail } from "@/components/shared/case-detail";
import { HearingTimeline } from "@/components/shared/hearing-timeline";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft, Lock, Gavel } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface JudgeCaseDetailPageProps {
  params: Promise<{ cin: string }>;
}

export default async function JudgeCaseDetailPage({
  params,
}: JudgeCaseDetailPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "JUDGE") {
    redirect(`/${currentUser.role.toLowerCase()}`);
  }

  const { cin } = await params;
  const res = await viewCaseAsJudgeAction(cin);

  if (!res.success || !res.data) {
    notFound();
  }

  const caseData = res.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/judge/history"
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
                Judicial Archive Record
              </h1>
              <CinBadge cin={caseData.cin} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Closed litigation history and decree orders for Case #{caseData.cin}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-sm border border-border bg-muted/50 text-foreground">
            <Gavel className="size-3.5 text-accent" />
            Complimentary Judicial Access
          </span>
        </div>
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
