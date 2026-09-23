import { getCurrentUser } from "@/lib/auth";
import { getLawyerBillingAction } from "@/actions/caseView.actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { CaseSearch } from "@/components/shared/case-search";
import { CreditCard, History, Info, ArrowRight, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LawyerDashboardPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "LAWYER") {
    redirect(`/${currentUser.role.toLowerCase()}`);
  }

  const billingRes = await getLawyerBillingAction();
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
              Defense & Prosecution Legal Counsel Portal
            </h1>
            <Badge variant="outline" className="text-xs font-mono rounded-sm">
              ROLE: LAWYER
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Legal precedent inspection, billed case law archive, and account ledger statements.
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

      {/* Statutory Fee Notice Banner */}
      <div className="flex items-start gap-3 p-3 bg-muted/40 border border-border rounded-sm text-xs">
        <Info className="size-4 text-accent shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-foreground">
            Statutory Judicial Record Access Fee: ₹50.00 per case docket
          </p>
          <p className="text-muted-foreground text-[11px]">
            In accordance with judicial records disclosure regulations, viewing closed case files incurs a charge of ₹50.00 per inspection session, itemized on your official billing statement.
          </p>
        </div>
      </div>

      {/* Billing Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-sm border border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center justify-between">
              <span>Cases Inspected This Month</span>
              <History className="size-3.5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight text-foreground">
              {billingData.monthlyViewCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Archived case files opened in the current billing cycle
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-sm border border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center justify-between">
              <span>Billed Charges This Month</span>
              <CreditCard className="size-3.5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight text-foreground">
              ₹{billingData.monthlyCharges.toFixed(2)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Current cycle accumulated inspection fee total
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-sm border border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center justify-between">
              <span>All-Time Incurred Charges</span>
              <ShieldCheck className="size-3.5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight text-foreground">
              ₹{billingData.totalCharges.toFixed(2)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Across {billingData.viewCount} lifetime case views
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Prominent Search Section */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center gap-2">
          <History className="size-4 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">
            Search Case Law & Precedents
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Query closed case files by party name, crime type, arresting officer, or judgment text. You will be prompted to confirm the ₹50 statutory fee before viewing details.
        </p>

        <div className="pt-2">
          <CaseSearch role="LAWYER" />
        </div>
      </div>

      {/* Navigation Ledger Card */}
      <Card className="rounded-sm border border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Itemized Billing Ledger
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <p className="text-muted-foreground">
            Review detailed itemized statements of all case inspections, timestamps, and statutory fee debits.
          </p>
          <Link
            href="/lawyer/billing"
            className="inline-flex items-center gap-1 font-medium text-foreground hover:underline text-xs"
          >
            <span>View complete billing ledger</span>
            <ArrowRight className="size-3" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
