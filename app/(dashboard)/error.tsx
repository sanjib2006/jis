"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { AlertCircle, RotateCcw, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error caught by boundary:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full border border-border rounded-sm bg-card p-6 space-y-4">
        <div className="flex items-center gap-2.5 text-destructive border-b border-border pb-3">
          <AlertCircle className="size-5 shrink-0" />
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            System Error &bull; Judicial Operation Interrupted
          </h2>
        </div>

        <div className="space-y-1 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">
            An unexpected operational exception occurred while processing this
            judicial record.
          </p>
          <p className="font-mono text-[11px] text-muted-foreground break-all">
            {error.message || "Internal server error"}
          </p>
          {error.digest && (
            <p className="text-[10px] text-muted-foreground font-mono">
              Digest Ref: {error.digest}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-border/60">
          <Button
            size="sm"
            onClick={() => reset()}
            className="h-8 text-xs rounded-sm"
          >
            <RotateCcw className="size-3.5 mr-1" />
            Retry Operation
          </Button>
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-8 text-xs rounded-sm"
            )}
          >
            <ArrowLeft className="size-3.5 mr-1" />
            Return to Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
