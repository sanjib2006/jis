import { z } from "zod";

export const createCaseSchema = z
  .object({
    defendantName: z
      .string()
      .min(2, "Defendant name must be at least 2 characters")
      .max(100, "Defendant name must not exceed 100 characters")
      .trim(),
    defendantAddress: z
      .string()
      .min(5, "Defendant address must be at least 5 characters")
      .max(255, "Defendant address must not exceed 255 characters")
      .trim(),
    crimeType: z
      .string()
      .min(2, "Crime type or charge section must be specified")
      .max(100, "Crime type must not exceed 100 characters")
      .trim(),
    crimeDate: z.coerce.date({
      errorMap: () => ({ message: "Enter a valid crime occurrence date" }),
    }),
    crimeLocation: z
      .string()
      .min(2, "Location of crime must be at least 2 characters")
      .max(150, "Crime location must not exceed 150 characters")
      .trim(),
    arrestingOfficer: z
      .string()
      .min(2, "Arresting officer designation/name is required")
      .max(100, "Officer name must not exceed 100 characters")
      .trim(),
    arrestDate: z.coerce.date({
      errorMap: () => ({ message: "Enter a valid date of arrest" }),
    }),
    judgeId: z.string().uuid("Select an assigned presiding Judge"),
    prosecutorId: z.string().uuid("Select an assigned Public Prosecutor"),
    lawyerId: z.string().uuid("Select an assigned Defense Counsel"),
    trialStartDate: z.coerce.date({
      errorMap: () => ({ message: "Enter a valid trial commencement date" }),
    }),
    expectedCompletionDate: z.coerce.date({
      errorMap: () => ({ message: "Enter expected trial conclusion date" }),
    }),
  })
  .refine(
    (data) => new Date(data.arrestDate) >= new Date(data.crimeDate),
    {
      message: "Date of arrest cannot precede the crime commission date",
      path: ["arrestDate"],
    }
  )
  .refine(
    (data) =>
      new Date(data.expectedCompletionDate) >= new Date(data.trialStartDate),
    {
      message: "Expected completion date must be on or after trial start date",
      path: ["expectedCompletionDate"],
    }
  );

export type CreateCaseInput = z.infer<typeof createCaseSchema>;

export const recordJudgmentSchema = z.object({
  cin: z.string().min(1, "Case Identification Number (CIN) is required"),
  judgmentDate: z.coerce.date({
    errorMap: () => ({ message: "Enter a valid judgment date" }),
  }),
  summary: z
    .string()
    .min(10, "Judgment summary must be at least 10 characters long")
    .max(5000, "Judgment summary cannot exceed 5000 characters")
    .trim(),
});

export type RecordJudgmentInput = z.infer<typeof recordJudgmentSchema>;

