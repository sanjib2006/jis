import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    case: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  getPublicCaseVerification,
  computeVerificationHash,
} from "@/lib/verification";

describe("Public Case Verification Service Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("computeVerificationHash", () => {
    it("generates a deterministic 64-character SHA-256 hexadecimal hash", () => {
      const hash1 = computeVerificationHash(
        "CIN-2026-001",
        "CLOSED",
        new Date("2026-03-15T10:00:00Z")
      );
      const hash2 = computeVerificationHash(
        "CIN-2026-001",
        "CLOSED",
        new Date("2026-03-15T10:00:00Z")
      );

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it("produces distinct hashes when status or judgment date changes", () => {
      const hashClosed = computeVerificationHash(
        "CIN-2026-001",
        "CLOSED",
        new Date("2026-03-15T10:00:00Z")
      );
      const hashPending = computeVerificationHash(
        "CIN-2026-001",
        "PENDING",
        null
      );

      expect(hashClosed).not.toBe(hashPending);
    });

    it("handles null or undefined judgment date without error", () => {
      const hash = computeVerificationHash("CIN-2026-002", "REGISTERED", null);
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe("getPublicCaseVerification", () => {
    it("returns null for empty or invalid CIN arguments", async () => {
      expect(await getPublicCaseVerification("")).toBeNull();
      // @ts-expect-error Testing invalid runtime input
      expect(await getPublicCaseVerification(null)).toBeNull();
      // @ts-expect-error Testing invalid runtime input
      expect(await getPublicCaseVerification(undefined)).toBeNull();
    });

    it("returns null when case does not exist in the database", async () => {
      (prisma.case.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        null
      );

      const result = await getPublicCaseVerification("CIN-NON-EXISTENT");
      expect(result).toBeNull();
      expect(prisma.case.findUnique).toHaveBeenCalledWith({
        where: { cin: "CIN-NON-EXISTENT" },
        select: expect.any(Object),
      });
    });

    it("retrieves and sanitizes a CLOSED case with judgment decree", async () => {
      const judgmentDate = new Date("2026-04-10T14:30:00Z");
      const mockCase = {
        cin: "CIN-2026-005",
        defendantName: "Rajesh Kumar",
        crimeType: "Corporate Embezzlement",
        crimeLocation: "Metropolitan Financial District",
        status: "CLOSED",
        trialStartDate: new Date("2026-01-10T10:00:00Z"),
        judge: {
          name: "Hon. Justice Sen",
        },
        judgment: {
          judgmentDate,
          summary: "Guilty of Section 409 IPC. Sentenced to 3 years rigorous imprisonment.",
        },
      };

      (prisma.case.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockCase
      );

      const result = await getPublicCaseVerification(" CIN-2026-005 "); // Test whitespace trimming
      expect(result).not.toBeNull();
      expect(result?.cin).toBe("CIN-2026-005");
      expect(result?.defendantName).toBe("Rajesh Kumar");
      expect(result?.isDisposed).toBe(true);
      expect(result?.judgeName).toBe("Hon. Justice Sen");
      expect(result?.judgmentDate).toEqual(judgmentDate);
      expect(result?.judgmentSummary).toBe(
        "Guilty of Section 409 IPC. Sentenced to 3 years rigorous imprisonment."
      );
      expect(result?.verificationHash).toBe(
        computeVerificationHash("CIN-2026-005", "CLOSED", judgmentDate)
      );

      // Verify privacy: no sensitive fields leaked
      expect(result).not.toHaveProperty("caseViews");
      expect(result).not.toHaveProperty("auditLogs");
      expect(result).not.toHaveProperty("lawyer");
      expect(result).not.toHaveProperty("prosecutor");
    });

    it("retrieves an active/pending case without disclosing unentered judgment", async () => {
      const mockCase = {
        cin: "CIN-2026-012",
        defendantName: "Sunil Verma",
        crimeType: "Securities Fraud",
        crimeLocation: "Capital City",
        status: "PENDING",
        trialStartDate: new Date("2026-05-01T10:00:00Z"),
        judge: {
          name: "Hon. Justice Banerjee",
        },
        judgment: null,
      };

      (prisma.case.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockCase
      );

      const result = await getPublicCaseVerification("CIN-2026-012");
      expect(result).not.toBeNull();
      expect(result?.cin).toBe("CIN-2026-012");
      expect(result?.isDisposed).toBe(false);
      expect(result?.judgmentDate).toBeNull();
      expect(result?.judgmentSummary).toBeNull();
      expect(result?.status).toBe("PENDING");
      expect(result?.verificationHash).toBe(
        computeVerificationHash("CIN-2026-012", "PENDING", null)
      );
    });
  });
});
