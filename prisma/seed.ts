import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting JIS database seed...");

  const registrarEmail = "registrar@jis.local";
  const registrarPassword = process.env.INITIAL_REGISTRAR_PASSWORD || "Registrar@123456";

  // 1. Seed or Upsert Registrar User in Prisma
  const registrar = await prisma.user.upsert({
    where: { email: registrarEmail },
    update: {
      role: "REGISTRAR",
      isActive: true,
    },
    create: {
      name: "Chief Judicial Registrar",
      email: registrarEmail,
      role: "REGISTRAR",
      isActive: true,
    },
  });

  console.log(`Prisma User record ensured for: ${registrar.email} (Role: ${registrar.role})`);

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

  // 3. Create Registrar in Supabase Auth if credentials provided
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

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: registrarEmail,
        password: registrarPassword,
        email_confirm: true,
        user_metadata: {
          name: registrar.name,
          role: "REGISTRAR",
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes("already registered")) {
          console.log(`Supabase Auth user already exists for ${registrarEmail}.`);
        } else {
          console.warn(`Supabase Auth creation notice: ${error.message}`);
        }
      } else if (data.user) {
        console.log(`Supabase Auth user created successfully for: ${data.user.email}`);
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
