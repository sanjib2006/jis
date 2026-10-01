import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/actions/case.actions", () => ({
  searchCasesAction: vi.fn(),
  getCaseByCinAction: vi.fn(),
  getPendingCasesAction: vi.fn(),
  getResolvedCasesAction: vi.fn(),
}));

vi.mock("@/actions/hearing.actions", () => ({
  getHearingsByDateAction: vi.fn(),
  getAvailableSlotsAction: vi.fn(),
}));

vi.mock("@/actions/courtroom.actions", () => ({
  getAllCourtroomsAction: vi.fn(),
}));

vi.mock("@/actions/analytics.actions", () => ({
  getRegistrarAnalyticsAction: vi.fn(),
}));

vi.mock("@/actions/caseView.actions", () => ({
  getClosedCasesAction: vi.fn(),
  getLawyerBillingAction: vi.fn(),
}));

vi.mock("ai", () => ({
  tool: vi.fn((config) => config),
  isStepCount: vi.fn(() => () => false),
  streamText: vi.fn(() => ({
    toTextStreamResponse: vi.fn(
      () =>
        new Response("mock-stream-response", {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        })
    ),
  })),
}));

vi.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: vi.fn(() => vi.fn((model: string) => `mock-model-${model}`)),
}));

import { getCurrentUser } from "@/lib/auth";
import { POST } from "@/app/api/chat/route";
import { createAiTools } from "@/lib/ai/tools";
import { getSystemPromptForRole } from "@/lib/ai/prompts";
import {
  searchCasesAction,
  getCaseByCinAction,
  getPendingCasesAction,
} from "@/actions/case.actions";
import { getLawyerBillingAction } from "@/actions/caseView.actions";
import type { CurrentUser } from "@/types";

