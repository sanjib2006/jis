"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/server";
import { createUserSchema, type CreateUserInput } from "@/lib/validators/user";
import { logAudit } from "@/actions/audit.actions";
import type { ActionResult, User } from "@/types";
import { revalidatePath } from "next/cache";

export async function createUserAction(
  data: CreateUserInput
): Promise<ActionResult<User>> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "REGISTRAR") {
    return {
      success: false,
      error: "Unauthorized. Only Registrars can provision user accounts.",
    };
  }

  const parseResult = createUserSchema.safeParse(data);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.errors[0]?.message || "Invalid input data",
    };
  }

  const { name, email, password, role } = parseResult.data;

  // Check duplicate email in DB
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return {
      success: false,
      error: "An account with this email address already exists.",
    };
  }

  // Provision user in Supabase Auth
  try {
    const supabaseAdmin = createAdminClient();
    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name,
          role,
        },
      });

    if (authError && !authError.message.toLowerCase().includes("already registered")) {
      return {
        success: false,
        error: `Supabase Auth error: ${authError.message}`,
      };
    }
  } catch (err) {
    console.error("Supabase Admin error:", err);
    return {
      success: false,
      error: "Failed to provision authentication credentials with identity provider.",
    };
  }

  // Create User in Prisma
  try {
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        role,
        isActive: true,
      },
    });

    await logAudit(currentUser.id, "USER_CREATED", "User", newUser.id, {
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    });

    revalidatePath("/registrar/accounts");
    return {
      success: true,
      data: newUser,
    };
  } catch (dbError) {
    console.error("Prisma error during user creation:", dbError);
    return {
      success: false,
      error: "Failed to persist user record into judicial database.",
    };
  }
}

export async function deactivateUserAction(
  userId: string
): Promise<ActionResult<void>> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "REGISTRAR") {
    return {
      success: false,
      error: "Unauthorized. Only Registrars can deactivate accounts.",
    };
  }

  if (currentUser.id === userId) {
    return {
      success: false,
      error: "Self-deactivation of primary administrative account is prohibited.",
    };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!targetUser) {
    return {
      success: false,
      error: "User record not found in system.",
    };
  }

  if (!targetUser.isActive) {
    return {
      success: false,
      error: "Account is already in a deactivated status.",
    };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    await logAudit(currentUser.id, "USER_DEACTIVATED", "User", userId, {
      email: targetUser.email,
      role: targetUser.role,
    });

    revalidatePath("/registrar/accounts");
    return { success: true };
  } catch (error) {
    console.error("Deactivation error:", error);
    return {
      success: false,
      error: "Database error while updating account status.",
    };
  }
}

export async function reactivateUserAction(
  userId: string
): Promise<ActionResult<void>> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "REGISTRAR") {
    return {
      success: false,
      error: "Unauthorized. Only Registrars can reactivate accounts.",
    };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!targetUser) {
    return {
      success: false,
      error: "User record not found in system.",
    };
  }

  if (targetUser.isActive) {
    return {
      success: false,
      error: "Account is already active.",
    };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });

    await logAudit(currentUser.id, "USER_REACTIVATED", "User", userId, {
      email: targetUser.email,
      role: targetUser.role,
    });

    revalidatePath("/registrar/accounts");
    return { success: true };
  } catch (error) {
    console.error("Reactivation error:", error);
    return {
      success: false,
      error: "Database error while updating account status.",
    };
  }
}

export async function getAllUsersAction(): Promise<ActionResult<User[]>> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "REGISTRAR") {
    return {
      success: false,
      error: "Unauthorized. Only Registrars can view user accounts.",
    };
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return {
      success: true,
      data: users,
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return {
      success: false,
      error: "Failed to query judicial personnel directory.",
    };
  }
}
