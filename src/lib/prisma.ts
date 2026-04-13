import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  (() => {
    const adapter = new PrismaPg(
      new Pool({
        connectionString: process.env.DATABASE_URL,
      }),
    );

    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  })();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
