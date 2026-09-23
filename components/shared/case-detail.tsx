import { CinBadge } from "@/components/shared/cin-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Calendar, Gavel, Shield, User } from "lucide-react";
import type { Case, User as UserModel } from "@/types";

interface CaseDetailProps {
  caseData: Case & {
    judge: UserModel;
    prosecutor: UserModel;
    lawyer: UserModel;
  };
}

export function CaseDetail({ caseData }: CaseDetailProps) {
  return (
    <div className="space-y-6">
      <Card className="rounded-sm border border-border bg-card">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <span>Case Docket Summary</span>
              <CinBadge cin={caseData.cin} />
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Registration Timestamp: {format(new Date(caseData.createdAt), "dd MMM yyyy, HH:mm")}
            </p>
          </div>
          <span className="font-mono text-xs uppercase px-2 py-0.5 rounded-sm border border-border bg-muted/50 font-semibold">
            Status: {caseData.status}
          </span>
        </CardHeader>
        <CardContent className="pt-4 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-[11px] text-muted-foreground block font-medium">
                Defendant Legal Name
              </span>
              <span className="text-sm font-semibold text-foreground">
                {caseData.defendantName}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block font-medium">
                Statutory Charge / Offense
              </span>
              <span className="text-sm font-semibold text-foreground">
                {caseData.crimeType}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground block font-medium">
              Registered Domicile Address
            </span>
            <span className="text-foreground">{caseData.defendantAddress}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border/40">
            <div>
              <span className="text-[11px] text-muted-foreground block font-medium">
                Incident Jurisdiction & Location
              </span>
              <span className="text-foreground">{caseData.crimeLocation}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block font-medium">
                Date Crime Committed
              </span>
              <span className="font-mono text-foreground">
                {format(new Date(caseData.crimeDate), "dd MMM yyyy")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border/40">
            <div>
              <span className="text-[11px] text-muted-foreground block font-medium">
                Arresting Officer & Authority
              </span>
              <span className="text-foreground">{caseData.arrestingOfficer}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block font-medium">
                Date of Custodial Arrest
              </span>
              <span className="font-mono text-foreground">
                {format(new Date(caseData.arrestDate), "dd MMM yyyy")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Assigned Officers */}
        <Card className="rounded-sm border border-border bg-card">
          <CardHeader className="pb-2.5 border-b border-border/60">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Assigned Judicial Personnel
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3.5 space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <Gavel className="size-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-mono block">
                  Presiding Judge
                </span>
                <span className="font-medium text-foreground">
                  {caseData.judge.name}
                </span>
                <span className="text-[11px] text-muted-foreground font-mono block">
                  {caseData.judge.email}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Shield className="size-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-mono block">
                  Public Prosecutor
                </span>
                <span className="font-medium text-foreground">
                  {caseData.prosecutor.name}
                </span>
                <span className="text-[11px] text-muted-foreground font-mono block">
                  {caseData.prosecutor.email}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <User className="size-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-mono block">
                  Defense Counsel
                </span>
                <span className="font-medium text-foreground">
                  {caseData.lawyer.name}
                </span>
                <span className="text-[11px] text-muted-foreground font-mono block">
                  {caseData.lawyer.email}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card className="rounded-sm border border-border bg-card">
          <CardHeader className="pb-2.5 border-b border-border/60">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Trial Milestone Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3.5 space-y-3.5 text-xs">
            <div className="flex items-center gap-2.5">
              <Calendar className="size-4 text-muted-foreground shrink-0" />
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-mono block">
                  Commencement Date
                </span>
                <span className="font-mono text-foreground font-medium text-xs">
                  {format(new Date(caseData.trialStartDate), "dd MMM yyyy")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Calendar className="size-4 text-muted-foreground shrink-0" />
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-mono block">
                  Targeted Conclusion
                </span>
                <span className="font-mono text-foreground font-medium text-xs">
                  {format(new Date(caseData.expectedCompletionDate), "dd MMM yyyy")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
