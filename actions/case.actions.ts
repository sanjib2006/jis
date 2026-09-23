"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createCaseSchema,
  recordJudgmentSchema,
  type CreateCaseInput,
  type RecordJudgmentInput,
} from "@/lib/validators/case";
import { logAudit } from "@/actions/audit.actions";
import type {
  ActionResult,
  Case,
  User,
  Courtroom,
  Hearing,
  Judgment,
} from "@/types";
import { revalidatePath } from "next/cache";

export type CaseWithPersonnel = Case & {
  judge: User;
  prosecutor: User;
  lawyer: User;
};

export async function registerCaseAction(
  data: CreateCaseInput
): Promise<ActionResult<{ cin: string }>> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "REGISTRAR") {
    return {
      success: false,
      error: "Unauthorized. Only Registrars can register official court cases.",
    };
  }

  const parseResult = createCaseSchema.safeParse(data);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.errors[0]?.message || "Invalid case input data",
    };
  }

  const validated = parseResult.data;

  // Validate Judge
  const judge = await prisma.user.findUnique({
    where: { id: validated.judgeId },
  });
  if (!judge || judge.role !== "JUDGE") {
    return {
      success: false,
      error: "The assigned presiding officer must be a verified Judge.",
    };
  }
  if (!judge.isActive) {
    return {
      success: false,
      error: "The selected Judge account is currently deactivated.",
    };
  }

  // Validate Prosecutor
  const prosecutor = await prisma.user.findUnique({
    where: { id: validated.prosecutorId },
  });
  if (!prosecutor || prosecutor.role !== "LAWYER") {
    return {
      success: false,
      error: "The assigned Prosecutor must be an enrolled Legal Counsel.",
    };
  }
  if (!prosecutor.isActive) {
    return {
      success: false,
      error: "The selected Prosecutor account is currently deactivated.",
    };
  }

  // Validate Defense Lawyer
  const defenseLawyer = await prisma.user.findUnique({
    where: { id: validated.lawyerId },
  });
  if (!defenseLawyer || defenseLawyer.role !== "LAWYER") {
    return {
      success: false,
      error: "The assigned Defense Counsel must be an enrolled Legal Counsel.",
    };
  }
  if (!defenseLawyer.isActive) {
    return {
      success: false,
      error: "The selected Defense Counsel account is currently deactivated.",
    };
  }

  try {
    const newCase = await prisma.case.create({
      data: {
        defendantName: validated.defendantName,
        defendantAddress: validated.defendantAddress,
        crimeType: validated.crimeType,
        crimeDate: new Date(validated.crimeDate),
        crimeLocation: validated.crimeLocation,
        arrestingOfficer: validated.arrestingOfficer,
        arrestDate: new Date(validated.arrestDate),
        trialStartDate: new Date(validated.trialStartDate),
        expectedCompletionDate: new Date(validated.expectedCompletionDate),
        judgeId: validated.judgeId,
        prosecutorId: validated.prosecutorId,
        lawyerId: validated.lawyerId,
        status: "REGISTERED",
      },
    });

    await logAudit(
      currentUser.id,
      "CASE_CREATED",
      "Case",
      newCase.cin,
      {
        defendant: newCase.defendantName,
        crimeType: newCase.crimeType,
        judge: judge.name,
      }
    );

    revalidatePath("/registrar");
    revalidatePath("/registrar/cases");

    return {
      success: true,
      data: { cin: newCase.cin },
    };
  } catch (error) {
    console.error("Case registration database error:", error);
    return {
      success: false,
      error: "Failed to persist new case docket into judicial registry.",
    };
  }
}

export async function getAllCasesAction(): Promise<
  ActionResult<CaseWithPersonnel[]>
> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "REGISTRAR") {
    return {
      success: false,
      error: "Unauthorized. Only Registrars can query the complete case registry.",
    };
  }

  try {
    const cases = await prisma.case.findMany({
      include: {
        judge: true,
        prosecutor: true,
        lawyer: true,
      },
      orderBy: { cin: "asc" },
    });

    return { success: true, data: cases };
  } catch (error) {
    console.error("Error fetching cases:", error);
    return {
      success: false,
      error: "Failed to query case docket registry.",
    };
  }
}

export async function getActivePersonnelAction(): Promise<
  ActionResult<{
    judges: User[];
    lawyers: User[];
  }>
> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "REGISTRAR") {
    return {
      success: false,
      error: "Unauthorized access.",
    };
  }

  try {
    const activeUsers = await prisma.user.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    const judges = activeUsers.filter((u) => u.role === "JUDGE");
    const lawyers = activeUsers.filter((u) => u.role === "LAWYER");

    return {
      success: true,
      data: { judges, lawyers },
    };
  } catch (error) {
    console.error("Error querying active personnel:", error);
    return {
      success: false,
      error: "Failed to load judicial personnel directory.",
    };
  }
}

