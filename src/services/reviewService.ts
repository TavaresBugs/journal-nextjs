// ============================================
// REVIEW SERVICE
// Serviço para CRUD de correções/comentários de mentoria
// ============================================

import { supabase } from '@/lib/supabase';

// ============================================
// TYPES
// ============================================

export interface MentorReview {
    id: string;
    mentorId: string;
    menteeId: string;
    tradeId?: string;
    journalEntryId?: string;
    reviewType: 'correction' | 'comment' | 'suggestion';
    content: string;
    rating?: number;
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
    // Context data for notifications
    entryDate?: string;
    entryAccountId?: string;
}

// ============================================
// DB TYPES (snake_case)
// ============================================

interface DBMentorReview {
    id: string;
    mentor_id: string;
    mentee_id: string;
    trade_id?: string;
    journal_entry_id?: string;
    review_type: string;
    content: string;
    rating?: number;
    is_read: boolean;
    created_at: string;
    updated_at: string;
    journal_entries?: {
        date: string;
        account_id: string;
    } | null;
}

// ============================================
// MAPPING FUNCTIONS
// ============================================

function mapReviewFromDB(db: DBMentorReview): MentorReview {
    return {
        id: db.id,
        mentorId: db.mentor_id,
        menteeId: db.mentee_id,
        tradeId: db.trade_id || undefined,
        journalEntryId: db.journal_entry_id || undefined,
        reviewType: db.review_type as MentorReview['reviewType'],
        content: db.content,
        rating: db.rating || undefined,
        isRead: db.is_read,
        createdAt: db.created_at,
        updatedAt: db.updated_at,
        entryDate: db.journal_entries?.date,
        entryAccountId: db.journal_entries?.account_id,
    };
}

// ============================================
// MENTOR FUNCTIONS
// ============================================

/**
 * Cria uma nova review (correção/comentário).
 * @param {Omit<MentorReview, 'id' | 'createdAt' | 'updatedAt' | 'isRead'>} data - Dados da review.
 * @returns {Promise<MentorReview | null>} A review criada ou null.
 * @example
 * const review = await createReview({
 *   mentorId: 'mentor-id',
 *   menteeId: 'mentee-id',
 *   reviewType: 'correction',
 *   content: 'Review content'
 * });
 */
export async function createReview(
    data: Omit<MentorReview, 'id' | 'createdAt' | 'updatedAt' | 'isRead'>
): Promise<MentorReview | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error('[createReview] No authenticated user');
        return null;
    }

    const { data: created, error } = await supabase
        .from('mentor_reviews')
        .insert({
            mentor_id: user.id,
            mentee_id: data.menteeId,
            trade_id: data.tradeId,
            journal_entry_id: data.journalEntryId,
            review_type: data.reviewType,
            content: data.content,
            rating: data.rating,
            is_read: false
        })
        .select()
        .single();

    if (error) {
        console.error('[createReview] Error creating review:', error);
        return null;
    }

    return mapReviewFromDB(created);
}

/**
 * Atualiza uma review existente.
 * @param {string} id - O ID da review.
 * @param {string} content - O novo conteúdo.
 * @returns {Promise<boolean>} True se sucesso, False caso contrário.
 * @example
 * const success = await updateReview('review-id', 'New content');
 */
export async function updateReview(id: string, content: string): Promise<boolean> {
    const { error } = await supabase
        .from('mentor_reviews')
        .update({
            content,
            updated_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) {
        console.error('[updateReview] Error updating review:', error);
        return false;
    }

    return true;
}

/**
 * Deleta uma review.
 * @param {string} id - O ID da review.
 * @returns {Promise<boolean>} True se sucesso, False caso contrário.
 * @example
 * const success = await deleteReview('review-id');
 */
export async function deleteReview(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('mentor_reviews')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('[deleteReview] Error deleting review:', error);
        return false;
    }

    return true;
}

/**
 * Busca todas as reviews feitas para um mentorado específico.
 * @param {string} menteeId - O ID do mentorado.
 * @returns {Promise<MentorReview[]>} Lista de reviews.
 * @example
 * const reviews = await getReviewsForMentee('mentee-id');
 */
export async function getReviewsForMentee(menteeId: string): Promise<MentorReview[]> {
    const { data, error } = await supabase
        .from('mentor_reviews')
        .select('*')
        .eq('mentee_id', menteeId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[getReviewsForMentee] Error fetching reviews:', error);
        return [];
    }

    return (data || []).map(mapReviewFromDB);
}

