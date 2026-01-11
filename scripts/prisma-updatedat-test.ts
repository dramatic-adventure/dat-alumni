import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const last = await prisma.donationPayment.findFirst({ orderBy: { createdAt: "desc" } });
  if (!last) throw new Error("No DonationPayment rows found.");

  console.log("BEFORE:", last.id, last.createdAt, last.updatedAt);

  // force a real write
  await prisma.donationPayment.update({
    where: { id: last.id },
    data: { donorName: (last.donorName ?? "") + " " },
  });

  const after = await prisma.donationPayment.findUnique({ where: { id: last.id } });
  console.log("AFTER :", after?.id, after?.createdAt, after?.updatedAt);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
