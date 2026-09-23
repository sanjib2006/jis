import { z } from "zod";

export const createCourtroomSchema = z.object({
  name: z
    .string()
    .min(1, "Courtroom name or identifier is required")
    .max(100, "Courtroom name must not exceed 100 characters")
    .trim(),
  location: z
    .string()
    .max(150, "Location description must not exceed 150 characters")
    .optional()
    .nullable(),
  maxSlots: z
    .coerce
    .number()
    .int("Daily slots must be an integer")
    .min(1, "Courtroom must support at least 1 hearing slot per day")
    .max(20, "Daily slot capacity cannot exceed 20 hearings"),
});

export const updateCourtroomSchema = createCourtroomSchema.extend({
  id: z.string().uuid("Invalid courtroom identifier"),
});

export type CreateCourtroomInput = z.infer<typeof createCourtroomSchema>;
export type UpdateCourtroomInput = z.infer<typeof updateCourtroomSchema>;
