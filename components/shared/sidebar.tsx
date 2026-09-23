"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROLE_NAV_MAP, type NavItem } from "@/lib/nav-config";
import type { CurrentUser } from "@/types";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface SidebarProps {
  user: CurrentUser | null;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

export function Sidebar({
  user,
  mobileOpen = false,
  onMobileOpenChange,
}: SidebarProps) {
  const pathname = usePathname();
  const role = user?.role || "REGISTRAR";
  const navItems: NavItem[] = ROLE_NAV_MAP[role] || [];

  const navContent = (
    <div className="flex flex-col h-full bg-primary text-primary-foreground select-none">
      <div className="h-12 border-b border-sidebar-border px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="size-2 rounded-full bg-accent" />
          <span className="font-semibold text-sm tracking-tight text-primary-foreground">
            JIS Portal
          </span>
        </Link>
        <span className="text-[10px] font-mono tracking-wider uppercase text-primary-foreground/60 px-1 py-0.5 rounded border border-sidebar-border">
          {role}
        </span>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/registrar" &&
              item.href !== "/judge" &&
              item.href !== "/lawyer" &&
              pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onMobileOpenChange?.(false)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-sm transition-colors border-l-2",
                isActive
                  ? "bg-sidebar-accent text-primary-foreground border-accent font-semibold"
                  : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-sidebar-accent/50 border-transparent"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border text-[11px] text-primary-foreground/60 font-mono">
        <p className="truncate">State Judicial System</p>
        <p className="text-[10px] text-primary-foreground/40">v1.0.0 &bull; Secure</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-56 border-r border-border shrink-0">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="p-0 w-64 border-r border-border bg-primary">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          {navContent}
        </SheetContent>
      </Sheet>
    </>
  );
}
