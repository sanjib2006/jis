import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CaseTable } from "@/components/cases/case-table";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CasesPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "REGISTRAR") {
    redirect(`/${currentUser.role.toLowerCase()}`);
  }

  const cases = await prisma.case.findMany({
    include: {
      judge: true,
      prosecutor: true,
      lawyer: true,
    },
    orderBy: { cin: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Official Case Docket Register
            </h1>
            <Badge
              variant="outline"
              className="text-[10px] uppercase font-mono py-0 px-1.5 rounded-sm"
            >
              {cases.length} {cases.length === 1 ? "Case" : "Cases"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Master statutory registry of criminal & civil litigations, trial timelines, and presiding officers.
          </p>
        </div>

        <Link
          href="/registrar/cases/new"
          className={cn(
            buttonVariants({ size: "sm" }),
            "h-8 text-xs font-medium rounded-sm inline-flex items-center"
          )}
        >
          <Plus className="size-3.5 mr-1" />
          Register New Case
        </Link>
      </div>

      <CaseTable cases={cases} />
    </div>
  );
}
