import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { FileQuestion, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RootNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full border border-border rounded-sm bg-card p-6 space-y-4 text-center">
        <div className="size-10 rounded-sm bg-muted flex items-center justify-center mx-auto text-muted-foreground">
          <FileQuestion className="size-5" />
        </div>

        <div className="space-y-1 text-xs">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            404 &bull; Page Not Found
          </h2>
          <p className="text-muted-foreground">
            The requested path does not exist on the Judiciary Information System portal.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className={cn(
              buttonVariants({ size: "sm" }),
              "h-8 text-xs rounded-sm inline-flex items-center"
            )}
          >
            <ArrowLeft className="size-3.5 mr-1" />
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
