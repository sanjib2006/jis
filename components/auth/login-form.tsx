"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";
import { loginAction, verify2faAction } from "@/actions/auth.actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Lock, Mail, ArrowLeft, KeyRound } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const initialError =
    urlError === "2fa_required"
      ? "Two-Factor Authentication is required for Registrar. Please enter your credentials to complete verification."
      : null;

  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(initialError);

  // 2FA State Machine
  const [step, setStep] = useState<"credentials" | "2fa">("credentials");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState<string>("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmitCredentials = (data: LoginInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await loginAction(data);
      if (!result.success) {
        setServerError(result.error || "Authentication failed.");
      } else if (result.data?.requires2fa && result.data.challengeId) {
        setChallengeId(result.data.challengeId);
        setOtpCode("");
        reset();
        setStep("2fa");
      } else if (result.data?.redirectUrl) {
        router.push(result.data.redirectUrl);
        router.refresh();
      }
    });
  };

  const onSubmitOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeId) return;

    if (otpCode.length !== 6) {
      setServerError("Please enter all 6 digits of the verification code.");
      return;
    }

    setServerError(null);
    startTransition(async () => {
      const result = await verify2faAction({
        challengeId,
        code: otpCode,
      });

      if (!result.success) {
        setServerError(result.error || "Verification failed.");
      } else if (result.data?.redirectUrl) {
        router.push(result.data.redirectUrl);
        router.refresh();
      }
    });
  };

  return (
    <Card className="w-full max-w-sm rounded border border-border bg-card shadow-none">
      <CardHeader className="space-y-1.5 pb-4">
        <div className="flex items-center gap-2.5">
          <Image
            src="/emblem.ico"
            alt="Judiciary Information System Emblem"
            width={24}
            height={24}
            unoptimized
            className="size-6 object-contain shrink-0"
          />
          <CardTitle className="text-lg font-semibold tracking-tight text-foreground">
            {step === "credentials"
              ? "Judiciary Information System"
              : "Two-Factor Authentication"}
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-muted-foreground font-normal">
          {step === "credentials"
            ? "Authorized personnel login. Enter statutory credentials to proceed."
            : "A 6-digit verification code has been dispatched to your registered email address."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {serverError && (
          <div className="mb-4 p-2.5 rounded-sm bg-destructive/10 border border-destructive/20 flex items-start gap-2 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        {step === "credentials" ? (
          <form
            key="form-credentials"
            onSubmit={handleSubmit(onSubmitCredentials)}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-xs font-medium text-foreground"
              >
                Official Email
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="name@court.gov.in"
                  autoComplete="email"
                  disabled={isPending}
                  className="text-xs h-9 rounded-sm pl-8"
                  {...register("email")}
                />
                <Mail className="size-3.5 text-muted-foreground absolute left-2.5 top-3 pointer-events-none" />
              </div>
              {errors.email && (
                <p className="text-[11px] text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-xs font-medium text-foreground"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isPending}
                  className="text-xs h-9 rounded-sm pl-8"
                  {...register("password")}
                />
                <Lock className="size-3.5 text-muted-foreground absolute left-2.5 top-3 pointer-events-none" />
              </div>
              {errors.password && (
                <p className="text-[11px] text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-9 text-xs rounded-sm font-medium transition-colors"
            >
              {isPending ? "Verifying Credentials..." : "Authenticate"}
            </Button>

            <div className="pt-2 text-center">
              <p className="text-[11px] text-muted-foreground font-mono">
                Accounts are provisioned by the Registrar.
              </p>
            </div>
          </form>
        ) : (
          <form
            key="form-2fa"
            onSubmit={onSubmitOtp}
            className="space-y-4"
            autoComplete="off"
          >
            <div className="space-y-1.5">
              <Label
                htmlFor="otpCode"
                className="text-xs font-medium text-foreground"
              >
                Verification Code
              </Label>
              <div className="relative">
                <Input
                  key="input-otpCode"
                  id="otpCode"
                  name="otpCode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) =>
                    setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="••••••"
                  autoFocus
                  disabled={isPending}
                  className="text-center font-mono text-base tracking-[0.5em] h-10 rounded-sm font-bold pl-8"
                />
                <KeyRound className="size-4 text-muted-foreground absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending || otpCode.length !== 6}
              className="w-full h-9 text-xs rounded-sm font-medium transition-colors"
            >
              {isPending ? "Verifying Code..." : "Verify & Proceed"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => {
                setStep("credentials");
                setServerError(null);
                setOtpCode("");
                reset();
              }}
              className="w-full h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to Login</span>
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
