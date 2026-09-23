"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  recordJudgmentSchema,
  type RecordJudgmentInput,
} from "@/lib/validators/case";
import { recordJudgmentAction } from "@/actions/case.actions";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Scale } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

interface JudgmentDialogProps {
  cin: string;
}

export function JudgmentDialog({ cin }: JudgmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RecordJudgmentInput>({
    resolver: zodResolver(recordJudgmentSchema),
    defaultValues: {
      cin,
      judgmentDate: new Date(),
      summary: "",
    },
  });

  const onSubmit = (data: RecordJudgmentInput) => {
    setServerError(null);
    startTransition(async () => {
      const res = await recordJudgmentAction(data);
      if (res.success) {
        toast.success(
          "Judicial judgment recorded successfully. Case docket closed."
        );
        setOpen(false);
        reset();
        router.refresh();
      } else {
        setServerError(res.error || "Failed to record judgment");
        toast.error(res.error || "Failed to record judgment");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center gap-1.5 text-xs font-medium h-8 px-3 rounded-sm bg-accent text-accent-foreground hover:bg-accent/90 transition-colors shadow-none cursor-pointer">
        <Scale className="size-3.5" />
        Record Judgment
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg border border-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
            <Scale className="size-4 text-accent" />
            Record Judicial Judgment
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Permanent case resolution for Case #{cin}. Recording a judgment marks
            the docket as <strong className="text-foreground">CLOSED</strong> and
            permanently locks the record as read-only.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {serverError && (
            <div className="flex items-start gap-2 p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-sm">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="judgmentDate" className="text-xs font-medium">
              Date of Judgment <span className="text-destructive">*</span>
            </Label>
            <Input
              id="judgmentDate"
              type="date"
              defaultValue={todayStr}
              {...register("judgmentDate")}
              className="text-xs h-8 rounded-sm bg-background"
            />
            {errors.judgmentDate && (
              <p className="text-[11px] text-destructive">
                {errors.judgmentDate.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="summary" className="text-xs font-medium">
              Statutory Judgment Findings & Summary{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="summary"
              rows={5}
              placeholder="Enter comprehensive judgment, conviction or acquittal orders, statutory reasoning, and sentencing summary..."
              {...register("summary")}
              className="text-xs rounded-sm bg-background resize-y min-h-[120px]"
            />
            {errors.summary && (
              <p className="text-[11px] text-destructive">
                {errors.summary.message}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground">
              Minimum 10 characters. Once submitted, judgments are permanent and
              cannot be modified.
            </p>
          </div>

          <DialogFooter className="gap-2 pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                reset();
                setServerError(null);
                setOpen(false);
              }}
              disabled={isPending}
              className="h-8 text-xs rounded-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="h-8 text-xs rounded-sm bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {isPending ? "Entering Judgment..." : "Finalize & Close Case"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
