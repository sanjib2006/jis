import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log("Starting JIS database seed...");

  const registrarEmail = "registrar@jis.local";
  const registrarPassword = process.env.INITIAL_REGISTRAR_PASSWORD || "Registrar@123456";

  // 1. Seed or Upsert Key Personnel in Prisma
  const defaultUsers = [
    {
      name: "Chief Judicial Registrar",
      email: registrarEmail,
      role: "REGISTRAR" as const,
      password: registrarPassword,
    },
    {
      name: "Hon. Justice V. K. Sen",
      email: "judge@jis.local",
      role: "JUDGE" as const,
      password: process.env.INITIAL_JUDGE_PASSWORD || "Judge@123456",
    },
    {
      name: "Adv. Rajesh Raman",
      email: "lawyer@jis.local",
      role: "LAWYER" as const,
      password: process.env.INITIAL_LAWYER_PASSWORD || "Lawyer@123456",
    },
  ];

  for (const u of defaultUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, isActive: true },
      create: {
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: true,
      },
    });
    console.log(`Prisma User record ensured for: ${u.email} (Role: ${u.role})`);
  }

  // 2. Seed Courtrooms (Phase 3 readiness)
  const courtrooms = [
    { name: "Courtroom 101 - High Bench", location: "Block A, 1st Floor", maxSlots: 5 },
    { name: "Courtroom 102 - Civil Division", location: "Block A, 1st Floor", maxSlots: 6 },
    { name: "Courtroom 201 - Criminal Bench", location: "Block B, 2nd Floor", maxSlots: 4 },
  ];

  for (const cr of courtrooms) {
    await prisma.courtroom.upsert({
      where: { name: cr.name },
      update: {},
      create: cr,
    });
  }
  console.log("Default courtrooms seeded.");

  // 3. Create default users in Supabase Auth if credentials provided
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
  } else {
    console.log(
      "Notice: SUPABASE_SERVICE_ROLE_KEY is not yet populated. Skipping Supabase Auth admin user creation."
    );
  }

  console.log("Database seeding completed.");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
