import { PrismaClient } from "@prisma/client";
import { range } from "lodash";

const prisma = new PrismaClient({
  log: ["error", "info", "query", "warn"],
});

type TransactionPrisma = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use"
>;

// A `main` function so that you can use async/await
async function main() {
  const createdUser = await prisma.user.upsert({
    where: {
      email: "hello@gmail.com",
    },
    create: {
      email: "hello@gmail.com",
      name: "user-1",
    },
    update: {
      id: 1,
    },
  });

  console.log("createdUser", createdUser);

  // Set this value to the number of parallel transactions
  const CONCURRENCY = 10;
  const WITH_LOCK = true;
  const ADD_DELAY = true;

  const promises = range(0, CONCURRENCY).map(() =>
    prisma.$transaction(
      async (transactionPrisma: TransactionPrisma) => {
        console.log("started transaction");

        if (WITH_LOCK) {
          await transactionPrisma.$queryRaw`SELECT id from "User" where email = 'hello@gmail.com' FOR UPDATE`;
        }

        const user = await transactionPrisma.user.findUnique({
          rejectOnNotFound: true,
          where: {
            email: "hello@gmail.com",
          },
        });

        // brief delay
        if (ADD_DELAY) {
          await new Promise((r) => setTimeout(r, 100));
        }

        const updatedUser = await transactionPrisma.user.update({
          where: {
            email: "hello@gmail.com",
          },
          data: {
            id: user.id + 1,
          },
        });

        console.log("updated user id", updatedUser.id);

        return updatedUser;
      },
      { timeout: 60000 }
    )
  );

  const result = await Promise.allSettled(promises);
  console.log("result", result);

  const finalUser = await prisma.user.findUnique({
    rejectOnNotFound: true,
    where: {
      email: "hello@gmail.com",
    },
  });

  console.log("finalUser id is", finalUser.id);
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
