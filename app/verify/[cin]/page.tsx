import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  ArrowLeft,
  FileCheck2,
  FileText,
  Lock,
} from "lucide-react";
import { getPublicCaseVerification } from "@/lib/verification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CinBadge } from "@/components/shared/cin-badge";
import {
  PrintVerificationButton,
  CopyHashButton,
} from "@/components/verification/verification-actions";

export const dynamic = "force-dynamic";

interface VerifyPageProps {
  params: Promise<{ cin: string }>;
}

export async function generateMetadata({
  params,
}: VerifyPageProps): Promise<Metadata> {
  const { cin } = await params;
  return {
    title: `Case Verification: ${cin} | Judiciary Information System`,
    description: `Official tamper-evident public verification record for case ${cin}.`,
  };
}

export default async function PublicCaseVerificationPage({
  params,
}: VerifyPageProps) {
  const { cin } = await params;
  const record = await getPublicCaseVerification(cin);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center py-8 px-4 sm:px-6">
      {/* Container with sharp government layout */}
      <div className="w-full max-w-3xl space-y-6">
        {/* Navigation & Print Bar */}
        <div className="flex items-center justify-between print:hidden">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            <ArrowLeft className="size-3.5" />
            <span>Portal Login</span>
          </Link>

          {record && (
            <div className="flex items-center gap-2">
              {record.isDisposed && (
                <a
                  href={`/api/pdf/judgment/${encodeURIComponent(record.cin)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 px-2.5 inline-flex items-center gap-1.5 text-xs font-medium rounded-sm border border-border bg-background hover:bg-muted text-foreground transition-colors"
                >
                  <FileText className="size-3.5 text-accent" />
                  <span>Download Decree (PDF)</span>
                </a>
              )}
              <PrintVerificationButton />
            </div>
          )}
        </div>

        {/* Official Court Registry Header */}
        <header className="border-b border-border pb-5 space-y-2 text-center sm:text-left sm:flex sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="size-11 rounded-sm bg-primary/10 border border-border flex items-center justify-center shrink-0">
              <Image
                src="/emblem.ico"
                alt="Judiciary Information System Emblem"
                width={32}
                height={32}
                unoptimized
                className="size-7 object-contain"
              />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-foreground uppercase">
                Judiciary Information System
              </h1>
              <p className="text-xs text-muted-foreground">
                National Statutory Case Verification Registry &bull; Central Repository
              </p>
            </div>
          </div>
          <div className="text-center sm:text-right pt-2 sm:pt-0">
            <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider block">
              Official Verification Portal
            </span>
            <span className="font-mono text-xs font-semibold text-foreground">
              Form JIS-VER-01
            </span>
          </div>
        </header>

        {/* Case Record Not Found */}
        {!record && (
          <Card className="rounded-sm border border-destructive/40 bg-card">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center gap-2 text-destructive">
                <ShieldAlert className="size-5 shrink-0" />
                <CardTitle className="text-sm font-semibold tracking-tight">
                  Verification Failed: No Statutory Record Found
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <p className="text-foreground leading-relaxed">
                The requested Case Identification Number{" "}
                <span className="font-mono font-semibold bg-muted px-1.5 py-0.5 rounded-xs border border-border">
                  {cin}
                </span>{" "}
                does not correspond to any registered court docket in the Central
                Judicial Registry.
              </p>
              <div className="bg-muted/40 border border-border/80 rounded-sm p-3 text-[11px] text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">
                  Statutory Authenticity Advisory:
                </p>
                <p>
                  If you are verifying a physical or electronic order bearing this
                  CIN, it may be invalid, superseded, or counterfeit. Please report
                  inconsistent court documents to the Office of the Registrar of
                  Courts.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Valid Case Record Found */}
        {record && (
          <div className="space-y-6">
            {/* Tamper-Evident Status Banner */}
            {record.isDisposed ? (
              <div className="flex items-start gap-3 p-4 bg-muted/30 border border-border rounded-sm">
                <ShieldCheck className="size-5 text-accent shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Statutory Record Authenticated &bull; Disposed Decree
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This docket is a permanent, disposed judicial record. The
                    final decree summary below reflects the certified entry in the
                    Central Judicial Database.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-4 bg-muted/20 border border-border rounded-sm">
                <Clock className="size-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Authentic Court Docket Verified &bull; Sub Judice (Pending Trial)
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This case is currently active and pending adjudication on the
                    court docket. Final judgment summary will be published upon
                    trial conclusion.
                  </p>
                </div>
              </div>
            )}

            {/* Official Sealed Certificate Card */}
            <Card className="rounded-sm border border-border bg-card shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                    Certified Docket Extract
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <CinBadge cin={record.cin} className="text-sm font-semibold" />
                    <span className="font-mono text-xs uppercase px-2 py-0.5 rounded-sm border border-border bg-muted/40 font-semibold">
                      {record.status}
                    </span>
                  </div>
                </div>
                <div className="text-left sm:text-right font-mono text-xs text-muted-foreground">
                  <div>
                    Verified:{" "}
                    <span className="text-foreground font-medium">
                      {format(new Date(record.verifiedAt), "dd MMM yyyy, HH:mm:ss")} UTC
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-5 text-xs">
                {/* Cryptographic SHA-256 Hash */}
                <div className="bg-muted/40 border border-border/80 rounded-sm p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase text-muted-foreground font-medium flex items-center gap-1.5">
                      <Lock className="size-3 text-muted-foreground" />
                      Registry Cryptographic SHA-256 Hash
                    </span>
                    <CopyHashButton hash={record.verificationHash} />
                  </div>
                  <p className="font-mono text-[11px] text-foreground break-all select-all bg-background/80 p-2 rounded-xs border border-border/60">
                    {record.verificationHash}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Matches the mathematical digest computed over the registered
                    case identifier, status, and judgment timestamp.
                  </p>
                </div>

                {/* Primary Docket Particulars */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border/60 pt-4">
                  <div className="space-y-3">
                    <div>
                      <span className="text-[11px] text-muted-foreground block font-mono uppercase">
                        Defendant Legal Name
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {record.defendantName}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block font-mono uppercase">
                        Statutory Charge / Offense
                      </span>
                      <span className="text-xs font-medium text-foreground">
                        {record.crimeType}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block font-mono uppercase">
                        Location of Alleged Offense
                      </span>
                      <span className="text-xs text-foreground">
                        {record.crimeLocation}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-[11px] text-muted-foreground block font-mono uppercase">
                        Presiding Judicial Officer
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        Hon. {record.judgeName}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block font-mono uppercase">
                        Trial Commencement Date
                      </span>
                      <span className="text-xs text-foreground font-mono">
                        {format(new Date(record.trialStartDate), "dd MMMM yyyy")}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block font-mono uppercase">
                        Final Judgment Determination Date
                      </span>
                      <span className="text-xs text-foreground font-mono">
                        {record.judgmentDate
                          ? format(new Date(record.judgmentDate), "dd MMMM yyyy")
                          : "Pending Final Adjudication"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Final Judgment Order Summary (if disposed) */}
                {record.judgmentSummary && (
                  <div className="border-t border-border/60 pt-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-foreground font-semibold text-xs font-mono uppercase">
                      <FileCheck2 className="size-4 text-accent" />
                      <span>Certified Judicial Decision &amp; Order Summary</span>
                    </div>
                    <div className="bg-muted/20 border border-border/70 rounded-sm p-3.5 text-xs text-foreground leading-relaxed whitespace-pre-wrap font-sans">
                      {record.judgmentSummary}
                    </div>
                  </div>
                )}

                {/* Statutory Certification Seal Block */}
                <div className="border-t border-border/60 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-muted-foreground text-[11px]">
                  <div className="space-y-0.5 text-center sm:text-left">
                    <p className="font-semibold text-foreground uppercase tracking-wide">
                      Registry Electronic Attestation
                    </p>
                    <p>
                      Issued under statutory authority of the Registrar of Courts.
                      Valid for presentation to public authorities, banking
                      institutions, and law enforcement.
                    </p>
                  </div>
                  <div className="text-center sm:text-right shrink-0 font-mono text-[10px] border border-border px-3 py-1.5 rounded-sm bg-muted/30">
                    DIGITALLY SEALED
                    <br />
                    CENTRAL JUDICIARY
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Global Footer */}
        <footer className="text-center text-xs text-muted-foreground pt-4 pb-8 space-y-1 print:pt-2 print:pb-0">
          <p>
            &copy; {new Date().getFullYear()} Judiciary Information System. All
            rights reserved.
          </p>
          <p className="text-[11px]">
            Statutory Court Record Archive &bull; Unaltered Electronic Extraction
          </p>
        </footer>
      </div>
    </div>
  );
}
