import { tool, type ToolSet } from "ai";
import { z } from "zod";
import {
  searchCasesAction,
  getCaseByCinAction,
  getPendingCasesAction,
  getResolvedCasesAction,
} from "@/actions/case.actions";
import {
  getHearingsByDateAction,
  getAvailableSlotsAction,
} from "@/actions/hearing.actions";
import { getAllCourtroomsAction } from "@/actions/courtroom.actions";
import { getRegistrarAnalyticsAction } from "@/actions/analytics.actions";
import {
  getClosedCasesAction,
  getLawyerBillingAction,
} from "@/actions/caseView.actions";
import type { CurrentUser } from "@/types";

/**
 * Recursively serializes objects containing Dates and Decimals into clean JSON.
 */
function serialize<T>(data: T): unknown {
  return JSON.parse(
    JSON.stringify(data, (_, value) => {
      if (typeof value === "bigint") return value.toString();
      return value;
    })
  );
}

/**
 * Factory for creating role-scoped AI tools.
 */
export function createAiTools(user: CurrentUser): ToolSet {
  // 1. Universal Search Tool (All Roles)
  const searchCases = tool({
    description:
      "Search cases by keyword across CIN, defendant name, crime type, location, or judgment summary. For Judge/Lawyer, results are automatically filtered to closed/resolved cases.",
    inputSchema: z.object({
      query: z
        .string()
        .min(1)
        .describe("Keyword, case number (CIN), crime type, defendant name, or legal phrase"),
    }),
    execute: async ({ query }) => {
      const result = await searchCasesAction(query);
      if (!result.success) {
        return { error: result.error || "Search failed." };
      }
      return {
        count: result.data?.length || 0,
        cases: serialize(
          (result.data || []).map((c) => ({
            cin: c.cin,
            defendantName: c.defendantName,
            crimeType: c.crimeType,
            status: c.status,
            judgeName: c.judge?.name,
            judgmentDate: c.judgment?.judgmentDate,
            judgmentSummary: c.judgment?.summary
              ? c.judgment.summary.slice(0, 200) + "..."
              : null,
          }))
        ),
      };
    },
  });

  // 2. Case Docket Details Tool (All Roles)
  const getCaseDetails = tool({
    description:
      "Retrieve full case docket by CIN, including trial history, defendant info, assigned counsel, and final judgment.",
    inputSchema: z.object({
      cin: z.string().describe("The official Case Identification Number (e.g., CIN-2026-XXXX)"),
    }),
    execute: async ({ cin }) => {
      const result = await getCaseByCinAction(cin);
      if (!result.success || !result.data) {
        return { error: result.error || `Case '${cin}' not found.` };
      }

      const caseData = result.data;

      // Role boundary check: Judges and Lawyers can only view CLOSED/RESOLVED cases
      if (
        user.role !== "REGISTRAR" &&
        caseData.status !== "CLOSED" &&
        caseData.status !== "RESOLVED"
      ) {
        return {
          error: `Case '${cin}' is currently active/pending. Under court privacy rules, only the Registrar has access to non-closed dockets.`,
        };
      }

      return serialize({
        cin: caseData.cin,
        defendantName: caseData.defendantName,
        defendantAddress: caseData.defendantAddress,
        crimeType: caseData.crimeType,
        crimeDate: caseData.crimeDate,
        crimeLocation: caseData.crimeLocation,
        arrestingOfficer: caseData.arrestingOfficer,
        arrestDate: caseData.arrestDate,
        status: caseData.status,
        judgeName: caseData.judge?.name,
        prosecutorName: caseData.prosecutor?.name,
        lawyerName: caseData.lawyer?.name,
        hearings: (caseData.hearings || []).map((h) => ({
          hearingDate: h.hearingDate,
          status: h.hearingStatus,
          courtroomName: h.courtroom?.name || "Unassigned",
          proceedingSummary: h.proceedingSummary,
          adjournmentReason: h.adjournmentReason,
        })),
        judgment: caseData.judgment
          ? {
              judgmentDate: caseData.judgment.judgmentDate,
              summary: caseData.judgment.summary,
            }
          : null,
      });
    },
  });

  // 3. Pending Cases Tool (Registrar Only)
  const getPendingCases = tool({
    description:
      "List all active court cases that are currently pending, registered, or adjourned.",
    inputSchema: z.object({}),
    execute: async () => {
      if (user.role !== "REGISTRAR") {
        return { error: "Access denied. Registrar privilege required." };
      }
      const result = await getPendingCasesAction();
      if (!result.success) {
        return { error: result.error || "Failed to retrieve pending cases." };
      }
      return {
        totalPending: result.data?.length || 0,
        cases: serialize(
          (result.data || []).slice(0, 25).map((c) => ({
            cin: c.cin,
            defendantName: c.defendantName,
            crimeType: c.crimeType,
            status: c.status,
            judgeName: c.judge?.name,
            trialStartDate: c.trialStartDate,
          }))
        ),
      };
    },
  });

  // 4. Resolved Cases Tool (Registrar Only)
  const getResolvedCases = tool({
    description:
      "Query resolved cases by date range (defaults to past 30 days if omitted).",
    inputSchema: z.object({
      fromDate: z.string().optional().describe("Start date in YYYY-MM-DD format"),
      toDate: z.string().optional().describe("End date in YYYY-MM-DD format"),
    }),
    execute: async ({ fromDate, toDate }) => {
      if (user.role !== "REGISTRAR") {
        return { error: "Access denied. Registrar privilege required." };
      }
      const result = await getResolvedCasesAction(fromDate, toDate);
      if (!result.success) {
        return { error: result.error || "Failed to retrieve resolved cases." };
      }
      return {
        count: result.data?.length || 0,
        cases: serialize(
          (result.data || []).map((c) => ({
            cin: c.cin,
            defendantName: c.defendantName,
            crimeType: c.crimeType,
            judgmentDate: c.judgment?.judgmentDate,
            judgmentSummary: c.judgment?.summary,
            judgeName: c.judge?.name,
          }))
        ),
      };
    },
  });

  // 5. Courtroom Availability Tool (Registrar Only)
  const getCourtroomAvailability = tool({
    description:
      "Check available courtroom hearing slots and judge scheduling conflicts for a specific date.",
    inputSchema: z.object({
      date: z.string().describe("Target date in YYYY-MM-DD format"),
      judgeId: z
        .string()
        .optional()
        .describe("Optional judge user ID to check for scheduling conflicts"),
    }),
    execute: async ({ date, judgeId }) => {
      if (user.role !== "REGISTRAR") {
        return { error: "Access denied. Registrar privilege required." };
      }

      if (judgeId) {
        const result = await getAvailableSlotsAction(date, judgeId);
        if (!result.success) {
          return { error: result.error || "Failed to query courtroom slots." };
        }
        return serialize(result.data);
      }

      // If no judge specified, return all active courtrooms and hearings for the day
      const [courtroomsRes, hearingsRes] = await Promise.all([
        getAllCourtroomsAction(),
        getHearingsByDateAction(date),
      ]);

      const courtrooms = courtroomsRes.data || [];
      const hearings = hearingsRes.data || [];

      const utilization = courtrooms.map((cr) => {
        const booked = hearings.filter((h) => h.courtroomId === cr.id).length;
        return {
          courtroomId: cr.id,
          courtroomName: cr.name,
          location: cr.location,
          maxSlots: cr.maxSlots,
          bookedSlots: booked,
          remainingSlots: Math.max(0, cr.maxSlots - booked),
        };
      });

      return serialize({
        date,
        totalHearingsOnDate: hearings.length,
        courtrooms: utilization,
      });
    },
  });

  // 6. Hearings by Date Tool (Registrar Only)
  const getHearingsForDate = tool({
    description: "List all scheduled or completed hearings for a specific calendar date.",
    inputSchema: z.object({
      date: z.string().describe("Date in YYYY-MM-DD format"),
    }),
    execute: async ({ date }) => {
      if (user.role !== "REGISTRAR") {
        return { error: "Access denied. Registrar privilege required." };
      }
      const result = await getHearingsByDateAction(date);
      if (!result.success) {
        return { error: result.error || "Failed to retrieve hearings." };
      }
      return serialize(
        (result.data || []).map((h) => ({
          cin: h.cin,
          courtroomName: h.courtroom?.name || "Unassigned",
          status: h.hearingStatus,
          defendantName: h.case?.defendantName,
          judgeName: h.case?.judge?.name,
          proceedingSummary: h.proceedingSummary,
          adjournmentReason: h.adjournmentReason,
        }))
      );
    },
  });

  // 7. Caseload Analytics Tool (Registrar Only)
  const getAnalyticsSummary = tool({
    description:
      "Retrieve judicial system analytics including total cases, active vs disposed count, clearance rate, and average resolution time.",
    inputSchema: z.object({}),
    execute: async () => {
      if (user.role !== "REGISTRAR") {
        return { error: "Access denied. Registrar privilege required." };
      }
      const result = await getRegistrarAnalyticsAction();
      if (!result.success) {
        return { error: result.error || "Failed to retrieve analytics." };
      }
      return serialize(result.data);
    },
  });

  // 8. Closed Case Precedents Tool (Judge & Lawyer)
  const getClosedCases = tool({
    description: "Browse the repository of closed and resolved judicial case records for precedent study.",
    inputSchema: z.object({}),
    execute: async () => {
      const result = await getClosedCasesAction();
      if (!result.success) {
        return { error: result.error || "Failed to retrieve closed cases." };
      }
      return {
        totalClosedCases: result.data?.length || 0,
        cases: serialize(
          (result.data || []).slice(0, 20).map((c) => ({
            cin: c.cin,
            defendantName: c.defendantName,
            crimeType: c.crimeType,
            judgmentDate: c.judgment?.judgmentDate,
            judgmentSummary: c.judgment?.summary,
            judgeName: c.judge?.name,
          }))
        ),
      };
    },
  });

  // 9. Lawyer Billing Summary Tool (Lawyer Only)
  const getLawyerBilling = tool({
    description:
      "Retrieve the lawyer's case view billing summary, total charges incurred, and monthly view counts.",
    inputSchema: z.object({}),
    execute: async () => {
      if (user.role !== "LAWYER") {
        return { error: "Access denied. Legal counsel authorization required." };
      }
      const result = await getLawyerBillingAction();
      if (!result.success) {
        return { error: result.error || "Failed to retrieve billing." };
      }
      const data = result.data;
      return serialize({
        totalCharges: data?.totalCharges || 0,
        totalViewCount: data?.viewCount || 0,
        monthlyCharges: data?.monthlyCharges || 0,
        monthlyViewCount: data?.monthlyViewCount || 0,
        recentViews: (data?.views || []).slice(0, 10).map((v) => ({
          cin: v.cin,
          defendantName: v.case?.defendantName,
          crimeType: v.case?.crimeType,
          viewedAt: v.viewedAt,
          chargeAmount: Number(v.chargeAmount),
        })),
      });
    },
  });

  // Role-gated tool registry
  if (user.role === "REGISTRAR") {
    return {
      searchCases,
      getCaseDetails,
      getPendingCases,
      getResolvedCases,
      getCourtroomAvailability,
      getHearingsForDate,
      getAnalyticsSummary,
      getClosedCases,
    };
  }

  if (user.role === "JUDGE") {
    return {
      searchCases,
      getCaseDetails,
      getClosedCases,
    };
  }

  // LAWYER
  return {
    searchCases,
    getCaseDetails,
    getClosedCases,
    getLawyerBilling,
  };
}
