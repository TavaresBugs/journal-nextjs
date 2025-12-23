/**
 * Prisma Repositories
 *
 * Type-safe repository implementations using Prisma ORM.
 * These provide full TypeScript autocompletion and type checking.
 *
 * @example
 * import { prismaTradeRepo, prismaJournalRepo } from '@/lib/database/repositories';
 * const trades = await prismaTradeRepo.getByAccountId(accountId, userId);
 */

export { prismaTradeRepo, PrismaTradeRepository } from "./TradeRepository";
export { prismaJournalRepo, PrismaJournalRepository } from "./JournalRepository";
export { prismaAccountRepo, PrismaAccountRepository } from "./AccountRepository";
export { prismaPlaybookRepo, PrismaPlaybookRepository } from "./PlaybookRepository";
export { prismaRoutineRepo, PrismaRoutineRepository } from "./RoutineRepository";
export { prismaReviewRepo, PrismaReviewRepository, type MentorReview } from "./ReviewRepository";
export {
  prismaMentalRepo,
  PrismaMentalRepository,
  type MentalProfile,
  type MentalEntry,
  type MentalLog,
} from "./MentalRepository";
export {
  prismaLaboratoryRepo,
  PrismaLaboratoryRepository,
  type LaboratoryExperiment,
  type LaboratoryRecap,
  type LaboratoryImage,
} from "./LaboratoryRepository";
export {
  prismaAdminRepo,
  PrismaAdminRepository,
  type UserExtended,
  type AuditLog,
  type AdminStats,
} from "./AdminRepository";
export {
  prismaCommunityRepo,
  PrismaCommunityRepository,
  type LeaderboardOptIn,
  type LeaderboardEntry,
  type SharedPlaybook,
} from "./CommunityRepository";
export {
  prismaMentorRepo,
  PrismaMentorRepository,
  type MentorInvite,
  type MentorAccountPermission,
  type TradeComment,
} from "./MentorRepository";
export { prismaShareRepo, PrismaShareRepository, type SharedJournal } from "./ShareRepository";
