import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockSignInWithPassword,
  mockSignOut,
  mockCookieSet,
  mockCookieDelete,
  mockCookieGet,
} = vi.hoisted(() => ({
  mockSignInWithPassword: vi.fn(),
  mockSignOut: vi.fn(),
  mockCookieSet: vi.fn(),
  mockCookieDelete: vi.fn(),
  mockCookieGet: vi.fn(),
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: mockCookieGet,
    set: mockCookieSet,
    delete: mockCookieDelete,
  }),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

// Mock Supabase server client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signOut: mockSignOut,
    },
  }),
}));

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    twoFactorChallenge: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

// Mock email dispatcher
vi.mock("@/lib/email", () => ({
  generateSecureOtp: vi.fn(() => "482915"),
  hashOtp: vi.fn((code: string) => `hash-${code}`),
  sendOtpEmail: vi.fn().mockResolvedValue({ success: true, id: "mock-resend-id" }),
}));

// Mock audit logging helper
vi.mock("@/actions/audit.actions", () => ({
  logAudit: vi.fn().mockResolvedValue({ id: "mock-audit-id" }),
}));

import { prisma } from "@/lib/prisma";
import { loginAction, verify2faAction } from "@/actions/auth.actions";
import { sendOtpEmail } from "@/lib/email";
import { logAudit } from "@/actions/audit.actions";

