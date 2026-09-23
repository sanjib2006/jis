"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createCourtroomSchema,
  type CreateCourtroomInput,
} from "@/lib/validators/courtroom";
import {
  createCourtroomAction,
  updateCourtroomAction,
} from "@/actions/courtroom.actions";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, AlertCircle } from "lucide-react";
import type { Courtroom } from "@/types";

interface CourtroomDialogProps {
  courtroomToEdit?: Courtroom | null;
  triggerButton?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateCourtroomDialog({
  courtroomToEdit,
  triggerButton,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: CourtroomDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const isEditMode = Boolean(courtroomToEdit);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCourtroomInput>({
    resolver: zodResolver(createCourtroomSchema),
    values: courtroomToEdit
      ? {
          name: courtroomToEdit.name,
          location: courtroomToEdit.location || "",
          maxSlots: courtroomToEdit.maxSlots,
        }
      : {
          name: "",
          location: "",
          maxSlots: 5,
        },
  });

  const onSubmit = (data: CreateCourtroomInput) => {
    setServerError(null);
    startTransition(async () => {
      let result;
      if (isEditMode && courtroomToEdit) {
        result = await updateCourtroomAction({
          id: courtroomToEdit.id,
          ...data,
        });
      } else {
        result = await createCourtroomAction(data);
      }

      if (!result.success) {
        setServerError(result.error || "Failed to save courtroom record.");
      } else {
        toast.success(
          isEditMode
            ? `Courtroom ${data.name} updated successfully`
            : `Courtroom ${data.name} registered`
        );
        reset();
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {triggerButton ? (
        <div onClick={() => setOpen(true)}>{triggerButton}</div>
      ) : (
        <DialogTrigger className="h-8 px-3 inline-flex items-center justify-center text-xs font-medium rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer">
          <Building2 className="size-3.5 mr-1.5" />
          Add Courtroom
        </DialogTrigger>
      )}

      <DialogContent className="max-w-md rounded-sm border border-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {isEditMode ? "Modify Courtroom Facility" : "Register Courtroom Facility"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure hearing room designations and daily scheduling capacities.
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
            <Label htmlFor="courtroom-name" className="text-xs font-medium">
              Courtroom / Bench Identifier
            </Label>
            <Input
              id="courtroom-name"
              placeholder="e.g. Courtroom 302 - Special Bench"
              disabled={isPending}
              className="h-8 text-xs rounded-sm"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-[11px] text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="courtroom-location" className="text-xs font-medium">
              Physical Location / Wing
            </Label>
            <Input
              id="courtroom-location"
              placeholder="e.g. West Wing, 3rd Floor"
              disabled={isPending}
              className="h-8 text-xs rounded-sm"
              {...register("location")}
            />
            {errors.location && (
              <p className="text-[11px] text-destructive">
                {errors.location.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="courtroom-maxSlots" className="text-xs font-medium">
              Maximum Daily Hearing Slots
            </Label>
            <Input
              id="courtroom-maxSlots"
              type="number"
              min={1}
              max={20}
              disabled={isPending}
              className="h-8 text-xs rounded-sm"
              {...register("maxSlots")}
            />
            {errors.maxSlots && (
              <p className="text-[11px] text-destructive">
                {errors.maxSlots.message}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground font-mono">
              Cap on concurrent hearings scheduled per working calendar day.
            </p>
          </div>

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
              disabled={isPending}
              className="h-8 text-xs rounded-sm"
            >
              {isPending
                ? "Saving..."
                : isEditMode
                ? "Update Courtroom"
                : "Register Courtroom"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
