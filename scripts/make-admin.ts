// Script pour promouvoir un utilisateur en admin
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const email = process.argv[2];

if (!email) {
  console.error("Usage: tsx scripts/make-admin.ts <email>");
  process.exit(1);
}

async function makeAdmin() {
  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: "admin" },
    });

    console.log(`✅ Utilisateur ${user.email} promu en admin`);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Record to update not found")
    ) {
      console.error(`❌ Utilisateur avec l'email ${email} non trouvé`);
    } else {
      console.error("❌ Erreur:", error);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin();
