import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import { format } from "date-fns";
import type { Hearing, Courtroom, Case, User } from "@/types";

export type CauseListHearing = Hearing & {
  case: Case & {
    judge: User;
    prosecutor: User;
    lawyer: User;
  };
  courtroom: Courtroom | null;
};

export interface GenerateCauseListOptions {
  date: Date;
  hearings: CauseListHearing[];
  baseUrl: string;
}

/**
 * Generates an official, publication-ready Daily Cause List PDF for court chamber sittings.
 * Incorporates statutory court headers, structured timetable rows, running page numbers,
 * and a master QR code linking directly to the live court registry.
 */
export async function generateCauseListPdf({
  date,
  hearings,
  baseUrl,
}: GenerateCauseListOptions): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const formattedDate = format(date, "EEEE, dd MMMM yyyy");
  const isoDate = format(date, "yyyy-MM-dd");
  const causeListUrl = `${baseUrl}/registrar/cases/by-hearing?date=${isoDate}`;

  // 1. Generate master QR code in memory
  let qrDataUrl = "";
  try {
    qrDataUrl = await QRCode.toDataURL(causeListUrl, {
      margin: 1,
      width: 160,
      color: {
        dark: "#142127",
        light: "#ffffff",
      },
    });
  } catch (err) {
    console.error("Failed to generate Cause List QR code:", err);
  }

  // 2. Official Court Registry Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(20, 33, 39); // Slate-navy charcoal
  doc.text("JUDICIARY INFORMATION SYSTEM", 105, 16, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "HIGH COURT OF JUDICATURE • CENTRAL DOCKET REGISTRY",
    105,
    21,
    { align: "center" }
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(20, 33, 39);
  doc.text("DAILY CAUSE LIST OF CHAMBER SITTINGS & PROCEEDINGS", 105, 27, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Sitting Date: ${formattedDate} | Official Gazette Form JIS-CL-01`, 105, 32, {
    align: "center",
  });

  // Top header rule
  doc.setDrawColor(20, 33, 39);
  doc.setLineWidth(0.4);
  doc.line(14, 35, 196, 35);

  // 3. Metadata Strip & Embedded Master QR Stamp
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 33, 39);
  doc.text("REGISTRY NOTICE & SITUATION BRIEF:", 14, 41);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Total Scheduled Matters: ${hearings.length} | Published: ${format(
      new Date(),
      "dd MMM yyyy, HH:mm"
    )} UTC`,
    14,
    46
  );
  doc.text(
    "All legal practitioners and litigants must report to their respective chambers 15 minutes prior to sitting.",
    14,
    50
  );

  // Master QR Stamp
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, "PNG", 172, 38, 22, 22);
    doc.setFontSize(5.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("SCAN FOR LIVE DOCKET", 183, 62, { align: "center" });
  }

  // Divider before table
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.line(14, 64, 196, 64);

  // 4. Cause List Timetable
  const tableRows = hearings.map((h, index) => {
    const timeStr = format(new Date(h.hearingDate), "hh:mm a");
    const parties = `State vs. ${h.case.defendantName}\nPros: ${h.case.prosecutor.name}\nDef: ${h.case.lawyer.name}`;
    const courtroomStr = h.courtroom
      ? `${h.courtroom.name}\n(${h.courtroom.location || "Main Bldg"})`
      : "Unassigned";
    const judgeStr = `Hon. ${h.case.judge.name}`;

    return [
      String(index + 1),
      timeStr,
      h.case.cin,
      parties,
      h.case.crimeType,
      `${courtroomStr}\n${judgeStr}`,
      h.hearingStatus,
    ];
  });

  if (tableRows.length === 0) {
    tableRows.push([
      "-",
      "-",
      "NONE",
      "No judicial chamber proceedings or trials scheduled for this date.",
      "-",
      "-",
      "-",
    ]);
  }

  autoTable(doc, {
    startY: 67,
    head: [
      [
        "Item #",
        "Time",
        "Case CIN",
        "Parties & Counsel",
        "Offense Category",
        "Courtroom & Bench",
        "Status",
      ],
    ],
    body: tableRows,
    theme: "grid",
    headStyles: {
      fillColor: [20, 33, 39], // Slate-navy charcoal
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "center",
      valign: "middle",
      minCellHeight: 8,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
      cellPadding: 2,
      valign: "middle",
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: "center", fontStyle: "bold" },
      1: { cellWidth: 16, halign: "center", fontStyle: "bold" },
      2: { cellWidth: 26, halign: "center", fontStyle: "bold" },
      3: { cellWidth: 46 },
      4: { cellWidth: 32 },
      5: { cellWidth: 32 },
      6: { cellWidth: 18, halign: "center", fontStyle: "bold" },
    },
    margin: { left: 14, right: 14, bottom: 18 },
    didDrawPage: (data) => {
      // Running Page Footers
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height || pageSize.getHeight();
      const pageWidth = pageSize.width || pageSize.getWidth();

      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);

      doc.text(
        "Certified by the Office of the Registrar of Courts • Central Electronic Archive",
        14,
        pageHeight - 8
      );
      doc.text(
        `Page ${data.pageNumber}`,
        pageWidth - 14,
        pageHeight - 8,
        { align: "right" }
      );
    },
  });

  return Buffer.from(doc.output("arraybuffer"));
}
