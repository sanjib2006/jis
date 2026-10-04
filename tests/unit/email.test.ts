import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  generateSecureOtp,
  hashOtp,
  formatSenderAddress,
  sendOtpEmail,
  sendHearingNoticeEmail,
} from "@/lib/email";

// Mock nodemailer
const mockSendMail = vi.fn();
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: mockSendMail,
    })),
  },
}));

describe("Email Service & Hearing Notice Engine Unit Tests", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.TO_EMAIL;
    delete process.env.TWO_FACTOR_RECIPIENT_EMAIL;
    mockSendMail.mockResolvedValue({ messageId: "<mock_msg_id@smtp>" });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Sender Address Formatting", () => {
    it("formats sender address with designated name and default email", () => {
      delete process.env.SMTP_FROM_EMAIL;
      expect(formatSenderAddress("JIS | Authentication")).toBe(
        '"JIS | Authentication" <jis@sanjib.me>'
      );
    });

    it("formats sender address with custom SMTP_FROM_EMAIL", () => {
      expect(
        formatSenderAddress("JIS | Court Notifications", "notifications@court.gov.in")
      ).toBe('"JIS | Court Notifications" <notifications@court.gov.in>');
    });

    it("extracts email when angle brackets are present in raw address", () => {
      expect(
        formatSenderAddress("JIS | Authentication", "Legacy Sender <legacy@court.gov.in>")
      ).toBe('"JIS | Authentication" <legacy@court.gov.in>');
    });
  });

  describe("OTP Generation & Hashing", () => {
    it("generates a cryptographically random 6-digit numeric OTP", () => {
      const code = generateSecureOtp();
      expect(code).toMatch(/^\d{6}$/);
      const num = parseInt(code, 10);
      expect(num).toBeGreaterThanOrEqual(100000);
      expect(num).toBeLessThan(1000000);
    });

    it("generates deterministic SHA-256 hash for verification codes", () => {
      const code = "482915";
      const hash1 = hashOtp(code);
      const hash2 = hashOtp("  482915  "); // trimmed
      expect(hash1).toHaveLength(64); // SHA-256 hex string
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hashOtp("482916"));
    });
  });

  describe("sendOtpEmail", () => {
    it("returns error if SMTP configuration is missing", async () => {
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
      process.env.TO_EMAIL = "registrar@court.gov.in";

      const result = await sendOtpEmail({ code: "123456" });
      expect(result.success).toBe(false);
      expect(result.error).toContain("configuration is missing");
    });

    it("returns error if TO_EMAIL is missing", async () => {
      process.env.SMTP_HOST = "smtp-relay.brevo.com";
      process.env.SMTP_USER = "user@smtp-brevo.com";
      process.env.SMTP_PASS = "xsmtpsib-testkey";
      delete process.env.TO_EMAIL;
      delete process.env.TWO_FACTOR_RECIPIENT_EMAIL;

      const result = await sendOtpEmail({ code: "123456" });
      expect(result.success).toBe(false);
      expect(result.error).toContain("configuration is missing");
    });

    it("dispatches OTP email payload via SMTP transport to TO_EMAIL", async () => {
      process.env.SMTP_HOST = "smtp-relay.brevo.com";
      process.env.SMTP_USER = "user@smtp-brevo.com";
      process.env.SMTP_PASS = "xsmtpsib-testkey";
      process.env.SMTP_FROM_EMAIL = "jis@sanjib.me";
      process.env.TO_EMAIL = "registrar@jis.local";

      const result = await sendOtpEmail({
        code: "987654",
        name: "Hon. Registrar",
      });

      expect(result.success).toBe(true);
      expect(result.id).toBe("<mock_msg_id@smtp>");
      expect(mockSendMail).toHaveBeenCalledOnce();

      const sentArgs = mockSendMail.mock.calls[0][0];
      expect(sentArgs.from).toBe('"JIS | Authentication" <jis@sanjib.me>');
      expect(sentArgs.to).toBe("registrar@jis.local");
      expect(sentArgs.subject).toBe("Your Judiciary Portal verification code");
      expect(sentArgs.html).toContain("987654");
      expect(sentArgs.html).toContain("Hon. Registrar");
      expect(sentArgs.html).toContain("Valid for 10 minutes · Single use");
      expect(sentArgs.html).toContain("We received a request to sign in to your Registrar administrative account.");
    });

    it("falls back to TWO_FACTOR_RECIPIENT_EMAIL when TO_EMAIL is not set", async () => {
      process.env.SMTP_HOST = "smtp-relay.brevo.com";
      process.env.SMTP_USER = "user@smtp-brevo.com";
      process.env.SMTP_PASS = "xsmtpsib-testkey";
      process.env.SMTP_FROM_EMAIL = "jis@sanjib.me";
      delete process.env.TO_EMAIL;
      process.env.TWO_FACTOR_RECIPIENT_EMAIL = "legacy-registrar@jis.local";

      const result = await sendOtpEmail({
        code: "987654",
        name: "Hon. Registrar",
      });

      expect(result.success).toBe(true);
      const sentArgs = mockSendMail.mock.calls[0][0];
      expect(sentArgs.to).toBe("legacy-registrar@jis.local");
    });

    it("handles SMTP transport errors gracefully", async () => {
      process.env.SMTP_HOST = "smtp-relay.brevo.com";
      process.env.SMTP_USER = "user@smtp-brevo.com";
      process.env.SMTP_PASS = "xsmtpsib-testkey";
      process.env.TO_EMAIL = "registrar@jis.local";

      mockSendMail.mockRejectedValue(new Error("SMTP connection refused"));

      const result = await sendOtpEmail({ code: "123456" });
      expect(result.success).toBe(false);
      expect(result.error).toContain("SMTP connection refused");
    });
  });

  describe("sendHearingNoticeEmail", () => {
    const mockNoticeOptions = {
      cin: "CIN-2026-0042",
      defendantName: "Vikram Malhotra",
      crimeType: "Securities Fraud & Embezzlement",
      hearingDate: new Date("2026-11-20T10:30:00Z"),
      courtroomName: "Courtroom 03",
      courtroomLocation: "Annex Wing, 2nd Floor",
      judgeName: "Hon. Justice Sen",
      prosecutorName: "Adv. Rajesh Sharma",
      prosecutorEmail: "prosecutor@jis.local",
      lawyerName: "Adv. Meera Nair",
      lawyerEmail: "defense@lawfirm.in",
      baseUrl: "https://jis.court.gov.in",
    };

    it("returns error if SMTP configuration is missing", async () => {
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
      process.env.TO_EMAIL = "counsel@court.gov.in";

      const result = await sendHearingNoticeEmail(mockNoticeOptions);
      expect(result.success).toBe(false);
      expect(result.error).toContain("configuration or recipient addresses missing");
    });

    it("routes to TO_EMAIL in sandbox/development mode", async () => {
      process.env.SMTP_HOST = "smtp-relay.brevo.com";
      process.env.SMTP_USER = "user@smtp-brevo.com";
      process.env.SMTP_PASS = "xsmtpsib-testkey";
      process.env.TO_EMAIL = "sandbox-owner@court.gov.in";

      const result = await sendHearingNoticeEmail(mockNoticeOptions);

      expect(result.success).toBe(true);
      expect(result.id).toBe("<mock_msg_id@smtp>");
      expect(mockSendMail).toHaveBeenCalledOnce();

      const sentArgs = mockSendMail.mock.calls[0][0];
      expect(sentArgs.from).toBe('"JIS | Court Notifications" <jis@sanjib.me>');
      expect(sentArgs.to).toBe("sandbox-owner@court.gov.in");
      expect(sentArgs.subject).toBe("Court Notice: Hearing Scheduled | Case CIN-2026-0042");
      expect(sentArgs.html).toContain("CIN-2026-0042");
      expect(sentArgs.html).toContain("State vs. Vikram Malhotra");
      expect(sentArgs.html).toContain("Courtroom 03");
      expect(sentArgs.html).toContain("Annex Wing, 2nd Floor");
      expect(sentArgs.html).toContain("Hon. Justice Sen");
      expect(sentArgs.html).toContain("Adv. Rajesh Sharma");
      expect(sentArgs.html).toContain("Adv. Meera Nair");
      expect(sentArgs.html).toContain("View Case Docket");
      expect(sentArgs.html).toContain("Directions to Counsel");
      expect(sentArgs.html).toContain("https://jis.court.gov.in/verify/CIN-2026-0042");
    });

    it("routes directly to assigned counsel emails when TO_EMAIL is not set", async () => {
      process.env.SMTP_HOST = "smtp-relay.brevo.com";
      process.env.SMTP_USER = "user@smtp-brevo.com";
      process.env.SMTP_PASS = "xsmtpsib-testkey";
      delete process.env.TO_EMAIL;
      delete process.env.TWO_FACTOR_RECIPIENT_EMAIL;

      const result = await sendHearingNoticeEmail(mockNoticeOptions);

      expect(result.success).toBe(true);
      const sentArgs = mockSendMail.mock.calls[0][0];
      expect(sentArgs.from).toBe('"JIS | Court Notifications" <jis@sanjib.me>');
      expect(sentArgs.to).toBe("prosecutor@jis.local, defense@lawfirm.in");
    });

    it("resolves base URL from VERCEL_PROJECT_PRODUCTION_URL when baseUrl and NEXT_PUBLIC_APP_URL are not provided", async () => {
      process.env.SMTP_HOST = "smtp-relay.brevo.com";
      process.env.SMTP_USER = "user@smtp-brevo.com";
      process.env.SMTP_PASS = "xsmtpsib-testkey";
      process.env.TO_EMAIL = "sandbox@jis.local";
      process.env.VERCEL_PROJECT_PRODUCTION_URL = "court-portal.vercel.app";
      delete process.env.NEXT_PUBLIC_APP_URL;

      const optionsWithoutBaseUrl = { ...mockNoticeOptions, baseUrl: undefined };
      const result = await sendHearingNoticeEmail(optionsWithoutBaseUrl);

      expect(result.success).toBe(true);
      const sentArgs = mockSendMail.mock.calls[0][0];
      expect(sentArgs.html).toContain(
        "https://court-portal.vercel.app/verify/CIN-2026-0042"
      );
    });

    it("handles SMTP network errors gracefully without crashing caller", async () => {
      process.env.SMTP_HOST = "smtp-relay.brevo.com";
      process.env.SMTP_USER = "user@smtp-brevo.com";
      process.env.SMTP_PASS = "xsmtpsib-testkey";
      process.env.TO_EMAIL = "sandbox@jis.local";

      mockSendMail.mockRejectedValue(new Error("DNS lookup failure"));

      const result = await sendHearingNoticeEmail(mockNoticeOptions);
      expect(result.success).toBe(false);
      expect(result.error).toBe("DNS lookup failure");
    });
  });
});
