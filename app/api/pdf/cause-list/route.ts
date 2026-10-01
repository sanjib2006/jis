import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateCauseListPdf, type CauseListHearing } from "@/lib/pdf/cause-list";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    const targetDate = dateParam ? new Date(dateParam) : new Date();
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid calendar date specified." },
        { status: 400 }
      );
    }

    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);

    const hearings = await prisma.hearing.findMany({
      where: {
        hearingDate: { gte: start, lte: end },
      },
      include: {
        case: {
          include: {
            judge: true,
            prosecutor: true,
            lawyer: true,
          },
        },
        courtroom: true,
      },
      orderBy: { hearingDate: "asc" },
    });

    const baseUrl = request.nextUrl.origin;
    const pdfBuffer = await generateCauseListPdf({
      date: targetDate,
      hearings: hearings as CauseListHearing[],
      baseUrl,
    });

    const filename = `JIS-CauseList-${format(targetDate, "yyyy-MM-dd")}.pdf`;

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Error generating Cause List PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate official Cause List PDF." },
      { status: 500 }
    );
  }
}