// ============================================
// MENTEE FUNCTIONS
// ============================================

/**
 * Busca todas as reviews recebidas pelo usuário logado.
 * @returns {Promise<MentorReview[]>} Lista de reviews.
 * @example
 * const reviews = await getMyReviews();
 */
export async function getMyReviews(): Promise<MentorReview[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error('[getMyReviews] No authenticated user');
        return [];
    }

    const { data, error } = await supabase
        .from('mentor_reviews')
        .select('*, journal_entries(date, account_id)')
        .eq('mentee_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[getMyReviews] Error fetching reviews:', error);
        return [];
    }

    // Cast data because Supabase types might not infer the join perfectly without generated types
    return (data as unknown as DBMentorReview[] || []).map(mapReviewFromDB);
}

/**
 * Busca reviews específicas de um trade.
 * @param {string} tradeId - O ID do trade.
 * @returns {Promise<MentorReview[]>} Lista de reviews.
 * @example
 * const reviews = await getReviewsForTrade('trade-id');
 */
export async function getReviewsForTrade(tradeId: string): Promise<MentorReview[]> {
    const { data, error } = await supabase
        .from('mentor_reviews')
        .select('*')
        .eq('trade_id', tradeId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('[getReviewsForTrade] Error fetching reviews:', error);
        return [];
    }

    return (data || []).map(mapReviewFromDB);
}

/**
 * Busca reviews específicas de um journal entry.
 * @param {string} journalEntryId - O ID do journal entry.
 * @returns {Promise<MentorReview[]>} Lista de reviews.
 */
export async function getReviewsForJournalEntry(journalEntryId: string): Promise<MentorReview[]> {
    const { data, error } = await supabase
        .from('mentor_reviews')
        .select('*')
        .eq('journal_entry_id', journalEntryId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('[getReviewsForJournalEntry] Error fetching reviews:', error);
        return [];
    }

    return (data || []).map(mapReviewFromDB);
}

/**
 * Busca reviews para um conjunto de trades e journal entries.
 * Útil para carregar notificações em lote (ex: DayDetailModal).
 * @param {string[]} tradeIds - Lista de IDs de trades.
 * @param {string[]} journalEntryIds - Lista de IDs de journal entries.
 * @returns {Promise<MentorReview[]>} Lista de reviews.
 */
export async function getReviewsForContext(
    tradeIds: string[], 
    journalEntryIds: string[]
): Promise<MentorReview[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
        .from('mentor_reviews')
        .select('*')
        .eq('mentee_id', user.id);

    // Filter by IDs if provided
    const conditions = [];
    if (tradeIds.length > 0) conditions.push(`trade_id.in.(${tradeIds.join(',')})`);
    if (journalEntryIds.length > 0) conditions.push(`journal_entry_id.in.(${journalEntryIds.join(',')})`);

    if (conditions.length === 0) return []; // Nothing to fetch

    // OR logic: trade_id IN (...) OR journal_entry_id IN (...)
    // Supabase .or() syntax is string based: 'condition1,condition2'
    query = query.or(conditions.join(','));

    const { data, error } = await query;

    if (error) {
        // Log only if it's not a syntax error due to empty lists (handled above but safety first)
        console.error('[getReviewsForContext] Error fetching reviews:', error);
        return [];
    }

    return (data || []).map(mapReviewFromDB);
}

/**
 * Marca uma review como lida.
 * @param {string} id - O ID da review.
 * @returns {Promise<boolean>} True se sucesso, False caso contrário.
 * @example
 * const success = await markReviewAsRead('review-id');
 */
export async function markReviewAsRead(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('mentor_reviews')
        .update({ is_read: true })
        .eq('id', id);

    if (error) {
        console.error('[markReviewAsRead] Error updating read status:', error);
        return false;
    }

    return true;
}

/**
 * Conta quantas reviews não lidas o usuário tem.
 * @returns {Promise<number>} Contagem de reviews não lidas.
 * @example
 * const count = await getUnreadReviewCount();
 */
export async function getUnreadReviewCount(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
        .from('mentor_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('mentee_id', user.id)
        .eq('is_read', false);

    if (error) {
        console.error('[getUnreadReviewCount] Error fetching count:', error);
        return 0;
    }

    return count || 0;
}