export async function recordJudgmentAction(
  data: RecordJudgmentInput
): Promise<ActionResult<{ cin: string }>> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "REGISTRAR") {
    return {
      success: false,
      error: "Unauthorized. Only Registrars can record official judgments.",
    };
  }

  const parseResult = recordJudgmentSchema.safeParse(data);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.errors[0]?.message || "Invalid judgment data",
    };
  }

  const validated = parseResult.data;

  try {
    const existingCase = await prisma.case.findUnique({
      where: { cin: validated.cin },
      include: { judgment: true },
    });

    if (!existingCase) {
      return {
        success: false,
        error: "Case docket not found.",
      };
    }

    if (existingCase.judgment) {
      return {
        success: false,
        error: "This case already has an immutable judgment recorded.",
      };
    }

    if (existingCase.status === "CLOSED" || existingCase.status === "RESOLVED") {
      return {
        success: false,
        error: "This case is already closed.",
      };
    }

    if (existingCase.status === "REGISTERED") {
      return {
        success: false,
        error: "Cannot record judgment on a case with no recorded hearings.",
      };
    }

    await prisma.$transaction([
      prisma.judgment.create({
        data: {
          cin: validated.cin,
          judgmentDate: new Date(validated.judgmentDate),
          summary: validated.summary,
        },
      }),
      prisma.case.update({
        where: { cin: validated.cin },
        data: { status: "CLOSED" },
      }),
    ]);

    await logAudit(
      currentUser.id,
      "JUDGMENT_RECORDED",
      "Case",
      validated.cin,
      {
        judgmentDate: validated.judgmentDate,
        summaryLength: validated.summary.length,
      }
    );

    revalidatePath("/registrar");
    revalidatePath("/registrar/cases");
    revalidatePath(`/registrar/cases/${validated.cin}`);
    revalidatePath("/registrar/cases/pending");
    revalidatePath("/registrar/cases/resolved");
    revalidatePath("/judge");
    revalidatePath("/lawyer");

    return {
      success: true,
      data: { cin: validated.cin },
    };
  } catch (error) {
    console.error("Error recording judgment:", error);
    return {
      success: false,
      error: "Failed to persist judgment into official judicial registry.",
    };
  }
}

export async function getPendingCasesAction(): Promise<
  ActionResult<CaseWithPersonnel[]>
> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "REGISTRAR") {
    return {
      success: false,
      error: "Unauthorized access.",
    };
  }

  try {
    const cases = await prisma.case.findMany({
      where: {
        status: { in: ["REGISTERED", "PENDING", "ADJOURNED"] },
      },
      include: {
        judge: true,
        prosecutor: true,
        lawyer: true,
      },
      orderBy: { cin: "asc" },
    });

    return { success: true, data: cases };
  } catch (error) {
    console.error("Error fetching pending cases:", error);
    return {
      success: false,
      error: "Failed to query pending cases.",
    };
  }
}

export type ResolvedCaseItem = Case & {
  judge: User;
  judgment: Judgment;
};

export async function getResolvedCasesAction(
  fromDate?: Date | string,
  toDate?: Date | string
): Promise<ActionResult<ResolvedCaseItem[]>> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "REGISTRAR") {
    return {
      success: false,
      error: "Unauthorized access.",
    };
  }

  try {
    const end = toDate ? new Date(toDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const start = fromDate
      ? new Date(fromDate)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);

    const cases = await prisma.case.findMany({
      where: {
        judgment: {
          judgmentDate: {
            gte: start,
            lte: end,
          },
        },
      },
      include: {
        judge: true,
        judgment: true,
      },
      orderBy: {
        judgment: {
          judgmentDate: "desc",
        },
      },
    });

    const resolvedCases = cases.filter(
      (c): c is typeof c & { judgment: NonNullable<typeof c.judgment> } =>
        c.judgment !== null
    );

    return { success: true, data: resolvedCases };
  } catch (error) {
    console.error("Error fetching resolved cases:", error);
    return {
      success: false,
      error: "Failed to query resolved cases registry.",
    };
  }
}

export type CaseWithHearingForDate = Case & {
  judge: User;
  hearings: (Hearing & { courtroom: Courtroom | null })[];
};

export async function getCasesByHearingDateAction(
  date?: Date | string
): Promise<ActionResult<CaseWithHearingForDate[]>> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "REGISTRAR") {
    return {
      success: false,
      error: "Unauthorized access.",
    };
  }

  try {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const cases = await prisma.case.findMany({
      where: {
        hearings: {
          some: {
            hearingDate: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        },
      },
      include: {
        judge: true,
        hearings: {
          where: {
            hearingDate: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          include: {
            courtroom: true,
          },
        },
      },
      orderBy: { cin: "asc" },
    });

    return { success: true, data: cases };
  } catch (error) {
    console.error("Error querying cases by hearing date:", error);
    return {
      success: false,
      error: "Failed to query cases by hearing date.",
    };
  }
}

export type CaseWithFullDetails = Case & {
  judge: User;
  prosecutor: User;
  lawyer: User;
  hearings: (Hearing & { courtroom: Courtroom | null })[];
  judgment: Judgment | null;
};

export async function getCaseByCinAction(
  cin: string
): Promise<ActionResult<CaseWithFullDetails | null>> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return {
      success: false,
      error: "Unauthorized. Authentication required.",
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

    return { success: true, data: caseRecord };
  } catch (error) {
    console.error("Error querying case by CIN:", error);
    return {
      success: false,
      error: "Failed to query case record.",
    };
  }
}

