import { getCurrentUser } from "@/lib/auth";
import { getPendingCasesAction } from "@/actions/case.actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CaseNavTabs } from "@/components/cases/case-nav-tabs";
import { CinSearchBar } from "@/components/cases/cin-search-bar";
import { CinBadge } from "@/components/shared/cin-badge";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ChevronRight } from "lucide-react";

export const revalidate = 15;

export default async function PendingCasesPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "REGISTRAR") {
    redirect(`/${currentUser.role.toLowerCase()}`);
  }

  const res = await getPendingCasesAction();
  const cases = res.success && res.data ? res.data : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Pending Litigations Registry
            </h1>
            <Badge
              variant="outline"
              className="text-[10px] uppercase font-mono py-0 px-1.5 rounded-sm"
            >
              {cases.length} {cases.length === 1 ? "Active Case" : "Active Cases"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Active proceedings awaiting adjudication or conclusion (Registered, Pending, or Adjourned).
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <CaseNavTabs />
        <div className="pt-1">
          <CinSearchBar />
        </div>
      </div>

      {cases.length === 0 ? (
        <div className="border border-border rounded-sm p-12 text-center text-xs text-muted-foreground bg-card">
          <p className="font-medium text-foreground">No pending cases.</p>
        </div>
      ) : (
        <div className="border border-border rounded-sm overflow-hidden bg-card">
          <Table>
            <TableHeader className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="font-semibold text-foreground h-9 px-3">
                  CIN
                </TableHead>
                <TableHead className="font-semibold text-foreground h-9 px-3">
                  Start Date
                </TableHead>
                <TableHead className="font-semibold text-foreground h-9 px-3">
                  Defendant
                </TableHead>
                <TableHead className="font-semibold text-foreground h-9 px-3">
                  Address
                </TableHead>
                <TableHead className="font-semibold text-foreground h-9 px-3">
                  Crime Type
                </TableHead>
                <TableHead className="font-semibold text-foreground h-9 px-3">
                  Defense Lawyer
                </TableHead>
                <TableHead className="font-semibold text-foreground h-9 px-3">
                  Prosecutor
                </TableHead>
                <TableHead className="font-semibold text-foreground h-9 px-3">
                  Presiding Judge
                </TableHead>
                <TableHead className="h-9 px-3 w-8" />
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {cases.map((c) => (
                <TableRow
                  key={c.cin}
                  className="border-b border-border/60 hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <TableCell className="py-2.5 px-3">
                    <Link href={`/registrar/cases/${c.cin}`} className="block">
                      <CinBadge cin={c.cin} />
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground py-2.5 px-3 whitespace-nowrap">
                    <Link href={`/registrar/cases/${c.cin}`} className="block">
                      {format(new Date(c.trialStartDate), "dd MMM yyyy")}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium text-foreground py-2.5 px-3">
                    <Link href={`/registrar/cases/${c.cin}`} className="block">
                      {c.defendantName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground py-2.5 px-3 max-w-44 truncate">
                    <Link href={`/registrar/cases/${c.cin}`} className="block">
                      {c.defendantAddress}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground py-2.5 px-3 max-w-36 truncate">
                    <Link href={`/registrar/cases/${c.cin}`} className="block">
                      {c.crimeType}
                    </Link>
                  </TableCell>
                  <TableCell className="text-foreground py-2.5 px-3">
                    <Link href={`/registrar/cases/${c.cin}`} className="block">
                      {c.lawyer.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-foreground py-2.5 px-3">
                    <Link href={`/registrar/cases/${c.cin}`} className="block">
                      {c.prosecutor.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-foreground py-2.5 px-3">
                    <Link href={`/registrar/cases/${c.cin}`} className="block">
                      {c.judge.name}
                    </Link>
                  </TableCell>
                  <TableCell className="py-2.5 px-3 text-right">
                    <Link href={`/registrar/cases/${c.cin}`}>
                      <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