describe("Registrar Two-Factor Authentication (2FA) Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loginAction 2FA Enforcing", () => {
    it("bypasses 2FA for LAWYER role and redirects directly to dashboard", async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: "lawyer-1", email: "lawyer@jis.local" } },
        error: null,
      });

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "lawyer-1",
        name: "Advocate Jane",
        email: "lawyer@jis.local",
        role: "LAWYER",
        isActive: true,
        createdAt: new Date(),
      });

      const result = await loginAction({
        email: "lawyer@jis.local",
        password: "password123",
      });

      expect(result.success).toBe(true);
      expect(result.data?.redirectUrl).toBe("/lawyer");
      expect(result.data?.requires2fa).toBeFalsy();
      expect(prisma.twoFactorChallenge.create).not.toHaveBeenCalled();
      expect(sendOtpEmail).not.toHaveBeenCalled();
    });

    it("bypasses 2FA for JUDGE role and redirects directly to dashboard", async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: "judge-1", email: "judge@jis.local" } },
        error: null,
      });

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "judge-1",
        name: "Hon. Justice Smith",
        email: "judge@jis.local",
        role: "JUDGE",
        isActive: true,
        createdAt: new Date(),
      });

      const result = await loginAction({
        email: "judge@jis.local",
        password: "password123",
      });

      expect(result.success).toBe(true);
      expect(result.data?.redirectUrl).toBe("/judge");
      expect(result.data?.requires2fa).toBeFalsy();
      expect(sendOtpEmail).not.toHaveBeenCalled();
    });

    it("triggers 2FA for REGISTRAR role, creates challenge, and dispatches email via SMTP", async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: "reg-1", email: "registrar@jis.local" } },
        error: null,
      });

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "reg-1",
        name: "Chief Registrar",
        email: "registrar@jis.local",
        role: "REGISTRAR",
        isActive: true,
        createdAt: new Date(),
      });

      vi.mocked(prisma.twoFactorChallenge.create).mockResolvedValue({
        id: "mock-challenge-uuid",
        userId: "reg-1",
        codeHash: "hash-482915",
        expiresAt: new Date(Date.now() + 600000),
        attempts: 0,
        createdAt: new Date(),
      });

      const result = await loginAction({
        email: "registrar@jis.local",
        password: "password123",
      });

      expect(result.success).toBe(true);
      expect(result.data?.requires2fa).toBe(true);
      expect(result.data?.challengeId).toBe("mock-challenge-uuid");

      // Verify challenge created in DB
      expect(prisma.twoFactorChallenge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "reg-1",
            attempts: 0,
          }),
        })
      );

      // Verify email dispatched via SMTP
      expect(sendOtpEmail).toHaveBeenCalledWith({
        code: "482915",
        name: "Chief Registrar",
      });

      // Verify pending cookie set
      expect(mockCookieSet).toHaveBeenCalledWith(
        "jis_2fa_pending",
        "true",
        expect.any(Object)
      );

      // Verify audit log
      expect(logAudit).toHaveBeenCalledWith(
        "reg-1",
        "OTP_GENERATED",
        "User",
        "reg-1",
        expect.any(Object)
      );
    });
  });

  describe("verify2faAction Validation & Verification", () => {
    it("rejects non-existent or invalid challenge ID", async () => {
      vi.mocked(prisma.twoFactorChallenge.findUnique).mockResolvedValue(null);

      const result = await verify2faAction({
        challengeId: "12345678-1234-1234-1234-123456789abc",
        code: "123456",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("expired or not found");
    });

    it("rejects expired OTP challenge and cleans it from DB", async () => {
      vi.mocked(prisma.twoFactorChallenge.findUnique).mockResolvedValue({
        id: "12345678-1234-1234-1234-123456789abc",
        userId: "reg-1",
        codeHash: "hash-123456",
        expiresAt: new Date(Date.now() - 5000), // Expired 5 seconds ago
        attempts: 0,
        createdAt: new Date(),
        user: { id: "reg-1", name: "Registrar", email: "reg@court.gov.in" } as any,
      });

      const result = await verify2faAction({
        challengeId: "12345678-1234-1234-1234-123456789abc",
        code: "123456",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("expired");
      expect(prisma.twoFactorChallenge.delete).toHaveBeenCalledWith({
        where: { id: "12345678-1234-1234-1234-123456789abc" },
      });
    });

    it("rejects incorrect OTP code, increments attempts, and logs failure", async () => {
      vi.mocked(prisma.twoFactorChallenge.findUnique).mockResolvedValue({
        id: "12345678-1234-1234-1234-123456789abc",
        userId: "reg-1",
        codeHash: "hash-654321", // Correct code is 654321
        expiresAt: new Date(Date.now() + 500000),
        attempts: 1,
        createdAt: new Date(),
        user: { id: "reg-1", name: "Registrar", email: "reg@court.gov.in" } as any,
      });

      vi.mocked(prisma.twoFactorChallenge.update).mockResolvedValue({
        id: "12345678-1234-1234-1234-123456789abc",
        userId: "reg-1",
        codeHash: "hash-654321",
        expiresAt: new Date(Date.now() + 500000),
        attempts: 2,
        createdAt: new Date(),
      });

      const result = await verify2faAction({
        challengeId: "12345678-1234-1234-1234-123456789abc",
        code: "111111", // Wrong code
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid verification code");
      expect(result.error).toContain("3 attempts remaining");
      expect(prisma.twoFactorChallenge.update).toHaveBeenCalled();
      expect(logAudit).toHaveBeenCalledWith(
        "reg-1",
        "OTP_VERIFY_FAILED",
        "User",
        "reg-1",
        expect.any(Object)
      );
    });

    it("locks challenge when attempts reach 5", async () => {
      vi.mocked(prisma.twoFactorChallenge.findUnique).mockResolvedValue({
        id: "12345678-1234-1234-1234-123456789abc",
        userId: "reg-1",
        codeHash: "hash-999999",
        expiresAt: new Date(Date.now() + 500000),
        attempts: 5, // Already maxed out
        createdAt: new Date(),
        user: { id: "reg-1", name: "Registrar", email: "reg@court.gov.in" } as any,
      });

      const result = await verify2faAction({
        challengeId: "12345678-1234-1234-1234-123456789abc",
        code: "999999",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Maximum verification attempts exceeded");
      expect(prisma.twoFactorChallenge.delete).toHaveBeenCalled();
      expect(logAudit).toHaveBeenCalledWith(
        "reg-1",
        "OTP_LOCKED",
        "User",
        "reg-1",
        expect.any(Object)
      );
    });

    it("successfully verifies valid OTP, consumes challenge, and grants registrar access", async () => {
      const validCode = "482915";

      vi.mocked(prisma.twoFactorChallenge.findUnique).mockResolvedValue({
        id: "12345678-1234-1234-1234-123456789abc",
        userId: "reg-1",
        codeHash: "hash-482915",
        expiresAt: new Date(Date.now() + 500000),
        attempts: 0,
        createdAt: new Date(),
        user: { id: "reg-1", name: "Registrar", email: "reg@court.gov.in" } as any,
      });

      const result = await verify2faAction({
        challengeId: "12345678-1234-1234-1234-123456789abc",
        code: validCode,
      });

      expect(result.success).toBe(true);
      expect(result.data?.redirectUrl).toBe("/registrar");

      // Verify challenge consumed (deleted)
      expect(prisma.twoFactorChallenge.delete).toHaveBeenCalledWith({
        where: { id: "12345678-1234-1234-1234-123456789abc" },
      });

      // Verify verified cookie set
      expect(mockCookieSet).toHaveBeenCalledWith(
        "jis_2fa_verified",
        "true",
        expect.any(Object)
      );

      // Verify pending cookie deleted
      expect(mockCookieDelete).toHaveBeenCalledWith("jis_2fa_pending");

      // Verify audit log
      expect(logAudit).toHaveBeenCalledWith(
        "reg-1",
        "OTP_VERIFIED",
        "User",
        "reg-1",
        expect.any(Object)
      );
    });
  });
});
