import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth helper
vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

// Mock Supabase server
vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(() => ({
    auth: {
      admin: {
        createUser: vi.fn().mockResolvedValue({
          data: { user: { id: "mock-supabase-id", email: "test@example.com" } },
          error: null,
        }),
      },
    },
  })),
}));

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
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
import { createUserAction, deactivateUserAction } from "@/actions/user.actions";
import { logAudit } from "@/actions/audit.actions";

describe("Phase 2 — Account Management & Audit Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createUserAction", () => {
    it("rejects when called by a non-REGISTRAR (e.g. JUDGE)", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "judge-123",
        name: "Hon. Judge",
        email: "judge@jis.local",
        role: "JUDGE",
        isActive: true,
        createdAt: new Date(),
      });

      const result = await createUserAction({
        name: "New Lawyer",
        email: "lawyer@jis.local",
        password: "password123",
        role: "LAWYER",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Only Registrars can provision");
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it("rejects duplicate email addresses", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "reg-123",
        name: "Chief Registrar",
        email: "registrar@jis.local",
        role: "REGISTRAR",
        isActive: true,
        createdAt: new Date(),
      });

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "existing-user",
        name: "Existing Person",
        email: "duplicate@jis.local",
        role: "LAWYER",
        isActive: true,
        createdAt: new Date(),
      });

      const result = await createUserAction({
        name: "Duplicate User",
        email: "duplicate@jis.local",
        password: "password123",
        role: "LAWYER",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("already exists");
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it("provisions user account and logs audit entry when called by REGISTRAR", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "reg-123",
        name: "Chief Registrar",
        email: "registrar@jis.local",
        role: "REGISTRAR",
        isActive: true,
        createdAt: new Date(),
      });

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: "new-judge-id",
        name: "Hon. New Judge",
        email: "newjudge@jis.local",
        role: "JUDGE",
        isActive: true,
        createdAt: new Date(),
      });

      const result = await createUserAction({
        name: "Hon. New Judge",
        email: "newjudge@jis.local",
        password: "password123",
        role: "JUDGE",
      });

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe("new-judge-id");
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            actorId: "reg-123",
            action: "USER_CREATED",
            entity: "User",
            entityId: "new-judge-id",
          }),
        })
      );
    });
  });

  describe("deactivateUserAction", () => {
    it("deactivates user and writes to AuditLog", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "reg-123",
        name: "Chief Registrar",
        email: "registrar@jis.local",
        role: "REGISTRAR",
        isActive: true,
        createdAt: new Date(),
      });

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "target-user-id",
        name: "Lawyer To Deactivate",
        email: "lawyer@jis.local",
        role: "LAWYER",
        isActive: true,
        createdAt: new Date(),
      });

      vi.mocked(prisma.user.update).mockResolvedValue({
        id: "target-user-id",
        name: "Lawyer To Deactivate",
        email: "lawyer@jis.local",
        role: "LAWYER",
        isActive: false,
        createdAt: new Date(),
      });

      const result = await deactivateUserAction("target-user-id");

      expect(result.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "target-user-id" },
        data: { isActive: false },
      });
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            actorId: "reg-123",
            action: "USER_DEACTIVATED",
            entity: "User",
            entityId: "target-user-id",
          }),
        })
      );
    });

    it("prevents self-deactivation by Registrar", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "reg-123",
        name: "Chief Registrar",
        email: "registrar@jis.local",
        role: "REGISTRAR",
        isActive: true,
        createdAt: new Date(),
      });

      const result = await deactivateUserAction("reg-123");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Self-deactivation");
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe("logAudit helper", () => {
    it("inserts audit entry with correct schema fields", async () => {
      vi.mocked(prisma.auditLog.create).mockResolvedValue({
        id: "audit-1",
        actorId: "actor-123",
        action: "CASE_CREATED",
        entity: "Case",
        entityId: "CIN-2026-001",
        details: { crimeType: "Forgery" },
        createdAt: new Date(),
      });

      await logAudit("actor-123", "CASE_CREATED", "Case", "CIN-2026-001", {
        crimeType: "Forgery",
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          actorId: "actor-123",
          action: "CASE_CREATED",
          entity: "Case",
          entityId: "CIN-2026-001",
          details: { crimeType: "Forgery" },
        },
      });
    });
  });
});
