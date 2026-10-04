import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
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
  console.log("=================================================");
  console.log("Starting JIS Database Wipe & Reseed...");
  console.log("=================================================");

  // ---------------------------------------------------------------------------
  // 0. Clean Existing Database Records (reverse dependency order)
  // ---------------------------------------------------------------------------
  console.log("Clearing existing database records...");
  await prisma.twoFactorChallenge.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.caseView.deleteMany({});
  await prisma.judgment.deleteMany({});
  await prisma.hearing.deleteMany({});
  await prisma.case.deleteMany({});
  await prisma.courtroom.deleteMany({});
  await prisma.user.deleteMany({});
  console.log("✓ Existing database tables cleared successfully.");

  // ---------------------------------------------------------------------------
  // 1. Seed Judicial Personnel (User Model)
  // ---------------------------------------------------------------------------
  console.log("\nSeeding user accounts...");
  const defaultUsers = [
    {
      name: "Chief Judicial Registrar",
      email: "registrar@jis.in",
      role: "REGISTRAR" as const,
      password: process.env.INITIAL_REGISTRAR_PASSWORD || "Registrar@123",
    },
    {
      name: "Hon. Justice V. K. Sen",
      email: "judge@jis.in",
      role: "JUDGE" as const,
      password: process.env.INITIAL_JUDGE_PASSWORD || "Judge@123",
    },
    {
      name: "Hon. Justice Priya Sharma",
      email: "judge2@jis.in",
      role: "JUDGE" as const,
      password: process.env.INITIAL_JUDGE_PASSWORD || "Judge@123",
    },
    {
      name: "Adv. Rajesh Raman",
      email: "lawyer@jis.in",
      role: "LAWYER" as const,
      password: process.env.INITIAL_LAWYER_PASSWORD || "Lawyer@123",
    },
    {
      name: "Adv. Vikram Malhotra",
      email: "prosecutor@jis.in",
      role: "LAWYER" as const,
      password: process.env.INITIAL_LAWYER_PASSWORD || "Lawyer@123",
    },
    {
      name: "Adv. Meera Nair",
      email: "lawyer2@jis.in",
      role: "LAWYER" as const,
      password: process.env.INITIAL_LAWYER_PASSWORD || "Lawyer@123",
    },
  ];

  const userMap: Record<string, string> = {};

  for (const u of defaultUsers) {
    const record = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: true,
      },
    });
    userMap[u.email] = record.id;
    console.log(`  + User: ${u.name} <${u.email}> (${u.role})`);
  }

  // ---------------------------------------------------------------------------
  // 2. Seed Courtroom Benches (Courtroom Model)
  // ---------------------------------------------------------------------------
  console.log("\nSeeding courtroom benches...");
  const defaultCourtrooms = [
    {
      name: "Courtroom 101 - Principal Bench",
      location: "Block A, 1st Floor",
      maxSlots: 5,
    },
    {
      name: "Courtroom 102 - Civil Division",
      location: "Block A, 1st Floor",
      maxSlots: 6,
    },
    {
      name: "Courtroom 201 - Criminal Bench",
      location: "Block B, 2nd Floor",
      maxSlots: 4,
    },
    {
      name: "Courtroom 202 - Commercial Bench",
      location: "Block B, 2nd Floor",
      maxSlots: 5,
    },
  ];

  const courtroomMap: Record<string, string> = {};

  for (const cr of defaultCourtrooms) {
    const record = await prisma.courtroom.create({
      data: cr,
    });
    courtroomMap[cr.name] = record.id;
    console.log(`  + Courtroom: ${cr.name} (${cr.location})`);
  }

  // ---------------------------------------------------------------------------
  // 3. Seed Cases Across All Statuses (Case Model)
  // ---------------------------------------------------------------------------
  console.log("\nSeeding case registry records...");
  const casesData = [
    {
      cin: "CIN-2026-001",
      defendantName: "Alok Verma",
      defendantAddress: "42 Park Street, Flat 4B, South Zone",
      crimeType: "BNS Sec 318 & 316 (Cheating & Criminal Breach of Trust)",
      crimeLocation: "Financial District Commercial Tower",
      arrestingOfficer: "Insp. Devendra Joshi (Crime Branch)",
      crimeDate: daysAgo(30),
      arrestDate: daysAgo(20),
      trialStartDate: daysAhead(5),
      expectedCompletionDate: daysAhead(90),
      status: "REGISTERED" as const,
      judgeId: userMap["judge@jis.in"],
      prosecutorId: userMap["prosecutor@jis.in"],
      lawyerId: userMap["lawyer@jis.in"],
    },
    {
      cin: "CIN-2026-002",
      defendantName: "Sunita Mehta",
      defendantAddress: "12 Railway Colony Road, Sector 3",
      crimeType: "BNS Sec 303 & 317 (Theft & Receiving Stolen Property)",
      crimeLocation: "Central Railway Freight Yard, Warehouse 9",
      arrestingOfficer: "SI Anand Kulkarni (RPF)",
      crimeDate: daysAgo(45),
      arrestDate: daysAgo(35),
      trialStartDate: daysAgo(15),
      expectedCompletionDate: daysAhead(60),
      status: "PENDING" as const,
      judgeId: userMap["judge@jis.in"],
      prosecutorId: userMap["prosecutor@jis.in"],
      lawyerId: userMap["lawyer@jis.in"],
    },
    {
      cin: "CIN-2026-003",
      defendantName: "Deepak Rao",
      defendantAddress: "78 Shanti Nagar, Lane 5, East District",
      crimeType: "BNS Sec 109 & 117 (Attempt to Murder & Grievous Hurt)",
      crimeLocation: "National Highway 48 Toll Plaza",
      arrestingOfficer: "Insp. Rakesh Sawant (City Police)",
      crimeDate: daysAgo(60),
      arrestDate: daysAgo(50),
      trialStartDate: daysAgo(25),
      expectedCompletionDate: daysAhead(120),
      status: "PENDING" as const,
      judgeId: userMap["judge2@jis.in"],
      prosecutorId: userMap["prosecutor@jis.in"],
      lawyerId: userMap["lawyer2@jis.in"],
    },
    {
      cin: "CIN-2026-004",
      defendantName: "Sanjay Grover",
      defendantAddress: "105 Crystal Plaza, Outer Ring Road",
      crimeType: "NI Act Sec 138 (Cheque Dishonour for Insufficient Funds)",
      crimeLocation: "Apex Mercantile Bank, Main Branch",
      arrestingOfficer: "SI Kavita Shinde (EOW)",
      crimeDate: daysAgo(90),
      arrestDate: daysAgo(70),
      trialStartDate: daysAgo(40),
      expectedCompletionDate: daysAhead(45),
      status: "ADJOURNED" as const,
      judgeId: userMap["judge@jis.in"],
      prosecutorId: userMap["prosecutor@jis.in"],
      lawyerId: userMap["lawyer@jis.in"],
    },
    {
      cin: "CIN-2026-005",
      defendantName: "Arvind Swaminathan",
      defendantAddress: "B-201 Green Meadows, Cantonment",
      crimeType: "PC Act Sec 13 (Criminal Misconduct by Public Servant)",
      crimeLocation: "Municipal Treasury Office",
      arrestingOfficer: "DSP Pradeep Nair (Anti-Corruption)",
      crimeDate: daysAgo(120),
      arrestDate: daysAgo(100),
      trialStartDate: daysAgo(50),
      expectedCompletionDate: daysAhead(80),
      status: "ADJOURNED" as const,
      judgeId: userMap["judge2@jis.in"],
      prosecutorId: userMap["prosecutor@jis.in"],
      lawyerId: userMap["lawyer2@jis.in"],
    },
    {
      cin: "CIN-2026-006",
      defendantName: "Ramesh Patel",
      defendantAddress: "23 GIDC Industrial Area, Phase 2",
      crimeType: "BNS Sec 281 & 125 (Rash Driving & Endangering Life)",
      crimeLocation: "Eastern Express Highway, Km 14",
      arrestingOfficer: "SI Suresh Gaikwad (Traffic Division)",
      crimeDate: daysAgo(75),
      arrestDate: daysAgo(70),
      trialStartDate: daysAgo(30),
      expectedCompletionDate: daysAgo(5),
      status: "RESOLVED" as const,
      judgeId: userMap["judge@jis.in"],
      prosecutorId: userMap["prosecutor@jis.in"],
      lawyerId: userMap["lawyer@jis.in"],
    },
    {
      cin: "CIN-2026-007",
      defendantName: "Vikram Singhania",
      defendantAddress: "14 Altamount Heights, High Court Marg",
      crimeType: "BNS Sec 336 & 340 (Forgery & Fraudulent Conveyance)",
      crimeLocation: "Sub-Registrar Office of Land Records",
      arrestingOfficer: "Insp. Devendra Joshi (Crime Branch)",
      crimeDate: daysAgo(150),
      arrestDate: daysAgo(130),
      trialStartDate: daysAgo(90),
      expectedCompletionDate: daysAgo(12),
      status: "CLOSED" as const,
      judgeId: userMap["judge@jis.in"],
      prosecutorId: userMap["prosecutor@jis.in"],
      lawyerId: userMap["lawyer@jis.in"],
    },
    {
      cin: "CIN-2026-008",
      defendantName: "Meera Deshmukh",
      defendantAddress: "602 Silicon Residency, Electronic City",
      crimeType: "IT Act Sec 66C & 66D (Identity Theft & Impersonation)",
      crimeLocation: "Infotech Cyber Park, Server Room B",
      arrestingOfficer: "Insp. Neha Saxena (Cyber Crime Cell)",
      crimeDate: daysAgo(140),
      arrestDate: daysAgo(120),
      trialStartDate: daysAgo(80),
      expectedCompletionDate: daysAgo(18),
      status: "CLOSED" as const,
      judgeId: userMap["judge2@jis.in"],
      prosecutorId: userMap["prosecutor@jis.in"],
      lawyerId: userMap["lawyer2@jis.in"],
    },
    {
      cin: "CIN-2026-009",
      defendantName: "Karan Oberoi",
      defendantAddress: "88 Marine Drive, Sea Face Towers",
      crimeType: "BNS Sec 308 & 351 (Extortion & Criminal Intimidation)",
      crimeLocation: "Regal Hotel Banquet Hall, Colaba",
      arrestingOfficer: "ACP Ashok Kamble (Anti-Extortion)",
      crimeDate: daysAgo(180),
      arrestDate: daysAgo(160),
      trialStartDate: daysAgo(110),
      expectedCompletionDate: daysAgo(45),
      status: "CLOSED" as const,
      judgeId: userMap["judge@jis.in"],
      prosecutorId: userMap["prosecutor@jis.in"],
      lawyerId: userMap["lawyer@jis.in"],
    },
    {
      cin: "CIN-2026-010",
      defendantName: "Harish Chawla",
      defendantAddress: "54 Grain Market, Old Bazaar",
      crimeType: "BNS Sec 318(4) & 338 (Commercial Tax Evasion & Forgery)",
      crimeLocation: "Commercial Tax Assessment Office",
      arrestingOfficer: "SI Anand Kulkarni (Tax Enforcement)",
      crimeDate: daysAgo(210),
      arrestDate: daysAgo(190),
      trialStartDate: daysAgo(140),
      expectedCompletionDate: daysAgo(70),
      status: "CLOSED" as const,
      judgeId: userMap["judge2@jis.in"],
      prosecutorId: userMap["prosecutor@jis.in"],
      lawyerId: userMap["lawyer@jis.in"],
    },
  ];

  for (const c of casesData) {
    await prisma.case.create({
      data: c,
    });
    console.log(`  + Case: ${c.cin} (${c.defendantName}) -> Status: ${c.status}`);
  }

  // ---------------------------------------------------------------------------
  // 4. Seed Hearings (including 2 Live sessions for TODAY)
  // ---------------------------------------------------------------------------
  console.log("\nSeeding hearings schedule...");
  const todayMorning = new Date();
  todayMorning.setHours(10, 30, 0, 0);

  const todayAfternoon = new Date();
  todayAfternoon.setHours(14, 0, 0, 0);

  const hearingsData = [
    // Today's Live Hearings (Appear on Daily Cause List & Dashboard)
    {
      cin: "CIN-2026-002",
      courtroomId: courtroomMap["Courtroom 101 - Principal Bench"],
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
    // Past & Future Hearings
    {
      cin: "CIN-2026-003",
      courtroomId: courtroomMap["Courtroom 201 - Criminal Bench"],
      hearingDate: daysAgo(20),
      hearingStatus: "COMPLETED" as const,
      proceedingSummary:
        "Bail application dismissed; formal charge sheet framed under BNS Sec 109 & 117; summons issued to prosecution eyewitnesses.",
      adjournmentReason: null,
      nextHearingDate: todayAfternoon,
    },
    {
      cin: "CIN-2026-004",
      courtroomId: courtroomMap["Courtroom 102 - Civil Division"],
      hearingDate: daysAgo(35),
      hearingStatus: "COMPLETED" as const,
      proceedingSummary:
        "Plea recorded; defendant entered not guilty; complainant affidavit of evidence taken on record.",
      adjournmentReason: null,
      nextHearingDate: daysAgo(5),
    },
    {
      cin: "CIN-2026-004",
      courtroomId: courtroomMap["Courtroom 102 - Civil Division"],
      hearingDate: daysAgo(5),
      hearingStatus: "ADJOURNED" as const,
      proceedingSummary: null,
      adjournmentReason:
        "Absence of key forensic handwriting examiner due to medical hospitalization.",
      nextHearingDate: daysAhead(14),
    },
    {
      cin: "CIN-2026-004",
      courtroomId: courtroomMap["Courtroom 102 - Civil Division"],
      hearingDate: daysAhead(14),
      hearingStatus: "SCHEDULED" as const,
      proceedingSummary:
        "Hearing scheduled for examination of handwriting expert witness.",
      adjournmentReason: null,
      nextHearingDate: null,
    },
    {
      cin: "CIN-2026-005",
      courtroomId: courtroomMap["Courtroom 201 - Criminal Bench"],
      hearingDate: daysAgo(40),
      hearingStatus: "COMPLETED" as const,
      proceedingSummary:
        "Preliminary audit registers and financial ledger copies placed on court record.",
      adjournmentReason: null,
      nextHearingDate: daysAgo(3),
    },
    {
      cin: "CIN-2026-005",
      courtroomId: courtroomMap["Courtroom 201 - Criminal Bench"],
      hearingDate: daysAgo(3),
      hearingStatus: "ADJOURNED" as const,
      proceedingSummary: null,
      adjournmentReason:
        "Prosecution requested 10 days to verify certified treasury ledger copies.",
      nextHearingDate: daysAhead(10),
    },
    {
      cin: "CIN-2026-006",
      courtroomId: courtroomMap["Courtroom 101 - Principal Bench"],
      hearingDate: daysAgo(25),
      hearingStatus: "COMPLETED" as const,
      proceedingSummary:
        "Site inspection report by Motor Vehicles Inspector examined and marked as Exhibit P-1.",
      adjournmentReason: null,
      nextHearingDate: daysAgo(6),
    },
    {
      cin: "CIN-2026-006",
      courtroomId: courtroomMap["Courtroom 101 - Principal Bench"],
      hearingDate: daysAgo(6),
      hearingStatus: "COMPLETED" as const,
      proceedingSummary:
        "Final statutory summation concluded by both counsels. Judgment reserved.",
      adjournmentReason: null,
      nextHearingDate: null,
    },
    {
      cin: "CIN-2026-007",
      courtroomId: courtroomMap["Courtroom 101 - Principal Bench"],
      hearingDate: daysAgo(80),
      hearingStatus: "COMPLETED" as const,
      proceedingSummary:
        "Prosecution opened arguments; 4 witness depositions recorded.",
      adjournmentReason: null,
      nextHearingDate: daysAgo(50),
    },
    {
      cin: "CIN-2026-007",
      courtroomId: courtroomMap["Courtroom 101 - Principal Bench"],
      hearingDate: daysAgo(50),
      hearingStatus: "COMPLETED" as const,
      proceedingSummary: "Defense witness cross-examinations concluded.",
      adjournmentReason: null,
      nextHearingDate: daysAgo(15),
    },
    {
      cin: "CIN-2026-007",
      courtroomId: courtroomMap["Courtroom 101 - Principal Bench"],
      hearingDate: daysAgo(15),
      hearingStatus: "COMPLETED" as const,
      proceedingSummary:
        "Final statutory summation delivered; judgment date designated.",
      adjournmentReason: null,
      nextHearingDate: null,
    },
    {
      cin: "CIN-2026-008",
      courtroomId: courtroomMap["Courtroom 201 - Criminal Bench"],
      hearingDate: daysAgo(70),
      hearingStatus: "COMPLETED" as const,
      proceedingSummary:
        "Digital forensic hard drive contents examined in in-camera session.",
      adjournmentReason: null,
      nextHearingDate: daysAgo(22),
    },
    {
      cin: "CIN-2026-008",
      courtroomId: courtroomMap["Courtroom 201 - Criminal Bench"],
      hearingDate: daysAgo(22),
      hearingStatus: "COMPLETED" as const,
      proceedingSummary:
        "Cyber cell investigating officer cross-examined regarding IP log hash chain discrepancies.",
      adjournmentReason: null,
      nextHearingDate: null,
    },
    {
      cin: "CIN-2026-009",
      courtroomId: courtroomMap["Courtroom 101 - Principal Bench"],
      hearingDate: daysAgo(100),
      hearingStatus: "COMPLETED" as const,
      proceedingSummary:
        "Voice sample acoustic spectrogram match verified by CFSL experts.",
      adjournmentReason: null,
      nextHearingDate: daysAgo(50),
    },
    {
      cin: "CIN-2026-009",
      courtroomId: courtroomMap["Courtroom 101 - Principal Bench"],
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
      proceedingSummary:
        "Tax assessment vouchers and invoices marked as court exhibits.",
      adjournmentReason: null,
      nextHearingDate: daysAgo(75),
    },
    {
      cin: "CIN-2026-010",
      courtroomId: courtroomMap["Courtroom 201 - Criminal Bench"],
      hearingDate: daysAgo(75),
      hearingStatus: "COMPLETED" as const,
      proceedingSummary:
        "Compounding deed between State and defendant placed on record.",
      adjournmentReason: null,
      nextHearingDate: null,
    },
  ];

  for (const h of hearingsData) {
    await prisma.hearing.create({ data: h });
  }
  console.log(`  ✓ Created ${hearingsData.length} hearings (including 2 live sessions for today).`);

  // ---------------------------------------------------------------------------
  // 5. Seed Judgments for Resolved & Closed Cases (Judgment Model)
  // ---------------------------------------------------------------------------
  console.log("\nSeeding judgments...");
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
        "Upon thorough evaluation of all 14 prosecution witness depositions and forensic document analysis confirming deliberate alteration of land title records, the Court finds the accused guilty beyond reasonable doubt under Section 336 read with Section 340 BNS. Sentenced to 2 years rigorous imprisonment and ₹50,000 statutory fine. Case docket officially closed.",
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
        "The accused stands convicted under Section 308 BNS. Recorded audio communications corroborated by Central Forensic Science Laboratory acoustic spectrogram analysis. The Court sentences the convict to 18 months simple imprisonment. Case docket marked closed.",
    },
    {
      cin: "CIN-2026-010",
      judgmentDate: daysAgo(70),
      summary:
        "A compounded statutory settlement was reached between the State Revenue Department and the defendant under Section 320 BNSS. All defaulted tax liabilities and compounded judicial fees stand discharged in full. Final closing decree entered.",
    },
  ];

  for (const j of judgmentsData) {
    await prisma.judgment.create({ data: j });
    console.log(`  + Judgment recorded for ${j.cin}`);
  }

  // ---------------------------------------------------------------------------
  // 6. Seed Lawyer Case Views (CaseView Model) for Billing
  // ---------------------------------------------------------------------------
  console.log("\nSeeding lawyer precedent case views (billing records)...");
  const lawyerId = userMap["lawyer@jis.in"];
  if (lawyerId) {
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
    console.log(`  ✓ Created 3 lawyer case views (₹150 billable total).`);
  }

  // ---------------------------------------------------------------------------
  // 7. Seed Operational Audit Logs (AuditLog Model)
  // ---------------------------------------------------------------------------
  console.log("\nSeeding audit trail logs...");
  const registrarId = userMap["registrar@jis.in"];
  if (registrarId) {
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
        details: {
          courtroom: "Courtroom 101 - Principal Bench",
          time: "10:30 IST",
        },
        createdAt: daysAgo(1),
      },
      {
        actorId: registrarId,
        action: "CASE_REGISTERED",
        entity: "Case",
        entityId: "CIN-2026-001",
        details: { defendant: "Alok Verma", crime: "BNS 318 & 316" },
        createdAt: daysAgo(1),
      },
    ];

    for (const al of auditLogsData) {
      await prisma.auditLog.create({ data: al });
    }
    console.log(`  ✓ Created 5 administrative audit log records.`);
  }

  // ---------------------------------------------------------------------------
  // 8. Sync Supabase Auth Accounts
  // ---------------------------------------------------------------------------
  console.log("\nSynchronizing Supabase Auth identities...");
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
        // Check if user exists by email in Supabase Auth
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existingAuthUser = listData?.users?.find(
          (usr) => usr.email?.toLowerCase() === u.email.toLowerCase()
        );

        if (existingAuthUser) {
          // Update password and metadata
          const { error: updateErr } =
            await supabaseAdmin.auth.admin.updateUserById(
              existingAuthUser.id,
              {
                password: u.password,
                email_confirm: true,
                user_metadata: {
                  name: u.name,
                  role: u.role,
                },
              }
            );
          if (updateErr) {
            console.warn(`  ! Could not update auth user (${u.email}): ${updateErr.message}`);
          } else {
            console.log(`  ✓ Supabase Auth user updated with new password: ${u.email}`);
          }
        } else {
          // Create new user
          const { error: createErr } =
            await supabaseAdmin.auth.admin.createUser({
              email: u.email,
              password: u.password,
              email_confirm: true,
              user_metadata: {
                name: u.name,
                role: u.role,
              },
            });
          if (createErr) {
            console.warn(`  ! Could not create auth user (${u.email}): ${createErr.message}`);
          } else {
            console.log(`  ✓ Supabase Auth user created: ${u.email}`);
          }
        }
      }
    } catch (authErr) {
      console.warn("  ! Supabase Auth admin API sync warning:", authErr);
    }
  }

  console.log("\n=================================================");
  console.log("JIS Database Seeding Completed Successfully! 🎉");
  console.log("=================================================");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
