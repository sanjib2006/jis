"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  scheduleHearingSchema,
  recordAdjournmentSchema,
  recordSummarySchema,
  type ScheduleHearingInput,
  type RecordAdjournmentInput,
  type RecordSummaryInput,
} from "@/lib/validators/hearing";
import { logAudit } from "@/actions/audit.actions";
import type { ActionResult, Hearing, Courtroom, Case, User } from "@/types";
import { revalidatePath } from "next/cache";

export interface AvailableSlotInfo {
  courtroomId: string;
  courtroomName: string;
  location: string | null;
  maxSlots: number;
  bookedSlots: number;
  remainingSlots: number;
}

export type HearingWithDetails = Hearing & {
  case: Case & { judge: User; prosecutor: User; lawyer: User };
  courtroom: Courtroom | null;
};

function getDayBoundaries(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function getAvailableSlotsAction(
  dateInput: string | Date,
  judgeId: string
): Promise<
  ActionResult<{
    judgeBooked: boolean;
    slots: AvailableSlotInfo[];
  }>
> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "REGISTRAR") {
    return {
      success: false,
      error: "Unauthorized. Only Registrars can query courtroom availability.",
    };
  }

  const targetDate = new Date(dateInput);
  if (isNaN(targetDate.getTime())) {
    return { success: false, error: "Invalid calendar date provided." };
  }

  const { start, end } = getDayBoundaries(targetDate);

  try {
    // 1. Check if Judge is booked for any hearing on this date
    const judgeHearing = await prisma.hearing.findFirst({
      where: {
        hearingDate: { gte: start, lte: end },
        hearingStatus: { in: ["SCHEDULED", "COMPLETED"] },
        case: { judgeId },
      },
      include: { case: true },
    });

    const judgeBooked = Boolean(judgeHearing);

    // 2. Query active courtrooms with hearing counts on this date
    const courtrooms = await prisma.courtroom.findMany({
      where: { isActive: true },
      include: {
        hearings: {
          where: {
            hearingDate: { gte: start, lte: end },
            hearingStatus: { in: ["SCHEDULED", "COMPLETED"] },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const slots: AvailableSlotInfo[] = courtrooms.map((cr) => {
      const bookedSlots = cr.hearings.length;
      const remainingSlots = Math.max(0, cr.maxSlots - bookedSlots);
      return {
        courtroomId: cr.id,
        courtroomName: cr.name,
        location: cr.location,
        maxSlots: cr.maxSlots,
        bookedSlots,
        remainingSlots,
      };
    });

    return {
      success: true,
      data: {
        judgeBooked,
        slots,
      },
    };
  } catch (error) {
    console.error("Error computing available slots:", error);
    return {
      success: false,
      error: "Failed to query courtroom slot availability.",
    };
  }
}

export async function scheduleHearingAction(
  data: ScheduleHearingInput
): Promise<ActionResult<Hearing>> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "REGISTRAR") {
    return {
      success: false,
      error: "Unauthorized. Only Registrars can schedule hearings.",
    };
  }

  const parseResult = scheduleHearingSchema.safeParse(data);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.errors[0]?.message || "Invalid hearing input",
    };
  }

  const validated = parseResult.data;
  const hearingDate = new Date(validated.hearingDate);
  const { start, end } = getDayBoundaries(hearingDate);

  // Check Case
  const caseRecord = await prisma.case.findUnique({
    where: { cin: validated.cin },
  });

  if (!caseRecord) {
    return { success: false, error: "Case docket not found." };
  }

  if (caseRecord.status === "CLOSED" || caseRecord.status === "RESOLVED") {
    return {
      success: false,
      error: "Cannot schedule hearings for a resolved or closed case record.",
    };
  }

  // Check Courtroom
  const courtroom = await prisma.courtroom.findUnique({
    where: { id: validated.courtroomId },
    include: {
      hearings: {
        where: {
          hearingDate: { gte: start, lte: end },
          hearingStatus: { in: ["SCHEDULED", "COMPLETED"] },
        },
      },
    },
  });

  if (!courtroom || !courtroom.isActive) {
    return {
      success: false,
      error: "Selected courtroom facility is inactive or not found.",
    };
  }

  if (courtroom.hearings.length >= courtroom.maxSlots) {
    return {
      success: false,
      error: `Courtroom "${courtroom.name}" has reached its maximum capacity of ${courtroom.maxSlots} hearings for this date.`,
    };
  }

  // Check Judge Conflict
  const judgeConflict = await prisma.hearing.findFirst({
    where: {
      hearingDate: { gte: start, lte: end },
      hearingStatus: { in: ["SCHEDULED", "COMPLETED"] },
      case: { judgeId: caseRecord.judgeId },
    },
  });

  if (judgeConflict) {
    return {
      success: false,
      error: "The presiding Judge already has another hearing scheduled on this calendar date.",
    };
  }

  try {
    const newHearing = await prisma.hearing.create({
      data: {
        cin: validated.cin,
        courtroomId: validated.courtroomId,
        hearingDate,
        hearingStatus: "SCHEDULED",
      },
    });

    // Update case status if REGISTERED
    if (caseRecord.status === "REGISTERED") {
      await prisma.case.update({
        where: { cin: validated.cin },
        data: { status: "PENDING" },
      });
    }

    await logAudit(
      currentUser.id,
      "HEARING_SCHEDULED",
      "Hearing",
      newHearing.id,
      {
        cin: validated.cin,
        courtroom: courtroom.name,
        hearingDate: newHearing.hearingDate,
      }
    );

    revalidatePath(`/registrar/cases/${validated.cin}`);
    revalidatePath("/registrar/hearings");
    revalidatePath("/registrar/cases");
    revalidatePath("/registrar");

    return { success: true, data: newHearing };
  } catch (error) {
    console.error("Hearing scheduling error:", error);
    return {
      success: false,
      error: "Database error while scheduling hearing session.",
    };
  }
}

