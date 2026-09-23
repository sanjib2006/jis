"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type AuditActionType =
  | "USER_CREATED"
  | "USER_DEACTIVATED"
  | "USER_REACTIVATED"
  | "CASE_CREATED"
  | "CASE_STATUS_CHANGED"
  | "HEARING_SCHEDULED"
  | "HEARING_ADJOURNED"
  | "HEARING_COMPLETED"
  | "JUDGMENT_RECORDED"
  | "CASE_VIEWED"
  | "COURTROOM_CREATED"
  | "COURTROOM_UPDATED";

/**
 * Reusable audit logging function. Inserts an immutable timestamped audit record.
 */
export async function logAudit(
  actorId: string,
  action: AuditActionType | string,
  entity: string,
  entityId: string,
  details?: Prisma.InputJsonValue
) {
  try {
    return await prisma.auditLog.create({
      data: {
        actorId,
        action,
        entity,
        entityId,
        details: details ?? undefined,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
    // Return null rather than crashing the primary action
    return null;
  }
}
