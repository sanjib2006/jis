import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm rounded border border-border bg-card">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-semibold tracking-tight text-foreground">
            Judiciary Information System
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Enter your credentials to access the judicial records portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Authentication module will be enabled in Phase 1.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/registrar"
              className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start text-xs font-mono")}
            >
              Registrar Portal Demo
            </Link>
            <Link
              href="/judge"
              className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start text-xs font-mono")}
            >
              Judge Portal Demo
            </Link>
            <Link
              href="/lawyer"
              className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start text-xs font-mono")}
            >
              Lawyer Portal Demo
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
