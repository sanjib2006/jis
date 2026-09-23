import { getCurrentUser } from "@/lib/auth";
import {
  getAuditLogsAction,
  getAuditFilterOptionsAction,
} from "@/actions/audit.actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AuditFilterBar } from "@/components/audit/audit-filter-bar";
import { AuditLogTable } from "@/components/audit/audit-log-table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ShieldAlert, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface AuditPageProps {
  searchParams: Promise<{
    action?: string;
    entity?: string;
    actorId?: string;
    fromDate?: string;
    toDate?: string;
    page?: string;
  }>;
}

export default async function AuditLogPage({ searchParams }: AuditPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "REGISTRAR") {
    redirect(`/${currentUser.role.toLowerCase()}`);
  }

  const { action, entity, actorId, fromDate, toDate, page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);

  const [optionsRes, logsRes] = await Promise.all([
    getAuditFilterOptionsAction(),
    getAuditLogsAction({
      action,
      entity,
      actorId,
      fromDate,
      toDate,
      page: currentPage,
      pageSize: 50,
    }),
  ]);

  const filterOptions = optionsRes.success && optionsRes.data
    ? optionsRes.data
    : { actions: [], entities: [], actors: [] };

  const auditData = logsRes.success && logsRes.data
    ? logsRes.data
    : { logs: [], totalCount: 0, totalPages: 1, currentPage: 1, pageSize: 50 };

  const buildPageUrl = (targetPage: number) => {
    const params = new URLSearchParams();
    if (action) params.set("action", action);
    if (entity) params.set("entity", entity);
    if (actorId) params.set("actorId", actorId);
    if (fromDate) params.set("fromDate", fromDate);
    if (toDate) params.set("toDate", toDate);
    params.set("page", targetPage.toString());
    return `/registrar/audit?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
              <ShieldAlert className="size-5 text-accent" />
              <span>Administrative Audit Trail</span>
            </h1>
            <Badge
              variant="outline"
              className="text-[10px] uppercase font-mono py-0 px-1.5 rounded-sm"
            >
              {auditData.totalCount} {auditData.totalCount === 1 ? "Event" : "Events"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Immutable, append-only chronological log of all judicial database mutations, user actions, and statutory filings.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <AuditFilterBar filterOptions={filterOptions} />

      {/* Audit Log Table */}
      <AuditLogTable logs={auditData.logs} />

      {/* Pagination Controls */}
      {auditData.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
          <span className="text-muted-foreground font-mono">
            Page {auditData.currentPage} of {auditData.totalPages} ({auditData.totalCount} total events)
          </span>

          <div className="flex items-center gap-2">
            <Link
              href={buildPageUrl(auditData.currentPage - 1)}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-7 text-xs rounded-sm",
                auditData.currentPage <= 1 && "pointer-events-none opacity-50"
              )}
            >
              <ChevronLeft className="size-3.5 mr-1" />
              Previous
            </Link>

            <Link
              href={buildPageUrl(auditData.currentPage + 1)}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-7 text-xs rounded-sm",
                auditData.currentPage >= auditData.totalPages && "pointer-events-none opacity-50"
              )}
            >
              Next
              <ChevronRight className="size-3.5 ml-1" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
