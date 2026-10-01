"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  loginSchema,
  verify2faSchema,
  type LoginInput,
  type Verify2faInput,
} from "@/lib/validators/auth";
import type { ActionResult } from "@/types";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { generateSecureOtp, hashOtp, sendOtpEmail } from "@/lib/email";
import { logAudit } from "@/actions/audit.actions";

export interface LoginResult {
  redirectUrl?: string;
  requires2fa?: boolean;
  challengeId?: string;
}

export async function loginAction(
  data: LoginInput
): Promise<ActionResult<LoginResult>> {
  const parseResult = loginSchema.safeParse(data);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.errors[0]?.message || "Invalid input data",
    };
  }

  const { email, password } = parseResult.data;
  const supabase = await createClient();

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (authError || !authData.user) {
    return {
      success: false,
      error: authError?.message || "Invalid email or password",
    };
  }

  try {
    const userRecord = await prisma.user.findUnique({
      where: { email },
    });

    if (!userRecord) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: "No judicial record found associated with this account.",
      };
    }

    if (!userRecord.isActive) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: "This account has been deactivated by the Registrar.",
      };
    }

    // Two-Factor Authentication Check: Enforced strictly for REGISTRAR role
    if (userRecord.role === "REGISTRAR") {
      const cookieStore = await cookies();

      // Clear any prior verification cookie and mark 2FA pending
      cookieStore.delete("jis_2fa_verified");
      cookieStore.set("jis_2fa_pending", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 600, // 10 minutes
      });

      // Generate 6-digit OTP and SHA-256 hash
      const otp = generateSecureOtp();
      const codeHash = hashOtp(otp);

      // Clean up previous challenges for this user
      await prisma.twoFactorChallenge.deleteMany({
        where: { userId: userRecord.id },
      });

      // Store challenge in database
      const challenge = await prisma.twoFactorChallenge.create({
        data: {
          userId: userRecord.id,
          codeHash,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
          attempts: 0,
        },
      });

      // Dispatch OTP email via Resend
      const emailResult = await sendOtpEmail({
        code: otp,
        name: userRecord.name,
      });

      if (!emailResult.success) {
        console.warn("Notice: Resend email dispatch failed:", emailResult.error);
      }

      // Log audit entry
      await logAudit(
        userRecord.id,
        "OTP_GENERATED",
        "User",
        userRecord.id,
        { challengeId: challenge.id }
      );

      return {
        success: true,
        data: {
          requires2fa: true,
          challengeId: challenge.id,
        },
      };
    }

    // Judges and Lawyers: Standard 1-factor authentication (no 2FA)
    const rolePaths: Record<string, string> = {
      REGISTRAR: "/registrar",
      JUDGE: "/judge",
      LAWYER: "/lawyer",
    };

    const redirectUrl = rolePaths[userRecord.role] || "/login";

    return {
      success: true,
      data: { redirectUrl },
    };
  } catch (error) {
    console.error("Database lookup error during login:", error);
    await supabase.auth.signOut();
    const cookieStore = await cookies();
    cookieStore.delete("jis_2fa_pending");
    cookieStore.delete("jis_2fa_verified");
    return {
      success: false,
      error: "Authentication service encountered a system error. Please try again.",
    };
  }
}

export async function verify2faAction(
  data: Verify2faInput
): Promise<ActionResult<{ redirectUrl: string }>> {
  const parseResult = verify2faSchema.safeParse(data);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.errors[0]?.message || "Invalid input data",
    };
  }

  const { challengeId, code } = parseResult.data;

  try {
    const challenge = await prisma.twoFactorChallenge.findUnique({
      where: { id: challengeId },
      include: { user: true },
    });

    if (!challenge) {
      return {
        success: false,
        error: "Verification challenge expired or not found. Please log in again.",
      };
    }

    // Check expiration
    if (new Date() > challenge.expiresAt) {
      await prisma.twoFactorChallenge.delete({ where: { id: challengeId } });
      return {
        success: false,
        error: "Verification code has expired. Please log in again.",
      };
    }

    // Check attempts limit (max 5)
    if (challenge.attempts >= 5) {
      await prisma.twoFactorChallenge.delete({ where: { id: challengeId } });
      await logAudit(
        challenge.userId,
        "OTP_LOCKED",
        "User",
        challenge.userId,
        { challengeId }
      );
      return {
        success: false,
        error: "Maximum verification attempts exceeded. Account verification locked for security. Please log in again.",
      };
    }

    // Compare SHA-256 hash
    const inputHash = hashOtp(code);
    if (inputHash !== challenge.codeHash) {
      const updated = await prisma.twoFactorChallenge.update({
        where: { id: challengeId },
        data: { attempts: { increment: 1 } },
      });

      const remaining = 5 - updated.attempts;

      await logAudit(
        challenge.userId,
        "OTP_VERIFY_FAILED",
        "User",
        challenge.userId,
        { challengeId, remainingAttempts: remaining }
      );

      return {
        success: false,
        error: `Invalid verification code. ${remaining} attempt${
          remaining === 1 ? "" : "s"
        } remaining.`,
      };
    }

    // Successful Verification: Consume challenge and grant verified status
    await prisma.twoFactorChallenge.delete({
      where: { id: challengeId },
    });

    const cookieStore = await cookies();
    cookieStore.delete("jis_2fa_pending");
    cookieStore.set("jis_2fa_verified", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    await logAudit(
      challenge.userId,
      "OTP_VERIFIED",
      "User",
      challenge.userId,
      { challengeId }
    );

    return {
      success: true,
      data: { redirectUrl: "/registrar" },
    };
  } catch (error) {
    console.error("Error during 2FA verification:", error);
    return {
      success: false,
      error: "Verification service encountered an unexpected error.",
    };
  }
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("jis_2fa_verified");
  cookieStore.delete("jis_2fa_pending");

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
