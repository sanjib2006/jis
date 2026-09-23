import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function RegistrarPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Registrar Portal
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Administrative overview, court docket scheduling, and user management.
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-mono rounded-sm">
          ROLE: REGISTRAR
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded border border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Pending Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              Phase 3–5 will populate case dockets
            </p>
          </CardContent>
        </Card>

        <Card className="rounded border border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Hearings Scheduled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              Phase 4 slot allocation engine
            </p>
          </CardContent>
        </Card>

        <Card className="rounded border border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Active Courtrooms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              Phase 3 courtroom management
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
