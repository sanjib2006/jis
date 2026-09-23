"use client";

import { useTransition } from "react";
import { logoutAction } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Menu } from "lucide-react";
import type { CurrentUser } from "@/types";

interface TopbarProps {
  user: CurrentUser | null;
  onOpenMobileNav?: () => void;
}

export function Topbar({ user, onOpenMobileNav }: TopbarProps) {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  return (
    <header className="h-12 border-b border-border px-4 sm:px-6 flex items-center justify-between bg-card shrink-0">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden text-muted-foreground"
          onClick={onOpenMobileNav}
          aria-label="Open Navigation"
        >
          <Menu className="size-4" />
        </Button>
        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase hidden sm:inline-block">
          Official Judicial Records
        </span>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium text-foreground">{user.name}</span>
              <Badge
                variant="outline"
                className="text-[10px] uppercase font-mono tracking-wider py-0 px-1.5 rounded-sm bg-muted/50 border-border"
              >
                {user.role}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={isPending}
              className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
              title="Sign out of portal"
            >
              <LogOut className="size-3.5 mr-1" />
              <span>{isPending ? "Signing out..." : "Sign Out"}</span>
            </Button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-mono rounded-sm">
              Session Inactive
            </Badge>
          </div>
        )}
      </div>
    </header>
  );
}
