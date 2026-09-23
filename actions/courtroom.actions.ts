"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createCourtroomSchema,
  updateCourtroomSchema,
  type CreateCourtroomInput,
  type UpdateCourtroomInput,
} from "@/lib/validators/courtroom";
import { logAudit } from "@/actions/audit.actions";
import type { ActionResult, Courtroom } from "@/types";
import { revalidatePath } from "next/cache";

export async function createCourtroomAction(
  data: CreateCourtroomInput
): Promise<ActionResult<Courtroom>> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "REGISTRAR") {
    return {
      success: false,
      error: "Unauthorized. Only Registrars can register courtrooms.",
    };
  }

  const parseResult = createCourtroomSchema.safeParse(data);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.errors[0]?.message || "Invalid input data",
    };
  }

  const { name, location, maxSlots } = parseResult.data;

  const existing = await prisma.courtroom.findUnique({
    where: { name },
  });

  if (existing) {
    return {
      success: false,
      error: "A courtroom with this name or bench identifier already exists.",
    };
  }

  try {
    const courtroom = await prisma.courtroom.create({
      data: {
        name,
        location: location || null,
        maxSlots,
        isActive: true,
      },
    });

    await logAudit(
      currentUser.id,
      "COURTROOM_CREATED",
      "Courtroom",
      courtroom.id,
      { name, maxSlots, location }
    );

    revalidatePath("/registrar/courtrooms");
    return { success: true, data: courtroom };
  } catch (error) {
    console.error("Courtroom creation error:", error);
    return {
      success: false,
      error: "Database error while creating courtroom record.",
    };
  }
}

export async function updateCourtroomAction(
  data: UpdateCourtroomInput
): Promise<ActionResult<Courtroom>> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "REGISTRAR") {
    return {
      success: false,
      error: "Unauthorized. Only Registrars can modify courtrooms.",
    };
  }

  const parseResult = updateCourtroomSchema.safeParse(data);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.errors[0]?.message || "Invalid input data",
    };
  }

  const { id, name, location, maxSlots } = parseResult.data;

  const existing = await prisma.courtroom.findUnique({
    where: { id },
  });

  if (!existing) {
    return {
      success: false,
      error: "Courtroom record not found.",
    };
  }

  // Check if renaming to another existing courtroom name
  if (name !== existing.name) {
    const nameCollision = await prisma.courtroom.findUnique({
      where: { name },
    });
    if (nameCollision) {
      return {
        success: false,
        error: "Another courtroom is already registered with this name.",
      };
    }
  }

  try {
    const updated = await prisma.courtroom.update({
      where: { id },
      data: {
        name,
        location: location || null,
        maxSlots,
      },
    });

    await logAudit(
      currentUser.id,
      "COURTROOM_UPDATED",
      "Courtroom",
      id,
      { oldName: existing.name, newName: name, maxSlots }
    );

    revalidatePath("/registrar/courtrooms");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Courtroom update error:", error);
    return {
      success: false,
      error: "Failed to update courtroom properties.",
    };
  }
}

export async function toggleCourtroomActiveAction(
  id: string
): Promise<ActionResult<void>> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "REGISTRAR") {
    return {
      success: false,
      error: "Unauthorized. Only Registrars can alter courtroom status.",
    };
  }

  const courtroom = await prisma.courtroom.findUnique({
    where: { id },
  });

  if (!courtroom) {
    return {
      success: false,
      error: "Courtroom record not found.",
    };
  }

  const newStatus = !courtroom.isActive;

  try {
    await prisma.courtroom.update({
      where: { id },
      data: { isActive: newStatus },
    });

    await logAudit(
      currentUser.id,
      newStatus ? "COURTROOM_REACTIVATED" : "COURTROOM_DEACTIVATED",
      "Courtroom",
      id,
      { name: courtroom.name, isActive: newStatus }
    );

    revalidatePath("/registrar/courtrooms");
    return { success: true };
  } catch (error) {
    console.error("Courtroom toggle status error:", error);
    return {
      success: false,
      error: "Failed to alter courtroom active status.",
    };
  }
}

export async function getAllCourtroomsAction(): Promise<ActionResult<Courtroom[]>> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "REGISTRAR") {
    return {
      success: false,
      error: "Unauthorized. Only Registrars can query courtrooms.",
    };
  }

  try {
    const courtrooms = await prisma.courtroom.findMany({
      orderBy: { name: "asc" },
    });
    return { success: true, data: courtrooms };
  } catch (error) {
    console.error("Error fetching courtrooms:", error);
    return {
      success: false,
      error: "Failed to query courtrooms from database.",
    };
  }
}
