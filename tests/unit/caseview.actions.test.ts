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
    },
    caseView: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  viewCaseAsLawyerAction,
  viewCaseAsJudgeAction,
  getLawyerBillingAction,
} from "@/actions/caseView.actions";
import { CHARGE_PER_VIEW } from "@/lib/constants";
import { searchCasesAction } from "@/actions/case.actions";

describe("Phase 6 — Judge & Lawyer Dashboards, Case History & Billing Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const judgeUser = {
    id: "judge-1",
    name: "Hon. Justice Sen",
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

  const registrarUser = {
    id: "reg-1",
    name: "Registrar Officer",
    email: "registrar@jis.local",
    role: "REGISTRAR",
    isActive: true,
  };

  const closedCaseMock = {
    cin: "cin-2026-0001",
    status: "CLOSED",
    defendantName: "Virendra Singh",
    crimeType: "IPC 379 - Theft",
    hearings: [],
    judgment: {
      id: "j-1",
      judgmentDate: new Date("2026-04-10"),
      summary: "Convicted and sentenced.",
    },
  };

  describe("viewCaseAsLawyerAction (FR4, FR19, TC3)", () => {
    it("rejects non-lawyer roles from billed lawyer view", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(judgeUser as any);

      const res = await viewCaseAsLawyerAction("cin-2026-0001");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Unauthorized");
    });

    it("rejects accessing non-closed cases for lawyers", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(lawyerUser as any);
      vi.mocked(prisma.case.findUnique).mockResolvedValueOnce({
        ...closedCaseMock,
        status: "PENDING",
      } as any);

      const res = await viewCaseAsLawyerAction("cin-2026-0001");
      expect(res.success).toBe(false);
      expect(res.error).toContain("only inspect archived, closed case records");
    });

    it("logs a CaseView row with ₹50 fee and records an audit log entry (TC3)", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(lawyerUser as any);
      vi.mocked(prisma.case.findUnique).mockResolvedValueOnce(closedCaseMock as any);
      const mockCreatedView = {
        id: "view-123",
        lawyerId: lawyerUser.id,
        cin: "cin-2026-0001",
        chargeAmount: CHARGE_PER_VIEW,
        viewedAt: new Date("2026-05-01T10:00:00Z"),
      };
      vi.mocked(prisma.caseView.create).mockResolvedValueOnce(mockCreatedView as any);

      const res = await viewCaseAsLawyerAction("cin-2026-0001");

      expect(res.success).toBe(true);
      expect(res.data?.chargeAmount).toBe(50.0);
      expect(prisma.caseView.create).toHaveBeenCalledWith({
        data: {
          lawyerId: lawyerUser.id,
          cin: "cin-2026-0001",
          chargeAmount: 50.0,
        },
      });
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "CASE_VIEWED",
            entity: "CaseView",
            entityId: "view-123",
          }),
        })
      );
    });

    it("creates a new CaseView row each time a lawyer views a case (pay-per-view)", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(lawyerUser as any);
      vi.mocked(prisma.case.findUnique).mockResolvedValue(closedCaseMock as any);
      vi.mocked(prisma.caseView.create).mockResolvedValue({
        id: "view-new",
        lawyerId: lawyerUser.id,
        cin: "cin-2026-0001",
        chargeAmount: CHARGE_PER_VIEW,
        viewedAt: new Date(),
      } as any);

      await viewCaseAsLawyerAction("cin-2026-0001");
      await viewCaseAsLawyerAction("cin-2026-0001");

      expect(prisma.caseView.create).toHaveBeenCalledTimes(2);
    });
  });

  describe("viewCaseAsJudgeAction (FR18, TC4)", () => {
    it("rejects non-judge users", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(lawyerUser as any);

      const res = await viewCaseAsJudgeAction("cin-2026-0001");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Unauthorized");
    });

    it("returns closed case details without creating any CaseView entry (TC4)", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(judgeUser as any);
      vi.mocked(prisma.case.findUnique).mockResolvedValueOnce(closedCaseMock as any);

      const res = await viewCaseAsJudgeAction("cin-2026-0001");

      expect(res.success).toBe(true);
      expect(res.data?.cin).toBe("cin-2026-0001");
      // Verify no CaseView was created
      expect(prisma.caseView.create).not.toHaveBeenCalled();
    });
  });

  describe("getLawyerBillingAction (FR4)", () => {
    it("aggregates itemized case views and computes total charges", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(lawyerUser as any);
      const now = new Date();
      const mockViews = [
        {
          id: "v-1",
          cin: "cin-2026-0001",
          chargeAmount: 50.0,
          viewedAt: now,
          case: closedCaseMock,
        },
        {
          id: "v-2",
          cin: "cin-2026-0002",
          chargeAmount: 50.0,
          viewedAt: now,
          case: closedCaseMock,
        },
      ];
      vi.mocked(prisma.caseView.findMany).mockResolvedValueOnce(mockViews as any);

      const res = await getLawyerBillingAction();

      expect(res.success).toBe(true);
      expect(res.data?.viewCount).toBe(2);
      expect(res.data?.totalCharges).toBe(100.0);
      expect(res.data?.monthlyCharges).toBe(100.0);
    });
  });

  describe("searchCasesAction (FR20)", () => {
    it("restricts search to CLOSED / RESOLVED cases for Judges and Lawyers", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(judgeUser as any);
      vi.mocked(prisma.case.findMany).mockResolvedValueOnce([closedCaseMock] as any);

      const res = await searchCasesAction("Theft");

      expect(res.success).toBe(true);
      expect(prisma.case.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ["CLOSED", "RESOLVED"] },
            OR: expect.arrayContaining([
              expect.objectContaining({
                crimeType: { contains: "Theft", mode: "insensitive" },
              }),
            ]),
          }),
        })
      );
    });

    it("permits Registrars to search across all case statuses without closed restriction", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(registrarUser as any);
      vi.mocked(prisma.case.findMany).mockResolvedValueOnce([closedCaseMock] as any);

      const res = await searchCasesAction("Theft");

      expect(res.success).toBe(true);
      expect(prisma.case.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            status: expect.anything(),
          }),
        })
      );
    });
  });
});
