/**
 * Prisma Client Singleton
 *
 * This file creates a singleton instance of the Prisma Client
 * to avoid multiple instances in development with hot reloading.
 *
 * @see https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
 */

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

/**
 * Prisma client instance
 * Reuses existing instance in development to prevent connection exhaustion
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export type { PrismaClient };

// Re-export security utilities
export * from "./security";
export * from "./auth";

// Re-export storage functions (Prisma alternatives)
export * as prismaStorage from "./storage";
