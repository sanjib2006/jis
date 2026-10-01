"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  QrCode,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Download,
} from "lucide-react";

interface QrVerificationDialogProps {
  cin: string;
  defendantName: string;
  caseStatus: string;
  trigger?: React.ReactNode;
}

export function QrVerificationDialog({
  cin,
  defendantName,
  caseStatus,
  trigger,
}: QrVerificationDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [svgMarkup, setSvgMarkup] = useState<string>("");
  const [pngDataUrl, setPngDataUrl] = useState<string>("");
  const [verifyUrl, setVerifyUrl] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/verify/${encodeURIComponent(cin)}`;
      setVerifyUrl(url);

      // Generate vector SVG for crisp on-screen rendering
      QRCode.toString(url, {
        type: "svg",
        margin: 1,
        width: 200,
        color: {
          dark: "#0f172a", // Slate-navy charcoal
          light: "#ffffff",
        },
      })
        .then((svg) => setSvgMarkup(svg))
        .catch((err) => console.error("Error generating SVG QR code:", err));

      // Generate PNG data URL for direct file download
      QRCode.toDataURL(url, {
        margin: 2,
        width: 400,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      })
        .then((dataUri) => setPngDataUrl(dataUri))
        .catch((err) => console.error("Error generating PNG QR code:", err));
    }
  }, [cin]);

  const handleCopyLink = async () => {
    if (!verifyUrl) return;
    try {
      await navigator.clipboard.writeText(verifyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is restricted
      const textarea = document.createElement("textarea");
      textarea.value = verifyUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger className="cursor-pointer inline-flex">
          {trigger}
        </DialogTrigger>
      ) : (
        <DialogTrigger className="inline-flex items-center justify-center gap-1.5 text-xs font-medium h-7 px-2.5 rounded-sm border border-border text-foreground hover:bg-muted transition-colors cursor-pointer">
          <QrCode className="size-3.5 text-muted-foreground" />
          <span>Verify &amp; QR</span>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-md rounded-sm border border-border p-5 bg-card">
        <DialogHeader className="pb-3 border-b border-border/70 space-y-1">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <ShieldCheck className="size-4 text-accent" />
            <DialogTitle className="text-sm font-semibold tracking-tight">
              Statutory Docket Authenticator
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Official public verification stamp for Court Docket{" "}
            <span className="font-mono font-medium text-foreground">{cin}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 flex flex-col items-center gap-4">
          {/* QR Code Container */}
          <div className="p-3 bg-white rounded-sm border border-border/80 shadow-xs flex items-center justify-center">
            {svgMarkup ? (
              <div
                className="w-48 h-48 flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: svgMarkup }}
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-xs text-muted-foreground animate-pulse font-mono">
                Generating QR...
              </div>
            )}
          </div>

          {/* Docket Info Box */}
          <div className="w-full bg-muted/40 border border-border/60 rounded-sm p-2.5 text-xs space-y-1.5 font-sans">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground font-mono uppercase">
                Case Identification:
              </span>
              <span className="font-mono font-semibold text-foreground">
                {cin}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground font-mono uppercase">
                Defendant:
              </span>
              <span className="font-medium text-foreground truncate max-w-[200px]">
                {defendantName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground font-mono uppercase">
                Status:
              </span>
              <span className="font-mono text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-xs border border-border bg-background">
                {caseStatus}
              </span>
            </div>
          </div>

          {/* Explanatory Notice */}
          <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
            Anyone scanning this QR code with a phone camera or barcode reader
            is immediately directed to the unauthenticated public verification
            registry to review the official court order and tamper-evident hash.
          </p>

          {/* Action Buttons */}
          <div className="w-full grid grid-cols-2 gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="text-xs h-8 rounded-sm gap-1.5 border-border"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-emerald-600" />
                  <span>Link Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5 text-muted-foreground" />
                  <span>Copy Link</span>
                </>
              )}
            </Button>

            {pngDataUrl && (
              <a
                href={pngDataUrl}
                download={`JIS-VERIFY-${cin}.png`}
                className="inline-flex items-center justify-center text-xs h-8 rounded-sm gap-1.5 border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 font-medium transition-colors"
              >
                <Download className="size-3.5 text-muted-foreground" />
                <span>Save QR Image</span>
              </a>
            )}
          </div>

          {/* Direct External Link */}
          {verifyUrl && (
            <a
              href={verifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-accent hover:underline flex items-center gap-1 font-medium pt-0.5"
            >
              <span>Open Public Verification Page</span>
              <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
