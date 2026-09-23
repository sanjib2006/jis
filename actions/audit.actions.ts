"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { ActionResult, AuditLog, User } from "@/types";

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
    return null;
  }
}

export type AuditLogWithActor = AuditLog & {
  actor: User;
};

export interface GetAuditLogsParams {
  action?: string;
  entity?: string;
  actorId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedAuditLogs {
  logs: AuditLogWithActor[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export async function getAuditLogsAction(
  params?: GetAuditLogsParams
): Promise<ActionResult<PaginatedAuditLogs>> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "REGISTRAR") {
    return {
      success: false,
      error: "Unauthorized. Registrar authorization required to inspect audit logs.",
    };
  }

  const page = Math.max(1, params?.page || 1);
  const pageSize = Math.max(1, Math.min(100, params?.pageSize || 50));
  const skip = (page - 1) * pageSize;

  const where: Prisma.AuditLogWhereInput = {};

  if (params?.action && params.action !== "ALL") {
    where.action = params.action;
  }

  if (params?.entity && params.entity !== "ALL") {
    where.entity = params.entity;
  }

  if (params?.actorId && params.actorId !== "ALL") {
    where.actorId = params.actorId;
  }

  if (params?.fromDate || params?.toDate) {
    where.createdAt = {};
    if (params.fromDate) {
      const start = new Date(params.fromDate);
      start.setHours(0, 0, 0, 0);
      where.createdAt.gte = start;
    }
    if (params.toDate) {
      const end = new Date(params.toDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  try {
    const [totalCount, logs] = await prisma.$transaction([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: { actor: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    return {
      success: true,
      data: {
        logs,
        totalCount,
        totalPages,
        currentPage: page,
        pageSize,
      },
    };
  } catch (error) {
    console.error("Error querying audit logs:", error);
    return {
      success: false,
      error: "Failed to query system audit logs.",
    };
  }
}

export interface AuditFilterOptions {
  actions: string[];
  entities: string[];
  actors: { id: string; name: string; role: string }[];
}

export async function getAuditFilterOptionsAction(): Promise<
  ActionResult<AuditFilterOptions>
> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "REGISTRAR") {
    return {
      success: false,
      error: "Unauthorized access.",
    };
  }

  try {
    const [distinctActions, distinctEntities, actors] = await Promise.all([
      prisma.auditLog.findMany({
        select: { action: true },
        distinct: ["action"],
        orderBy: { action: "asc" },
      }),
      prisma.auditLog.findMany({
        select: { entity: true },
        distinct: ["entity"],
        orderBy: { entity: "asc" },
      }),
      prisma.user.findMany({
        select: { id: true, name: true, role: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return {
      success: true,
      data: {
        actions: distinctActions.map((a) => a.action),
        entities: distinctEntities.map((e) => e.entity),
        actors,
      },
    };
  } catch (error) {
    console.error("Error fetching audit filter options:", error);
    return {
      success: false,
      error: "Failed to load audit filter options.",
    };
  }
}
