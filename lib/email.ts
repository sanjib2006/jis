import crypto from "crypto";
import nodemailer from "nodemailer";

export function generateSecureOtp(): string {
  // Generate cryptographically secure 6-digit number (100000 - 999999)
  return crypto.randomInt(100000, 1000000).toString();
}

export function hashOtp(code: string): string {
  return crypto.createHash("sha256").update(code.trim()).digest("hex");
}

function getSmtpTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // STARTTLS on port 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

interface SendOtpOptions {
  code: string;
  name?: string;
}

export async function sendOtpEmail({
  code,
  name = "Judicial Registrar",
}: SendOtpOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const fromEmail = process.env.SMTP_FROM_EMAIL || "jis@sanjib.me";
  const toEmail = process.env.TO_EMAIL || process.env.TWO_FACTOR_RECIPIENT_EMAIL;

  if (!smtpHost || !smtpUser || !smtpPass || !toEmail) {
    console.error(
      "Missing SMTP configuration or TO_EMAIL in environment."
    );
    return {
      success: false,
      error: "Email delivery service configuration is missing.",
    };
  }

  // Console notice for audit & logging (dev environment)
  if (process.env.NODE_ENV !== "production") {
    console.log("\n" + "=".repeat(64));
    console.log("  ⚖️  JUDICIARY INFORMATION SYSTEM — TWO-FACTOR AUTHENTICATION");
    console.log("=".repeat(64));
    console.log(`  Recipient Address  : ${toEmail}`);
    console.log(`  Officer Name       : ${name}`);
    console.log(`  Security Code      : [ ${code.split("").join(" ")} ]`);
    console.log(`  Validity Period    : 10 minutes`);
    console.log("=".repeat(64) + "\n");
  }

  try {
    const transporter = getSmtpTransport();
    const info = await transporter.sendMail({
      from: fromEmail,
      to: toEmail,
      subject: "Your Judiciary Portal verification code",
      html: `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <meta http-equiv="X-UA-Compatible" content="IE=edge">
              <meta name="x-apple-disable-message-reformatting">
              <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
              <title>Your Judiciary Portal verification code</title>
              <style>
                @media only screen and (max-width: 480px) {
                  .email-body { padding: 16px 10px !important; }
                  .email-card { padding: 26px 18px !important; width: 100% !important; border-radius: 4px !important; }
                  .otp-box { padding: 18px 8px !important; margin: 26px 0 24px 0 !important; }
                  .otp-code { font-size: 30px !important; letter-spacing: 6px !important; padding-left: 6px !important; }
                  .greeting-text { font-size: 14px !important; }
                  .instruction-text { font-size: 13px !important; }
                }
              </style>
            </head>
            <body class="email-body" style="margin: 0; padding: 32px 16px; background-color: #f6f5f1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #142127; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <div class="email-card" style="max-width: 480px; width: 100%; box-sizing: border-box; background-color: #ffffff; border-radius: 6px; padding: 36px 32px; border: 1px solid #e8e9e5; text-align: left;">
                      
                      <!-- Brand Header -->
                      <div style="margin-bottom: 24px;">
                        <h1 style="margin: 0; font-size: 16px; font-weight: 600; color: #103937; letter-spacing: -0.2px;">
                          Judiciary Information System
                        </h1>
                      </div>

                      <!-- Greeting & Notice -->
                      <p class="greeting-text" style="margin: 0 0 12px 0; font-size: 15px; line-height: 1.5; color: #142127;">
                        ${name ? `Hello ${name},` : "Hello,"}
                      </p>
                      <p style="margin: 0 0 28px 0; font-size: 14px; line-height: 1.6; color: #495459;">
                        We received a request to sign in to your Registrar administrative account.
                      </p>

                      <!-- Large Centered OTP with Responsive Spacing -->
                      <div class="otp-box" style="text-align: center; margin: 30px 0 28px 0; background-color: #faf9f6; border: 1px solid #eeece7; border-radius: 4px; padding: 22px 14px;">
                        <div class="otp-code" style="font-family: 'SF Mono', SFMono-Regular, Consolas, Menlo, monospace; font-size: 38px; font-weight: 700; letter-spacing: 10px; color: #103937; line-height: 1; padding-left: 10px; white-space: nowrap; word-break: keep-all; display: inline-block;">
                          ${code}
                        </div>
                        <p style="margin: 12px 0 0 0; font-size: 12px; color: #6f7a80; font-weight: 500;">
                          Valid for 10 minutes · Single use
                        </p>
                      </div>

                      <!-- Completion Instruction -->
                      <p class="instruction-text" style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #495459;">
                        Enter this code in the Judiciary Information System to complete verification.
                      </p>

                      <!-- Security Notice -->
                      <p style="margin: 0 0 12px 0; font-size: 12px; line-height: 1.6; color: #6f7a80;">
                        Security notice: Never share this code with anyone. Court administrative personnel will never ask for your verification code by phone or external correspondence.
                      </p>

                      <!-- Unauthorized Attempt Notice -->
                      <p style="margin: 0 0 26px 0; font-size: 12px; line-height: 1.6; color: #6f7a80;">
                        Didn't request this login? Contact your judicial system security officer immediately.
                      </p>

                      <!-- Clean Minimal Footer -->
                      <div style="padding-top: 20px; border-top: 1px solid #eeece7;">
                        <p style="margin: 0; font-size: 11px; line-height: 1.6; color: #8e979c;">
                          State Judicial System<br>
                          National Judicial Data Grid Compliant
                        </p>
                      </div>

                    </div>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
    });

    return { success: true, id: info.messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    console.error("SMTP email error:", err);
    return { success: false, error: message };
  }
}

export interface HearingNoticeEmailOptions {
  cin: string;
  defendantName: string;
  crimeType?: string;
  hearingDate: Date | string;
  courtroomName: string;
  courtroomLocation?: string | null;
  judgeName: string;
  prosecutorName: string;
  prosecutorEmail: string;
  lawyerName: string;
  lawyerEmail: string;
  baseUrl?: string;
}

export async function sendHearingNoticeEmail(
  options: HearingNoticeEmailOptions
): Promise<{ success: boolean; id?: string; error?: string }> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const fromEmail = process.env.SMTP_FROM_EMAIL || "jis@sanjib.me";

  // In development, testing, or sandbox mode with mock/seed data,
  // route all notice emails to TO_EMAIL if defined
  const overrideRecipient =
    process.env.TO_EMAIL || process.env.TWO_FACTOR_RECIPIENT_EMAIL;
  let recipients: string[] = [];
  if (overrideRecipient) {
    recipients = [overrideRecipient];
  } else {
    if (options.prosecutorEmail) recipients.push(options.prosecutorEmail);
    if (options.lawyerEmail && !recipients.includes(options.lawyerEmail)) {
      recipients.push(options.lawyerEmail);
    }
  }

  if (!smtpHost || !smtpUser || !smtpPass || recipients.length === 0) {
    console.error(
      "Missing SMTP configuration or recipient email addresses in environment/input."
    );
    return {
      success: false,
      error: "Email delivery service configuration or recipient addresses missing.",
    };
  }

  const hearingDateObj = new Date(options.hearingDate);
  let formattedDateTime: string;
  if (!isNaN(hearingDateObj.getTime())) {
    const datePart = hearingDateObj.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "2-digit",
    });
    const hours = hearingDateObj.getUTCHours();
    const minutes = hearingDateObj.getUTCMinutes();
    if (hours === 0 && minutes === 0) {
      formattedDateTime = `${datePart} · 10:30 AM IST (Court Session)`;
    } else {
      const timePart = hearingDateObj.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      });
      formattedDateTime = `${datePart} · ${timePart} IST`;
    }
  } else {
    formattedDateTime = String(options.hearingDate);
  }

  // Resolve base URL for links in email (handles Vercel production/preview and custom domains)
  let resolvedBaseUrl = options.baseUrl;
  if (!resolvedBaseUrl) {
    if (process.env.NEXT_PUBLIC_APP_URL) {
      resolvedBaseUrl = process.env.NEXT_PUBLIC_APP_URL;
    } else if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      resolvedBaseUrl = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    } else if (process.env.VERCEL_URL) {
      resolvedBaseUrl = `https://${process.env.VERCEL_URL}`;
    } else {
      resolvedBaseUrl = "http://localhost:3000";
    }
  }
  resolvedBaseUrl = resolvedBaseUrl.replace(/\/+$/, "");
  const docketUrl = `${resolvedBaseUrl}/verify/${encodeURIComponent(options.cin)}`;

  // Console notice for audit & logging (dev environment)
  if (process.env.NODE_ENV !== "production") {
    console.log("\n" + "=".repeat(64));
    console.log("  ⚖️  JUDICIARY INFORMATION SYSTEM — NOTICE OF HEARING DISPATCH");
    console.log("=".repeat(64));
    console.log(`  Case CIN           : ${options.cin}`);
    console.log(`  Matter             : State vs. ${options.defendantName}`);
    console.log(`  Scheduled Hearing  : ${formattedDateTime}`);
    console.log(
      `  Courtroom Facility : ${options.courtroomName}${
        options.courtroomLocation ? ` (${options.courtroomLocation})` : ""
      }`
    );
    console.log(`  Presiding Judge    : ${options.judgeName}`);
    console.log(
      `  Prosecution        : ${options.prosecutorName} <${options.prosecutorEmail}>`
    );
    console.log(
      `  Defense Counsel    : ${options.lawyerName} <${options.lawyerEmail}>`
    );
    console.log(`  Dispatched To      : ${recipients.join(", ")}`);
    console.log("=".repeat(64) + "\n");
  }

  try {
    const transporter = getSmtpTransport();
    const info = await transporter.sendMail({
      from: fromEmail,
      to: recipients.join(", "),
      subject: `Court Notice: Hearing Scheduled | Case ${options.cin}`,
      html: `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <meta http-equiv="X-UA-Compatible" content="IE=edge">
              <meta name="x-apple-disable-message-reformatting">
              <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
              <title>Court Notice: Hearing Scheduled | Case ${options.cin}</title>
              <style>
                @media only screen and (max-width: 520px) {
                  .email-outer-pad { padding: 14px 8px !important; }
                  .email-card { width: 100% !important; max-width: 100% !important; border-radius: 4px !important; }
                  .card-header { padding: 18px 16px !important; }
                  .card-body { padding: 20px 14px !important; }
                  .stack-cell { display: block !important; width: 100% !important; box-sizing: border-box !important; }
                  .stack-label { padding: 10px 12px 2px 12px !important; border-bottom: none !important; font-size: 11px !important; text-transform: uppercase !important; letter-spacing: 0.5px !important; color: #6f7a80 !important; }
                  .stack-val { padding: 2px 12px 10px 12px !important; border-bottom: 1px solid #e8e9e5 !important; font-size: 13px !important; }
                  .stack-last { border-bottom: none !important; }
                  .action-btn-wrap { margin: 20px 0 22px 0 !important; }
                  .action-btn { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: center !important; padding: 13px 16px !important; }
                  .counsel-box { padding: 12px 14px !important; }
                  .footer-pad { padding: 14px 16px !important; }
                }
              </style>
            </head>
            <body class="email-outer-pad" style="margin: 0; padding: 32px 16px; background-color: #f6f5f1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #142127; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <div class="email-card" style="max-width: 560px; width: 100%; box-sizing: border-box; background-color: #ffffff; border-radius: 6px; overflow: hidden; border: 1px solid #e2e4df; box-shadow: 0 1px 3px rgba(0,0,0,0.03); text-align: left;">
                      
                      <!-- Institutional Header -->
                      <div class="card-header" style="background-color: #103937; padding: 22px 26px; border-bottom: 2px solid #b28b4d;">
                        <h1 style="margin: 0; font-size: 17px; font-weight: 600; color: #ffffff; letter-spacing: 0.3px;">
                          Judiciary Information System
                        </h1>
                        <p style="margin: 4px 0 0 0; font-size: 11px; color: #d1b88a; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 500;">
                          Central Court Registry · Notice of Scheduled Hearing
                        </p>
                      </div>

                      <!-- Body Content -->
                      <div class="card-body" style="padding: 26px 24px;">
                        <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.5; color: #142127;">
                          To the Presiding Judge, Public Prosecutor, and Defense Counsel,
                        </p>
                        <p style="margin: 0 0 22px 0; font-size: 13px; line-height: 1.6; color: #495459;">
                          A judicial hearing has been scheduled for the following matter. Please review the session details and courtroom allocation below:
                        </p>

                        <!-- Case Details Table (Responsive 2-column or stacked) -->
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #faf9f6; border: 1px solid #dedfdb; border-radius: 4px; margin: 0 0 24px 0; border-collapse: collapse;">
                          <tr>
                            <td class="stack-cell stack-label" style="padding: 10px 14px; border-bottom: 1px solid #dedfdb; font-size: 12px; font-weight: 600; color: #6f7a80; width: 35%; vertical-align: top;">Case Number (CIN)</td>
                            <td class="stack-cell stack-val" style="padding: 10px 14px; border-bottom: 1px solid #dedfdb; font-family: 'SF Mono', Consolas, Menlo, monospace; font-weight: 700; color: #103937; vertical-align: top; word-break: break-word;">${options.cin}</td>
                          </tr>
                          <tr>
                            <td class="stack-cell stack-label" style="padding: 10px 14px; border-bottom: 1px solid #dedfdb; font-size: 12px; font-weight: 600; color: #6f7a80; width: 35%; vertical-align: top;">Title of Matter</td>
                            <td class="stack-cell stack-val" style="padding: 10px 14px; border-bottom: 1px solid #dedfdb; font-weight: 600; color: #142127; vertical-align: top; word-break: break-word;">State vs. ${options.defendantName}</td>
                          </tr>
                          <tr>
                            <td class="stack-cell stack-label" style="padding: 10px 14px; border-bottom: 1px solid #dedfdb; font-size: 12px; font-weight: 600; color: #6f7a80; width: 35%; vertical-align: top;">Scheduled Date &amp; Time</td>
                            <td class="stack-cell stack-val" style="padding: 10px 14px; border-bottom: 1px solid #dedfdb; font-weight: 700; color: #103937; vertical-align: top; word-break: break-word;">${formattedDateTime}</td>
                          </tr>
                          <tr>
                            <td class="stack-cell stack-label" style="padding: 10px 14px; border-bottom: 1px solid #dedfdb; font-size: 12px; font-weight: 600; color: #6f7a80; width: 35%; vertical-align: top;">Courtroom Bench</td>
                            <td class="stack-cell stack-val" style="padding: 10px 14px; border-bottom: 1px solid #dedfdb; color: #142127; vertical-align: top; word-break: break-word;">${options.courtroomName}${options.courtroomLocation ? ` (${options.courtroomLocation})` : ""}</td>
                          </tr>
                          <tr>
                            <td class="stack-cell stack-label" style="padding: 10px 14px; border-bottom: 1px solid #dedfdb; font-size: 12px; font-weight: 600; color: #6f7a80; width: 35%; vertical-align: top;">Presiding Judge</td>
                            <td class="stack-cell stack-val" style="padding: 10px 14px; border-bottom: 1px solid #dedfdb; color: #142127; vertical-align: top; word-break: break-word;">${options.judgeName}</td>
                          </tr>
                          <tr>
                            <td class="stack-cell stack-label" style="padding: 10px 14px; border-bottom: 1px solid #dedfdb; font-size: 12px; font-weight: 600; color: #6f7a80; width: 35%; vertical-align: top;">Public Prosecutor</td>
                            <td class="stack-cell stack-val" style="padding: 10px 14px; border-bottom: 1px solid #dedfdb; color: #142127; vertical-align: top; word-break: break-word;">${options.prosecutorName} <span style="color: #6f7a80; font-size: 12px;">(${options.prosecutorEmail})</span></td>
                          </tr>
                          <tr>
                            <td class="stack-cell stack-label" style="padding: 10px 14px; font-size: 12px; font-weight: 600; color: #6f7a80; width: 35%; vertical-align: top;">Defense Counsel</td>
                            <td class="stack-cell stack-val stack-last" style="padding: 10px 14px; color: #142127; vertical-align: top; word-break: break-word;">${options.lawyerName} <span style="color: #6f7a80; font-size: 12px;">(${options.lawyerEmail})</span></td>
                          </tr>
                        </table>

                        <!-- Primary Action Button (full-width on mobile) -->
                        <div class="action-btn-wrap" style="text-align: center; margin: 24px 0 26px 0;">
                          <a href="${docketUrl}" class="action-btn" style="display: inline-block; background-color: #103937; color: #ffffff; text-decoration: none; padding: 12px 26px; font-size: 13px; font-weight: 600; border-radius: 4px; letter-spacing: 0.3px; -webkit-tap-highlight-color: transparent;">
                            View Case Docket &rarr;
                          </a>
                        </div>

                        <!-- Directions to Counsel -->
                        <div class="counsel-box" style="background-color: #fcfbf9; border: 1px solid #eeece7; border-radius: 4px; padding: 14px 16px; margin: 0 0 8px 0;">
                          <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #142127;">
                            Directions to Counsel:
                          </p>
                          <ul style="margin: 0; padding-left: 18px; font-size: 12px; line-height: 1.6; color: #495459;">
                            <li><strong>Attendance:</strong> Assigned counsel or an authorized representative must be present when the matter is called on the Daily Cause List.</li>
                            <li><strong>Adjournment:</strong> Any formal request for adjournment must be submitted through the Registrar portal prior to the sitting of the bench.</li>
                          </ul>
                        </div>
                      </div>

                      <!-- Footer -->
                      <div class="footer-pad" style="background-color: #fbfaf7; padding: 16px 24px; border-top: 1px solid #dedfdb; text-align: center;">
                        <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #8e979c;">
                          State Judicial System · National Judicial Data Grid Compliant<br>
                          Dispatched automatically by the Central Electronic Court Registry
                        </p>
                      </div>

                    </div>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
    });

    return { success: true, id: info.messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    console.error("SMTP email error:", err);
    return { success: false, error: message };
  }
}
