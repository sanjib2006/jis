import { z } from "zod";

export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters")
    .trim(),
  email: z
    .string()
    .min(1, "Email address is required")
    .email("Enter a valid email address")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(6, "Temporary password must be at least 6 characters"),
  role: z.enum(["REGISTRAR", "JUDGE", "LAWYER"], {
    errorMap: () => ({ message: "Select a valid statutory role" }),
  }),
});

export const deactivateUserSchema = z.object({
  userId: z.string().uuid("Invalid user identifier"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type DeactivateUserInput = z.infer<typeof deactivateUserSchema>;
