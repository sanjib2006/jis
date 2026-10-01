"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  QrCode,
  Copy,
  Check,
  ExternalLink,
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
        width: 160,
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

      <DialogContent className="sm:max-w-md border border-border bg-card">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <Image
              src="/emblem.ico"
              alt="JIS Emblem"
              width={18}
              height={18}
              unoptimized
              className="size-4.5 object-contain shrink-0"
            />
            <DialogTitle className="text-sm font-semibold tracking-tight">
              Statutory Docket Authenticator
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Official public verification stamp for Court Docket{" "}
            <span className="font-mono font-medium text-foreground">{cin}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3.5">
          {/* QR Code Container */}
          <div className="p-2.5 bg-white rounded-sm border border-border shadow-2xs flex items-center justify-center">
            {svgMarkup ? (
              <div
                className="w-40 h-40 flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: svgMarkup }}
              />
            ) : (
              <div className="w-40 h-40 flex items-center justify-center text-xs text-muted-foreground animate-pulse font-mono">
                Generating QR...
              </div>
            )}
          </div>

          {/* Docket Info Box */}
          <div className="w-full bg-muted/40 border border-border/70 rounded-sm p-2.5 text-xs space-y-1.5 font-sans">
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
            Scan with any mobile camera to view the authentic court decree on the
            public registry.
          </p>

          {/* Action Buttons */}
          <div className="w-full space-y-2 pt-0.5">
            {verifyUrl && (
              <a
                href={verifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "w-full h-8 text-xs font-medium rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-1.5 shadow-none"
                )}
              >
                <ExternalLink className="size-3.5" />
                <span>Open Public Verification Page</span>
              </a>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="h-8 text-xs rounded-sm gap-1.5 border-border bg-background hover:bg-muted text-foreground font-medium"
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
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-8 text-xs rounded-sm gap-1.5 border-border bg-background hover:bg-muted text-foreground font-medium flex items-center justify-center"
                  )}
                >
                  <Download className="size-3.5 text-muted-foreground" />
                  <span>Save QR Image</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
