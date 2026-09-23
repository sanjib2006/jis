"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";
import type { ActionResult } from "@/types";
import { redirect } from "next/navigation";

export async function loginAction(
  data: LoginInput
): Promise<ActionResult<{ redirectUrl: string }>> {
  const parseResult = loginSchema.safeParse(data);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.errors[0]?.message || "Invalid input data",
    };
  }

  const { email, password } = parseResult.data;
  const supabase = await createClient();

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (authError || !authData.user) {
    return {
      success: false,
      error: authError?.message || "Invalid email or password",
    };
  }

  try {
    const userRecord = await prisma.user.findUnique({
      where: { email },
    });

    if (!userRecord) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: "No judicial record found associated with this account.",
      };
    }

    if (!userRecord.isActive) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: "This account has been deactivated by the Registrar.",
      };
    }

    const rolePaths: Record<string, string> = {
      REGISTRAR: "/registrar",
      JUDGE: "/judge",
      LAWYER: "/lawyer",
    };

    const redirectUrl = rolePaths[userRecord.role] || "/login";

    return {
      success: true,
      data: { redirectUrl },
    };
  } catch (error) {
    console.error("Database lookup error during login:", error);
    return {
      success: false,
      error: "Authentication service encountered a system error.",
    };
  }
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
