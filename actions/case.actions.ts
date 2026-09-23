"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCaseSchema, type CreateCaseInput } from "@/lib/validators/case";
import { logAudit } from "@/actions/audit.actions";
import type { ActionResult, Case, User } from "@/types";
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
