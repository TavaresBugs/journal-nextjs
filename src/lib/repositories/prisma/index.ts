/**
 * Prisma Repositories
 *
 * Type-safe repository implementations using Prisma ORM.
 * These provide full TypeScript autocompletion and type checking.
 *
 * @example
 * import { prismaTradeRepo, prismaJournalRepo } from '@/lib/repositories/prisma';
 * const trades = await prismaTradeRepo.getByAccountId(accountId, userId);
 */

export { prismaTradeRepo, PrismaTradeRepository } from "./TradeRepository";
export { prismaJournalRepo, PrismaJournalRepository } from "./JournalRepository";
export { prismaAccountRepo, PrismaAccountRepository } from "./AccountRepository";
export { prismaPlaybookRepo, PrismaPlaybookRepository } from "./PlaybookRepository";
