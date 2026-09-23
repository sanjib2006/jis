"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { viewCaseAsLawyerAction } from "@/actions/caseView.actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, CreditCard } from "lucide-react";
import { toast } from "sonner";

interface LawyerChargeDialogProps {
  cin: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function LawyerChargeDialog({
  cin,
  open,
  onOpenChange,
  onSuccess,
}: LawyerChargeDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleConfirm = () => {
    if (!cin) return;
    setError(null);
    startTransition(async () => {
      const res = await viewCaseAsLawyerAction(cin);
      if (res.success && res.data) {
        toast.success(`Statutory fee of ₹50.00 recorded for Case #${cin}`);
        onOpenChange(false);
        if (onSuccess) onSuccess();
        router.push(`/lawyer/history/${cin}`);
      } else {
        setError(res.error || "Failed to process case view billing.");
        toast.error(res.error || "Failed to process case view billing.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border border-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
            <CreditCard className="size-4 text-accent" />
            Confirm Case Law Inspection
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            Accessing archived case record{" "}
            <strong className="text-foreground">#{cin}</strong> will incur a
            statutory access charge of{" "}
            <strong className="text-foreground">₹50.00</strong> billed to your
            account.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-start gap-2 p-2.5 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-sm">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="text-[11px] text-muted-foreground bg-muted/30 p-2.5 rounded-sm border border-border/50 font-mono">
          Each distinct viewing session is permanently recorded and logged for
          billing statements under statutory compliance.
        </div>

        <DialogFooter className="gap-2 pt-2 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="h-8 text-xs rounded-sm"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            disabled={isPending}
            className="h-8 text-xs rounded-sm bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {isPending ? "Recording View..." : "Confirm & Proceed (₹50.00)"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
