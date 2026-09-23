import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth
vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    case: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    courtroom: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerCaseAction } from "@/actions/case.actions";
import {
  createCourtroomAction,
  updateCourtroomAction,
} from "@/actions/courtroom.actions";

describe("Phase 3 — Courtroom & Case Registration Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validJudgeId = "11111111-1111-4111-8111-111111111111";
  const validProsecutorId = "22222222-2222-4222-8222-222222222222";
  const validLawyerId = "33333333-3333-4333-8333-333333333333";

  const validCasePayload = {
    defendantName: "Virendra Singh",
    defendantAddress: "14 Court Road, Civil Lines",
    crimeType: "IPC 379 - Theft",
    crimeDate: new Date("2026-01-10"),
    crimeLocation: "Railway Goods Shed",
    arrestingOfficer: "Sub-Inspector K. Sharma",
    arrestDate: new Date("2026-01-12"),
    judgeId: validJudgeId,
    prosecutorId: validProsecutorId,
    lawyerId: validLawyerId,
    trialStartDate: new Date("2026-03-01"),
    expectedCompletionDate: new Date("2026-06-01"),
  };

  describe("registerCaseAction", () => {
    it("rejects case registration from non-REGISTRAR callers (e.g. LAWYER)", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "lawyer-1",
        name: "Adv. Raman",
        email: "raman@jis.local",
        role: "LAWYER",
        isActive: true,
        createdAt: new Date(),
      });

      const result = await registerCaseAction(validCasePayload);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Only Registrars can register");
      expect(prisma.case.create).not.toHaveBeenCalled();
    });

    it("rejects when assigned judgeId does not have JUDGE role", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "reg-1",
        name: "Chief Registrar",
        email: "reg@jis.local",
        role: "REGISTRAR",
        isActive: true,
        createdAt: new Date(),
      });

      // Mock user lookup returning a Lawyer instead of Judge
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: validJudgeId,
        name: "Wrong Role Person",
        email: "wrong@jis.local",
        role: "LAWYER",
        isActive: true,
        createdAt: new Date(),
      });

      const result = await registerCaseAction(validCasePayload);

      expect(result.success).toBe(false);
      expect(result.error).toContain("must be a verified Judge");
      expect(prisma.case.create).not.toHaveBeenCalled();
    });

    it("successfully creates case docket, generates CIN, and writes to AuditLog", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "reg-1",
        name: "Chief Registrar",
        email: "reg@jis.local",
        role: "REGISTRAR",
        isActive: true,
        createdAt: new Date(),
      });

      // Mock personnel validations
      vi.mocked(prisma.user.findUnique).mockImplementation(async ({ where }) => {
        if (where.id === validJudgeId) {
          return {
            id: validJudgeId,
            name: "Hon. Justice Mehra",
            email: "mehra@jis.local",
            role: "JUDGE",
            isActive: true,
            createdAt: new Date(),
          };
        }
        if (where.id === validProsecutorId) {
          return {
            id: validProsecutorId,
            name: "Adv. Public Prosecutor",
            email: "pp@jis.local",
            role: "LAWYER",
            isActive: true,
            createdAt: new Date(),
          };
        }
        if (where.id === validLawyerId) {
          return {
            id: validLawyerId,
            name: "Adv. Defense",
            email: "defense@jis.local",
            role: "LAWYER",
            isActive: true,
            createdAt: new Date(),
          };
        }
        return null;
      });

      vi.mocked(prisma.case.create).mockResolvedValue({
        cin: "cuid-cin-2026-999",
        defendantName: validCasePayload.defendantName,
        defendantAddress: validCasePayload.defendantAddress,
        crimeType: validCasePayload.crimeType,
        crimeDate: validCasePayload.crimeDate,
        crimeLocation: validCasePayload.crimeLocation,
        arrestingOfficer: validCasePayload.arrestingOfficer,
        arrestDate: validCasePayload.arrestDate,
        trialStartDate: validCasePayload.trialStartDate,
        expectedCompletionDate: validCasePayload.expectedCompletionDate,
        status: "REGISTERED",
        judgeId: validCasePayload.judgeId,
        prosecutorId: validCasePayload.prosecutorId,
        lawyerId: validCasePayload.lawyerId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await registerCaseAction(validCasePayload);

      expect(result.success).toBe(true);
      expect(result.data?.cin).toBe("cuid-cin-2026-999");
      expect(prisma.case.create).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            actorId: "reg-1",
            action: "CASE_CREATED",
            entity: "Case",
            entityId: "cuid-cin-2026-999",
          }),
        })
      );
    });

    it("rejects case registration when required fields are missing", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "reg-1",
        name: "Chief Registrar",
        email: "reg@jis.local",
        role: "REGISTRAR",
        isActive: true,
        createdAt: new Date(),
      });

      const invalidPayload = {
        ...validCasePayload,
        defendantName: "", // missing required name
      };

      const result = await registerCaseAction(invalidPayload as any);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(prisma.case.create).not.toHaveBeenCalled();
    });
  });

  describe("Courtroom Management Actions", () => {
    it("rejects courtroom registration from non-REGISTRAR users", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "judge-1",
        name: "Hon. Judge",
        email: "judge@jis.local",
        role: "JUDGE",
        isActive: true,
        createdAt: new Date(),
      });

      const result = await createCourtroomAction({
        name: "Courtroom 401",
        location: "East Wing",
        maxSlots: 5,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Only Registrars can register");
      expect(prisma.courtroom.create).not.toHaveBeenCalled();
    });

    it("rejects duplicate courtroom names", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "reg-1",
        name: "Registrar",
        email: "reg@jis.local",
        role: "REGISTRAR",
        isActive: true,
        createdAt: new Date(),
      });

      vi.mocked(prisma.courtroom.findUnique).mockResolvedValue({
        id: "existing-courtroom-id",
        name: "Courtroom 101",
        location: "Main Building",
        maxSlots: 5,
        isActive: true,
      });

      const result = await createCourtroomAction({
        name: "Courtroom 101",
        location: "Annex",
        maxSlots: 6,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("already exists");
      expect(prisma.courtroom.create).not.toHaveBeenCalled();
    });
  });
});
