import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-6 sm:p-12">
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold tracking-tight text-base">
            Judiciary Information System
          </span>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider rounded-sm">
            Records Portal
          </Badge>
        </div>
        <Link
          href="/login"
          className={cn(buttonVariants({ size: "sm" }), "rounded-sm font-medium text-xs")}
        >
          Portal Login
        </Link>
      </header>

      <main className="max-w-4xl mx-auto w-full my-auto py-12 space-y-8">
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            Official Case & Hearing Record Management
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl font-normal leading-relaxed">
            Statutory records system for Registrars, Judicial Officers, and Legal Counsel.
            Centralized case registration, hearing slot scheduling, proceeding summaries, and legal archives.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <Card className="rounded border border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-foreground">
                Registrar Administration
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Case registration, hearing slot allocations, adjournments, and judicial decrees.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/registrar"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full text-xs rounded-sm")}
              >
                Enter Registrar View
              </Link>
            </CardContent>
          </Card>

          <Card className="rounded border border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-foreground">
                Judicial Research
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Complimentary full case access, precedent inquiry, and historical judgment review.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/judge"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full text-xs rounded-sm")}
              >
                Enter Judicial View
              </Link>
            </CardContent>
          </Card>

          <Card className="rounded border border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-foreground">
                Advocate Records
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Public case law research, billed view logging, and account billing statements.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/lawyer"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full text-xs rounded-sm")}
              >
                Enter Advocate View
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="max-w-4xl mx-auto w-full border-t border-border pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
        <span>Judiciary Information System &bull; Academic Software Engineering Project</span>
        <span>Next.js 15 &bull; Prisma &bull; Supabase Postgres</span>
      </footer>
    </div>
  );
}
