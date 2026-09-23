import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CaseRegistrationForm } from "@/components/cases/case-registration-form";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NewCasePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "REGISTRAR") {
    redirect(`/${currentUser.role.toLowerCase()}`);
  }

  const activeUsers = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const judges = activeUsers.filter((u) => u.role === "JUDGE");
  const lawyers = activeUsers.filter((u) => u.role === "LAWYER");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/registrar/cases"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-xs" }),
              "h-7 w-7 text-muted-foreground hover:text-foreground"
            )}
          >
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back to cases</span>
          </Link>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Official Case Docket Registration
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Record first information, criminal charges, and assign constitutional officers to create a unique CIN.
            </p>
          </div>
        </div>
      </div>

      <CaseRegistrationForm judges={judges} lawyers={lawyers} />
    </div>
  );
}
