"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Auth error caught by boundary:", error);
  }, [error]);

  return (
    <div className="max-w-sm w-full border border-border rounded-sm bg-card p-6 space-y-4 text-xs">
      <div className="flex items-center gap-2 text-destructive border-b border-border pb-3">
        <AlertCircle className="size-4 shrink-0" />
        <h2 className="text-sm font-semibold text-foreground">
          Authentication Error
        </h2>
      </div>

      <p className="text-muted-foreground">
        An error occurred during identity verification or session establishment.
      </p>

      <div className="flex items-center gap-2 pt-2 border-t border-border/60">
        <Button
          size="sm"
          onClick={() => reset()}
          className="h-8 text-xs rounded-sm"
        >
          <RotateCcw className="size-3.5 mr-1" />
          Try Again
        </Button>
        <Link
          href="/login"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-8 text-xs rounded-sm"
          )}
        >
          Return to Login
        </Link>
      </div>
    </div>
  );
}
