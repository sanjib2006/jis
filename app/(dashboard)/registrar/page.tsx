import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Plus, Building2, Users, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RegistrarPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "REGISTRAR") {
    redirect(`/${currentUser.role.toLowerCase()}`);
  }

  const [pendingCasesCount, courtroomsCount, usersCount] = await Promise.all([
    prisma.case.count({
      where: {
        status: { in: ["REGISTERED", "PENDING", "ADJOURNED"] },
      },
    }),
    prisma.courtroom.count({
      where: { isActive: true },
    }),
    prisma.user.count({
      where: { isActive: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Registrar Administrative Portal
            </h1>
            <Badge variant="outline" className="text-xs font-mono rounded-sm">
              ROLE: REGISTRAR
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Operational dashboard for docket registration, courtroom slot assignments, and judicial directory.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/registrar/courtrooms"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-8 text-xs font-medium rounded-sm inline-flex items-center"
            )}
          >
            <Building2 className="size-3.5 mr-1" />
            Courtrooms
          </Link>
          <Link
            href="/registrar/cases/new"
            className={cn(
              buttonVariants({ size: "sm" }),
              "h-8 text-xs font-medium rounded-sm inline-flex items-center"
            )}
          >
            <Plus className="size-3.5 mr-1" />
            Register Case
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-sm border border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center justify-between">
              <span>Active Docket</span>
              <FileText className="size-3.5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight text-foreground">
              {pendingCasesCount}
            </div>
            <Link
              href="/registrar/cases"
              className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors mt-1 block"
            >
              View pending case register &rarr;
            </Link>
          </CardContent>
        </Card>

        <Card className="rounded-sm border border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center justify-between">
              <span>Active Benches / Courtrooms</span>
              <Building2 className="size-3.5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight text-foreground">
              {courtroomsCount}
            </div>
            <Link
              href="/registrar/courtrooms"
              className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors mt-1 block"
            >
              Configure courtroom slots &rarr;
            </Link>
          </CardContent>
        </Card>

        <Card className="rounded-sm border border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center justify-between">
              <span>Enrolled Personnel</span>
              <Users className="size-3.5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight text-foreground">
              {usersCount}
            </div>
            <Link
              href="/registrar/accounts"
              className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors mt-1 block"
            >
              Manage user directory &rarr;
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
