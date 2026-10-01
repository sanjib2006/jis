import crypto from "crypto";

export function generateSecureOtp(): string {
  // Generate cryptographically secure 6-digit number (100000 - 999999)
  return crypto.randomInt(100000, 1000000).toString();
}

export function hashOtp(code: string): string {
  return crypto.createHash("sha256").update(code.trim()).digest("hex");
}

interface SendOtpOptions {
  code: string;
  name?: string;
}

export async function sendOtpEmail({
  code,
  name = "Judicial Registrar",
}: SendOtpOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const toEmail = process.env.TWO_FACTOR_RECIPIENT_EMAIL;

  if (!apiKey || !toEmail) {
    console.error(
      "Missing RESEND_API_KEY or TWO_FACTOR_RECIPIENT_EMAIL in environment."
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
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: toEmail,
        subject: "Your Judiciary Portal verification code",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Your Judiciary Portal verification code</title>
            </head>
            <body style="margin: 0; padding: 40px 16px; background-color: #f6f5f1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #142127; -webkit-font-smoothing: antialiased;">
              <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 6px; padding: 40px 36px;">
                
                <!-- Brand Header -->
                <div style="margin-bottom: 28px;">
                  <h1 style="margin: 0; font-size: 17px; font-weight: 600; color: #103937; letter-spacing: -0.2px;">
                    Judiciary Information System
                  </h1>
                </div>

                <!-- Greeting & Notice -->
                <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.5; color: #142127;">
                  ${name ? `Hello ${name},` : "Hello,"}
                </p>
                <p style="margin: 0 0 36px 0; font-size: 14px; line-height: 1.6; color: #495459;">
                  We received a request to sign in to your Registrar administrative account.
                </p>

                <!-- Large Centered OTP with Generous Spacing -->
                <div style="text-align: center; margin: 38px 0 34px 0;">
                  <div style="font-family: 'SF Mono', SFMono-Regular, Consolas, Menlo, monospace; font-size: 42px; font-weight: 700; letter-spacing: 12px; color: #103937; line-height: 1; padding-left: 12px;">
                    ${code}
                  </div>
                  <p style="margin: 14px 0 0 0; font-size: 13px; color: #6f7a80;">
                    Valid for 10 minutes · Single use
                  </p>
                </div>

                <!-- Completion Instruction -->
                <p style="margin: 0 0 30px 0; font-size: 14px; line-height: 1.6; color: #495459;">
                  Enter this code in the Judiciary Information System to complete verification.
                </p>

                <!-- Security Notice -->
                <p style="margin: 0 0 14px 0; font-size: 12px; line-height: 1.6; color: #6f7a80;">
                  Security notice: Never share this code with anyone. Court administrative personnel will never ask for your verification code by phone or external correspondence.
                </p>

                <!-- Unauthorized Attempt Notice -->
                <p style="margin: 0 0 32px 0; font-size: 12px; line-height: 1.6; color: #6f7a80;">
                  Didn't request this login? Contact your judicial system security officer immediately.
                </p>

                <!-- Clean Minimal Footer -->
                <div style="padding-top: 24px; border-top: 1px solid #eeece7;">
                  <p style="margin: 0; font-size: 11px; line-height: 1.6; color: #8e979c;">
                    State Judicial System<br>
                    National Judicial Data Grid Compliant
                  </p>
                </div>

              </div>
            </body>
          </html>
        `,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend API error response:", errText);
      return { success: false, error: errText };
    }

    const data = (await res.json()) as { id?: string };
    return { success: true, id: data.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    console.error("Resend network error:", err);
    return { success: false, error: message };
  }
}

export interface HearingNoticeEmailOptions {
  cin: string;
  defendantName: string;
  crimeType: string;
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
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  // In development / testing or sandbox mode, route to TWO_FACTOR_RECIPIENT_EMAIL
  // to avoid Resend 403 sandbox block for unverified external domains
  let recipients: string[] = [];
  if (process.env.TWO_FACTOR_RECIPIENT_EMAIL) {
    recipients = [process.env.TWO_FACTOR_RECIPIENT_EMAIL];
  } else {
    if (options.prosecutorEmail) recipients.push(options.prosecutorEmail);
    if (options.lawyerEmail && !recipients.includes(options.lawyerEmail)) {
      recipients.push(options.lawyerEmail);
    }
  }

  if (!apiKey || recipients.length === 0) {
    console.error(
      "Missing RESEND_API_KEY or recipient email addresses in environment/input."
    );
    return {
      success: false,
      error: "Email delivery service configuration or recipient addresses missing.",
    };
  }

  const hearingDateObj = new Date(options.hearingDate);
  const formattedDate = !isNaN(hearingDateObj.getTime())
    ? hearingDateObj.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : String(options.hearingDate);

  const baseUrl =
    options.baseUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";
  const docketUrl = `${baseUrl}/verify/${encodeURIComponent(options.cin)}`;

  // Console notice for audit & logging (dev environment)
  if (process.env.NODE_ENV !== "production") {
    console.log("\n" + "=".repeat(64));
    console.log("  ⚖️  JUDICIARY INFORMATION SYSTEM — NOTICE OF HEARING DISPATCH");
    console.log("=".repeat(64));
    console.log(`  Case CIN           : ${options.cin}`);
    console.log(`  Defendant          : ${options.defendantName}`);
    console.log(`  Offense / Charge   : ${options.crimeType}`);
    console.log(`  Scheduled Hearing  : ${formattedDate}`);
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
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: recipients.length === 1 ? recipients[0] : recipients,
        subject: `Court Notice: Hearing Scheduled for Case ${options.cin}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Notice of Scheduled Hearing — JIS</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f6f5f1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #142127;">
              <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 16px;">
                <tr>
                  <td align="center">
                    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border: 1px solid #dedfdb; border-radius: 4px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                      
                      <!-- Header -->
                      <tr>
                        <td style="background-color: #103937; padding: 24px 32px; border-bottom: 2px solid #b28b4d;">
                          <h1 style="margin: 0; font-size: 18px; font-weight: 600; color: #ffffff; letter-spacing: 0.5px;">
                            Judiciary Information System
                          </h1>
                          <p style="margin: 4px 0 0 0; font-size: 11px; color: #b28b4d; text-transform: uppercase; letter-spacing: 1px; font-weight: 500;">
                            Official Notice of Judicial Hearing · Cause Summons
                          </p>
                        </td>
                      </tr>

                      <!-- Notice Banner -->
                      <tr>
                        <td style="background-color: #fcf9f2; border-bottom: 1px solid #f0e6d2; padding: 12px 32px;">
                          <p style="margin: 0; font-size: 12px; color: #825a18; font-weight: 500;">
                            🏛️ Formal Judicial Summons &amp; Notice of Cause Listing
                          </p>
                        </td>
                      </tr>

                      <!-- Body Content -->
                      <tr>
                        <td style="padding: 32px;">
                          <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.5; color: #142127;">
                            To the Presiding Judge, Assigned Prosecution, and Defense Counsel,
                          </p>
                          <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.6; color: #495459;">
                            Please take formal notice that the Registrar has scheduled a judicial hearing session for the cause identified below. All assigned counsel are required to appear before the designated bench at the specified calendar time.
                          </p>

                          <!-- Case Details Table -->
                          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f5f1; border: 1px solid #dedfdb; border-radius: 4px; margin: 0 0 24px 0; font-size: 13px;">
                            <tr>
                              <td style="padding: 12px 16px; border-bottom: 1px solid #dedfdb; font-weight: 600; color: #6f7a80; width: 38%;">Case Identification (CIN)</td>
                              <td style="padding: 12px 16px; border-bottom: 1px solid #dedfdb; font-family: monospace; font-weight: 700; color: #103937;">${options.cin}</td>
                            </tr>
                            <tr>
                              <td style="padding: 12px 16px; border-bottom: 1px solid #dedfdb; font-weight: 600; color: #6f7a80;">Defendant / Accused</td>
                              <td style="padding: 12px 16px; border-bottom: 1px solid #dedfdb; font-weight: 600; color: #142127;">${options.defendantName}</td>
                            </tr>
                            <tr>
                              <td style="padding: 12px 16px; border-bottom: 1px solid #dedfdb; font-weight: 600; color: #6f7a80;">Offense / Statutory Charge</td>
                              <td style="padding: 12px 16px; border-bottom: 1px solid #dedfdb; color: #142127;">${options.crimeType}</td>
                            </tr>
                            <tr>
                              <td style="padding: 12px 16px; border-bottom: 1px solid #dedfdb; font-weight: 600; color: #6f7a80;">Hearing Date &amp; Time</td>
                              <td style="padding: 12px 16px; border-bottom: 1px solid #dedfdb; font-weight: 700; color: #103937;">${formattedDate}</td>
                            </tr>
                            <tr>
                              <td style="padding: 12px 16px; border-bottom: 1px solid #dedfdb; font-weight: 600; color: #6f7a80;">Courtroom Bench</td>
                              <td style="padding: 12px 16px; border-bottom: 1px solid #dedfdb; color: #142127;">${options.courtroomName}${options.courtroomLocation ? ` (${options.courtroomLocation})` : ""}</td>
                            </tr>
                            <tr>
                              <td style="padding: 12px 16px; border-bottom: 1px solid #dedfdb; font-weight: 600; color: #6f7a80;">Presiding Judge</td>
                              <td style="padding: 12px 16px; border-bottom: 1px solid #dedfdb; color: #142127;">${options.judgeName}</td>
                            </tr>
                            <tr>
                              <td style="padding: 12px 16px; border-bottom: 1px solid #dedfdb; font-weight: 600; color: #6f7a80;">Public Prosecutor</td>
                              <td style="padding: 12px 16px; border-bottom: 1px solid #dedfdb; color: #142127;">${options.prosecutorName} (${options.prosecutorEmail})</td>
                            </tr>
                            <tr>
                              <td style="padding: 12px 16px; font-weight: 600; color: #6f7a80;">Defense Counsel</td>
                              <td style="padding: 12px 16px; color: #142127;">${options.lawyerName} (${options.lawyerEmail})</td>
                            </tr>
                          </table>

                          <!-- Action Button -->
                          <div style="text-align: center; margin: 28px 0 24px 0;">
                            <a href="${docketUrl}" style="display: inline-block; background-color: #103937; color: #ffffff; text-decoration: none; padding: 12px 24px; font-size: 13px; font-weight: 600; border-radius: 4px; letter-spacing: 0.3px;">
                              Access Certified Docket &amp; QR Record &rarr;
                            </a>
                          </div>

                          <!-- Statutory Notice -->
                          <p style="margin: 0 0 8px 0; font-size: 12px; line-height: 1.5; color: #6f7a80;">
                            <strong>Notice to Counsel:</strong> Attendance is mandatory at the designated courtroom session. In the event of an unavoidable emergency, an application for adjournment must be formally submitted through the Registrar portal prior to the calling of the cause list.
                          </p>
                          <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #6f7a80;">
                            This is an automated transmission dispatched by the Judiciary Information System. Certified case history and digital decree records are accessible via the portal link above.
                          </p>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style="background-color: #fbfaf7; padding: 16px 32px; border-top: 1px solid #dedfdb; text-align: center;">
                          <p style="margin: 0; font-size: 11px; color: #8e979c;">
                            State Judicial System · National Judicial Data Grid Compliant · Automated Court Summons System
                          </p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend API error response:", errText);
      return { success: false, error: errText };
    }

    const data = (await res.json()) as { id?: string };
    return { success: true, id: data.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    console.error("Resend network error:", err);
    return { success: false, error: message };
  }
}
