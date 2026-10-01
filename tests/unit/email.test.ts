import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  generateSecureOtp,
  hashOtp,
  sendOtpEmail,
  sendHearingNoticeEmail,
} from "@/lib/email";

describe("Email Service & Hearing Notice Engine Unit Tests", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
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
    it("returns error if RESEND_API_KEY is missing", async () => {
      delete process.env.RESEND_API_KEY;
      process.env.TWO_FACTOR_RECIPIENT_EMAIL = "registrar@court.gov.in";

      const result = await sendOtpEmail({ code: "123456" });
      expect(result.success).toBe(false);
      expect(result.error).toContain("configuration is missing");
    });

    it("returns error if TWO_FACTOR_RECIPIENT_EMAIL is missing", async () => {
      process.env.RESEND_API_KEY = "re_test_12345";
      delete process.env.TWO_FACTOR_RECIPIENT_EMAIL;

      const result = await sendOtpEmail({ code: "123456" });
      expect(result.success).toBe(false);
      expect(result.error).toContain("configuration is missing");
    });

    it("dispatches OTP email payload with Resend API", async () => {
      process.env.RESEND_API_KEY = "re_mock_api_key";
      process.env.TWO_FACTOR_RECIPIENT_EMAIL = "registrar@jis.local";
      process.env.RESEND_FROM_EMAIL = "onboarding@resend.dev";

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: "msg_otp_123" }),
      });
      global.fetch = mockFetch;

      const result = await sendOtpEmail({
        code: "987654",
        name: "Hon. Registrar",
      });

      expect(result.success).toBe(true);
      expect(result.id).toBe("msg_otp_123");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.resend.com/emails",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer re_mock_api_key",
            "Content-Type": "application/json",
          }),
        })
      );

      const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(sentBody.to).toBe("registrar@jis.local");
      expect(sentBody.subject).toBe("Your Judiciary Portal verification code");
      expect(sentBody.html).toContain("987654");
      expect(sentBody.html).toContain("Hon. Registrar");
      expect(sentBody.html).toContain("Valid for 10 minutes · Single use");
      expect(sentBody.html).toContain("We received a request to sign in to your Registrar administrative account.");
    });

    it("handles Resend API rejection gracefully", async () => {
      process.env.RESEND_API_KEY = "re_mock_api_key";
      process.env.TWO_FACTOR_RECIPIENT_EMAIL = "registrar@jis.local";

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        text: async () => "Forbidden: Invalid API key",
      });

      const result = await sendOtpEmail({ code: "123456" });
      expect(result.success).toBe(false);
      expect(result.error).toContain("Forbidden");
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

    it("returns error if RESEND_API_KEY is missing", async () => {
      delete process.env.RESEND_API_KEY;
      process.env.TWO_FACTOR_RECIPIENT_EMAIL = "counsel@court.gov.in";

      const result = await sendHearingNoticeEmail(mockNoticeOptions);
      expect(result.success).toBe(false);
      expect(result.error).toContain("configuration or recipient addresses missing");
    });

    it("routes to TWO_FACTOR_RECIPIENT_EMAIL in sandbox/development mode to prevent Resend 403 blocks", async () => {
      process.env.RESEND_API_KEY = "re_mock_api_key";
      process.env.TWO_FACTOR_RECIPIENT_EMAIL = "sandbox-owner@court.gov.in";

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: "msg_notice_sandbox" }),
      });
      global.fetch = mockFetch;

      const result = await sendHearingNoticeEmail(mockNoticeOptions);

      expect(result.success).toBe(true);
      expect(result.id).toBe("msg_notice_sandbox");

      const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(sentBody.to).toBe("sandbox-owner@court.gov.in");
      expect(sentBody.subject).toBe("Court Notice: Hearing Scheduled | Case CIN-2026-0042");
      expect(sentBody.html).toContain("CIN-2026-0042");
      expect(sentBody.html).toContain("State vs. Vikram Malhotra");
      expect(sentBody.html).toContain("Courtroom 03");
      expect(sentBody.html).toContain("Annex Wing, 2nd Floor");
      expect(sentBody.html).toContain("Hon. Justice Sen");
      expect(sentBody.html).toContain("Adv. Rajesh Sharma");
      expect(sentBody.html).toContain("Adv. Meera Nair");
      expect(sentBody.html).toContain("View Case Docket");
      expect(sentBody.html).toContain("Directions to Counsel");
      expect(sentBody.html).toContain("https://jis.court.gov.in/verify/CIN-2026-0042");
    });

    it("routes directly to assigned counsel emails when TWO_FACTOR_RECIPIENT_EMAIL is not set", async () => {
      process.env.RESEND_API_KEY = "re_mock_api_key";
      delete process.env.TWO_FACTOR_RECIPIENT_EMAIL;

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: "msg_notice_prod" }),
      });
      global.fetch = mockFetch;

      const result = await sendHearingNoticeEmail(mockNoticeOptions);

      expect(result.success).toBe(true);
      const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(sentBody.to).toEqual([
        "prosecutor@jis.local",
        "defense@lawfirm.in",
      ]);
    });

    it("handles Resend network errors gracefully without crashing caller", async () => {
      process.env.RESEND_API_KEY = "re_mock_api_key";
      process.env.TWO_FACTOR_RECIPIENT_EMAIL = "sandbox@jis.local";

      global.fetch = vi.fn().mockRejectedValue(new Error("DNS lookup failure"));

      const result = await sendHearingNoticeEmail(mockNoticeOptions);
      expect(result.success).toBe(false);
      expect(result.error).toBe("DNS lookup failure");
    });
  });
});
