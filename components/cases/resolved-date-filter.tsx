"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Filter, RotateCcw } from "lucide-react";

interface ResolvedDateFilterProps {
  initialFrom: string;
  initialTo: string;
}

export function ResolvedDateFilter({
  initialFrom,
  initialTo,
}: ResolvedDateFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [from, setFrom] = useState(searchParams.get("from") || initialFrom);
  const [to, setTo] = useState(searchParams.get("to") || initialTo);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    router.push(`/registrar/cases/resolved?${params.toString()}`);
  };

  const handleReset = () => {
    setFrom(initialFrom);
    setTo(initialTo);
    router.push("/registrar/cases/resolved");
  };

  return (
    <form
      onSubmit={handleApply}
      className="flex flex-wrap items-end gap-3 p-3 bg-muted/20 border border-border rounded-sm text-xs"
    >
      <div className="space-y-1">
        <Label
          htmlFor="from-date"
          className="text-[11px] text-muted-foreground font-mono"
        >
          Judgment From Date
        </Label>
        <Input
          id="from-date"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="text-xs h-8 bg-card w-36"
        />
      </div>

      <div className="space-y-1">
        <Label
          htmlFor="to-date"
          className="text-[11px] text-muted-foreground font-mono"
        >
          Judgment To Date
        </Label>
        <Input
          id="to-date"
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="text-xs h-8 bg-card w-36"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" className="h-8 text-xs rounded-sm">
          <Filter className="size-3 mr-1" />
          Filter Decisions
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="h-8 text-xs rounded-sm"
        >
          <RotateCcw className="size-3 mr-1" />
          Default 30 Days
        </Button>
      </div>
    </form>
  );
}
