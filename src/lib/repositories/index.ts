import { SupabaseClient } from '@supabase/supabase-js';
import { TradeRepository } from './TradeRepository';

export * from './BaseRepository';
export * from './TradeRepository';
export * from './types';

// Simple factory or singleton access if needed,
// though typically we instantiate repositories per request/component with the client
export const createTradeRepository = (client: SupabaseClient) => new TradeRepository(client);
