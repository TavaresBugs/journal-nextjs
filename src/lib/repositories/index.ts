import { SupabaseClient } from "@supabase/supabase-js";
import { TradeRepository } from "./TradeRepository";
import { JournalRepository } from "./JournalRepository";
import { PlaybookRepository } from "./PlaybookRepository";
import { AccountRepository } from "./AccountRepository";

export * from "./BaseRepository";
export * from "./TradeRepository";
export * from "./JournalRepository";
export * from "./PlaybookRepository";
export * from "./AccountRepository";
export * from "@/lib/database/types";

// Factory functions for creating repositories
export const createTradeRepository = (client: SupabaseClient) => new TradeRepository(client);
export const createJournalRepository = (client: SupabaseClient) => new JournalRepository(client);
export const createPlaybookRepository = (client: SupabaseClient) => new PlaybookRepository(client);
export const createAccountRepository = (client: SupabaseClient) => new AccountRepository(client);
