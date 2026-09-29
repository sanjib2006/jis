"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types";
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  differenceInDays,
} from "date-fns";

export interface MonthlyTrendData {
  month: string;
  monthKey: string;
  registered: number;
  closed: number;
}

export interface StatusBreakdownData {
  status: "REGISTERED" | "PENDING" | "ADJOURNED" | "RESOLVED" | "CLOSED";
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface HearingEfficiencyData {
  totalHearings: number;
  completed: number;
  adjourned: number;
  scheduled: number;
  completionRate: number;
  adjournmentRate: number;
  scheduledRate: number;
}

export interface CourtroomUtilizationData {
  courtroomId: string;
  courtroomName: string;
  location: string | null;
  totalHearings: number;
  completedHearings: number;
  scheduledHearings: number;
}

export interface RegistrarAnalyticsSummary {
  totalCases: number;
  activeCases: number;
  disposedCases: number;
  clearanceRate: number;
  avgResolutionDays: number;
  monthlyTrends: MonthlyTrendData[];
  statusBreakdown: StatusBreakdownData[];
  hearingEfficiency: HearingEfficiencyData;
  courtroomUtilization: CourtroomUtilizationData[];
}

export async function getRegistrarAnalyticsAction(): Promise<
  ActionResult<RegistrarAnalyticsSummary>
> {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "REGISTRAR") {
    return {
      success: false,
      error: "Unauthorized. Registrar access required for judicial caseload intelligence.",
    };
  }

  try {
    const now = new Date();

    // 1. Fetch all cases with necessary relations for trend & status calculations
    const cases = await prisma.case.findMany({
      select: {
        cin: true,
        status: true,
        createdAt: true,
        trialStartDate: true,
        judgment: {
          select: {
            judgmentDate: true,
          },
        },
      },
    });

    // 2. Fetch all hearings for completion rates
    const hearings = await prisma.hearing.findMany({
      select: {
        id: true,
        hearingStatus: true,
        hearingDate: true,
        courtroomId: true,
      },
    });

    // 3. Fetch Courtrooms with hearings
    const courtrooms = await prisma.courtroom.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        location: true,
        hearings: {
          select: {
            id: true,
            hearingStatus: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const totalCases = cases.length;

    // Status Counts & Breakdown
    const statusCounts: Record<string, number> = {
      REGISTERED: 0,
      PENDING: 0,
      ADJOURNED: 0,
      RESOLVED: 0,
      CLOSED: 0,
    };

    let totalResolutionDays = 0;
    let resolvedCaseCount = 0;

    for (const c of cases) {
      if (statusCounts[c.status] !== undefined) {
        statusCounts[c.status]++;
      }

      if (c.judgment && (c.status === "CLOSED" || c.status === "RESOLVED")) {
        const jDate = new Date(c.judgment.judgmentDate);
        const sDate = new Date(c.trialStartDate || c.createdAt);
        const days = Math.max(0, differenceInDays(jDate, sDate));
        totalResolutionDays += days;
        resolvedCaseCount++;
      }
    }

    const activeCases =
      statusCounts.REGISTERED + statusCounts.PENDING + statusCounts.ADJOURNED;
    const disposedCases = statusCounts.RESOLVED + statusCounts.CLOSED;
    const clearanceRate =
      totalCases > 0 ? Math.round((disposedCases / totalCases) * 1000) / 10 : 0;
    const avgResolutionDays =
      resolvedCaseCount > 0
        ? Math.round(totalResolutionDays / resolvedCaseCount)
        : 0;

    // Status breakdown array formatted with government slate-navy palette colors
    const statusConfig = [
      {
        status: "REGISTERED" as const,
        label: "Registered",
        color: "#64748b", // slate-500
      },
      {
        status: "PENDING" as const,
        label: "Active Trial (Pending)",
        color: "#d97706", // amber-600
      },
      {
        status: "ADJOURNED" as const,
        label: "Adjourned",
        color: "#e11d48", // rose-600
      },
      {
        status: "RESOLVED" as const,
        label: "Resolved",
        color: "#059669", // emerald-600
      },
      {
        status: "CLOSED" as const,
        label: "Closed & Archived",
        color: "#0f172a", // slate-900 / primary
      },
    ];

    const statusBreakdown: StatusBreakdownData[] = statusConfig.map((cfg) => {
      const count = statusCounts[cfg.status] || 0;
      const percentage =
        totalCases > 0 ? Math.round((count / totalCases) * 1000) / 10 : 0;
      return {
        status: cfg.status,
        label: cfg.label,
        count,
        percentage,
        color: cfg.color,
      };
    });

    // 4. Monthly Trend: Past 6 calendar months
    const monthlyTrends: MonthlyTrendData[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const mStart = startOfMonth(monthDate);
      const mEnd = endOfMonth(monthDate);
      const monthKey = format(monthDate, "yyyy-MM");
      const monthLabel = format(monthDate, "MMM yyyy");

      let regCount = 0;
      let closedCount = 0;

      for (const c of cases) {
        const created = new Date(c.createdAt);
        if (created >= mStart && created <= mEnd) {
          regCount++;
        }

        if (c.judgment && (c.status === "CLOSED" || c.status === "RESOLVED")) {
          const jDate = new Date(c.judgment.judgmentDate);
          if (jDate >= mStart && jDate <= mEnd) {
            closedCount++;
          }
        }
      }

      monthlyTrends.push({
        month: monthLabel,
        monthKey,
        registered: regCount,
        closed: closedCount,
      });
    }

    // 5. Hearing Efficiency & Completion Rates
    const totalHearings = hearings.length;
    let completedHearings = 0;
    let adjournedHearings = 0;
    let scheduledHearings = 0;

    for (const h of hearings) {
      if (h.hearingStatus === "COMPLETED") completedHearings++;
      else if (h.hearingStatus === "ADJOURNED") adjournedHearings++;
      else if (h.hearingStatus === "SCHEDULED") scheduledHearings++;
    }

    const completionRate =
      totalHearings > 0
        ? Math.round((completedHearings / totalHearings) * 1000) / 10
        : 0;
    const adjournmentRate =
      totalHearings > 0
        ? Math.round((adjournedHearings / totalHearings) * 1000) / 10
        : 0;
    const scheduledRate =
      totalHearings > 0
        ? Math.round((scheduledHearings / totalHearings) * 1000) / 10
        : 0;

    const hearingEfficiency: HearingEfficiencyData = {
      totalHearings,
      completed: completedHearings,
      adjourned: adjournedHearings,
      scheduled: scheduledHearings,
      completionRate,
      adjournmentRate,
      scheduledRate,
    };

    // 6. Courtroom Utilization
    const courtroomUtilization: CourtroomUtilizationData[] = courtrooms.map(
      (cr) => {
        let completed = 0;
        let scheduled = 0;

        for (const h of cr.hearings) {
          if (h.hearingStatus === "COMPLETED") completed++;
          else if (h.hearingStatus === "SCHEDULED") scheduled++;
        }

        return {
          courtroomId: cr.id,
          courtroomName: cr.name,
          location: cr.location,
          totalHearings: cr.hearings.length,
          completedHearings: completed,
          scheduledHearings: scheduled,
        };
      }
    );

    return {
      success: true,
      data: {
        totalCases,
        activeCases,
        disposedCases,
        clearanceRate,
        avgResolutionDays,
        monthlyTrends,
        statusBreakdown,
        hearingEfficiency,
        courtroomUtilization,
      },
    };
  } catch (error) {
    console.error("Error computing registrar analytics:", error);
    return {
      success: false,
      error: "Failed to generate judicial caseload analytics data.",
    };
  }
}
