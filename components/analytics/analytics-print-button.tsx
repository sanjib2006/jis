"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AnalyticsPrintButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.print()}
      className="h-8 text-xs font-medium rounded-sm inline-flex items-center"
    >
      <Printer className="size-3.5 mr-1" />
      Print Official Report
    </Button>
  );
}
