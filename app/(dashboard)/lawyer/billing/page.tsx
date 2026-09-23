import { getCurrentUser } from "@/lib/auth";
import { getLawyerBillingAction } from "@/actions/caseView.actions";
import { redirect } from "next/navigation";
import Link from "next/link";
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
import { ArrowLeft, CreditCard, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LawyerBillingPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "LAWYER") {
    redirect(`/${currentUser.role.toLowerCase()}`);
  }

  const res = await getLawyerBillingAction();
  const billingData = res.success && res.data
    ? res.data
    : { views: [], totalCharges: 0, viewCount: 0, monthlyCharges: 0, monthlyViewCount: 0 };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/lawyer"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-xs" }),
              "h-7 w-7 text-muted-foreground hover:text-foreground"
            )}
          >
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back</span>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                Itemized Billing Statements & Fee Ledger
              </h1>
              <Badge
                variant="outline"
                className="text-[10px] uppercase font-mono py-0 px-1.5 rounded-sm"
              >
                {billingData.viewCount}{" "}
                {billingData.viewCount === 1 ? "Inspection" : "Inspections"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Official record of accrued case law inspection charges debited under statutory regulations.
            </p>
          </div>
        </div>

        <Link
          href="/lawyer/history"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-8 text-xs font-medium rounded-sm inline-flex items-center"
          )}
        >
          Browse Archive Register
        </Link>
      </div>

      {/* Summary Banner */}
      <div className="p-4 border border-border rounded-sm bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-sm bg-primary text-primary-foreground flex items-center justify-center shrink-0">
            <CreditCard className="size-4" />
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase font-mono">
              Accumulated Total Charges
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              ₹{billingData.totalCharges.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground sm:text-right font-mono">
          <div>
            This Month:{" "}
            <span className="font-semibold text-foreground">
              ₹{billingData.monthlyCharges.toFixed(2)}
            </span>{" "}
            ({billingData.monthlyViewCount} views)
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Tariff Rate: ₹50.00 / case view
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      {billingData.views.length === 0 ? (
        <div className="border border-border rounded-sm p-12 text-center text-xs text-muted-foreground bg-card">
          <p className="font-medium text-foreground">No case inspection charges on record</p>
          <p className="mt-1">
            Accessing archived cases in the Case Law repository will automatically itemize fees here.
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-sm overflow-hidden bg-card">
          <Table>
            <TableHeader className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="font-semibold text-foreground h-9 px-3">
                  Transaction / Inspection Timestamp
                </TableHead>
                <TableHead className="font-semibold text-foreground h-9 px-3">
                  CIN
                </TableHead>
                <TableHead className="font-semibold text-foreground h-9 px-3">
                  Case Docket (Defendant)
                </TableHead>
                <TableHead className="font-semibold text-foreground h-9 px-3">
                  Crime Classification
                </TableHead>
                <TableHead className="font-semibold text-foreground h-9 px-3 text-right">
                  Billed Amount
                </TableHead>
                <TableHead className="h-9 px-3 w-8" />
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {billingData.views.map((v) => (
                <TableRow
                  key={v.id}
                  className="border-b border-border/60 hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <TableCell className="font-mono text-[11px] text-muted-foreground py-2.5 px-3 whitespace-nowrap">
                    <Link href={`/lawyer/history/${v.cin}`} className="block">
                      {format(new Date(v.viewedAt), "dd MMM yyyy, HH:mm:ss")}
                    </Link>
                  </TableCell>
                  <TableCell className="py-2.5 px-3">
                    <Link href={`/lawyer/history/${v.cin}`} className="block">
                      <CinBadge cin={v.cin} />
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium text-foreground py-2.5 px-3">
                    <Link href={`/lawyer/history/${v.cin}`} className="block">
                      {v.case.defendantName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground py-2.5 px-3">
                    <Link href={`/lawyer/history/${v.cin}`} className="block">
                      {v.case.crimeType}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-[11px] font-semibold text-foreground py-2.5 px-3 text-right whitespace-nowrap">
                    <Link href={`/lawyer/history/${v.cin}`} className="block">
                      ₹{Number(v.chargeAmount).toFixed(2)}
                    </Link>
                  </TableCell>
                  <TableCell className="py-2.5 px-3 text-right">
                    <Link href={`/lawyer/history/${v.cin}`}>
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
