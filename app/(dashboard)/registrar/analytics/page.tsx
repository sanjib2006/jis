import { getCurrentUser } from "@/lib/auth";
import { getRegistrarAnalyticsAction } from "@/actions/analytics.actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { MonthlyTrendChart } from "@/components/analytics/monthly-trend-chart";
import { StatusBreakdownChart } from "@/components/analytics/status-breakdown-chart";
import { HearingEfficiencyCard } from "@/components/analytics/hearing-efficiency-card";
import { CourtroomUtilizationCard } from "@/components/analytics/courtroom-utilization-card";
import { AnalyticsPrintButton } from "@/components/analytics/analytics-print-button";
import {
  ArrowLeft,
  Calendar,
  Scale,
  Clock,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const revalidate = 15;

export default async function RegistrarAnalyticsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "REGISTRAR") {
    redirect(`/${currentUser.role.toLowerCase()}`);
  }

  const res = await getRegistrarAnalyticsAction();
  if (!res.success || !res.data) {
    return (
      <div className="p-8 text-center text-destructive text-sm">
        {res.error || "Failed to load judicial analytics data."}
      </div>
    );
  }

  const analytics = res.data;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/registrar"
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
                Judicial Caseload Analytics & Docket Intelligence
              </h1>
              <Badge variant="outline" className="text-xs font-mono rounded-sm">
                REGISTRAR INTELLIGENCE
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Official statistical reporting on case disposition, trial duration, hearing completion efficiency, and courtroom load.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AnalyticsPrintButton />
          <Link
            href="/registrar/cases"
            className={cn(
              buttonVariants({ size: "sm" }),
              "h-8 text-xs font-medium rounded-sm inline-flex items-center"
            )}
          >
            <FileText className="size-3.5 mr-1" />
            Case Dockets
          </Link>
        </div>
      </div>

      {/* 4-Metric High Level Statutory KPI Strip */}
      <div className="border border-border rounded-sm bg-card p-4 grid grid-cols-2 lg:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
        <div className="px-3 pt-2 sm:pt-0">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-semibold tracking-tight text-foreground font-mono">
              {analytics.totalCases}
            </span>
            <Scale className="size-4 text-muted-foreground" />
          </div>
          <div className="text-xs text-muted-foreground uppercase font-mono tracking-wider mt-1">
            Total Enrolled Caseload
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Lifetime recorded legal actions
          </div>
        </div>

        <div className="px-3 pt-2 sm:pt-0">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-semibold tracking-tight text-foreground font-mono">
              {analytics.activeCases}
            </span>
            <Calendar className="size-4 text-amber-600" />
          </div>
          <div className="text-xs text-muted-foreground uppercase font-mono tracking-wider mt-1">
            Active Trial Proceedings
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Registered, pending & adjourned dockets
          </div>
        </div>

        <div className="px-3 pt-2 sm:pt-0">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-semibold tracking-tight text-foreground font-mono">
              {analytics.clearanceRate.toFixed(1)}%
            </span>
            <CheckCircle2 className="size-4 text-emerald-600" />
          </div>
          <div className="text-xs text-muted-foreground uppercase font-mono tracking-wider mt-1">
            Case Clearance Rate
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {analytics.disposedCases} disposed of {analytics.totalCases} total cases
          </div>
        </div>

        <div className="px-3 pt-2 sm:pt-0">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-semibold tracking-tight text-foreground font-mono">
              ~{analytics.avgResolutionDays} <span className="text-base font-normal text-muted-foreground">days</span>
            </span>
            <Clock className="size-4 text-accent" />
          </div>
          <div className="text-xs text-muted-foreground uppercase font-mono tracking-wider mt-1">
            Avg. Trial Disposal Window
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            From commencement to decree entry
          </div>
        </div>
      </div>

      {/* Main Analytics Grid: Dominant 2/3 + 1/3 layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dominant 2-col Column: Trends & Status Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <MonthlyTrendChart data={analytics.monthlyTrends} />
          <StatusBreakdownChart
            data={analytics.statusBreakdown}
            totalCases={analytics.totalCases}
          />
        </div>

        {/* Secondary 1-col Sidebar: Hearing Efficiency & Bench Load */}
        <div className="space-y-6">
          <HearingEfficiencyCard data={analytics.hearingEfficiency} />
          <CourtroomUtilizationCard data={analytics.courtroomUtilization} />
        </div>
      </div>
    </div>
  );
}
