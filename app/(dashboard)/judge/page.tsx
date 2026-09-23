import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { CaseSearch } from "@/components/shared/case-search";
import { History, FileText, ArrowRight, Gavel } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function JudgeDashboardPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "JUDGE") {
    redirect(`/${currentUser.role.toLowerCase()}`);
  }

  const closedCasesCount = await prisma.case.count({
    where: {
      status: { in: ["CLOSED", "RESOLVED"] },
    },
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Judicial Archive & Research Portal
            </h1>
            <Badge variant="outline" className="text-xs font-mono rounded-sm">
              ROLE: JUDGE
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Complimentary judicial access to past case jurisprudence, statutory rulings, and trial proceedings.
          </p>
        </div>

        <Link
          href="/judge/history"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-8 text-xs font-medium rounded-sm inline-flex items-center"
          )}
        >
          <History className="size-3.5 mr-1" />
          Browse Archive Register
        </Link>
      </div>

      {/* Welcome Banner */}
      <div className="p-4 border border-border rounded-sm bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="size-8 rounded-sm bg-primary text-primary-foreground flex items-center justify-center shrink-0 mt-0.5">
            <Gavel className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Welcome, Judge {currentUser.name}
            </h2>
            <p className="text-xs text-muted-foreground">
              As a presiding officer of the court, your access to closed case dockets, testimonies, and final decrees is unrestricted and free of statutory fees.
            </p>
          </div>
        </div>

        <div className="shrink-0 sm:border-l sm:border-border sm:pl-6 text-right sm:text-left">
          <span className="text-[10px] uppercase font-mono text-muted-foreground block">
            Closed Dockets Available
          </span>
          <span className="text-2xl font-semibold text-foreground">
            {closedCasesCount}
          </span>
        </div>
      </div>

      {/* Prominent Search Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">
            Universal Jurisprudence & Case Keyword Search
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Instant multi-field search across Case Identification Numbers, defendants, crime sections, arresting officers, and recorded judgment texts.
        </p>

        <div className="pt-2">
          <CaseSearch role="JUDGE" />
        </div>
      </div>

      {/* Navigation Quick Card */}
      <Card className="rounded-sm border border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Complete Historical Docket
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <p className="text-muted-foreground">
            View the chronological master registry of all adjudicated and closed case records.
          </p>
          <Link
            href="/judge/history"
            className="inline-flex items-center gap-1 font-medium text-foreground hover:underline text-xs"
          >
            <span>Open complete case history archive</span>
            <ArrowRight className="size-3" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
