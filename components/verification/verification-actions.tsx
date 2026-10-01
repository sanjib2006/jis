"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Copy, Check } from "lucide-react";

export function PrintVerificationButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.print()}
      className="h-8 text-xs gap-1.5 rounded-sm border-border text-foreground hover:bg-muted font-medium print:hidden"
    >
      <Printer className="size-3.5 text-muted-foreground" />
      <span>Print Certificate</span>
    </Button>
  );
}

export function CopyHashButton({ hash }: { hash: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = hash;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      title="Copy Cryptographic SHA-256 Hash"
      className="size-6 text-muted-foreground hover:text-foreground print:hidden"
    >
      {copied ? (
        <Check className="size-3 text-emerald-600" />
      ) : (
        <Copy className="size-3" />
      )}
    </Button>
  );
}
