"use client";

import { useState } from "react";
import type { AuditLogWithActor } from "@/actions/audit.actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Code2 } from "lucide-react";

interface AuditLogTableProps {
  logs: AuditLogWithActor[];
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
  const [selectedDetails, setSelectedDetails] = useState<{
    action: string;
    entity: string;
    entityId: string;
    details: unknown;
  } | null>(null);

  if (logs.length === 0) {
    return (
      <div className="border border-border rounded-sm p-12 text-center text-xs text-muted-foreground bg-card">
        <p className="font-medium text-foreground">No audit log entries.</p>
        <p className="mt-1">
          Adjust the filter parameters above to broaden your query.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="border border-border rounded-sm overflow-hidden bg-card font-mono text-[11px]">
        <Table>
          <TableHeader className="bg-muted/40 uppercase tracking-wider text-muted-foreground">
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="font-semibold text-foreground h-8 px-2.5 w-44">
                Timestamp (UTC)
              </TableHead>
              <TableHead className="font-semibold text-foreground h-8 px-2.5">
                Actor / Principal
              </TableHead>
              <TableHead className="font-semibold text-foreground h-8 px-2.5">
                Action Event
              </TableHead>
              <TableHead className="font-semibold text-foreground h-8 px-2.5">
                Entity
              </TableHead>
              <TableHead className="font-semibold text-foreground h-8 px-2.5">
                Target Entity ID
              </TableHead>
              <TableHead className="font-semibold text-foreground h-8 px-2.5">
                Payload Details
              </TableHead>
              <TableHead className="h-8 px-2.5 w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => {
              const hasDetails = log.details !== null && log.details !== undefined;
              const detailsSnippet = hasDetails
                ? JSON.stringify(log.details)
                : "—";

              return (
                <TableRow
                  key={log.id}
                  className="border-b border-border/40 hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="py-1.5 px-2.5 text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss")}
                  </TableCell>
                  <TableCell className="py-1.5 px-2.5 font-sans font-medium text-foreground whitespace-nowrap">
                    <span>{log.actor.name}</span>
                    <span className="ml-1 text-[10px] font-mono text-muted-foreground">
                      [{log.actor.role}]
                    </span>
                  </TableCell>
                  <TableCell className="py-1.5 px-2.5">
                    <span className="px-1.5 py-0.5 rounded border border-border bg-muted/40 text-foreground text-[10px]">
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell className="py-1.5 px-2.5 text-foreground font-semibold">
                    {log.entity}
                  </TableCell>
                  <TableCell className="py-1.5 px-2.5 text-muted-foreground max-w-40 truncate">
                    {log.entityId}
                  </TableCell>
                  <TableCell className="py-1.5 px-2.5 text-muted-foreground max-w-xs truncate font-mono text-[10px]">
                    {detailsSnippet}
                  </TableCell>
                  <TableCell className="py-1.5 px-2.5 text-right">
                    {hasDetails && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() =>
                          setSelectedDetails({
                            action: log.action,
                            entity: log.entity,
                            entityId: log.entityId,
                            details: log.details,
                          })
                        }
                        className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
                        title="View Full JSON Payload"
                      >
                        <Code2 className="size-3" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Details JSON Dialog */}
      <Dialog
        open={!!selectedDetails}
        onOpenChange={(open) => !open && setSelectedDetails(null)}
      >
        <DialogContent className="sm:max-w-lg border border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Code2 className="size-4 text-accent" />
              <span>Audit Mutation Details & Payload</span>
            </DialogTitle>
          </DialogHeader>

          {selectedDetails && (
            <div className="space-y-3 pt-2 text-xs">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono border-b border-border/60 pb-2">
                <span className="font-semibold text-foreground">
                  Action: {selectedDetails.action}
                </span>
                <span>&bull;</span>
                <span className="text-muted-foreground">
                  {selectedDetails.entity} #{selectedDetails.entityId}
                </span>
              </div>

              <div className="p-3 bg-muted/30 border border-border rounded-sm font-mono text-[11px] overflow-x-auto max-h-72">
                <pre className="whitespace-pre-wrap text-foreground">
                  {JSON.stringify(selectedDetails.details, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
