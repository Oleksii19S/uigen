import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const customers = [
    { id: "u_00", email: "alice@example.com", password: "pass1234", creation_date: "2026-06-01" },
    { id: "u_01", email: "bob@example.com",   password: "pass1234", creation_date: "2026-06-02" },
    { id: "u_02", email: "carol@example.com", password: "pass1234", creation_date: "2026-06-03" },
  ];

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { id: customer.id },
      update: {},
      create: customer,
    });
  }

  console.log("Seeded", customers.length, "customers.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
