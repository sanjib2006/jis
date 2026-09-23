import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/types";

export const getCurrentUser = cache(async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser || !authUser.email) {
      return null;
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: authUser.email },
    });

    if (!dbUser) {
      return null;
    }

    return {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      isActive: dbUser.isActive,
      createdAt: dbUser.createdAt,
    };
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      (error as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }

    console.error("Error in getCurrentUser:", error);
    return null;
  }
});
