"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";

interface CasesHearingDateFilterProps {
  currentDate: string;
}

export function CasesHearingDateFilter({
  currentDate,
}: CasesHearingDateFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleDateChange = (newDate: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newDate) {
      params.set("date", newDate);
    } else {
      params.delete("date");
    }
    router.push(`/registrar/cases/by-hearing?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/20 border border-border rounded-sm">
      <Label
        htmlFor="cases-hearing-date"
        className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 shrink-0"
      >
        <Calendar className="size-3.5" />
        Filter Cases by Hearing Session Date:
      </Label>
      <Input
        id="cases-hearing-date"
        type="date"
        value={currentDate}
        onChange={(e) => handleDateChange(e.target.value)}
        className="h-8 text-xs font-mono w-44 rounded-sm bg-card"
      />
    </div>
  );
}
