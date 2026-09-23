"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  scheduleHearingSchema,
  type ScheduleHearingInput,
} from "@/lib/validators/hearing";
import {
  getAvailableSlotsAction,
  scheduleHearingAction,
  type AvailableSlotInfo,
} from "@/actions/hearing.actions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, AlertCircle, AlertTriangle, Clock } from "lucide-react";

interface ScheduleHearingDialogProps {
  cin: string;
  judgeId: string;
}

export function ScheduleHearingDialog({
  cin,
  judgeId,
}: ScheduleHearingDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isCheckingSlots, startCheckingSlots] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const [slotCheckResult, setSlotCheckResult] = useState<{
    judgeBooked: boolean;
    slots: AvailableSlotInfo[];
  } | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ScheduleHearingInput>({
    resolver: zodResolver(scheduleHearingSchema),
    defaultValues: {
      cin,
      courtroomId: "",
      hearingDate: new Date(),
    },
  });

  const checkAvailability = (dateVal: string) => {
    if (!dateVal) return;
    setServerError(null);
    startCheckingSlots(async () => {
      const res = await getAvailableSlotsAction(dateVal, judgeId);
      if (res.success && res.data) {
        setSlotCheckResult(res.data);
      } else {
        setServerError(res.error || "Failed to inspect courtroom slot capacity.");
      }
    });
  };

  const onSubmit = (data: ScheduleHearingInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await scheduleHearingAction(data);
      if (!result.success) {
        setServerError(result.error || "Failed to schedule hearing.");
      } else {
        toast.success("Hearing scheduled successfully.");
        reset();
        setSlotCheckResult(null);
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="h-8 px-3 inline-flex items-center justify-center text-xs font-medium rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer">
        <Calendar className="size-3.5 mr-1.5" />
        Schedule Hearing
      </DialogTrigger>

      <DialogContent className="max-w-md rounded-sm border border-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Schedule Court Hearing
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Assign calendar hearing slot based on courtroom capacity and judicial officer availability.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {serverError && (
            <div className="p-2.5 rounded-sm bg-destructive/10 border border-destructive/20 flex items-start gap-2 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Date Selection */}
          <div className="space-y-1">
            <Label htmlFor="hearingDate" className="text-xs font-medium">
              Hearing Calendar Date
            </Label>
            <Input
              id="hearingDate"
              type="date"
              disabled={isPending}
              className="h-8 text-xs rounded-sm"
              {...register("hearingDate", {
                onChange: (e) => checkAvailability(e.target.value),
              })}
            />
            {errors.hearingDate && (
              <p className="text-[11px] text-destructive">
                {errors.hearingDate.message}
              </p>
            )}
          </div>

          {/* Availability Feedback Strip */}
          {isCheckingSlots && (
            <div className="p-2 text-xs text-muted-foreground font-mono flex items-center gap-2">
              <Clock className="size-3.5 animate-spin" />
              Checking bench slot capacity & judge schedule...
            </div>
          )}

          {slotCheckResult && !isCheckingSlots && (
            <div className="space-y-3 pt-1">
              {slotCheckResult.judgeBooked ? (
                <div className="p-2.5 rounded-sm bg-destructive/10 border border-destructive/20 flex items-start gap-2 text-xs text-destructive">
                  <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Judicial Conflict</span>
                    The assigned Presiding Judge already has another hearing scheduled on this date. Select another calendar date.
                  </div>
                </div>
              ) : (
                <div className="p-2 rounded-sm bg-muted/60 border border-border text-[11px] text-muted-foreground">
                  Presiding Judge is clear on this date. Select a courtroom below:
                </div>
              )}

              {/* Courtroom Selection */}
              <div className="space-y-1">
                <Label htmlFor="courtroomId" className="text-xs font-medium">
                  Allocated Courtroom Chamber
                </Label>
                <Controller
                  name="courtroomId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isPending || slotCheckResult.judgeBooked}
                    >
                      <SelectTrigger id="courtroomId" className="h-8 text-xs rounded-sm">
                        <SelectValue placeholder="Select available courtroom" />
                      </SelectTrigger>
                      <SelectContent className="rounded-sm text-xs">
                        {slotCheckResult.slots.map((s) => {
                          const isFull = s.remainingSlots <= 0;
                          return (
                            <SelectItem
                              key={s.courtroomId}
                              value={s.courtroomId}
                              disabled={isFull}
                              className="text-xs"
                            >
                              {s.courtroomName} &bull;{" "}
                              {isFull
                                ? "FULL (0 slots remaining)"
                                : `${s.remainingSlots} of ${s.maxSlots} slots remaining`}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.courtroomId && (
                  <p className="text-[11px] text-destructive">
                    {errors.courtroomId.message}
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => setOpen(false)}
              className="h-8 text-xs rounded-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={
                isPending ||
                isCheckingSlots ||
                !slotCheckResult ||
                slotCheckResult.judgeBooked
              }
              className="h-8 text-xs rounded-sm"
            >
              {isPending ? "Scheduling..." : "Confirm Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
