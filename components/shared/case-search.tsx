"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  searchCasesAction,
  type SearchResultCase,
} from "@/actions/case.actions";
import { CinBadge } from "@/components/shared/cin-badge";
import { LawyerChargeDialog } from "@/components/lawyer/lawyer-charge-dialog";
import { Search, Loader2, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface CaseSearchProps {
  role: "REGISTRAR" | "JUDGE" | "LAWYER";
  placeholder?: string;
}

export function CaseSearch({
  role,
  placeholder = "Search cases by keyword (CIN, defendant, crime, location, judgment summary)...",
}: CaseSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultCase[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isPending, startTransition] = useTransition();

  // For Lawyer charge confirmation
  const [lawyerChargeCin, setLawyerChargeCin] = useState<string | null>(null);
  const [lawyerDialogOpen, setLawyerDialogOpen] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(() => {
      startTransition(async () => {
        const res = await searchCasesAction(trimmed);
        if (res.success && res.data) {
          setResults(res.data);
        } else {
          setResults([]);
        }
        setHasSearched(true);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectCase = (cin: string) => {
    if (role === "LAWYER") {
      setLawyerChargeCin(cin);
      setLawyerDialogOpen(true);
    } else if (role === "JUDGE") {
      router.push(`/judge/history/${cin}`);
    } else {
      router.push(`/registrar/cases/${cin}`);
    }
  };

  return (
    <div className="space-y-3 w-full">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-9 pr-9 text-xs h-9 rounded-sm bg-card border-border shadow-none"
        />
        {isPending && (
          <Loader2 className="absolute right-3 top-2.5 size-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {hasSearched && query.trim().length >= 2 && results.length === 0 && !isPending && (
        <div className="p-4 border border-border rounded-sm bg-card text-center text-xs text-muted-foreground">
          No matching judicial records found for &ldquo;{query.trim()}&rdquo;.
        </div>
      )}

      {results.length > 0 && (
        <div className="border border-border rounded-sm bg-card divide-y divide-border/60 overflow-hidden shadow-sm">
          <div className="px-3 py-1.5 bg-muted/40 text-[11px] font-mono text-muted-foreground uppercase flex items-center justify-between">
            <span>
              {results.length} Matching Case {results.length === 1 ? "Record" : "Records"}
            </span>
            {role === "LAWYER" && (
              <span className="text-[10px] text-accent font-sans">
                ₹50.00 access fee per inspection
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border/40">
            {results.map((c) => (
              <div
                key={c.cin}
                onClick={() => handleSelectCase(c.cin)}
                className="px-3 py-2.5 hover:bg-muted/40 cursor-pointer transition-colors flex items-center justify-between text-xs group"
              >
                <div className="space-y-1 pr-4">
                  <div className="flex items-center gap-2">
                    <CinBadge cin={c.cin} />
                    <span className="font-semibold text-foreground">
                      {c.defendantName}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1 py-0.5 rounded border border-border text-muted-foreground bg-muted/30">
                      {c.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-muted-foreground">
                    <span>Charge: {c.crimeType}</span>
                    <span>&bull;</span>
                    <span>Judge: {c.judge.name}</span>
                    {c.judgment && (
                      <>
                        <span>&bull;</span>
                        <span className="font-mono text-foreground/80">
                          Judgment: {format(new Date(c.judgment.judgmentDate), "dd MMM yyyy")}
                        </span>
                      </>
                    )}
                  </div>
                  {c.judgment?.summary && (
                    <p className="text-[11px] text-muted-foreground line-clamp-1 italic">
                      &ldquo;{c.judgment.summary}&rdquo;
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-foreground shrink-0 text-xs">
                  <span className="hidden sm:inline text-[11px]">
                    {role === "LAWYER" ? "Inspect (₹50)" : "View Docket"}
                  </span>
                  <ChevronRight className="size-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charge Dialog for Lawyers */}
      {role === "LAWYER" && (
        <LawyerChargeDialog
          cin={lawyerChargeCin}
          open={lawyerDialogOpen}
          onOpenChange={setLawyerDialogOpen}
        />
      )}
    </div>
  );
}
