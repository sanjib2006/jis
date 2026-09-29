import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function daysAhead(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  console.log("Starting comprehensive JIS database seed...");

  // 1. Seed Key Judicial Personnel in Prisma
  const defaultUsers = [
    {
      name: "Chief Judicial Registrar",
      email: "registrar@jis.local",
      role: "REGISTRAR" as const,
      password: process.env.INITIAL_REGISTRAR_PASSWORD || "Registrar@123456",
    },
    {
      name: "Hon. Justice V. K. Sen",
      email: "judge@jis.local",
      role: "JUDGE" as const,
      password: process.env.INITIAL_JUDGE_PASSWORD || "Judge@123456",
    },
    {
      name: "Hon. Justice Priya Sharma",
      email: "judge2@jis.local",
      role: "JUDGE" as const,
      password: process.env.INITIAL_JUDGE_PASSWORD || "Judge@123456",
    },
    {
      name: "Adv. Rajesh Raman",
      email: "lawyer@jis.local",
      role: "LAWYER" as const,
      password: process.env.INITIAL_LAWYER_PASSWORD || "Lawyer@123456",
    },
    {
      name: "Adv. Vikram Malhotra",
      email: "prosecutor@jis.local",
      role: "LAWYER" as const,
      password: process.env.INITIAL_LAWYER_PASSWORD || "Lawyer@123456",
    },
  ];

  const userMap: Record<string, string> = {};

  for (const u of defaultUsers) {
    const record = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, isActive: true },
      create: {
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: true,
      },
    });
    userMap[u.email] = record.id;
    console.log(`Prisma User record ensured for: ${u.email} (Role: ${u.role})`);
  }

  // 2. Seed Courtrooms
  const defaultCourtrooms = [
    { name: "Courtroom 101 - High Bench", location: "Block A, 1st Floor", maxSlots: 5 },
    { name: "Courtroom 102 - Civil Division", location: "Block A, 1st Floor", maxSlots: 6 },
    { name: "Courtroom 201 - Criminal Bench", location: "Block B, 2nd Floor", maxSlots: 4 },
  ];

  const courtroomMap: Record<string, string> = {};

  for (const cr of defaultCourtrooms) {
    const record = await prisma.courtroom.upsert({
      where: { name: cr.name },
      update: { location: cr.location, maxSlots: cr.maxSlots, isActive: true },
      create: cr,
    });
    courtroomMap[cr.name] = record.id;
  }
  console.log("Default courtrooms seeded.");

  // 3. Register Realistic Cases
  const casesData = [
    {
      cin: "CIN-2026-001",
      defendantName: "Alok Verma",
      defendantAddress: "42 Park Street, Flat 4B, South Zone",
      crimeType: "IPC Sec 420 & 406 (Corporate Fraud & Breach of Trust)",
      crimeLocation: "Financial District Commercial Tower",
      arrestingOfficer: "Insp. Devendra Joshi, Crime Branch",
      crimeDate: daysAgo(30),
      arrestDate: daysAgo(20),
      trialStartDate: daysAhead(5),
      expectedCompletionDate: daysAhead(90),
      status: "REGISTERED" as const,
      judgeId: userMap["judge@jis.local"],
      prosecutorId: userMap["prosecutor@jis.local"],
      lawyerId: userMap["lawyer@jis.local"],
    },
    {
      cin: "CIN-2026-002",
      defendantName: "Sunita Mehta",
      defendantAddress: "12 Railway Colony Road, Sector 3",
      crimeType: "IPC Sec 379 & 411 (Theft & Concealment of Stolen Assets)",
      crimeLocation: "Central Railway Yard Warehouse 9",
      arrestingOfficer: "SI Anand Kulkarni, RPF",
      crimeDate: daysAgo(45),
      arrestDate: daysAgo(35),
      trialStartDate: daysAgo(15),
      expectedCompletionDate: daysAhead(60),
      status: "PENDING" as const,
      judgeId: userMap["judge@jis.local"],
      prosecutorId: userMap["prosecutor@jis.local"],
      lawyerId: userMap["lawyer@jis.local"],
    },
    {
      cin: "CIN-2026-003",
      defendantName: "Deepak Rao",
      defendantAddress: "78 Shanti Nagar, Lane 5, East District",
      crimeType: "IPC Sec 307 & 326 (Attempted Culpable Homicide & Grievous Hurt)",
      crimeLocation: "National Highway 48 Toll Plaza",
      arrestingOfficer: "Insp. Rakesh Sawant, City Police",
      crimeDate: daysAgo(60),
      arrestDate: daysAgo(50),
      trialStartDate: daysAgo(25),
      expectedCompletionDate: daysAhead(120),
      status: "PENDING" as const,
      judgeId: userMap["judge2@jis.local"],
      prosecutorId: userMap["prosecutor@jis.local"],
      lawyerId: userMap["lawyer@jis.local"],
    },
    {
      cin: "CIN-2026-004",
      defendantName: "Sanjay Grover",
      defendantAddress: "105 Crystal Plaza, Ring Road",
      crimeType: "NI Act Sec 138 (Cheque Dishonour for Insufficient Funds)",
      crimeLocation: "Apex Mercantile Bank, Main Branch",
      arrestingOfficer: "SI Kavita Shinde, Economic Offences Wing",
      crimeDate: daysAgo(90),
      arrestDate: daysAgo(70),
      trialStartDate: daysAgo(40),
      expectedCompletionDate: daysAhead(45),
      status: "ADJOURNED" as const,
      judgeId: userMap["judge@jis.local"],
      prosecutorId: userMap["prosecutor@jis.local"],
      lawyerId: userMap["lawyer@jis.local"],
    },
    {
      cin: "CIN-2026-005",
      defendantName: "Arvind Swaminathan",
      defendantAddress: "B-201 Green Meadows, Old Cantonment",
      crimeType: "IPC Sec 409 (Criminal Breach of Trust by Public Servant)",
      crimeLocation: "Municipal Treasury Office",
      arrestingOfficer: "DSP Pradeep Nair, Anti-Corruption Bureau",
      crimeDate: daysAgo(120),
      arrestDate: daysAgo(100),
      trialStartDate: daysAgo(50),
      expectedCompletionDate: daysAhead(80),
      status: "ADJOURNED" as const,
      judgeId: userMap["judge2@jis.local"],
      prosecutorId: userMap["prosecutor@jis.local"],
      lawyerId: userMap["lawyer@jis.local"],
    },
    {
      cin: "CIN-2026-006",
      defendantName: "Ramesh Patel",
      defendantAddress: "23 GIDC Industrial Area, Phase 2",
      crimeType: "IPC Sec 279 & 337 (Rash Driving & Endangering Personal Safety)",
      crimeLocation: "Eastern Express Highway, Km 14",
      arrestingOfficer: "SI Suresh Gaikwad, Traffic Division",
      crimeDate: daysAgo(75),
      arrestDate: daysAgo(70),
      trialStartDate: daysAgo(30),
      expectedCompletionDate: daysAgo(5),
      status: "RESOLVED" as const,
      judgeId: userMap["judge@jis.local"],
      prosecutorId: userMap["prosecutor@jis.local"],
      lawyerId: userMap["lawyer@jis.local"],
    },
    {
      cin: "CIN-2026-007",
      defendantName: "Vikram Singhania",
      defendantAddress: "14 Altamount Heights, High Court Marg",
      crimeType: "IPC Sec 120B & 468 (Forgery for Purpose of Cheating & Conspiracy)",
      crimeLocation: "Sub-Registrar Office of Land Records",
      arrestingOfficer: "Insp. Devendra Joshi, Crime Branch",
      crimeDate: daysAgo(150),
      arrestDate: daysAgo(130),
      trialStartDate: daysAgo(90),
      expectedCompletionDate: daysAgo(12),
      status: "CLOSED" as const,
      judgeId: userMap["judge@jis.local"],
      prosecutorId: userMap["prosecutor@jis.local"],
      lawyerId: userMap["lawyer@jis.local"],
    },
    {
      cin: "CIN-2026-008",
      defendantName: "Meera Deshmukh",
      defendantAddress: "602 Silicon Residency, Electronic City",
      crimeType: "IT Act Sec 66C & 66D (Identity Theft & Computer Resource Impersonation)",
      crimeLocation: "Infotech Cyber Park, Server Room B",
      arrestingOfficer: "Insp. Neha Saxena, Cyber Crime Cell",
      crimeDate: daysAgo(140),
      arrestDate: daysAgo(120),
      trialStartDate: daysAgo(80),
      expectedCompletionDate: daysAgo(18),
      status: "CLOSED" as const,
      judgeId: userMap["judge2@jis.local"],
      prosecutorId: userMap["prosecutor@jis.local"],
      lawyerId: userMap["lawyer@jis.local"],
    },
    {
      cin: "CIN-2026-009",
      defendantName: "Karan Oberoi",
      defendantAddress: "88 Marine Drive, Sea Face Towers",
      crimeType: "IPC Sec 384 & 506 (Extortion & Criminal Intimidation)",
      crimeLocation: "Regal Hotel Banquet Hall, Colaba",
      arrestingOfficer: "ACP Ashok Kamble, Anti-Extortion Squad",
      crimeDate: daysAgo(180),
      arrestDate: daysAgo(160),
      trialStartDate: daysAgo(110),
      expectedCompletionDate: daysAgo(45),
      status: "CLOSED" as const,
      judgeId: userMap["judge@jis.local"],
      prosecutorId: userMap["prosecutor@jis.local"],
      lawyerId: userMap["lawyer@jis.local"],
    },
    {
      cin: "CIN-2026-010",
      defendantName: "Harish Chawla",
      defendantAddress: "54 Grain Market, Old Bazaar",
      crimeType: "IPC Sec 471 (Fraudulent Use of Forged Tax Invoices as Genuine)",
      crimeLocation: "Commercial Tax Assessment Office",
      arrestingOfficer: "SI Anand Kulkarni, State Tax Enforcement",
      crimeDate: daysAgo(210),
      arrestDate: daysAgo(190),
      trialStartDate: daysAgo(140),
      expectedCompletionDate: daysAgo(70),
      status: "CLOSED" as const,
      judgeId: userMap["judge2@jis.local"],
      prosecutorId: userMap["prosecutor@jis.local"],
      lawyerId: userMap["lawyer@jis.local"],
    },
  ];

  for (const c of casesData) {
    await prisma.case.upsert({
      where: { cin: c.cin },
      update: {
        defendantName: c.defendantName,
        defendantAddress: c.defendantAddress,
        crimeType: c.crimeType,
        crimeLocation: c.crimeLocation,
        arrestingOfficer: c.arrestingOfficer,
        crimeDate: c.crimeDate,
        arrestDate: c.arrestDate,
        trialStartDate: c.trialStartDate,
        expectedCompletionDate: c.expectedCompletionDate,
        status: c.status,
        judgeId: c.judgeId,
        prosecutorId: c.prosecutorId,
        lawyerId: c.lawyerId,
      },
      create: c,
    });
  }
  console.log("10 Case records seeded across diverse statuses.");

  // 4. Seed Hearings (including 2 TODAY for live Registrar session display)
  const todayMorning = new Date();
  todayMorning.setHours(10, 30, 0, 0);

  const todayAfternoon = new Date();
  todayAfternoon.setHours(14, 0, 0, 0);

  const hearingsData = [
    // Today's Hearings (Live on Registrar Dashboard)
    {
      cin: "CIN-2026-002",
      courtroomId: courtroomMap["Courtroom 101 - High Bench"],
      hearingDate: todayMorning,
      hearingStatus: "SCHEDULED" as const,
      proceedingSummary: null,
      adjournmentReason: null,
      nextHearingDate: null,
    },
    {
      cin: "CIN-2026-003",
      courtroomId: courtroomMap["Courtroom 201 - Criminal Bench"],
      hearingDate: todayAfternoon,
      hearingStatus: "SCHEDULED" as const,
      proceedingSummary: null,
      adjournmentReason: null,
      nextHearingDate: null,
    },
    // Past Hearings & Future Hearings for other cases
    {
      cin: "CIN-2026-003",
      courtroomId: courtroomMap["Courtroom 201 - Criminal Bench"],
      hearingDate: daysAgo(20),
      hearingStatus: "COMPLETED" as const,
      proceedingSummary: "Bail application dismissed; charge sheet formally framed; witness summons issued.",
      adjournmentReason: null,
      nextHearingDate: todayAfternoon,
    },
    {
      cin: "CIN-2026-004",
      courtroomId: courtroomMap["Courtroom 102 - Civil Division"],
      hearingDate: daysAgo(35),
      hearingStatus: "COMPLETED" as const,
      proceedingSummary: "Plea recorded; defendant pleaded not guilty; complainant evidence affidavit submitted.",
      adjournmentReason: null,
      nextHearingDate: daysAgo(5),
    },
    {
      cin: "CIN-2026-004",
      courtroomId: courtroomMap["Courtroom 102 - Civil Division"],
      hearingDate: daysAgo(5),
      hearingStatus: "ADJOURNED" as const,
      proceedingSummary: null,
      adjournmentReason: "Absence of key forensic handwriting expert due to medical hospitalization.",
      nextHearingDate: daysAhead(14),
    },
    {
      cin: "CIN-2026-004",
      courtroomId: courtroomMap["Courtroom 102 - Civil Division"],
      hearingDate: daysAhead(14),
      hearingStatus: "SCHEDULED" as const,
      proceedingSummary: null,
      adjournmentReason: null,
      nextHearingDate: null,
    },
    {
      cin: "CIN-2026-005",
      courtroomId: courtroomMap["Courtroom 201 - Criminal Bench"],
      hearingDate: daysAgo(40),
      hearingStatus: "COMPLETED" as const,
      proceedingSummary: "Preliminary departmental audit registers and ledger books submitted into court records.",
      adjournmentReason: null,
      nextHearingDate: daysAgo(3),
    },
    {
      cin: "CIN-2026-005",
      courtroomId: courtroomMap["Courtroom 201 - Criminal Bench"],
      hearingDate: daysAgo(3),
      hearingStatus: "ADJOURNED" as const,
      proceedingSummary: null,
      adjournmentReason: "Prosecution requested 10 days to verify certified treasury ledger copies.",
      nextHearingDate: daysAhead(10),
    },
    {
      cin: "CIN-2026-006",
      courtroomId: courtroomMap["Courtroom 101 - High Bench"],
      hearingDate: daysAgo(25),
      hearingStatus: "COMPLETED" as const,
      proceedingSummary: "Site inspection report by Motor Vehicles Inspector examined and marked as Exhibit P-1.",
      adjournmentReason: null,
      nextHearingDate: daysAgo(6),
    },
    {
      cin: "CIN-2026-006",
      courtroomId: courtroomMap["Courtroom 101 - High Bench"],
      hearingDate: daysAgo(6),
      hearingStatus: "COMPLETED" as const,
      proceedingSummary: "Final arguments concluded by both counsels. Judgment reserved.",
      adjournmentReason: null,
      nextHearingDate: null,
    },
    {
      cin: "CIN-2026-007",
      courtroomId: courtroomMap["Courtroom 101 - High Bench"],
      hearingDate: daysAgo(80),
      hearingStatus: "COMPLETED" as const,
      proceedingSummary: "Prosecution opened arguments; 4 witness depositions recorded.",
      adjournmentReason: null,
      nextHearingDate: daysAgo(50),
    },
    {
      cin: "CIN-2026-007",
      courtroomId: courtroomMap["Courtroom 101 - High Bench"],
      hearingDate: daysAgo(50),
      hearingStatus: "COMPLETED" as const,
      proceedingSummary: "Defense witness cross-examinations concluded.",
      adjournmentReason: null,
      nextHearingDate: daysAgo(15),
    },
    {
      cin: "CIN-2026-007",
      courtroomId: courtroomMap["Courtroom 101 - High Bench"],
      hearingDate: daysAgo(15),
      hearingStatus: "COMPLETED" as const,
      proceedingSummary: "Final statutory summation delivered; judgment date designated.",
      adjournmentReason: null,
      nextHearingDate: null,
    },
    {
      cin: "CIN-2026-008",
      courtroomId: courtroomMap["Courtroom 201 - Criminal Bench"],
      hearingDate: daysAgo(70),
      hearingStatus: "COMPLETED" as const,
      proceedingSummary: "Digital forensic drive contents examined in in-camera session.",
      adjournmentReason: null,
      nextHearingDate: daysAgo(22),
    },
    {
      cin: "CIN-2026-008",
      courtroomId: courtroomMap["Courtroom 201 - Criminal Bench"],
      hearingDate: daysAgo(22),
      hearingStatus: "COMPLETED" as const,
      proceedingSummary: "Cyber cell officer cross-examined regarding IP log discrepancies.",
      adjournmentReason: null,
      nextHearingDate: null,
    },
    {
      cin: "CIN-2026-009",
      courtroomId: courtroomMap["Courtroom 101 - High Bench"],
      hearingDate: daysAgo(100),
      hearingStatus: "COMPLETED" as const,
      proceedingSummary: "Voice sample acoustic match report verified by CFSL experts.",
      adjournmentReason: null,
      nextHearingDate: daysAgo(50),
    },
    {
      cin: "CIN-2026-009",
      courtroomId: courtroomMap["Courtroom 101 - High Bench"],
      hearingDate: daysAgo(50),
      hearingStatus: "COMPLETED" as const,
      proceedingSummary: "Final arguments concluded. Judgment reserved.",
      adjournmentReason: null,
      nextHearingDate: null,
    },
    {
      cin: "CIN-2026-010",
      courtroomId: courtroomMap["Courtroom 201 - Criminal Bench"],
      hearingDate: daysAgo(130),
      hearingStatus: "COMPLETED" as const,
      proceedingSummary: "Tax assessment vouchers examined and marked as court exhibits.",
      adjournmentReason: null,
      nextHearingDate: daysAgo(75),
    },
    {
      cin: "CIN-2026-010",
      courtroomId: courtroomMap["Courtroom 201 - Criminal Bench"],
      hearingDate: daysAgo(75),
      hearingStatus: "COMPLETED" as const,
      proceedingSummary: "Settlement deed between parties placed on record.",
      adjournmentReason: null,
      nextHearingDate: null,
    },
  ];

  // Remove previous dummy hearings for idempotency
  await prisma.hearing.deleteMany({
    where: { cin: { in: casesData.map((c) => c.cin) } },
  });

  for (const h of hearingsData) {
    await prisma.hearing.create({ data: h });
  }
  console.log("Hearings seeded (including 2 live sessions scheduled for today).");

  // 5. Seed Judgments for Resolved & Closed Cases
  const judgmentsData = [
    {
      cin: "CIN-2026-006",
      judgmentDate: daysAgo(5),
      summary:
        "The defendant pleaded guilty under summary judicial procedure. The Court hereby imposes a statutory judicial fine of ₹10,000/- with an official endorsement on driving credentials. Fine verified as deposited with the court treasury. Matter stands formally resolved.",
    },
    {
      cin: "CIN-2026-007",
      judgmentDate: daysAgo(12),
      summary:
        "Upon thorough evaluation of all 14 prosecution witness depositions and forensic document analysis confirming deliberate alteration of land title records, the Court finds the accused guilty beyond reasonable doubt under Section 468 read with Section 120B IPC. Sentenced to 2 years rigorous imprisonment and ₹50,000 statutory fine. Case docket officially closed.",
    },
    {
      cin: "CIN-2026-008",
      judgmentDate: daysAgo(18),
      summary:
        "The prosecution failed to establish an unbroken chain of custody regarding the seizure of the questioned digital apparatus and IP log mappings. In accordance with established criminal jurisprudence, the benefit of doubt is accorded to the defendant. The accused is hereby acquitted of all charges under the Information Technology Act. Case record closed.",
    },
    {
      cin: "CIN-2026-009",
      judgmentDate: daysAgo(45),
      summary:
        "The accused stands convicted under Section 384 IPC. Recorded audio communications corroborated by Central Forensic Science Laboratory acoustic spectrogram analysis. The Court sentences the convict to 18 months simple imprisonment. Case docket marked closed.",
    },
    {
      cin: "CIN-2026-010",
      judgmentDate: daysAgo(70),
      summary:
        "A compounded statutory settlement was reached between the State Revenue Department and the defendant under Section 320 CrPC. All defaulted tax liabilities and compounded judicial fees stand discharged in full. Final closing decree entered.",
    },
  ];

  for (const j of judgmentsData) {
    await prisma.judgment.upsert({
      where: { cin: j.cin },
      update: { judgmentDate: j.judgmentDate, summary: j.summary },
      create: j,
    });
  }
  console.log("5 Judgments seeded for historical archive and jurisprudence search.");

  // 6. Seed Lawyer Case Views (CaseView) for Lawyer Billing Portal
  const lawyerId = userMap["lawyer@jis.local"];
  if (lawyerId) {
    // Delete existing views for idempotency
    await prisma.caseView.deleteMany({
      where: { lawyerId },
    });

    const caseViewsData = [
      {
        lawyerId,
        cin: "CIN-2026-007",
        viewedAt: daysAgo(3),
        chargeAmount: 50.0,
      },
      {
        lawyerId,
        cin: "CIN-2026-008",
        viewedAt: daysAgo(7),
        chargeAmount: 50.0,
      },
      {
        lawyerId,
        cin: "CIN-2026-009",
        viewedAt: daysAgo(35),
        chargeAmount: 50.0,
      },
    ];

    for (const cv of caseViewsData) {
      await prisma.caseView.create({ data: cv });
    }
    console.log("Lawyer CaseViews seeded (2 this month, 1 previous month = ₹150 total).");
  }

  // 7. Seed Operational Audit Logs for Registrar Activity Feed
  const registrarId = userMap["registrar@jis.local"];
  if (registrarId) {
    await prisma.auditLog.deleteMany({
      where: { actorId: registrarId },
    });

    const auditLogsData = [
      {
        actorId: registrarId,
        action: "CASE_STATUS_CHANGED",
        entity: "Case",
        entityId: "CIN-2026-007",
        details: { status: "CLOSED", remarks: "Decree executed; docket closed" },
        createdAt: daysAgo(12),
      },
      {
        actorId: registrarId,
        action: "JUDGMENT_RECORDED",
        entity: "Judgment",
        entityId: "CIN-2026-008",
        details: { summary: "Acquittal judgment entered into registry" },
        createdAt: daysAgo(18),
      },
      {
        actorId: registrarId,
        action: "HEARING_ADJOURNED",
        entity: "Hearing",
        entityId: "CIN-2026-004",
        details: { reason: "Expert witness medical leave" },
        createdAt: daysAgo(5),
      },
      {
        actorId: registrarId,
        action: "HEARING_SCHEDULED",
        entity: "Hearing",
        entityId: "CIN-2026-002",
        details: { courtroom: "Courtroom 101 - High Bench", time: "10:30" },
        createdAt: daysAgo(1),
      },
      {
        actorId: registrarId,
        action: "CASE_REGISTERED",
        entity: "Case",
        entityId: "CIN-2026-001",
        details: { defendant: "Alok Verma", crime: "IPC 420 & 406" },
        createdAt: daysAgo(1),
      },
    ];

    for (const al of auditLogsData) {
      await prisma.auditLog.create({ data: al });
    }
    console.log("Registrar AuditLog records seeded.");
  }

  // 8. Ensure Supabase Auth accounts for all personnel
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    supabaseUrl &&
    serviceRoleKey &&
    !serviceRoleKey.includes("your-service-role-key")
  ) {
    try {
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      for (const u of defaultUsers) {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: {
            name: u.name,
            role: u.role,
          },
        });

        if (error) {
          if (error.message.toLowerCase().includes("already registered")) {
            console.log(`Supabase Auth user already exists for ${u.email}.`);
          } else {
            console.warn(`Supabase Auth creation notice (${u.email}): ${error.message}`);
          }
        } else if (data.user) {
          console.log(`Supabase Auth user created successfully for: ${data.user.email}`);
        }
      }
    } catch (authErr) {
      console.warn("Could not connect to Supabase Auth admin API:", authErr);
    }
  }

  console.log("Comprehensive database seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
