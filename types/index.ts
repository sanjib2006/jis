export type {
  Role,
  CaseStatus,
  HearingStatus,
  User,
  Courtroom,
  Case,
  Hearing,
  Judgment,
  CaseView,
  AuditLog,
  Prisma,
} from "@prisma/client";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: "REGISTRAR" | "JUDGE" | "LAWYER";
  isActive: boolean;
  createdAt: Date;
}
