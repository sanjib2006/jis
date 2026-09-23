"use client";

import { useState, useTransition } from "react";
import type { Courtroom } from "@/types";
import { toggleCourtroomActiveAction } from "@/actions/courtroom.actions";
import { CreateCourtroomDialog } from "@/components/courtrooms/create-courtroom-dialog";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, CheckCircle2, XCircle } from "lucide-react";

interface CourtroomTableProps {
  courtrooms: Courtroom[];
}

export function CourtroomTable({ courtrooms }: CourtroomTableProps) {
  const [isPending, startTransition] = useTransition();
  const [courtroomToEdit, setCourtroomToEdit] = useState<Courtroom | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleToggle = (id: string, name: string) => {
    startTransition(async () => {
      const result = await toggleCourtroomActiveAction(id);
      if (!result.success) {
        toast.error(result.error || "Failed to alter courtroom status.");
      } else {
        toast.success(`Courtroom ${name} status updated.`);
      }
    });
  };

  const handleOpenEdit = (cr: Courtroom) => {
    setCourtroomToEdit(cr);
    setEditDialogOpen(true);
  };

  if (courtrooms.length === 0) {
    return (
      <div className="border border-border rounded-sm p-8 text-center text-xs text-muted-foreground">
        No courtrooms or benches registered in the system.
      </div>
    );
  }

  return (
    <>
      <div className="border border-border rounded-sm overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="font-semibold text-foreground h-9 px-3">
                Courtroom / Bench
              </TableHead>
              <TableHead className="font-semibold text-foreground h-9 px-3">
                Location
              </TableHead>
              <TableHead className="font-semibold text-foreground h-9 px-3">
                Daily Slot Capacity
              </TableHead>
              <TableHead className="font-semibold text-foreground h-9 px-3">
                Status
              </TableHead>
              <TableHead className="h-9 px-3 w-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {courtrooms.map((cr) => (
              <TableRow
                key={cr.id}
                className="border-b border-border/60 hover:bg-muted/30 transition-colors"
              >
                <TableCell className="font-medium text-foreground py-2.5 px-3">
                  {cr.name}
                </TableCell>
                <TableCell className="text-muted-foreground py-2.5 px-3">
                  {cr.location || "—"}
                </TableCell>
                <TableCell className="font-mono text-foreground py-2.5 px-3">
                  {cr.maxSlots} hearings / day
                </TableCell>
                <TableCell className="py-2.5 px-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`size-1.5 rounded-full shrink-0 ${
                        cr.isActive ? "bg-emerald-600" : "bg-muted-foreground"
                      }`}
                    />
                    <span
                      className={`text-xs ${
                        cr.isActive
                          ? "text-foreground font-normal"
                          : "text-muted-foreground line-through"
                      }`}
                    >
                      {cr.isActive ? "Available" : "Decommissioned"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-2.5 px-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      disabled={isPending}
                      className="h-6 w-6 inline-flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer disabled:opacity-40"
                      aria-label="Actions"
                    >
                      <MoreHorizontal className="size-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="rounded-sm text-xs min-w-36"
                    >
                      <DropdownMenuLabel className="text-[10px] uppercase font-mono text-muted-foreground">
                        Courtroom Actions
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        disabled={isPending}
                        onClick={() => handleOpenEdit(cr)}
                        className="text-foreground text-xs cursor-pointer"
                      >
                        <Edit className="size-3.5 mr-1.5" />
                        Modify Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={isPending}
                        onClick={() => handleToggle(cr.id, cr.name)}
                        className={
                          cr.isActive
                            ? "text-destructive focus:text-destructive text-xs cursor-pointer"
                            : "text-foreground text-xs cursor-pointer"
                        }
                      >
                        {cr.isActive ? (
                          <>
                            <XCircle className="size-3.5 mr-1.5" />
                            Decommission
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="size-3.5 mr-1.5" />
                            Re-activate
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {courtroomToEdit && (
        <CreateCourtroomDialog
          courtroomToEdit={courtroomToEdit}
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setCourtroomToEdit(null);
          }}
        />
      )}
    </>
  );
}
