"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";

interface HearingsDateFilterProps {
  currentDate: string;
}

export function HearingsDateFilter({ currentDate }: HearingsDateFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleDateChange = (newDate: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newDate) {
      params.set("date", newDate);
    } else {
      params.delete("date");
    }
    router.push(`/registrar/hearings?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="hearings-date" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 shrink-0">
        <Calendar className="size-3.5" />
        Filter by Session Date:
      </Label>
      <Input
        id="hearings-date"
        type="date"
        value={currentDate}
        onChange={(e) => handleDateChange(e.target.value)}
        className="h-8 text-xs font-mono w-40 rounded-sm"
      />
    </div>
  );
}
