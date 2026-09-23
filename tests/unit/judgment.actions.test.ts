import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth
vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    case: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    judgment: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn((operations) => Promise.all(operations)),
  },
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  recordJudgmentAction,
  getPendingCasesAction,
  getResolvedCasesAction,
  getCasesByHearingDateAction,
} from "@/actions/case.actions";

describe("Phase 5 — Case Resolution & Registrar Queries Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const registrarUser = {
    id: "reg-user-1",
    name: "Head Registrar",
    email: "registrar@jis.local",
    role: "REGISTRAR",
    isActive: true,
  };

  const lawyerUser = {
    id: "lawyer-1",
    name: "Advocate Sharma",
    email: "lawyer@jis.local",
    role: "LAWYER",
    isActive: true,
  };

  describe("recordJudgmentAction", () => {
    it("rejects unauthorized users or non-Registrars", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(lawyerUser as any);

      const res = await recordJudgmentAction({
        cin: "cin-2026-0001",
        judgmentDate: new Date("2026-05-15"),
        summary: "Defendant is convicted under IPC Section 379 and sentenced to 1 year imprisonment.",
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("Unauthorized");
    });

    it("fails validation if judgment summary is shorter than 10 characters", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(registrarUser as any);

      const res = await recordJudgmentAction({
        cin: "cin-2026-0001",
        judgmentDate: new Date("2026-05-15"),
        summary: "Guilty",
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("at least 10 characters");
    });

    it("rejects recording judgment on a case with status REGISTERED (no hearings held yet)", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(registrarUser as any);
      vi.mocked(prisma.case.findUnique).mockResolvedValueOnce({
        cin: "cin-2026-0001",
        status: "REGISTERED",
        judgment: null,
      } as any);

      const res = await recordJudgmentAction({
        cin: "cin-2026-0001",
        judgmentDate: new Date("2026-05-15"),
        summary: "Defendant is acquitted due to lack of prosecution evidence presented.",
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("Cannot record judgment on a case with no recorded hearings");
    });

    it("rejects recording judgment if the case already has a judgment or is closed", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(registrarUser as any);
      vi.mocked(prisma.case.findUnique).mockResolvedValueOnce({
        cin: "cin-2026-0001",
        status: "CLOSED",
        judgment: {
          id: "j-1",
          judgmentDate: new Date("2026-04-01"),
          summary: "Prior judgment text",
        },
      } as any);

      const res = await recordJudgmentAction({
        cin: "cin-2026-0001",
        judgmentDate: new Date("2026-05-15"),
        summary: "New attempt to record a duplicate judgment on a closed case.",
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("immutable judgment recorded");
    });

    it("successfully creates judgment and updates case status to CLOSED", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(registrarUser as any);
      vi.mocked(prisma.case.findUnique).mockResolvedValueOnce({
        cin: "cin-2026-0001",
        status: "PENDING",
        judgment: null,
      } as any);

      const res = await recordJudgmentAction({
        cin: "cin-2026-0001",
        judgmentDate: new Date("2026-05-15"),
        summary: "After evaluating depositions, defendant is sentenced to statutory probation.",
      });

      expect(res.success).toBe(true);
      expect(res.data).toEqual({ cin: "cin-2026-0001" });
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.judgment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            cin: "cin-2026-0001",
            summary: "After evaluating depositions, defendant is sentenced to statutory probation.",
          }),
        })
      );
      expect(prisma.case.update).toHaveBeenCalledWith({
        where: { cin: "cin-2026-0001" },
        data: { status: "CLOSED" },
      });
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "JUDGMENT_RECORDED",
            entity: "Case",
            entityId: "cin-2026-0001",
          }),
        })
      );
    });
  });

  describe("getPendingCasesAction", () => {
    it("returns only cases with status REGISTERED, PENDING, or ADJOURNED", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(registrarUser as any);
      const mockCases = [
        { cin: "cin-2026-0001", status: "REGISTERED" },
        { cin: "cin-2026-0002", status: "PENDING" },
        { cin: "cin-2026-0003", status: "ADJOURNED" },
      ];
      vi.mocked(prisma.case.findMany).mockResolvedValueOnce(mockCases as any);

      const res = await getPendingCasesAction();
      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(3);
      expect(prisma.case.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: { in: ["REGISTERED", "PENDING", "ADJOURNED"] },
          },
          orderBy: { cin: "asc" },
        })
      );
    });
  });

  describe("getResolvedCasesAction", () => {
    it("queries cases having judgments within the specified date range", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(registrarUser as any);
      const mockResolved = [
        {
          cin: "cin-2026-0001",
          status: "CLOSED",
          judgment: {
            id: "j-1",
            judgmentDate: new Date("2026-04-10"),
            summary: "Final decree issued.",
          },
        },
      ];
      vi.mocked(prisma.case.findMany).mockResolvedValueOnce(mockResolved as any);

      const res = await getResolvedCasesAction("2026-04-01", "2026-04-30");
      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(1);
      expect(prisma.case.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            judgment: {
              judgmentDate: expect.objectContaining({
                gte: expect.any(Date),
                lte: expect.any(Date),
              }),
            },
          },
        })
      );
    });
  });

  describe("getCasesByHearingDateAction", () => {
    it("queries cases having scheduled hearings on the target date", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(registrarUser as any);
      const mockCases = [
        {
          cin: "cin-2026-0001",
          hearings: [
            {
              id: "h-1",
              hearingDate: new Date("2026-05-20"),
              hearingStatus: "SCHEDULED",
            },
          ],
        },
      ];
      vi.mocked(prisma.case.findMany).mockResolvedValueOnce(mockCases as any);

      const res = await getCasesByHearingDateAction("2026-05-20");
      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(1);
      expect(prisma.case.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            hearings: {
              some: {
                hearingDate: expect.objectContaining({
                  gte: expect.any(Date),
                  lte: expect.any(Date),
                }),
              },
            },
          },
        })
      );
    });
  });
});
