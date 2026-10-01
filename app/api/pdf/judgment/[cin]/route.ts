import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateJudgmentDecreePdf,
  type CaseWithJudgmentAndPersonnel,
} from "@/lib/pdf/judgment-decree";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ cin: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { cin } = await params;
    if (!cin) {
      return NextResponse.json(
        { error: "Case Identification Number (CIN) is required." },
        { status: 400 }
      );
    }

    const caseData = await prisma.case.findUnique({
      where: { cin: cin.trim() },
      include: {
        judge: true,
        prosecutor: true,
        lawyer: true,
        judgment: true,
      },
    });

    if (!caseData) {
      return NextResponse.json(
        { error: `Case docket '${cin}' not found in official registry.` },
        { status: 404 }
      );
    }

    if (!caseData.judgment) {
      return NextResponse.json(
        {
          error: `Case docket '${cin}' is pending trial or sub judice; no judgment decree has been entered.`,
        },
        { status: 400 }
      );
    }

    const baseUrl = request.nextUrl.origin;
    const pdfBuffer = await generateJudgmentDecreePdf({
      caseData: caseData as CaseWithJudgmentAndPersonnel,
      baseUrl,
    });

    const filename = `JIS-Judgment-Decree-${caseData.cin}.pdf`;

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Error generating Judgment Decree PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate certified Judgment Decree PDF." },
      { status: 500 }
    );
  }
}
