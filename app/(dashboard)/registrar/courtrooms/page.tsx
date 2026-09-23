import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CreateCourtroomDialog } from "@/components/courtrooms/create-courtroom-dialog";
import { CourtroomTable } from "@/components/courtrooms/courtroom-table";
import { Badge } from "@/components/ui/badge";

export const revalidate = 15;

export default async function CourtroomsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "REGISTRAR") {
    redirect(`/${currentUser.role.toLowerCase()}`);
  }

  const courtrooms = await prisma.courtroom.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Courtroom Facilities & Bench Capacities
            </h1>
            <Badge
              variant="outline"
              className="text-[10px] uppercase font-mono py-0 px-1.5 rounded-sm"
            >
              {courtrooms.length} {courtrooms.length === 1 ? "Courtroom" : "Courtrooms"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure court chambers and maximum daily hearing capacity for docket scheduling.
          </p>
        </div>

        <CreateCourtroomDialog />
      </div>

      <CourtroomTable courtrooms={courtrooms} />
    </div>
  );
}
