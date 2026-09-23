import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth
vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    hearing: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    courtroom: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    case: {
      findUnique: vi.fn(),
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
import {
  getAvailableSlotsAction,
  scheduleHearingAction,
  recordAdjournmentAction,
  recordHearingSummaryAction,
} from "@/actions/hearing.actions";

describe("Phase 4 — Hearing Scheduling, Adjournment & Proceedings Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const judgeId = "11111111-1111-4111-8111-111111111111";
  const courtroomId = "22222222-2222-4222-8222-222222222222";
  const cin = "cin-test-2026-100";
  const hearingId = "44444444-4444-4444-8444-444444444444";
  const testDate = new Date("2026-04-15");

  describe("getAvailableSlotsAction", () => {
    it("reports remaining slots accurately and detects judge conflict", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "reg-1",
        name: "Chief Registrar",
        email: "reg@jis.local",
        role: "REGISTRAR",
        isActive: true,
        createdAt: new Date(),
      });

      // Judge has no prior hearing on this date
      vi.mocked(prisma.hearing.findFirst).mockResolvedValue(null);

      // 2 courtrooms: one with 2 of 5 booked, one with 5 of 5 booked
      vi.mocked(prisma.courtroom.findMany).mockResolvedValue([
        {
          id: courtroomId,
          name: "Courtroom 101",
          location: "Floor 1",
          maxSlots: 5,
          isActive: true,
          hearings: [
            { id: "h1" } as any,
            { id: "h2" } as any,
          ],
        },
        {
          id: "cr-full",
          name: "Courtroom 102",
          location: "Floor 1",
          maxSlots: 4,
          isActive: true,
          hearings: [
            { id: "h3" } as any,
            { id: "h4" } as any,
            { id: "h5" } as any,
            { id: "h6" } as any,
          ],
        },
      ]);

      const result = await getAvailableSlotsAction(testDate, judgeId);

      expect(result.success).toBe(true);
      expect(result.data?.judgeBooked).toBe(false);
      expect(result.data?.slots).toHaveLength(2);

      const cr1 = result.data?.slots.find((s) => s.courtroomId === courtroomId);
      expect(cr1?.bookedSlots).toBe(2);
      expect(cr1?.remainingSlots).toBe(3);

      const cr2 = result.data?.slots.find((s) => s.courtroomId === "cr-full");
      expect(cr2?.bookedSlots).toBe(4);
      expect(cr2?.remainingSlots).toBe(0);
    });
  });

  describe("scheduleHearingAction", () => {
    it("rejects scheduling if judge already has another hearing on that calendar date", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "reg-1",
        name: "Chief Registrar",
        email: "reg@jis.local",
        role: "REGISTRAR",
        isActive: true,
        createdAt: new Date(),
      });

      vi.mocked(prisma.case.findUnique).mockResolvedValue({
        cin,
        defendantName: "Accused Person",
        defendantAddress: "Delhi",
        crimeType: "Theft",
        crimeDate: new Date(),
        crimeLocation: "Market",
        arrestingOfficer: "Inspector",
        arrestDate: new Date(),
        trialStartDate: new Date(),
        expectedCompletionDate: new Date(),
        status: "PENDING",
        judgeId,
        prosecutorId: "pp-1",
        lawyerId: "def-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.courtroom.findUnique).mockResolvedValue({
        id: courtroomId,
        name: "Courtroom 101",
        location: "1st Floor",
        maxSlots: 5,
        isActive: true,
        hearings: [],
      });

      // Conflict: judge already has a hearing
      vi.mocked(prisma.hearing.findFirst).mockResolvedValue({
        id: "existing-hearing",
        cin: "cin-other",
        courtroomId: "other-cr",
        hearingDate: testDate,
        hearingStatus: "SCHEDULED",
        proceedingSummary: null,
        adjournmentReason: null,
        nextHearingDate: null,
        createdAt: new Date(),
      });

      const result = await scheduleHearingAction({
        cin,
        courtroomId,
        hearingDate: testDate,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("presiding Judge already has another hearing");
      expect(prisma.hearing.create).not.toHaveBeenCalled();
    });

    it("rejects scheduling if courtroom has reached maximum slot capacity", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "reg-1",
        name: "Chief Registrar",
        email: "reg@jis.local",
        role: "REGISTRAR",
        isActive: true,
        createdAt: new Date(),
      });

      vi.mocked(prisma.case.findUnique).mockResolvedValue({
        cin,
        status: "PENDING",
        judgeId,
      } as any);

      vi.mocked(prisma.courtroom.findUnique).mockResolvedValue({
        id: courtroomId,
        name: "Courtroom 101",
        location: "1st Floor",
        maxSlots: 3,
        isActive: true,
        hearings: [
          { id: "h1" } as any,
          { id: "h2" } as any,
          { id: "h3" } as any,
        ],
      });

      const result = await scheduleHearingAction({
        cin,
        courtroomId,
        hearingDate: testDate,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("maximum capacity of 3");
      expect(prisma.hearing.create).not.toHaveBeenCalled();
    });
  });

  describe("recordAdjournmentAction", () => {
    it("rejects adjournment when reason is shorter than 5 characters", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "reg-1",
        role: "REGISTRAR",
      } as any);

      const result = await recordAdjournmentAction({
        hearingId,
        adjournmentReason: "Sick", // too short (4 chars)
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("at least 5 characters");
      expect(prisma.hearing.update).not.toHaveBeenCalled();
    });

    it("records adjournment and updates case status to ADJOURNED", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "reg-1",
        role: "REGISTRAR",
      } as any);

      vi.mocked(prisma.hearing.findUnique).mockResolvedValue({
        id: hearingId,
        cin,
        hearingStatus: "SCHEDULED",
        case: { cin, status: "PENDING" },
      } as any);

      const result = await recordAdjournmentAction({
        hearingId,
        adjournmentReason: "Key witness absent due to medical emergency.",
      });

      expect(result.success).toBe(true);
      expect(prisma.hearing.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: hearingId },
          data: expect.objectContaining({
            hearingStatus: "ADJOURNED",
            adjournmentReason: "Key witness absent due to medical emergency.",
          }),
        })
      );
      expect(prisma.case.update).toHaveBeenCalledWith({
        where: { cin },
        data: { status: "ADJOURNED" },
      });
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe("recordHearingSummaryAction", () => {
    it("records proceeding summary and marks hearing as COMPLETED", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "reg-1",
        role: "REGISTRAR",
      } as any);

      vi.mocked(prisma.hearing.findUnique).mockResolvedValue({
        id: hearingId,
        cin,
        hearingStatus: "SCHEDULED",
        case: { cin, status: "PENDING" },
      } as any);

      const result = await recordHearingSummaryAction({
        hearingId,
        proceedingSummary: "Cross-examination of PW-1 completed. Defense requested bail arguments on next date.",
      });

      expect(result.success).toBe(true);
      expect(prisma.hearing.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: hearingId },
          data: expect.objectContaining({
            hearingStatus: "COMPLETED",
            proceedingSummary: expect.stringContaining("Cross-examination of PW-1 completed"),
          }),
        })
      );
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });
  });
});
