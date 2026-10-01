import { describe, it, expect } from "vitest";
import { generateCauseListPdf, type CauseListHearing } from "@/lib/pdf/cause-list";
import {
  generateJudgmentDecreePdf,
  type CaseWithJudgmentAndPersonnel,
} from "@/lib/pdf/judgment-decree";

describe("Official Court PDF Generation Engine Unit Tests", () => {
  const mockHearings: CauseListHearing[] = [
    {
      id: "hearing-1",
      caseId: "case-1",
      courtroomId: "cr-1",
      hearingDate: new Date("2026-10-15T10:30:00Z"),
      hearingStatus: "SCHEDULED",
      summary: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      case: {
        id: "case-1",
        cin: "CIN-2026-001",
        defendantName: "Ramesh Patel",
        crimeType: "Securities Fraud",
        crimeLocation: "Financial District",
        status: "PENDING",
        trialStartDate: new Date("2026-01-10T10:00:00Z"),
        createdAt: new Date(),
        updatedAt: new Date(),
        judgeId: "judge-1",
        prosecutorId: "pros-1",
        lawyerId: "law-1",
        judge: {
          id: "judge-1",
          name: "Hon. Justice Sen",
          email: "judge@jis.local",
          role: "JUDGE",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        prosecutor: {
          id: "pros-1",
          name: "Adv. Public Prosecutor Roy",
          email: "pros@jis.local",
          role: "REGISTRAR",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        lawyer: {
          id: "law-1",
          name: "Adv. Defense Counsel Sharma",
          email: "law@jis.local",
          role: "LAWYER",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      courtroom: {
        id: "cr-1",
        name: "Courtroom 01",
        location: "East Wing, Level 2",
        maxSlots: 8,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    {
      id: "hearing-2",
      caseId: "case-2",
      courtroomId: null,
      hearingDate: new Date("2026-10-15T14:00:00Z"),
      hearingStatus: "ADJOURNED",
      summary: "Adjourned on request of defense counsel.",
      createdAt: new Date(),
      updatedAt: new Date(),
      case: {
        id: "case-2",
        cin: "CIN-2026-002",
        defendantName: "Vikram Malhotra",
        crimeType: "Corporate Embezzlement",
        crimeLocation: "Capital City",
        status: "ADJOURNED",
        trialStartDate: new Date("2026-02-15T10:00:00Z"),
        createdAt: new Date(),
        updatedAt: new Date(),
        judgeId: "judge-1",
        prosecutorId: "pros-1",
        lawyerId: "law-1",
        judge: {
          id: "judge-1",
          name: "Hon. Justice Sen",
          email: "judge@jis.local",
          role: "JUDGE",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        prosecutor: {
          id: "pros-1",
          name: "Adv. Public Prosecutor Roy",
          email: "pros@jis.local",
          role: "REGISTRAR",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        lawyer: {
          id: "law-1",
          name: "Adv. Defense Counsel Sharma",
          email: "law@jis.local",
          role: "LAWYER",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      courtroom: null,
    },
  ];

  const mockCaseWithJudgment: CaseWithJudgmentAndPersonnel = {
    id: "case-closed-1",
    cin: "CIN-2026-006",
    defendantName: "Ramesh Patel",
    crimeType: "Grand Larceny & Embezzlement",
    crimeLocation: "Metro Bank Headquarters",
    status: "RESOLVED",
    trialStartDate: new Date("2026-01-15T10:00:00Z"),
    createdAt: new Date(),
    updatedAt: new Date(),
    judgeId: "judge-1",
    prosecutorId: "pros-1",
    lawyerId: "law-1",
    judge: {
      id: "judge-1",
      name: "Justice Sen",
      email: "sen@jis.local",
      role: "JUDGE",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    prosecutor: {
      id: "pros-1",
      name: "Adv. Rajesh Kumar",
      email: "rajesh@jis.local",
      role: "REGISTRAR",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    lawyer: {
      id: "law-1",
      name: "Adv. Priya Sharma",
      email: "priya@jis.local",
      role: "LAWYER",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    judgment: {
      id: "jdg-1",
      caseId: "case-closed-1",
      judgmentDate: new Date("2026-04-10T14:30:00Z"),
      summary:
        "The accused Ramesh Patel has been proved guilty beyond all reasonable doubt under Sections 409 and 420 of the Penal Code. " +
        "The evidence of forensic financial audits and witness testimonies conclusively establishes willful misappropriation of funds. " +
        "SENTENCING ORDER: The defendant is sentenced to 3 years rigorous imprisonment and a fine of Rs. 500,000.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  describe("Daily Cause List PDF Generation", () => {
    it("generates a valid PDF buffer starting with %PDF- header for scheduled hearings", async () => {
      const pdfBuffer = await generateCauseListPdf({
        date: new Date("2026-10-15T00:00:00Z"),
        hearings: mockHearings,
        baseUrl: "https://jis.court.gov.in",
      });

      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(1000);
      expect(pdfBuffer.toString("utf8", 0, 5)).toBe("%PDF-");
    });

    it("generates a valid PDF buffer with fallback table row when no hearings are scheduled", async () => {
      const pdfBuffer = await generateCauseListPdf({
        date: new Date("2026-10-16T00:00:00Z"),
        hearings: [],
        baseUrl: "https://jis.court.gov.in",
      });

      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(1000);
      expect(pdfBuffer.toString("utf8", 0, 5)).toBe("%PDF-");
    });
  });

  describe("Certified Judgment Decree PDF Generation", () => {
    it("generates a valid PDF buffer starting with %PDF- header embedding QR code and seal", async () => {
      const pdfBuffer = await generateJudgmentDecreePdf({
        caseData: mockCaseWithJudgment,
        baseUrl: "https://jis.court.gov.in",
      });

      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(2000);
      expect(pdfBuffer.toString("utf8", 0, 5)).toBe("%PDF-");
    });

    it("handles extensive multi-paragraph judgment text across pages", async () => {
      const longSummary = "Paragraph test findings. ".repeat(80);
      const longCase = {
        ...mockCaseWithJudgment,
        judgment: {
          ...mockCaseWithJudgment.judgment,
          summary: longSummary,
        },
      };

      const pdfBuffer = await generateJudgmentDecreePdf({
        caseData: longCase,
        baseUrl: "https://jis.court.gov.in",
      });

      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(3000);
      expect(pdfBuffer.toString("utf8", 0, 5)).toBe("%PDF-");
    });
  });
});