export async function recordAdjournmentAction(
  data: RecordAdjournmentInput
): Promise<ActionResult<void>> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "REGISTRAR") {
    return {
      success: false,
      error: "Unauthorized. Only Registrars can record adjournments.",
    };
  }

  const parseResult = recordAdjournmentSchema.safeParse(data);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.errors[0]?.message || "Invalid adjournment data",
    };
  }

  const { hearingId, adjournmentReason, nextHearingDate, nextCourtroomId } =
    parseResult.data;

  const hearing = await prisma.hearing.findUnique({
    where: { id: hearingId },
    include: { case: true },
  });

  if (!hearing) {
    return { success: false, error: "Hearing session not found." };
  }

  if (hearing.hearingStatus !== "SCHEDULED") {
    return {
      success: false,
      error: `Cannot adjourn a hearing that is already ${hearing.hearingStatus}.`,
    };
  }

  try {
    const nextDate = nextHearingDate ? new Date(nextHearingDate) : null;

    await prisma.hearing.update({
      where: { id: hearingId },
      data: {
        hearingStatus: "ADJOURNED",
        adjournmentReason,
        nextHearingDate: nextDate,
      },
    });

    await prisma.case.update({
      where: { cin: hearing.cin },
      data: { status: "ADJOURNED" },
    });

    // Auto-schedule subsequent hearing if date and courtroom provided
    if (nextDate && nextCourtroomId) {
      await scheduleHearingAction({
        cin: hearing.cin,
        hearingDate: nextDate,
        courtroomId: nextCourtroomId,
      });
    }

    await logAudit(
      currentUser.id,
      "HEARING_ADJOURNED",
      "Hearing",
      hearingId,
      {
        cin: hearing.cin,
        reason: adjournmentReason,
        nextHearingDate: nextDate,
      }
    );

    revalidatePath(`/registrar/cases/${hearing.cin}`);
    revalidatePath("/registrar/hearings");
    revalidatePath("/registrar/cases");

    return { success: true };
  } catch (error) {
    console.error("Adjournment recording error:", error);
    return {
      success: false,
      error: "Database error while recording hearing adjournment.",
    };
  }
}

export async function recordHearingSummaryAction(
  data: RecordSummaryInput
): Promise<ActionResult<void>> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "REGISTRAR") {
    return {
      success: false,
      error: "Unauthorized. Only Registrars can record hearing summaries.",
    };
  }

  const parseResult = recordSummarySchema.safeParse(data);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.errors[0]?.message || "Invalid summary data",
    };
  }

  const { hearingId, proceedingSummary, nextHearingDate, nextCourtroomId } =
    parseResult.data;

  const hearing = await prisma.hearing.findUnique({
    where: { id: hearingId },
    include: { case: true },
  });

  if (!hearing) {
    return { success: false, error: "Hearing session not found." };
  }

  if (hearing.hearingStatus !== "SCHEDULED") {
    return {
      success: false,
      error: `Cannot record summary on a hearing that is ${hearing.hearingStatus}.`,
    };
  }

  try {
    const nextDate = nextHearingDate ? new Date(nextHearingDate) : null;

    await prisma.hearing.update({
      where: { id: hearingId },
      data: {
        hearingStatus: "COMPLETED",
        proceedingSummary,
        nextHearingDate: nextDate,
      },
    });

    // If next hearing date provided and courtroom provided, auto-schedule
    if (nextDate && nextCourtroomId) {
      await scheduleHearingAction({
        cin: hearing.cin,
        hearingDate: nextDate,
        courtroomId: nextCourtroomId,
      });
    }

    await logAudit(
      currentUser.id,
      "HEARING_COMPLETED",
      "Hearing",
      hearingId,
      {
        cin: hearing.cin,
        summarySnippet: proceedingSummary.slice(0, 80),
        nextHearingDate: nextDate,
      }
    );

    revalidatePath(`/registrar/cases/${hearing.cin}`);
    revalidatePath("/registrar/hearings");
    revalidatePath("/registrar/cases");

    return { success: true };
  } catch (error) {
    console.error("Summary recording error:", error);
    return {
      success: false,
      error: "Database error while recording proceeding summary.",
    };
  }
}

export async function getHearingsByDateAction(
  dateInput: string | Date
): Promise<ActionResult<HearingWithDetails[]>> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "REGISTRAR") {
    return {
      success: false,
      error: "Unauthorized access.",
    };
  }

  const targetDate = new Date(dateInput);
  if (isNaN(targetDate.getTime())) {
    return { success: false, error: "Invalid calendar date provided." };
  }

  const { start, end } = getDayBoundaries(targetDate);

  try {
    const hearings = await prisma.hearing.findMany({
      where: {
        hearingDate: { gte: start, lte: end },
      },
      include: {
        case: {
          include: {
            judge: true,
            prosecutor: true,
            lawyer: true,
          },
        },
        courtroom: true,
      },
      orderBy: { hearingDate: "asc" },
    });

    return { success: true, data: hearings as HearingWithDetails[] };
  } catch (error) {
    console.error("Error querying hearings by date:", error);
    return {
      success: false,
      error: "Failed to query scheduled hearings for the selected date.",
    };
  }
}
