import { prisma } from "@/lib/prisma";
import type { CaseStatus } from "@/types";
import crypto from "crypto";

export interface PublicVerificationRecord {
  cin: string;
  defendantName: string;
  crimeType: string;
  crimeLocation: string;
  status: CaseStatus;
  trialStartDate: Date;
  judgeName: string;
  judgmentDate: Date | null;
  judgmentSummary: string | null;
  isDisposed: boolean;
  verificationHash: string;
  verifiedAt: Date;
}

/**
 * Computes a deterministic SHA-256 integrity hash for case verification.
 * Guarantees that paper certificates or QR codes can be mathematically validated.
 */
export function computeVerificationHash(
  cin: string,
  status: string,
  judgmentDate: Date | null | undefined
): string {
  const payload = `${cin}:${status}:${
    judgmentDate ? new Date(judgmentDate).toISOString() : "UNDISPOSED"
  }`;
  return crypto.createHash("sha256").update(payload).digest("hex");
}

/**
 * Fetches sanitized public verification data for a court case by its CIN.
 * Strictly adheres to privacy policies:
 * - Excludes lawyer billing, view counts, internal audit logs, and personnel contact details.
 * - Supports both active/sub-judice dockets and disposed judgments.
 */
export async function getPublicCaseVerification(
  cin: string
): Promise<PublicVerificationRecord | null> {
  if (!cin || typeof cin !== "string") {
    return null;
  }

  const normalizedCin = cin.trim();

  const caseRecord = await prisma.case.findUnique({
    where: { cin: normalizedCin },
    select: {
      cin: true,
      defendantName: true,
      crimeType: true,
      crimeLocation: true,
      status: true,
      trialStartDate: true,
      judge: {
        select: {
          name: true,
        },
      },
      judgment: {
        select: {
          judgmentDate: true,
          summary: true,
        },
      },
    },
  });

  if (!caseRecord) {
    return null;
  }

  const isDisposed =
    caseRecord.status === "RESOLVED" ||
    caseRecord.status === "CLOSED" ||
    !!caseRecord.judgment;

  const judgmentDate = caseRecord.judgment?.judgmentDate ?? null;
  const judgmentSummary = isDisposed
    ? caseRecord.judgment?.summary ?? null
    : null;

  const verificationHash = computeVerificationHash(
    caseRecord.cin,
    caseRecord.status,
    judgmentDate
  );

  return {
    cin: caseRecord.cin,
    defendantName: caseRecord.defendantName,
    crimeType: caseRecord.crimeType,
    crimeLocation: caseRecord.crimeLocation,
    status: caseRecord.status,
    trialStartDate: caseRecord.trialStartDate,
    judgeName: caseRecord.judge.name,
    judgmentDate,
    judgmentSummary,
    isDisposed,
    verificationHash,
    verifiedAt: new Date(),
  };
}
