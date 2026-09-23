import { z } from "zod";

export const scheduleHearingSchema = z.object({
  cin: z.string().min(1, "Case Identification Number (CIN) is required"),
  hearingDate: z.coerce.date({
    errorMap: () => ({ message: "Select a valid hearing calendar date" }),
  }),
  courtroomId: z.string().uuid("Select an assigned courtroom"),
});

export const recordAdjournmentSchema = z.object({
  hearingId: z.string().uuid("Invalid hearing identifier"),
  adjournmentReason: z
    .string()
    .min(5, "Reason for adjournment must be at least 5 characters")
    .max(500, "Adjournment reason must not exceed 500 characters")
    .trim(),
  nextHearingDate: z.coerce.date().optional().nullable(),
  nextCourtroomId: z.string().uuid().optional().nullable(),
});

export const recordSummarySchema = z.object({
  hearingId: z.string().uuid("Invalid hearing identifier"),
  proceedingSummary: z
    .string()
    .min(10, "Proceeding summary must be at least 10 characters")
    .max(2000, "Proceeding summary must not exceed 2000 characters")
    .trim(),
  nextHearingDate: z.coerce.date().optional().nullable(),
  nextCourtroomId: z.string().uuid().optional().nullable(),
});

export type ScheduleHearingInput = z.infer<typeof scheduleHearingSchema>;
export type RecordAdjournmentInput = z.infer<typeof recordAdjournmentSchema>;
export type RecordSummaryInput = z.infer<typeof recordSummarySchema>;
