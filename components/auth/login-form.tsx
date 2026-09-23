"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";
import { loginAction } from "@/actions/auth.actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Lock, Mail } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await loginAction(data);
      if (!result.success) {
        setServerError(result.error || "Authentication failed.");
      } else if (result.data?.redirectUrl) {
        router.push(result.data.redirectUrl);
        router.refresh();
      }
    });
  };

  return (
    <Card className="w-full max-w-sm rounded border border-border bg-card shadow-none">
      <CardHeader className="space-y-1.5 pb-4">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-accent" />
          <CardTitle className="text-lg font-semibold tracking-tight text-foreground">
            Judiciary Information System
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-muted-foreground font-normal">
          Authorized personnel login. Enter statutory credentials to proceed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="p-2.5 rounded-sm bg-destructive/10 border border-destructive/20 flex items-start gap-2 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium text-foreground">
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
              <p className="text-[11px] text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-medium text-foreground">
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
      </CardContent>
    </Card>
  );
}
