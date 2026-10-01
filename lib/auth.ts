import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/types";

export const getCurrentUser = cache(async function getCurrentUser(): Promise<CurrentUser | null> {
  let authUser: {
    id: string;
    email: string;
    created_at: string;
    user_metadata?: Record<string, unknown>;
  } | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      return null;
    }

    authUser = {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      user_metadata: user.user_metadata,
    };

    // Attempt to enrich user details from PostgreSQL database
    try {
      const dbUser = await prisma.user.findUnique({
        where: { email: authUser.email },
      });

      if (dbUser) {
        // Enforce account activation: deactivated accounts are denied access
        if (!dbUser.isActive) {
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
      }
    } catch (dbError) {
      console.warn(
        "Database unreachable or warming up in getCurrentUser, falling back to verified JWT session:",
        dbError instanceof Error ? dbError.message : dbError
      );
    }

    // Resilient fallback to verified Supabase JWT session payload
    const userRole =
      (authUser.user_metadata?.role as "REGISTRAR" | "JUDGE" | "LAWYER") ||
      "REGISTRAR";
    const userName =
      (authUser.user_metadata?.name as string) ||
      authUser.email.split("@")[0];

    return {
      id: authUser.id,
      name: userName,
      email: authUser.email,
      role: userRole,
      isActive: true,
      createdAt: new Date(authUser.created_at),
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
