import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth
vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    case: {
      findMany: vi.fn(),
    },
    hearing: {
      findMany: vi.fn(),
    },
    courtroom: {
      findMany: vi.fn(),
    },
  },
}));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRegistrarAnalyticsAction } from "@/actions/analytics.actions";

describe("Registrar Analytics & Caseload Intelligence Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const registrarUser = {
    id: "reg-1",
    name: "Chief Registrar",
    email: "registrar@jis.local",
    role: "REGISTRAR",
    isActive: true,
  };

  const judgeUser = {
    id: "judge-1",
    name: "Hon. Justice Sen",
    email: "judge@jis.local",
    role: "JUDGE",
    isActive: true,
  };

  it("rejects unauthenticated requests", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const res = await getRegistrarAnalyticsAction();
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Unauthorized/i);
  });

  it("rejects non-registrar roles (e.g. Judge)", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(judgeUser as any);

    const res = await getRegistrarAnalyticsAction();
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Registrar access required/i);
  });

  it("calculates accurate caseload status distribution and clearance rates", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(registrarUser as any);

    const now = new Date();
    const mockCases = [
      {
        cin: "CIN-001",
        status: "REGISTERED",
        createdAt: now,
        trialStartDate: now,
        judgment: null,
      },
      {
        cin: "CIN-002",
        status: "PENDING",
        createdAt: now,
        trialStartDate: now,
        judgment: null,
      },
      {
        cin: "CIN-003",
        status: "ADJOURNED",
        createdAt: now,
        trialStartDate: now,
        judgment: null,
      },
      {
        cin: "CIN-004",
        status: "RESOLVED",
        createdAt: now,
        trialStartDate: now,
        judgment: { judgmentDate: now },
      },
      {
        cin: "CIN-005",
        status: "CLOSED",
        createdAt: now,
        trialStartDate: now,
        judgment: { judgmentDate: now },
      },
    ];

    const mockHearings = [
      { id: "h1", hearingStatus: "COMPLETED", hearingDate: now, courtroomId: "c1" },
      { id: "h2", hearingStatus: "COMPLETED", hearingDate: now, courtroomId: "c1" },
      { id: "h3", hearingStatus: "ADJOURNED", hearingDate: now, courtroomId: "c2" },
      { id: "h4", hearingStatus: "SCHEDULED", hearingDate: now, courtroomId: "c1" },
    ];

    const mockCourtrooms = [
      {
        id: "c1",
        name: "Courtroom 101",
        location: "Block A",
        hearings: [
          { id: "h1", hearingStatus: "COMPLETED" },
          { id: "h2", hearingStatus: "COMPLETED" },
          { id: "h4", hearingStatus: "SCHEDULED" },
        ],
      },
      {
        id: "c2",
        name: "Courtroom 102",
        location: "Block B",
        hearings: [{ id: "h3", hearingStatus: "ADJOURNED" }],
      },
    ];

    vi.mocked(prisma.case.findMany).mockResolvedValue(mockCases as any);
    vi.mocked(prisma.hearing.findMany).mockResolvedValue(mockHearings as any);
    vi.mocked(prisma.courtroom.findMany).mockResolvedValue(mockCourtrooms as any);

    const res = await getRegistrarAnalyticsAction();
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();

    const data = res.data!;
    expect(data.totalCases).toBe(5);
    expect(data.activeCases).toBe(3); // REGISTERED + PENDING + ADJOURNED
    expect(data.disposedCases).toBe(2); // RESOLVED + CLOSED
    expect(data.clearanceRate).toBe(40); // 2 / 5 = 40%

    // Hearing Efficiency
    expect(data.hearingEfficiency.totalHearings).toBe(4);
    expect(data.hearingEfficiency.completed).toBe(2);
    expect(data.hearingEfficiency.completionRate).toBe(50); // 2 / 4 = 50%
    expect(data.hearingEfficiency.adjourned).toBe(1);
    expect(data.hearingEfficiency.adjournmentRate).toBe(25); // 1 / 4 = 25%

    // Courtrooms
    expect(data.courtroomUtilization).toHaveLength(2);
    expect(data.courtroomUtilization[0].courtroomName).toBe("Courtroom 101");
    expect(data.courtroomUtilization[0].totalHearings).toBe(3);
  });

  it("handles empty database gracefully without division by zero errors", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(registrarUser as any);

    vi.mocked(prisma.case.findMany).mockResolvedValue([]);
    vi.mocked(prisma.hearing.findMany).mockResolvedValue([]);
    vi.mocked(prisma.courtroom.findMany).mockResolvedValue([]);

    const res = await getRegistrarAnalyticsAction();
    expect(res.success).toBe(true);
    expect(res.data?.totalCases).toBe(0);
    expect(res.data?.clearanceRate).toBe(0);
    expect(res.data?.hearingEfficiency.completionRate).toBe(0);
  });

  it("catches internal database errors and returns failure response without throwing", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(registrarUser as any);
    vi.mocked(prisma.case.findMany).mockRejectedValue(new Error("DB Connection Crash"));

    const res = await getRegistrarAnalyticsAction();
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Failed to generate/i);
  });
});
