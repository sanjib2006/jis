import { getCurrentUser } from "@/lib/auth";
import { getClosedCasesAction } from "@/actions/caseView.actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CaseSearch } from "@/components/shared/case-search";
import { LawyerHistoryTable } from "@/components/lawyer/lawyer-history-table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LawyerHistoryPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "LAWYER") {
    redirect(`/${currentUser.role.toLowerCase()}`);
  }

  const res = await getClosedCasesAction();
  const closedCases = res.success && res.data ? res.data : [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/lawyer"
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
                Archived Case Law Repository
              </h1>
              <Badge
                variant="outline"
                className="text-[10px] uppercase font-mono py-0 px-1.5 rounded-sm"
              >
                {closedCases.length}{" "}
                {closedCases.length === 1 ? "Closed Case" : "Closed Cases"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Statutory database of closed judgments, rulings, and court precedents. ₹50.00 access fee per inspection.
            </p>
          </div>
        </div>

        <Link
          href="/lawyer/billing"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-8 text-xs font-medium rounded-sm inline-flex items-center"
          )}
        >
          <CreditCard className="size-3.5 mr-1" />
          View Billing Statements
        </Link>
      </div>

      {/* Case Search at top */}
      <div className="space-y-1">
        <span className="text-[11px] font-mono text-muted-foreground uppercase">
          Quick Case Law Search:
        </span>
        <CaseSearch role="LAWYER" placeholder="Filter archive by keyword, party name, or charge section..." />
      </div>

      {/* Table with Charge Confirmation */}
      <LawyerHistoryTable cases={closedCases} />
    </div>
  );
}
