import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell } from "@/components/shared/dashboard-shell";


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
