import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth
vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    auditLog: {
      create: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn((ops) => Promise.all(ops)),
  },
}));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  logAudit,
  getAuditLogsAction,
  getAuditFilterOptionsAction,
} from "@/actions/audit.actions";

describe("Phase 7 — Audit Log Viewer & Security Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const registrarUser = {
    id: "reg-1",
    name: "Head Registrar",
    email: "registrar@jis.local",
    role: "REGISTRAR",
    isActive: true,
  };

  const judgeUser = {
    id: "judge-1",
    name: "Justice Sen",
    email: "judge@jis.local",
    role: "JUDGE",
    isActive: true,
  };

  const lawyerUser = {
    id: "lawyer-1",
    name: "Advocate Sharma",
    email: "lawyer@jis.local",
    role: "LAWYER",
    isActive: true,
  };

  describe("getAuditLogsAction (FR21, NFR7)", () => {
    it("rejects unauthorized access from non-Registrars", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(judgeUser as any);

      const res = await getAuditLogsAction();
      expect(res.success).toBe(false);
      expect(res.error).toContain("Unauthorized");
    });

    it("rejects unauthenticated requests", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(null);

      const res = await getAuditLogsAction();
      expect(res.success).toBe(false);
      expect(res.error).toContain("Unauthorized");
    });

    it("applies filtering by action, entity, actorId, and date range", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(registrarUser as any);
      vi.mocked(prisma.auditLog.count).mockResolvedValueOnce(1);
      vi.mocked(prisma.auditLog.findMany).mockResolvedValueOnce([
        {
          id: "log-1",
          actorId: "reg-1",
          action: "CASE_CREATED",
          entity: "Case",
          entityId: "cin-2026-0001",
          details: { crimeType: "Theft" },
          createdAt: new Date("2026-05-01"),
          actor: registrarUser,
        },
      ] as any);

      const res = await getAuditLogsAction({
        action: "CASE_CREATED",
        entity: "Case",
        actorId: "reg-1",
        fromDate: "2026-05-01",
        toDate: "2026-05-02",
        page: 1,
        pageSize: 50,
      });

      expect(res.success).toBe(true);
      expect(res.data?.logs).toHaveLength(1);
      expect(res.data?.totalCount).toBe(1);
      expect(res.data?.totalPages).toBe(1);
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: "CASE_CREATED",
            entity: "Case",
            actorId: "reg-1",
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
          skip: 0,
          take: 50,
        })
      );
    });

    it("correctly calculates pagination metadata", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(registrarUser as any);
      vi.mocked(prisma.auditLog.count).mockResolvedValueOnce(105);
      vi.mocked(prisma.auditLog.findMany).mockResolvedValueOnce([] as any);

      const res = await getAuditLogsAction({
        page: 3,
        pageSize: 50,
      });

      expect(res.success).toBe(true);
      expect(res.data?.currentPage).toBe(3);
      expect(res.data?.totalPages).toBe(3);
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 100,
          take: 50,
        })
      );
    });
  });

  describe("getAuditFilterOptionsAction", () => {
    it("rejects non-Registrar users", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(lawyerUser as any);

      const res = await getAuditFilterOptionsAction();
      expect(res.success).toBe(false);
      expect(res.error).toContain("Unauthorized");
    });

    it("returns distinct actions, entities, and active personnel for dropdowns", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(registrarUser as any);
      vi.mocked(prisma.auditLog.findMany)
        .mockResolvedValueOnce([{ action: "CASE_CREATED" }, { action: "JUDGMENT_RECORDED" }] as any)
        .mockResolvedValueOnce([{ entity: "Case" }, { entity: "Courtroom" }] as any);
      vi.mocked(prisma.user.findMany).mockResolvedValueOnce([
        { id: "reg-1", name: "Registrar", role: "REGISTRAR" },
      ] as any);

      const res = await getAuditFilterOptionsAction();

      expect(res.success).toBe(true);
      expect(res.data?.actions).toEqual(["CASE_CREATED", "JUDGMENT_RECORDED"]);
      expect(res.data?.entities).toEqual(["Case", "Courtroom"]);
      expect(res.data?.actors).toHaveLength(1);
    });
  });

  describe("logAudit helper", () => {
    it("successfully creates audit record", async () => {
      vi.mocked(prisma.auditLog.create).mockResolvedValueOnce({
        id: "log-1",
        actorId: "reg-1",
        action: "CASE_CREATED",
        entity: "Case",
        entityId: "cin-1",
        details: null,
        createdAt: new Date(),
      } as any);

      const result = await logAudit("reg-1", "CASE_CREATED", "Case", "cin-1", { test: true });
      expect(result).not.toBeNull();
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          actorId: "reg-1",
          action: "CASE_CREATED",
          entity: "Case",
          entityId: "cin-1",
          details: { test: true },
        },
      });
    });

    it("gracefully catches database errors and returns null without throwing", async () => {
      vi.mocked(prisma.auditLog.create).mockRejectedValueOnce(new Error("DB failure"));

      const result = await logAudit("reg-1", "CASE_CREATED", "Case", "cin-1");
      expect(result).toBeNull();
    });
  });
});
