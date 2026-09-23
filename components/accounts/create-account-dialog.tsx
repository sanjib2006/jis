"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserSchema, type CreateUserInput } from "@/lib/validators/user";
import { createUserAction } from "@/actions/user.actions";
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
import { UserPlus, AlertCircle } from "lucide-react";

export function CreateAccountDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "LAWYER",
    },
  });

  const onSubmit = (data: CreateUserInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await createUserAction(data);
      if (!result.success) {
        setServerError(result.error || "Failed to create user account.");
      } else {
        toast.success(`Account provisioned for ${data.email}`);
        reset();
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="h-8 px-3 inline-flex items-center justify-center text-xs font-medium rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer">
        <UserPlus className="size-3.5 mr-1.5" />
        Provision Account
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-sm border border-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Provision Judicial Account
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Create statutory login credentials for Judges, Legal Counsel, or Registrars.
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
            <Label htmlFor="name" className="text-xs font-medium">
              Full Legal Name
            </Label>
            <Input
              id="name"
              placeholder="e.g. Hon. Rajesh Sharma"
              disabled={isPending}
              className="h-8 text-xs rounded-sm"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-[11px] text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="email" className="text-xs font-medium">
              Official Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="e.g. r.sharma@judiciary.gov.in"
              disabled={isPending}
              className="h-8 text-xs rounded-sm"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-[11px] text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="password" className="text-xs font-medium">
              Temporary Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimum 6 characters"
              disabled={isPending}
              className="h-8 text-xs rounded-sm"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-[11px] text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="role" className="text-xs font-medium">
              Statutory Role
            </Label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isPending}
                >
                  <SelectTrigger id="role" className="h-8 text-xs rounded-sm">
                    <SelectValue placeholder="Select judicial role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-sm text-xs">
                    <SelectItem value="REGISTRAR">Registrar (Administrator)</SelectItem>
                    <SelectItem value="JUDGE">Judge (Judicial Officer)</SelectItem>
                    <SelectItem value="LAWYER">Lawyer (Advocate / Prosecutor)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.role && (
              <p className="text-[11px] text-destructive">{errors.role.message}</p>
            )}
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
              {isPending ? "Creating Account..." : "Confirm & Provision"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
