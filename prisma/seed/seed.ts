import { PrismaClient } from "../../lib/generated/prisma/client";
import { StaffRole, RingGameType } from "../../lib/generated/prisma/enums";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const seedStaff = async () => {
  const staffDataList = [
    {
      name: "Admin User",
      email: "admin@example.com",
      emailVerified: true,
      role: StaffRole.ADMIN,
    },
    {
      name: "member1",
      email: "member1@example.com",
      emailVerified: true,
      role: StaffRole.MEMBER,
    },
    {
      name: "member2",
      email: "member2@example.com",
      emailVerified: true,
      role: StaffRole.MEMBER,
    },
  ];

  for (const data of staffDataList) {
    const existingStaff = await prisma.staff.findUnique({
      where: { email: data.email },
    });

    if (!existingStaff) {
      await prisma.staff.create({ data });
    }
  }
};

async function main() {
  console.log("Seeding...");

  await seedStaff();

  // --- Players ---
  const playersData = [
    { memberId: "1001", name: "タロー", webCoinGameId: "WC001" },
    { memberId: "1002", name: "ハナコ", webCoinGameId: "WC002" },
    { memberId: "1003", name: "マイケル", webCoinGameId: "WC003" },
    { memberId: "1004", name: "ジョニー", webCoinGameId: "WC004" },
    { memberId: "1005", name: "アリス", webCoinGameId: "WC005" },
    { memberId: "8001", name: "サニー", webCoinGameId: null },
    { memberId: "8002", name: "ジェシカ", webCoinGameId: null },
  ];

  for (const p of playersData) {
    if (
      !(await prisma.player.findUnique({ where: { memberId: p.memberId } }))
    ) {
      const player = await prisma.player.create({
        data: {
          memberId: p.memberId,
          name: p.name,
          webCoinGameId: p.webCoinGameId,
          webCoinBalance: 10000,
          inStoreChipBalance: 1000,
        },
      });
      await prisma.webCoinDeposit.create({
        data: {
          playerId: player.id,
          depositAmount: 10000,
        },
      });
      await prisma.inStoreChipDeposit.create({
        data: {
          playerId: player.id,
          depositAmount: 1000,
        },
      });
      console.log(`Created Player: ${p.name}`);
    }
  }

  // --- Ring Game Desks ---
  const deskNames = ["Table A", "Table B", "VIP Table"];
  for (const name of deskNames) {
    const existing = await prisma.ringGameDesk.findFirst({ where: { name } });
    if (!existing) {
      await prisma.ringGameDesk.create({ data: { name } });
      console.log(`Created Disk: ${name}`);
    }
  }

  // --- Tournaments ---
  // Create a tournament for today
  const today = new Date();
  today.setHours(19, 0, 0, 0); // 19:00 start

  const entryCloses = new Date(today);
  entryCloses.setHours(21, 0, 0, 0); // 21:00 close

  const tournamentName = "Daily Hyper Turbo";

  if (
    !(await prisma.tournament.findFirst({
      where: { name: tournamentName, startAt: today },
    }))
  ) {
    const tournament = await prisma.tournament.create({
      data: {
        name: tournamentName,
        startAt: today,
        entryClosesAt: entryCloses,
      },
    });

    // Prizes
    await prisma.tournamentPrize.createMany({
      data: [
        { tournamentId: tournament.id, rank: 1, amount: 30000 },
        { tournamentId: tournament.id, rank: 2, amount: 10000 },
      ],
    });
    console.log(`Created Tournament: ${tournamentName}`);
  }

  // Future tournament
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowName = "Weekend Special";
  if (
    !(await prisma.tournament.findFirst({
      where: { name: tomorrowName, startAt: tomorrow },
    }))
  ) {
    await prisma.tournament.create({
      data: {
        name: tomorrowName,
        startAt: tomorrow,
        entryClosesAt: new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000), // 3 hours later
      },
    });
    console.log(`Created Tournament: ${tomorrowName}`);
  }

  // --- Ring Game Buy-In Options ---
  const ringGameBuyInOptions = [
    // IN_STORE
    { chipAmount: 100, chargeAmount: 3000 },
    { chipAmount: 200, chargeAmount: 5000 },
    { chipAmount: 400, chargeAmount: 9000 },
  ];

  for (const opt of ringGameBuyInOptions) {
    const existing = await prisma.inStoreRingBuyInOption.findFirst({
      where: {
        chipAmount: opt.chipAmount,
        chargeAmount: opt.chargeAmount,
      },
    });

    if (!existing) {
      await prisma.inStoreRingBuyInOption.create({
        data: {
          chipAmount: opt.chipAmount,
          chargeAmount: opt.chargeAmount,
        },
      });
      console.log(`Created InStoreRingBuyInOption: ${opt.chipAmount}`);
    }
  }

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
