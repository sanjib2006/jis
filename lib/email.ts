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
        subject: "Your JIS Portal Verification Code",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Judiciary Information System</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f6f5f1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #142127;">
              <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 16px;">
                <tr>
                  <td align="center">
                    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 540px; background-color: #ffffff; border: 1px solid #dedfdb; border-radius: 4px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                      
                      <!-- Header -->
                      <tr>
                        <td style="background-color: #103937; padding: 24px 32px; border-bottom: 2px solid #b28b4d;">
                          <h1 style="margin: 0; font-size: 18px; font-weight: 600; color: #ffffff; letter-spacing: 0.5px;">
                            Judiciary Information System
                          </h1>
                          <p style="margin: 4px 0 0 0; font-size: 11px; color: #b28b4d; text-transform: uppercase; letter-spacing: 1px; font-weight: 500;">
                            Authorized Administrative Access Security
                          </p>
                        </td>
                      </tr>

                      <!-- Body Content -->
                      <tr>
                        <td style="padding: 32px;">
                          <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.5; color: #142127;">
                            Greetings <strong>${name}</strong>,
                          </p>
                          <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 1.6; color: #495459;">
                            An authentication request was initiated for your official Registrar administrative account. To complete identity verification and access the judicial docket portal, enter the one-time security code provided below:
                          </p>

                          <!-- OTP Code Box -->
                          <div style="background-color: #f6f5f1; border: 1px solid #dedfdb; border-radius: 4px; padding: 20px; text-align: center; margin: 24px 0;">
                            <span style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #103937;">
                              ${code}
                            </span>
                            <div style="margin-top: 8px; font-size: 11px; color: #6f7a80;">
                              Valid for 10 minutes · Single-use code
                            </div>
                          </div>

                          <p style="margin: 0 0 8px 0; font-size: 12px; line-height: 1.5; color: #6f7a80;">
                            <strong>Security Notice:</strong> Do not disclose this verification code to anyone. Court administrative personnel will never request your security code via telephone or external correspondence.
                          </p>
                          <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #6f7a80;">
                            If you did not initiate this login request, please alert the judicial system security officer immediately.
                          </p>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style="background-color: #fbfaf7; padding: 16px 32px; border-top: 1px solid #dedfdb; text-align: center;">
                          <p style="margin: 0; font-size: 11px; color: #8e979c;">
                            State Judicial System · National Judicial Data Grid Compliant
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
