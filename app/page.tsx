import Link from "next/link";
import Image from "next/image";
import { ArrowRight, FileText, Scale, BookOpen } from "lucide-react";

function CourthouseMark({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M8 21h48M12 21l20-11 20 11M16 25v25M27 25v25M37 25v25M48 25v25M10 53h44"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="square"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-accent/20 selection:text-foreground overflow-x-hidden">
      {/* Top Navigation */}
      <header className="border-b border-border bg-background/90 backdrop-blur-md sticky top-0 z-20 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <CourthouseMark className="w-7 h-7 sm:w-8 sm:h-8 text-accent shrink-0" />
            <span className="font-semibold text-base sm:text-lg tracking-tight text-foreground">
              Judiciary Information System
            </span>
            <span className="hidden sm:inline-block text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-sm border border-border bg-secondary text-muted-foreground">
              Records Portal
            </span>
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-sm text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-all hover:-translate-y-0.5 shadow-sm"
          >
            <span>Portal Login</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Content Area with Building Background */}
      <main className="flex-1 relative flex flex-col justify-center overflow-hidden">
        {/* Background Image with Government Portal Treatment */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <Image
            src="/building.png"
            alt="Neoclassical courthouse architecture"
            fill
            priority
            unoptimized
            className="object-cover object-right-top md:object-[72%_center] filter saturate-[0.88] contrast-[0.98]"
            sizes="100vw"
          />
          {/* Subtle ivory wash to ensure high contrast for typography while keeping building visible */}
          <div
            className="absolute inset-0 hidden md:block"
            style={{
              background:
                "linear-gradient(to right, #f6f5f1 0%, rgba(246, 245, 241, 0.98) 40%, rgba(246, 245, 241, 0.6) 55%, rgba(246, 245, 241, 0) 75%)",
            }}
          />
          {/* Mobile wash to keep vertical text readable */}
          <div
            className="absolute inset-0 block md:hidden"
            style={{
              background:
                "linear-gradient(to bottom, rgba(246, 245, 241, 0.96) 0%, rgba(246, 245, 241, 0.85) 100%)",
            }}
          />
          {/* Note: Removed the bottom ivory gradient fog so the image meets the dark footer with a sharp, grounded edge */}
        </div>

        {/* Content Container (proportioned to fit 100% viewport cleanly) */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-4 sm:py-6 flex flex-col justify-center gap-6 lg:gap-8">
          {/* Hero Copy */}
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5 text-[10px] sm:text-[11px] font-bold tracking-[0.22em] text-muted-foreground uppercase mb-2.5">
              <span className="w-8 h-[2px] bg-accent" />
              Public · Accessible · Transparent
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] xl:text-[3rem] font-semibold tracking-tight text-foreground leading-[1.12]">
              Official Case &amp;<br className="hidden sm:inline" />
              Hearing Record<br className="hidden sm:inline" />
              Management
            </h1>

            <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl font-normal leading-relaxed">
              Statutory records system for Registrars, Judicial Officers, and Legal Counsel.
              Centralized case registration, hearing slot scheduling, proceeding summaries, and legal archives.
            </p>
          </div>

          {/* Action Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 mt-2 lg:mt-4">
            {/* Registrar Administration */}
            <Link
              href="/registrar"
              className="group relative flex flex-col justify-between p-4 sm:p-5 bg-card/95 backdrop-blur-sm rounded-sm border border-border shadow-sm hover:shadow-md transition-all border-b-[3px] border-b-chart-1 hover:-translate-y-0.5"
            >
              <div>
                <div className="w-9 h-9 rounded-md bg-chart-1/15 text-chart-1 flex items-center justify-center mb-3">
                  <FileText className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-semibold text-card-foreground tracking-tight">
                  Registrar Administration
                </h2>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  Case registration, hearing slot allocations, adjournments, and judicial decrees.
                </p>
              </div>
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-chart-1 group-hover:brightness-75">
                <span>Enter Registrar View</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            {/* Judicial Research */}
            <Link
              href="/judge"
              className="group relative flex flex-col justify-between p-4 sm:p-5 bg-card/95 backdrop-blur-sm rounded-sm border border-border shadow-sm hover:shadow-md transition-all border-b-[3px] border-b-chart-2 hover:-translate-y-0.5"
            >
              <div>
                <div className="w-9 h-9 rounded-md bg-chart-2/15 text-chart-2 flex items-center justify-center mb-3">
                  <Scale className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-semibold text-card-foreground tracking-tight">
                  Judicial Research
                </h2>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  Complimentary full case access, precedent inquiry, and historical judgment review.
                </p>
              </div>
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-chart-2 group-hover:brightness-75">
                <span>Enter Judicial View</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            {/* Advocate Records */}
            <Link
              href="/lawyer"
              className="group relative flex flex-col justify-between p-4 sm:p-5 bg-card/95 backdrop-blur-sm rounded-sm border border-border shadow-sm hover:shadow-md transition-all border-b-[3px] border-b-chart-3 hover:-translate-y-0.5"
            >
              <div>
                <div className="w-9 h-9 rounded-md bg-chart-3/15 text-chart-3 flex items-center justify-center mb-3">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-semibold text-card-foreground tracking-tight">
                  Advocate Records
                </h2>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  Public case law research, billed view logging, and account billing statements.
                </p>
              </div>
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-chart-3 group-hover:brightness-75">
                <span>Enter Advocate View</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </div>
        </div>
      </main>

      {/* Official Government Records Footer */}
      <footer className="bg-primary text-primary-foreground py-3.5 sm:py-4 border-t border-sidebar-border shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-6">
          <div className="flex items-center gap-3">
            <CourthouseMark className="w-6 h-6 sm:w-7 sm:h-7 text-accent shrink-0" />
            <div>
              <div className="text-xs sm:text-sm font-semibold tracking-tight">
                Judiciary Information System
              </div>
              <div className="text-[11px] text-primary-foreground/70">
                Department of Justice &amp; Legal Affairs
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] sm:text-xs text-primary-foreground/70">
            <span>Statutory Judicial Repository</span>
            <span className="hidden sm:inline opacity-30">•</span>
            <span>National Judicial Data Grid Compliant</span>
            <span className="hidden sm:inline opacity-30">•</span>
            <span>Authorized Personnel Only</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
