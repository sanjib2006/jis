"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/actions/audit.actions";
import { CHARGE_PER_VIEW } from "@/lib/constants";
import type {
  ActionResult,
  Case,
  User,
  Courtroom,
  Hearing,
  Judgment,
  CaseView,
} from "@/types";

export type ClosedCaseDetail = Case & {
  judge: User;
  prosecutor: User;
  lawyer: User;
  hearings: (Hearing & { courtroom: Courtroom | null })[];
  judgment: Judgment | null;
};

export type CaseWithJudgment = Case & {
  judge: User;
  prosecutor: User;
  lawyer: User;
  judgment: Judgment | null;
};

export type LawyerBillingSummary = {
  views: (CaseView & { case: Case })[];
  totalCharges: number;
  viewCount: number;
  monthlyCharges: number;
  monthlyViewCount: number;
};

export async function viewCaseAsLawyerAction(
  cin: string
): Promise<
  ActionResult<{
    case: ClosedCaseDetail;
    caseViewId: string;
    chargeAmount: number;
    viewedAt: Date;
  }>
> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "LAWYER") {
    return {
      success: false,
      error: "Unauthorized. Legal counsel authorization required.",
    };
  }

  try {
    const caseRecord = await prisma.case.findUnique({
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

    if (!caseRecord) {
      return {
        success: false,
        error: "Case docket not found.",
      };
    }

    if (caseRecord.status !== "CLOSED" && caseRecord.status !== "RESOLVED") {
      return {
        success: false,
        error:
          "Lawyers may only inspect archived, closed case records under statutory billing.",
      };
    }

    const caseView = await prisma.caseView.create({
      data: {
        lawyerId: currentUser.id,
        cin: caseRecord.cin,
        chargeAmount: CHARGE_PER_VIEW,
      },
    });

    await logAudit(currentUser.id, "CASE_VIEWED", "CaseView", caseView.id, {
      cin: caseRecord.cin,
      chargeAmount: CHARGE_PER_VIEW,
    });

    return {
      success: true,
      data: {
        case: caseRecord,
        caseViewId: caseView.id,
        chargeAmount: CHARGE_PER_VIEW,
        viewedAt: caseView.viewedAt,
      },
    };
  } catch (error) {
    console.error("Error logging lawyer case view:", error);
    return {
      success: false,
      error: "Failed to record case law inspection billing.",
    };
  }
}

export async function getLawyerBillingAction(): Promise<
  ActionResult<LawyerBillingSummary>
> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "LAWYER") {
    return {
      success: false,
      error: "Unauthorized access.",
    };
  }

  try {
    const views = await prisma.caseView.findMany({
      where: { lawyerId: currentUser.id },
      include: { case: true },
      orderBy: { viewedAt: "desc" },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalCharges = 0;
    let monthlyCharges = 0;
    let monthlyViewCount = 0;

    for (const v of views) {
      const amt = Number(v.chargeAmount);
      totalCharges += amt;

      if (new Date(v.viewedAt) >= startOfMonth) {
        monthlyCharges += amt;
        monthlyViewCount += 1;
      }
    }

    return {
      success: true,
      data: {
        views,
        totalCharges,
        viewCount: views.length,
        monthlyCharges,
        monthlyViewCount,
      },
    };
  } catch (error) {
    console.error("Error fetching lawyer billing:", error);
    return {
      success: false,
      error: "Failed to load billing statements.",
    };
  }
}

export async function viewCaseAsJudgeAction(
  cin: string
): Promise<ActionResult<ClosedCaseDetail>> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "JUDGE") {
    return {
      success: false,
      error:
        "Unauthorized. Presiding Judicial Officer authorization required.",
    };
  }

  try {
    const caseRecord = await prisma.case.findUnique({
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

    if (!caseRecord) {
      return {
        success: false,
        error: "Case docket not found.",
      };
    }

    if (caseRecord.status !== "CLOSED" && caseRecord.status !== "RESOLVED") {
      return {
        success: false,
        error: "Judges may only browse closed cases in the judicial archive.",
      };
    }

    // Complimentary judicial access: no CaseView row is created
    return {
      success: true,
      data: caseRecord,
    };
  } catch (error) {
    console.error("Error viewing case as judge:", error);
    return {
      success: false,
      error: "Failed to open judicial case archive record.",
    };
  }
}

export async function getClosedCasesAction(): Promise<
  ActionResult<CaseWithJudgment[]>
> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return {
      success: false,
      error: "Unauthorized access.",
    };
  }

  try {
    const cases = await prisma.case.findMany({
      where: {
        status: { in: ["CLOSED", "RESOLVED"] },
      },
      include: {
        judge: true,
        prosecutor: true,
        lawyer: true,
        judgment: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: cases };
  } catch (error) {
    console.error("Error querying closed cases archive:", error);
    return {
      success: false,
      error: "Failed to query closed cases archive.",
    };
  }
}
