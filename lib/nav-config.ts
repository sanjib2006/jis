import {
  LayoutDashboard,
  FileText,
  Calendar,
  Building2,
  Users,
  ShieldAlert,
  History,
  CreditCard,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const REGISTRAR_NAV: NavItem[] = [
  {
    label: "Dashboard",
    href: "/registrar",
    icon: LayoutDashboard,
  },
  {
    label: "Case Docket",
    href: "/registrar/cases",
    icon: FileText,
  },
  {
    label: "Hearings",
    href: "/registrar/hearings",
    icon: Calendar,
  },
  {
    label: "Courtrooms",
    href: "/registrar/courtrooms",
    icon: Building2,
  },
  {
    label: "User Accounts",
    href: "/registrar/accounts",
    icon: Users,
  },
  {
    label: "Audit Log",
    href: "/registrar/audit",
    icon: ShieldAlert,
  },
];

export const JUDGE_NAV: NavItem[] = [
  {
    label: "Judicial Archive",
    href: "/judge",
    icon: History,
  },
];

export const LAWYER_NAV: NavItem[] = [
  {
    label: "Case Law Search",
    href: "/lawyer",
    icon: History,
  },
  {
    label: "Billing Statements",
    href: "/lawyer/billing",
    icon: CreditCard,
  },
];

export const ROLE_NAV_MAP = {
  REGISTRAR: REGISTRAR_NAV,
  JUDGE: JUDGE_NAV,
  LAWYER: LAWYER_NAV,
} as const;
