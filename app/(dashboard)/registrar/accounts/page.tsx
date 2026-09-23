import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CreateAccountDialog } from "@/components/accounts/create-account-dialog";
import { AccountTable } from "@/components/accounts/account-table";
import { Badge } from "@/components/ui/badge";

export const revalidate = 15;

export default async function AccountsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "REGISTRAR") {
    redirect(`/${currentUser.role.toLowerCase()}`);
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Judicial Personnel Directory
            </h1>
            <Badge variant="outline" className="text-[10px] uppercase font-mono py-0 px-1.5 rounded-sm">
              {users.length} {users.length === 1 ? "Record" : "Records"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Provision, review, and control statutory user access for Judges, Lawyers, and Registrars.
          </p>
        </div>

        <CreateAccountDialog />
      </div>

      <AccountTable users={users} currentUser={currentUser} />
    </div>
  );
}
