"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, AlertCircle } from "lucide-react";
import { getCaseByCinAction } from "@/actions/case.actions";

export function CinSearchBar() {
  const [cinInput, setCinInput] = useState("");
  const [notFoundCin, setNotFoundCin] = useState<string | null>(null);
  const [isSearching, startSearching] = useTransition();
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = cinInput.trim();
    if (!query) return;

    setNotFoundCin(null);
    startSearching(async () => {
      const res = await getCaseByCinAction(query);
      if (res.success && res.data) {
        router.push(`/registrar/cases/${res.data.cin}`);
      } else {
        setNotFoundCin(query);
      }
    });
  };

  return (
    <div className="space-y-2">
      <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            value={cinInput}
            onChange={(e) => {
              setCinInput(e.target.value);
              if (notFoundCin) setNotFoundCin(null);
            }}
            placeholder="Search docket by CIN (e.g. cin-2026-0001)..."
            className="pl-8 text-xs h-8 rounded-sm bg-card"
          />
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={isSearching || !cinInput.trim()}
          className="h-8 text-xs rounded-sm shrink-0"
        >
          {isSearching ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            "Lookup CIN"
          )}
        </Button>
      </form>

      {notFoundCin && (
        <div className="flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 border border-destructive/20 px-3 py-1.5 rounded-sm max-w-md">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>
            No case docket found matching CIN &ldquo;{notFoundCin}&rdquo;
          </span>
        </div>
      )}
    </div>
  );
}
