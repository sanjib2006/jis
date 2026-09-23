"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FileText, Clock, CheckCircle2, Calendar } from "lucide-react";

export function CaseNavTabs() {
  const pathname = usePathname();

  const tabs = [
    {
      label: "All Cases",
      href: "/registrar/cases",
      icon: FileText,
      exact: true,
    },
    {
      label: "Pending Cases",
      href: "/registrar/cases/pending",
      icon: Clock,
      exact: false,
    },
    {
      label: "Resolved Cases",
      href: "/registrar/cases/resolved",
      icon: CheckCircle2,
      exact: false,
    },
    {
      label: "By Hearing Date",
      href: "/registrar/cases/by-hearing",
      icon: Calendar,
      exact: false,
    },
  ];

  return (
    <div className="flex items-center gap-1 border-b border-border text-xs">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.exact
          ? pathname === tab.href
          : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            prefetch={true}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-2 font-medium border-b-2 -mb-px transition-colors rounded-t-sm",
              isActive
                ? "border-accent text-foreground font-semibold bg-muted/30"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10"
            )}
          >
            <Icon className="size-3.5" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
