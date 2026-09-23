import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function JudgePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Judicial Archive Portal
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Complimentary case law search, past judgments, and proceeding records.
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-mono rounded-sm">
          ROLE: JUDGE
        </Badge>
      </div>

      <Card className="rounded border border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Historical Records Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Judges have unrestricted complimentary access to closed case history. Search and case timeline views will be connected in Phase 6.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
