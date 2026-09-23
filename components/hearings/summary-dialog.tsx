"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  recordSummarySchema,
  type RecordSummaryInput,
} from "@/lib/validators/hearing";
import { recordHearingSummaryAction } from "@/actions/hearing.actions";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import type { Courtroom } from "@/types";

interface SummaryDialogProps {
  hearingId: string;
  courtrooms: Courtroom[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SummaryDialog({
  hearingId,
  courtrooms,
  open,
  onOpenChange,
}: SummaryDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<RecordSummaryInput>({
    resolver: zodResolver(recordSummarySchema),
    defaultValues: {
      hearingId,
      proceedingSummary: "",
      nextHearingDate: null,
      nextCourtroomId: null,
    },
    values: {
      hearingId,
      proceedingSummary: "",
      nextHearingDate: null,
      nextCourtroomId: null,
    },
  });

  const nextDateSelected = Boolean(watch("nextHearingDate"));

  const onSubmit = (data: RecordSummaryInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await recordHearingSummaryAction(data);
      if (!result.success) {
        setServerError(result.error || "Failed to record proceeding summary.");
      } else {
        toast.success("Hearing summary recorded and session marked completed.");
        reset();
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-sm border border-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Record Proceeding Summary
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Enter judicial proceedings record, evidence tendered, or testimonies examined.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 py-2">
          {serverError && (
            <div className="p-2.5 rounded-sm bg-destructive/10 border border-destructive/20 flex items-start gap-2 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="proceedingSummary" className="text-xs font-medium">
              Official Proceeding Summary *
            </Label>
            <Textarea
              id="proceedingSummary"
              placeholder="e.g. Prosecution produced Prosecution Witness #1. Cross-examination concluded. Defense argued bail petition."
              disabled={isPending}
              rows={4}
              className="text-xs rounded-sm resize-none"
              {...register("proceedingSummary")}
            />
            {errors.proceedingSummary && (
              <p className="text-[11px] text-destructive">
                {errors.proceedingSummary.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border/40">
            <div className="space-y-1">
              <Label htmlFor="nextHearingDate" className="text-xs font-medium">
                Next Hearing Date (Optional)
              </Label>
              <Input
                id="nextHearingDate"
                type="date"
                disabled={isPending}
                className="h-8 text-xs rounded-sm"
                {...register("nextHearingDate")}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="nextCourtroomId" className="text-xs font-medium">
                Next Courtroom
              </Label>
              <Controller
                name="nextCourtroomId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    disabled={isPending || !nextDateSelected}
                  >
                    <SelectTrigger id="nextCourtroomId" className="h-8 text-xs rounded-sm">
                      <SelectValue placeholder="Select chamber" />
                    </SelectTrigger>
                    <SelectContent className="rounded-sm text-xs">
                      {courtrooms.map((cr) => (
                        <SelectItem key={cr.id} value={cr.id}>
                          {cr.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs rounded-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="h-8 text-xs rounded-sm"
            >
              {isPending ? "Recording..." : "Record Proceeding & Complete"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
