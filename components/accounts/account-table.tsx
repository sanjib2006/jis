"use client";

import { useTransition } from "react";
import type { User, CurrentUser } from "@/types";
import { deactivateUserAction, reactivateUserAction } from "@/actions/user.actions";
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
import { MoreHorizontal, UserCheck, UserX } from "lucide-react";
import { format } from "date-fns";

interface AccountTableProps {
  users: User[];
  currentUser: CurrentUser | null;
}

export function AccountTable({ users, currentUser }: AccountTableProps) {
  const [isPending, startTransition] = useTransition();

  const handleDeactivate = (userId: string, email: string) => {
    startTransition(async () => {
      const result = await deactivateUserAction(userId);
      if (!result.success) {
        toast.error(result.error || "Failed to deactivate account.");
      } else {
        toast.success(`Account for ${email} deactivated.`);
      }
    });
  };

  const handleReactivate = (userId: string, email: string) => {
    startTransition(async () => {
      const result = await reactivateUserAction(userId);
      if (!result.success) {
        toast.error(result.error || "Failed to reactivate account.");
      } else {
        toast.success(`Account for ${email} reactivated.`);
      }
    });
  };

  if (users.length === 0) {
    return (
      <div className="border border-border rounded-sm p-12 text-center text-xs text-muted-foreground bg-card">
        <p className="font-medium text-foreground">No user accounts.</p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-sm overflow-hidden bg-card">
      <Table>
        <TableHeader className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
          <TableRow className="border-b border-border hover:bg-transparent">
            <TableHead className="font-semibold text-foreground h-9 px-3">Name</TableHead>
            <TableHead className="font-semibold text-foreground h-9 px-3">Official Email</TableHead>
            <TableHead className="font-semibold text-foreground h-9 px-3">Role</TableHead>
            <TableHead className="font-semibold text-foreground h-9 px-3">Status</TableHead>
            <TableHead className="font-semibold text-foreground h-9 px-3">Provisioned Date</TableHead>
            <TableHead className="h-9 px-3 w-12 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="text-xs">
          {users.map((user) => {
            const isSelf = currentUser?.id === user.id;

            return (
              <TableRow
                key={user.id}
                className="border-b border-border/60 hover:bg-muted/30 transition-colors"
              >
                <TableCell className="font-medium text-foreground py-2.5 px-3">
                  <div className="flex items-center gap-1.5">
                    <span>{user.name}</span>
                    {isSelf && (
                      <span className="text-[10px] text-muted-foreground font-mono">
                        (You)
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-[11px] text-muted-foreground py-2.5 px-3">
                  {user.email}
                </TableCell>
                <TableCell className="font-medium py-2.5 px-3">
                  {user.role === "REGISTRAR" && "Registrar"}
                  {user.role === "JUDGE" && "Judge"}
                  {user.role === "LAWYER" && "Advocate / Lawyer"}
                </TableCell>
                <TableCell className="py-2.5 px-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`size-1.5 rounded-full shrink-0 ${
                        user.isActive ? "bg-emerald-600" : "bg-muted-foreground"
                      }`}
                    />
                    <span
                      className={`text-xs ${
                        user.isActive
                          ? "text-foreground font-normal"
                          : "text-muted-foreground line-through"
                      }`}
                    >
                      {user.isActive ? "Active" : "Deactivated"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-[11px] text-muted-foreground py-2.5 px-3">
                  {format(new Date(user.createdAt), "dd MMM yyyy")}
                </TableCell>
                <TableCell className="py-2.5 px-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      disabled={isPending || isSelf}
                      className="h-6 w-6 inline-flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Actions"
                    >
                      <MoreHorizontal className="size-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="rounded-sm text-xs min-w-36"
                    >
                      <DropdownMenuLabel className="text-[10px] uppercase font-mono text-muted-foreground">
                        Account Actions
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {user.isActive ? (
                        <DropdownMenuItem
                          disabled={isPending || isSelf}
                          onClick={() => handleDeactivate(user.id, user.email)}
                          className="text-destructive focus:text-destructive text-xs cursor-pointer"
                        >
                          <UserX className="size-3.5 mr-1.5" />
                          Deactivate Account
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          disabled={isPending}
                          onClick={() => handleReactivate(user.id, user.email)}
                          className="text-foreground text-xs cursor-pointer"
                        >
                          <UserCheck className="size-3.5 mr-1.5" />
                          Reactivate Account
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
