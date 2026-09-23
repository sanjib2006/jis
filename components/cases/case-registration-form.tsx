"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCaseSchema, type CreateCaseInput } from "@/lib/validators/case";
import { registerCaseAction } from "@/actions/case.actions";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CinBadge } from "@/components/shared/cin-badge";
import { AlertCircle, CheckCircle2, FilePlus2, List } from "lucide-react";
import type { User } from "@/types";

interface CaseRegistrationFormProps {
  judges: User[];
  lawyers: User[];
}

export function CaseRegistrationForm({
  judges,
  lawyers,
}: CaseRegistrationFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [registeredCin, setRegisteredCin] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateCaseInput>({
    resolver: zodResolver(createCaseSchema),
    defaultValues: {
      defendantName: "",
      defendantAddress: "",
      crimeType: "",
      crimeLocation: "",
      arrestingOfficer: "",
      judgeId: "",
      prosecutorId: "",
      lawyerId: "",
    },
  });

  const onSubmit = (data: CreateCaseInput) => {
    setServerError(null);
    setRegisteredCin(null);

    startTransition(async () => {
      const result = await registerCaseAction(data);
      if (!result.success) {
        setServerError(result.error || "Failed to register court case.");
      } else if (result.data?.cin) {
        const cin = result.data.cin;
        setRegisteredCin(cin);
        toast.success(`Case docket registered with CIN: ${cin}`);
        reset();
      }
    });
  };

  const handleRegisterAnother = () => {
    setRegisteredCin(null);
    reset();
  };

  return (
    <div className="space-y-6">
      {registeredCin && (
        <Card className="border border-emerald-500/40 bg-emerald-500/5 rounded-sm">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="size-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Case Docket Registered Successfully
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">Assigned CIN:</span>
                  <CinBadge cin={registeredCin} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegisterAnother}
                className="h-8 text-xs rounded-sm"
              >
                <FilePlus2 className="size-3.5 mr-1" />
                Register Another Case
              </Button>
              <Button
                size="sm"
                onClick={() => router.push("/registrar/cases")}
                className="h-8 text-xs rounded-sm"
              >
                <List className="size-3.5 mr-1" />
                View Case Registry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {serverError && (
        <div className="p-3 rounded-sm bg-destructive/10 border border-destructive/20 flex items-start gap-2 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Two-Column Grid: Defendant Info + Incident Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section 1: Defendant Information */}
          <Card className="rounded-sm border border-border bg-card">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-sm font-semibold">
                1. Defendant Profile
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Statutory identifying details of the accused individual.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5">
              <div className="space-y-1">
                <Label htmlFor="defendantName" className="text-xs font-medium">
                  Full Name of Defendant
                </Label>
                <Input
                  id="defendantName"
                  placeholder="e.g. Anand Kumar Verma"
                  disabled={isPending}
                  className="h-8 text-xs rounded-sm"
                  {...register("defendantName")}
                />
                {errors.defendantName && (
                  <p className="text-[11px] text-destructive">
                    {errors.defendantName.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="defendantAddress" className="text-xs font-medium">
                  Residential / Domicile Address
                </Label>
                <Input
                  id="defendantAddress"
                  placeholder="e.g. 42B Civil Lines, Sector 4, New Delhi"
                  disabled={isPending}
                  className="h-8 text-xs rounded-sm"
                  {...register("defendantAddress")}
                />
                {errors.defendantAddress && (
                  <p className="text-[11px] text-destructive">
                    {errors.defendantAddress.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Crime Details & Arrest Information */}
          <Card className="rounded-sm border border-border bg-card">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-sm font-semibold">
                2. Alleged Offense & Arrest Record
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Charge categorization, scene location, and arresting officer.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="crimeType" className="text-xs font-medium">
                    Crime Classification / IPC Section
                  </Label>
                  <Input
                    id="crimeType"
                    placeholder="e.g. IPC 420 - Fraud"
                    disabled={isPending}
                    className="h-8 text-xs rounded-sm"
                    {...register("crimeType")}
                  />
                  {errors.crimeType && (
                    <p className="text-[11px] text-destructive">
                      {errors.crimeType.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="crimeDate" className="text-xs font-medium">
                    Date of Commission
                  </Label>
                  <Input
                    id="crimeDate"
                    type="date"
                    disabled={isPending}
                    className="h-8 text-xs rounded-sm"
                    {...register("crimeDate")}
                  />
                  {errors.crimeDate && (
                    <p className="text-[11px] text-destructive">
                      {errors.crimeDate.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="crimeLocation" className="text-xs font-medium">
                  Incident Location Jurisdiction
                </Label>
                <Input
                  id="crimeLocation"
                  placeholder="e.g. Connaught Place Circle, Central District"
                  disabled={isPending}
                  className="h-8 text-xs rounded-sm"
                  {...register("crimeLocation")}
                />
                {errors.crimeLocation && (
                  <p className="text-[11px] text-destructive">
                    {errors.crimeLocation.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="arrestingOfficer" className="text-xs font-medium">
                    Arresting Officer & Badge
                  </Label>
                  <Input
                    id="arrestingOfficer"
                    placeholder="e.g. Insp. V. K. Malhotra #492"
                    disabled={isPending}
                    className="h-8 text-xs rounded-sm"
                    {...register("arrestingOfficer")}
                  />
                  {errors.arrestingOfficer && (
                    <p className="text-[11px] text-destructive">
                      {errors.arrestingOfficer.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="arrestDate" className="text-xs font-medium">
                    Date of Custodial Arrest
                  </Label>
                  <Input
                    id="arrestDate"
                    type="date"
                    disabled={isPending}
                    className="h-8 text-xs rounded-sm"
                    {...register("arrestDate")}
                  />
                  {errors.arrestDate && (
                    <p className="text-[11px] text-destructive">
                      {errors.arrestDate.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section 3: Assigned Judicial Officers & Counsel */}
        <Card className="rounded-sm border border-border bg-card">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-sm font-semibold">
              3. Assigned Judicial Bench & Counsel
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Allocation of verified active presiding Judge, Public Prosecutor, and Defense Lawyer.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="judgeId" className="text-xs font-medium">
                Presiding Judge
              </Label>
              <Controller
                name="judgeId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isPending}
                  >
                    <SelectTrigger id="judgeId" className="h-8 text-xs rounded-sm">
                      <SelectValue placeholder="Select Presiding Judge" />
                    </SelectTrigger>
                    <SelectContent className="rounded-sm text-xs">
                      {judges.map((j) => (
                        <SelectItem key={j.id} value={j.id}>
                          {j.name} ({j.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.judgeId && (
                <p className="text-[11px] text-destructive">
                  {errors.judgeId.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="prosecutorId" className="text-xs font-medium">
                Public Prosecutor
              </Label>
              <Controller
                name="prosecutorId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isPending}
                  >
                    <SelectTrigger id="prosecutorId" className="h-8 text-xs rounded-sm">
                      <SelectValue placeholder="Select Prosecutor" />
                    </SelectTrigger>
                    <SelectContent className="rounded-sm text-xs">
                      {lawyers.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name} ({l.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.prosecutorId && (
                <p className="text-[11px] text-destructive">
                  {errors.prosecutorId.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="lawyerId" className="text-xs font-medium">
                Defense Counsel
              </Label>
              <Controller
                name="lawyerId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isPending}
                  >
                    <SelectTrigger id="lawyerId" className="h-8 text-xs rounded-sm">
                      <SelectValue placeholder="Select Defense Counsel" />
                    </SelectTrigger>
                    <SelectContent className="rounded-sm text-xs">
                      {lawyers.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name} ({l.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.lawyerId && (
                <p className="text-[11px] text-destructive">
                  {errors.lawyerId.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Trial Schedule Timeline */}
        <Card className="rounded-sm border border-border bg-card">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-sm font-semibold">
              4. Trial Schedule & Timetable
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Anticipated trial commencement date and projected conclusion milestone.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="trialStartDate" className="text-xs font-medium">
                Trial Commencement Date
              </Label>
              <Input
                id="trialStartDate"
                type="date"
                disabled={isPending}
                className="h-8 text-xs rounded-sm"
                {...register("trialStartDate")}
              />
              {errors.trialStartDate && (
                <p className="text-[11px] text-destructive">
                  {errors.trialStartDate.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="expectedCompletionDate" className="text-xs font-medium">
                Targeted Completion / Verdict Date
              </Label>
              <Input
                id="expectedCompletionDate"
                type="date"
                disabled={isPending}
                className="h-8 text-xs rounded-sm"
                {...register("expectedCompletionDate")}
              />
              {errors.expectedCompletionDate && (
                <p className="text-[11px] text-destructive">
                  {errors.expectedCompletionDate.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => router.push("/registrar/cases")}
            className="h-9 px-4 text-xs rounded-sm"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isPending}
            className="h-9 px-5 text-xs rounded-sm"
          >
            {isPending ? "Generating Case Docket..." : "Formally Register Case"}
          </Button>
        </div>
      </form>
    </div>
  );
}
