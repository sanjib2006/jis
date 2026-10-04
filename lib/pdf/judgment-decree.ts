import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { format } from "date-fns";
import { computeVerificationHash } from "@/lib/verification";
import type { Case, User, Judgment } from "@/types";

export type CaseWithJudgmentAndPersonnel = Case & {
  judge: User;
  prosecutor: User;
  lawyer: User;
  judgment: Judgment;
};

export interface GenerateJudgmentDecreeOptions {
  caseData: CaseWithJudgmentAndPersonnel;
  baseUrl: string;
}

/**
 * Generates an official Certified Judgment Decree PDF with statutory judicial styling,
 * verbatim legal findings, cryptographic SHA-256 integrity seal, and an embedded
 * tamper-evident QR code linking directly to the public verification registry.
 */
export async function generateJudgmentDecreePdf({
  caseData,
  baseUrl,
}: GenerateJudgmentDecreeOptions): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  const verifyUrl = `${baseUrl}/verify/${encodeURIComponent(caseData.cin)}`;

  // 1. Generate high-resolution QR code
  let qrDataUrl = "";
  try {
    qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 220,
      color: {
        dark: "#142127",
        light: "#ffffff",
      },
    });
  } catch (err) {
    console.error("Failed to generate Judgment QR code:", err);
  }

  // Cryptographic integrity seal
  const verificationHash = computeVerificationHash(
    caseData.cin,
    caseData.status,
    caseData.judgment.judgmentDate
  );

  // Helper function to draw formal legal border on a page
  const drawPageBorder = () => {
    // Outer border
    doc.setDrawColor(20, 33, 39);
    doc.setLineWidth(0.5);
    doc.rect(10, 10, 190, 277);

    // Inner border
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.15);
    doc.rect(11.5, 11.5, 187, 274);
  };

  drawPageBorder();

  // 2. Official Court Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(20, 33, 39);
  doc.text("IN THE HIGH COURT OF JUDICATURE", 105, 20, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text("CENTRAL SESSIONS & JUDICIAL ADJUDICATION DIVISION", 105, 25, {
    align: "center",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 33, 39);
  doc.text("OFFICIAL JUDGMENT DECREE & OPERATIVE ORDER", 105, 31, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("STATUTORY DECREE ROLL • FORM JIS-DEC-01", 105, 36, {
    align: "center",
  });

  // Header separator
  doc.setDrawColor(20, 33, 39);
  doc.setLineWidth(0.35);
  doc.line(16, 39, 194, 39);

  // 3. Two-Column Docket Metadata & Embedded QR Stamp
  const startY = 44;

  // Left Column: Docket Particulars (135mm width)
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("CASE IDENTIFICATION (CIN):", 16, startY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(20, 33, 39);
  doc.text(caseData.cin, 65, startY);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("PROSECUTION / STATE:", 16, startY + 6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(20, 33, 39);
  doc.text(`Adv. ${caseData.prosecutor.name}`, 65, startY + 6);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("DEFENDANT (ACCUSED):", 16, startY + 12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 33, 39);
  const defDocLabel = caseData.idDocType && caseData.idDocNumber
    ? `${caseData.defendantName} [${caseData.idDocType}: ${caseData.idDocNumber}]`
    : caseData.defendantName;
  doc.text(defDocLabel, 65, startY + 12);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("DEFENSE COUNSEL:", 16, startY + 18);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(20, 33, 39);
  doc.text(`Adv. ${caseData.lawyer.name}`, 65, startY + 18);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("STATUTORY OFFENSE:", 16, startY + 24);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(20, 33, 39);
  doc.text(caseData.crimeType, 65, startY + 24);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("LOCATION OF OFFENSE:", 16, startY + 30);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(20, 33, 39);
  doc.text(caseData.crimeLocation, 65, startY + 30);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("PRESIDING JUDGE:", 16, startY + 36);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 33, 39);
  doc.text(`Hon. ${caseData.judge.name}`, 65, startY + 36);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("FINAL JUDGMENT DATE:", 16, startY + 42);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 33, 39);
  doc.text(
    format(new Date(caseData.judgment.judgmentDate), "dd MMMM yyyy"),
    65,
    startY + 42
  );

  // Right Column: Dynamic Verification QR Code (26mm x 26mm)
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, "PNG", 163, startY - 2, 26, 26);
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 33, 39);
    doc.text("SCAN TO VERIFY", 176, startY + 28, { align: "center" });
    doc.setFontSize(5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Central Judicial Seal", 176, startY + 31.5, { align: "center" });
  }

  // Divider before findings
  const findingsStartY = startY + 47;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.line(16, findingsStartY, 194, findingsStartY);

  // 4. Operative Findings & Order Summary
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 33, 39);
  doc.text(
    "OPERATIVE FINDINGS, REASONING & FINAL JUDICIAL DETERMINATION:",
    16,
    findingsStartY + 7
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  const splitSummary = doc.splitTextToSize(
    caseData.judgment.summary,
    contentWidth - 6
  );

  let currentY = findingsStartY + 14;
  const lineHeight = 4.6;

  for (let i = 0; i < splitSummary.length; i++) {
    // Check if we need to advance to a new page
    if (currentY > pageHeight - 65) {
      doc.addPage();
      drawPageBorder();

      // Top continuation notice
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Case #{${caseData.cin}} — Official Judgment Decree (Continued)`,
        16,
        18
      );
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.line(16, 21, 194, 21);

      currentY = 27;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
    }

    doc.text(splitSummary[i], 16, currentY);
    currentY += lineHeight;
  }

  // 5. Attestation & Electronic Seal Box (pinned to bottom of page)
  const attestationY = Math.max(currentY + 6, pageHeight - 56);

  // Attestation divider
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.line(16, attestationY, 194, attestationY);

  // SHA-256 Cryptographic Hash
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("REGISTRY CRYPTOGRAPHIC SHA-256 INTEGRITY DIGEST:", 16, attestationY + 5);

  doc.setFont("courier", "normal");
  doc.setFontSize(7);
  doc.setTextColor(20, 33, 39);
  doc.text(verificationHash, 16, attestationY + 9.5);

  // Statutory Certification Text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  const certNotice =
    `Certified extract of the electronic judicial decree pronounced by Hon. ${caseData.judge.name}. ` +
    `Digitally authenticated pursuant to statutory court rules and entered into the Central Judicial Register. ` +
    `Valid for official presentation without physical wet ink signature.`;
  const splitNotice = doc.splitTextToSize(certNotice, 135);
  doc.text(splitNotice, 16, attestationY + 14);

  // Official Court Seal Stamp Box (Right side)
  doc.setDrawColor(20, 33, 39);
  doc.setLineWidth(0.3);
  doc.rect(156, attestationY + 4, 38, 20);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(20, 33, 39);
  doc.text("REGISTRAR OF COURTS", 175, attestationY + 9, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text("CENTRAL JUDICIAL REGISTRY", 175, attestationY + 13, {
    align: "center",
  });
  doc.text("DIGITALLY SEALED", 175, attestationY + 17, { align: "center" });
  doc.text(
    format(new Date(), "dd-MMM-yyyy"),
    175,
    attestationY + 21,
    { align: "center" }
  );

  // Running page numbers on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Page ${p} of ${totalPages} • Judiciary Information System`,
      105,
      pageHeight - 6,
      { align: "center" }
    );
  }

  return Buffer.from(doc.output("arraybuffer"));
}