describe("Judicial AI Assistant Route & Tools Unit Tests", () => {
  const mockRegistrar: CurrentUser = {
    id: "reg-1",
    name: "Registrar Sharma",
    email: "registrar@jis.local",
    role: "REGISTRAR",
    isActive: true,
    createdAt: new Date(),
  };

  const mockJudge: CurrentUser = {
    id: "judge-1",
    name: "Justice Verma",
    email: "judge@jis.local",
    role: "JUDGE",
    isActive: true,
    createdAt: new Date(),
  };

  const mockLawyer: CurrentUser = {
    id: "lawyer-1",
    name: "Advocate Roy",
    email: "lawyer@jis.local",
    role: "LAWYER",
    isActive: true,
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("API Route Handler (/api/chat)", () => {
    it("rejects unauthenticated requests with 401 status", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      const req = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: [{ role: "user", content: "Hello" }] }),
      });

      const response = await POST(req);
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error).toContain("Unauthorized");
    });

    it("returns 503 when Gemini API key is missing", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockRegistrar);

      const originalKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      const originalGeminiKey = process.env.GEMINI_API_KEY;
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      delete process.env.GEMINI_API_KEY;

      const req = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: [{ role: "user", content: "Hello" }] }),
      });

      const response = await POST(req);
      expect(response.status).toBe(503);
      const json = await response.json();
      expect(json.error).toContain("Gemini API key is not configured");

      process.env.GOOGLE_GENERATIVE_AI_API_KEY = originalKey;
      process.env.GEMINI_API_KEY = originalGeminiKey;
    });

    it("rejects invalid body format with 400 status", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockRegistrar);
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = "mock-key";

      const req = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({ invalidField: "test" }),
      });

      const response = await POST(req);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toContain("Expected 'messages' array");
    });

    it("streams response successfully when authorized with valid payload", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockRegistrar);
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = "mock-key";

      const req = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "How many pending cases?" }],
        }),
      });

      const response = await POST(req);
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toBe("mock-stream-response");
    });
  });

  describe("Role-Based Tool Scoping", () => {
    it("provides full administrative tool suite to Registrar", () => {
      const tools = createAiTools(mockRegistrar) as Record<string, unknown>;

      expect(tools.searchCases).toBeDefined();
      expect(tools.getCaseDetails).toBeDefined();
      expect(tools.getPendingCases).toBeDefined();
      expect(tools.getResolvedCases).toBeDefined();
      expect(tools.getCourtroomAvailability).toBeDefined();
      expect(tools.getHearingsForDate).toBeDefined();
      expect(tools.getAnalyticsSummary).toBeDefined();
      expect(tools.getClosedCases).toBeDefined();
      expect(tools.getLawyerBilling).toBeUndefined(); // Lawyer only
    });

    it("restricts Judge to precedent search and case details tools", () => {
      const tools = createAiTools(mockJudge) as Record<string, unknown>;

      expect(tools.searchCases).toBeDefined();
      expect(tools.getCaseDetails).toBeDefined();
      expect(tools.getClosedCases).toBeDefined();
      expect(tools.getPendingCases).toBeUndefined();
      expect(tools.getCourtroomAvailability).toBeUndefined();
      expect(tools.getHearingsForDate).toBeUndefined();
      expect(tools.getAnalyticsSummary).toBeUndefined();
      expect(tools.getLawyerBilling).toBeUndefined();
    });

    it("equips Lawyer with precedent search, case details, and billing tools", () => {
      const tools = createAiTools(mockLawyer) as Record<string, unknown>;

      expect(tools.searchCases).toBeDefined();
      expect(tools.getCaseDetails).toBeDefined();
      expect(tools.getClosedCases).toBeDefined();
      expect(tools.getLawyerBilling).toBeDefined();
      expect(tools.getPendingCases).toBeUndefined();
      expect(tools.getCourtroomAvailability).toBeUndefined();
      expect(tools.getHearingsForDate).toBeUndefined();
      expect(tools.getAnalyticsSummary).toBeUndefined();
    });
  });

  describe("Tool Execution & Security Boundaries", () => {
    it("executes searchCases and formats serialized result", async () => {
      const tools = createAiTools(mockRegistrar) as any;

      vi.mocked(searchCasesAction).mockResolvedValue({
        success: true,
        data: [
          {
            cin: "CIN-2026-0001",
            defendantName: "A. Kumar",
            crimeType: "Theft",
            status: "PENDING",
            judge: { name: "Justice Verma" },
            judgment: null,
          } as any,
        ],
      });

      const result = await tools.searchCases.execute({ query: "theft" });
      expect(result.count).toBe(1);
      expect(result.cases[0].cin).toBe("CIN-2026-0001");
      expect(result.cases[0].defendantName).toBe("A. Kumar");
    });

    it("prevents Judge from viewing active/pending case dockets", async () => {
      const tools = createAiTools(mockJudge) as any;

      vi.mocked(getCaseByCinAction).mockResolvedValue({
        success: true,
        data: {
          cin: "CIN-2026-0001",
          defendantName: "Pending Defendant",
          status: "PENDING", // Not CLOSED or RESOLVED
        } as any,
      });

      const result = await tools.getCaseDetails.execute({ cin: "CIN-2026-0001" });
      expect(result.error).toContain("privacy rules");
      expect(result.error).toContain("only the Registrar has access");
    });

    it("permits Judge to view CLOSED case dockets", async () => {
      const tools = createAiTools(mockJudge) as any;

      vi.mocked(getCaseByCinAction).mockResolvedValue({
        success: true,
        data: {
          cin: "CIN-2026-0002",
          defendantName: "Closed Defendant",
          crimeType: "Burglary",
          status: "CLOSED",
          judgment: {
            judgmentDate: new Date("2026-01-15"),
            summary: "Guilty as charged",
          },
          hearings: [],
        } as any,
      });

      const result = await tools.getCaseDetails.execute({ cin: "CIN-2026-0002" });
      expect(result.error).toBeUndefined();
      expect(result.cin).toBe("CIN-2026-0002");
      expect(result.status).toBe("CLOSED");
    });

    it("allows Lawyer to query billing summary", async () => {
      const tools = createAiTools(mockLawyer) as any;

      vi.mocked(getLawyerBillingAction).mockResolvedValue({
        success: true,
        data: {
          totalCharges: 100,
          viewCount: 2,
          monthlyCharges: 50,
          monthlyViewCount: 1,
          views: [],
        },
      });

      const result = await tools.getLawyerBilling.execute({});
      expect(result.totalCharges).toBe(100);
      expect(result.totalViewCount).toBe(2);
    });

    it("executes getPendingCases for Registrar", async () => {
      const tools = createAiTools(mockRegistrar) as any;

      vi.mocked(getPendingCasesAction).mockResolvedValue({
        success: true,
        data: [
          {
            cin: "CIN-2026-0099",
            defendantName: "B. Singh",
            crimeType: "Fraud",
            status: "ADJOURNED",
          } as any,
        ],
      });

      const result = await tools.getPendingCases.execute({});
      expect(result.totalPending).toBe(1);
      expect(result.cases[0].cin).toBe("CIN-2026-0099");
    });
  });

  describe("System Prompts Grounding", () => {
    it("returns distinct role-grounded prompts for all 3 roles", () => {
      const regPrompt = getSystemPromptForRole("REGISTRAR");
      const judgePrompt = getSystemPromptForRole("JUDGE");
      const lawyerPrompt = getSystemPromptForRole("LAWYER");

      expect(regPrompt).toContain("Court Registrar");
      expect(regPrompt).toContain("Courtroom & Schedule Management");

      expect(judgePrompt).toContain("honorable Judge");
      expect(judgePrompt).toContain("CLOSED and RESOLVED cases");

      expect(lawyerPrompt).toContain("Legal Practitioner");
      expect(lawyerPrompt).toContain("₹50.00");
    });
  });
});
