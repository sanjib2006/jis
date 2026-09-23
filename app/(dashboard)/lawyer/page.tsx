import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LawyerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Defense & Prosecution Portal
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Archived case inspection, billing ledger, and case search.
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-mono rounded-sm">
          ROLE: LAWYER
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded border border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Archived Case Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              Case views logged for this account
            </p>
          </CardContent>
        </Card>

        <Card className="rounded border border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Accrued Incurred Charges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight">₹0.00</div>
            <p className="text-xs text-muted-foreground mt-1">
              Billed per closed case access (Phase 6)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
