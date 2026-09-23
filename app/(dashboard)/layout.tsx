import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="h-12 border-b border-border px-6 flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm tracking-tight">
            JIS Record System
          </span>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider py-0 px-1.5 rounded-sm">
            Phase 0 Scaffold
          </Badge>
        </div>
        <nav className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
          <Link href="/registrar" className="hover:text-foreground transition-colors">
            Registrar
          </Link>
          <Link href="/judge" className="hover:text-foreground transition-colors">
            Judge
          </Link>
          <Link href="/lawyer" className="hover:text-foreground transition-colors">
            Lawyer
          </Link>
          <Link href="/login" className="hover:text-foreground transition-colors">
            Login
          </Link>
        </nav>
      </header>
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">{children}</main>
    </div>
  );
}
