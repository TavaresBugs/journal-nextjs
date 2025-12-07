// ============================================
// MENTOR SERVICE
// Serviço para gerenciamento de mentoria
// ============================================

import { supabase } from '@/lib/supabase';
import { mapTradeFromDB } from '@/services/tradeService';
import { 
    MentorInvite, 
    MentorPermission, 
    TradeComment, 
    MenteeOverview,
    Trade,
    JournalEntry,
    DailyRoutine,
    MentorAccountPermission
} from '@/types';
import { DBTrade } from '@/types/database';

// ============================================
// DB TYPES (snake_case)
// ============================================

interface DBMentorInvite {
    id: string;
    mentor_id: string;
    mentor_email: string;
    mentee_id: string | null;
    mentee_email: string;
    permission: string;
    status: string;
    invite_token: string;
    created_at: string;
    accepted_at: string | null;
    expires_at: string;
}

interface DBTradeComment {
    id: string;
    trade_id: string;
    user_id: string;
    content: string;
    created_at: string;
    updated_at: string;
}

// ============================================
// MAPPING FUNCTIONS
// ============================================

function mapInviteFromDB(db: DBMentorInvite): MentorInvite {
    return {
        id: db.id,
        mentorId: db.mentor_id,
        mentorEmail: db.mentor_email,
        menteeId: db.mentee_id || '',
        menteeEmail: db.mentee_email,
        permission: db.permission as MentorPermission,
        status: db.status as MentorInvite['status'],
        inviteToken: db.invite_token,
        createdAt: db.created_at,
        acceptedAt: db.accepted_at || undefined,
        expiresAt: db.expires_at,
    };
}

function mapCommentFromDB(db: DBTradeComment): TradeComment {
    return {
        id: db.id,
        tradeId: db.trade_id,
        userId: db.user_id,
        content: db.content,
        createdAt: db.created_at,
        updatedAt: db.updated_at,
    };
}

// ============================================
// ROLE CHECK FUNCTIONS
// ============================================

/**
 * Verifica se o usuário atual é mentor.
 * @returns {Promise<boolean>} True se for mentor, False caso contrário.
 * @example
 * const isUserMentor = await isMentor();
 */
export async function isMentor(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Check 1: Has mentor role in users_extended
    const { data: userExtended } = await supabase
        .from('users_extended')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

    if (userExtended?.role === 'mentor') {
        return true;
    }

    // Check 2: Has accepted mentee invites (backwards compatibility)
    const { data, error } = await supabase
        .from('mentor_invites')
        .select('id')
        .eq('mentor_id', user.id)
        .eq('status', 'accepted')
        .limit(1);

    if (error) {
        console.error('Erro ao verificar status de mentor:', error);
        return false;
    }

    return (data?.length || 0) > 0;
}

// ============================================
// INVITE FUNCTIONS
// ============================================

/**
 * Envia um convite de mentoria para um aluno.
 * @param {string} menteeEmail - Email do aluno.
 * @param {MentorPermission} [permission='view'] - Permissão inicial (padrão: 'view').
 * @returns {Promise<MentorInvite | null>} O convite criado ou null.
 * @example
 * const invite = await inviteMentee('aluno@example.com', 'comment');
 */
export async function inviteMentee(
    menteeEmail: string, 
    permission: MentorPermission = 'view'
): Promise<MentorInvite | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error('[inviteMentee] No authenticated user');
        return null;
    }

    console.log('[inviteMentee] Starting invite creation:', {
        mentorId: user.id,
        mentorEmail: user.email,
        menteeEmail: menteeEmail.toLowerCase(),
        permission,
    });

    // Verificar se já existe convite pendente para este email
    const { data: existingInvite, error: checkError } = await supabase
        .from('mentor_invites')
        .select()
        .eq('mentor_id', user.id)
        .eq('mentee_email', menteeEmail.toLowerCase())
        .eq('status', 'pending')
        .maybeSingle();

    if (checkError) {
        console.error('[inviteMentee] Error checking existing invite:', checkError);
    }

    if (existingInvite) {
        console.warn('[inviteMentee] Já existe um convite pendente para este email:', existingInvite);
        return mapInviteFromDB(existingInvite);
    }

    console.log('[inviteMentee] No existing invite found, creating new one...');

    const { data, error } = await supabase
        .from('mentor_invites')
        .insert({
            mentor_id: user.id,
            mentor_email: user.email?.toLowerCase(),
            mentee_email: menteeEmail.toLowerCase(),
            permission,
        })
        .select()
        .single();

    if (error) {
        console.error('[inviteMentee] Error creating invite:', error);
        console.error('[inviteMentee] Error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
        });
        return null;
    }

    console.log('[inviteMentee] SUCCESS - Invite created:', data);
    return mapInviteFromDB(data);
}

/**
 * @deprecated Use inviteMentee instead - Mantido para compatibilidade
 */
export async function inviteMentor(
    mentorEmail: string, 
    permission: MentorPermission = 'view'
): Promise<MentorInvite | null> {
    console.warn('inviteMentor is deprecated, use inviteMentee instead');
    return inviteMentee(mentorEmail, permission);
}

/**
 * Aceita um convite de mentoria usando o token.
 * @param {string} token - O token do convite.
 * @returns {Promise<boolean>} True se sucesso, False caso contrário.
 * @example
 * const success = await acceptInvite('token-uuid');
 */
export async function acceptInvite(token: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Atualizar o convite com o mentee_id
    const { error } = await supabase
        .from('mentor_invites')
        .update({ 
            mentee_id: user.id,
            status: 'accepted',
            accepted_at: new Date().toISOString()
        })
        .eq('invite_token', token)
        .eq('status', 'pending');

    if (error) {
        console.error('Erro ao aceitar convite:', error);
        return false;
    }

    return true;
}

/**
 * Rejeita um convite de mentoria.
 * @param {string} inviteId - O ID do convite.
 * @returns {Promise<boolean>} True se sucesso, False caso contrário.
 * @example
 * const success = await rejectInvite('invite-id');
 */
export async function rejectInvite(inviteId: string): Promise<boolean> {
    const { error } = await supabase
        .from('mentor_invites')
        .update({ status: 'rejected' })
        .eq('id', inviteId)
        .eq('status', 'pending');

    if (error) {
        console.error('Erro ao rejeitar convite:', error);
        return false;
    }

    return true;
}

/**
 * Revoga um convite de mentoria aceito.
 * @param {string} inviteId - O ID do convite.
 * @returns {Promise<boolean>} True se sucesso, False caso contrário.
 * @example
 * const success = await revokeInvite('invite-id');
 */
export async function revokeInvite(inviteId: string): Promise<boolean> {
    const { error } = await supabase
        .from('mentor_invites')
        .update({ status: 'revoked' })
        .eq('id', inviteId);

    if (error) {
        console.error('Erro ao revogar convite:', error);
        return false;
    }

    return true;
}

/**
 * Lista os convites enviados pelo usuário logado (como mentor).
 * @returns {Promise<MentorInvite[]>} Lista de convites enviados.
 * @example
 * const invites = await getSentInvites();
 */
export async function getSentInvites(): Promise<MentorInvite[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.log('[getSentInvites] No authenticated user');
        return [];
    }

    console.log('[getSentInvites] Fetching invites for mentor:', user.id, user.email);

    const { data, error } = await supabase
        .from('mentor_invites')
        .select('*')
        .eq('mentor_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[getSentInvites] Error:', error);
        return [];
    }

    console.log('[getSentInvites] Found invites:', data?.length || 0, data);

    return (data || []).map(mapInviteFromDB);
}

/**
 * Lista os convites recebidos pelo usuário logado (como mentorado).
 * @returns {Promise<MentorInvite[]>} Lista de convites recebidos.
 * @example
 * const invites = await getReceivedInvites();
 */
export async function getReceivedInvites(): Promise<MentorInvite[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
        console.log('[getReceivedInvites] No user or email');
        return [];
    }

    const userEmail = user.email.toLowerCase();
    console.log('[getReceivedInvites] Checking invites for email:', userEmail);
    console.log('[getReceivedInvites] Current time (ISO):', new Date().toISOString());

    // First, let's check ALL pending invites for this email (without expires filter)
    const { data: allPending } = await supabase
        .from('mentor_invites')
        .select('*')
        .eq('mentee_email', userEmail)
        .eq('status', 'pending');

    console.log('[getReceivedInvites] All pending (no expires filter):', allPending?.length || 0, allPending);
    
    if (allPending && allPending.length > 0) {
        allPending.forEach(inv => {
            console.log('[getReceivedInvites] Invite expires_at:', inv.expires_at, 'is future?', new Date(inv.expires_at) > new Date());
        });
    }

    // Now the actual query with expires filter
    const { data, error } = await supabase
        .from('mentor_invites')
        .select('*')
        .eq('mentee_email', userEmail)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[getReceivedInvites] Error:', error);
        return [];
    }

    console.log('[getReceivedInvites] Found invites (with expires filter):', data?.length || 0, data);

    return (data || []).map(mapInviteFromDB);
}

/**
 * Lista os mentores do usuário logado (convites aceitos onde sou mentorado).
 * @returns {Promise<MentorInvite[]>} Lista de mentores.
 * @example
 * const mentors = await getMentors();
 */
export async function getMentors(): Promise<MentorInvite[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('mentor_invites')
        .select('*')
        .eq('mentee_id', user.id)
        .eq('status', 'accepted')
        .order('accepted_at', { ascending: false });

    if (error) {
        console.error('Erro ao buscar mentores:', error);
        return [];
    }

    return (data || []).map(mapInviteFromDB);
}

/**
 * Lista os alunos do usuário logado (convites aceitos onde sou mentor).
 * @returns {Promise<MenteeOverview[]>} Lista de alunos com resumo.
 * @example
 * const mentees = await getMentees();
 */
export async function getMentees(): Promise<MenteeOverview[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Buscar convites aceitos onde sou mentor (sem JOIN problemático)
    const { data: invites, error } = await supabase
        .from('mentor_invites')
        .select('*')
        .eq('mentor_id', user.id)
        .eq('status', 'accepted');

    if (error) {
        console.error('Erro ao buscar alunos:', error);
        return [];
    }

    // Para cada aluno, buscar estatísticas
    const mentees: MenteeOverview[] = [];

    for (const invite of invites || []) {
        // Se não temos mentee_id ainda (convite aceito antes de associar), pular
        if (!invite.mentee_id) continue;
        
        // Buscar trades do aluno
        const { data: trades } = await supabase
            .from('trades')
            .select('id, outcome, entry_date')
            .eq('user_id', invite.mentee_id);

        const totalTrades = trades?.length || 0;
        const wins = trades?.filter(t => t.outcome === 'win').length || 0;
        const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;

        // Trades nos últimos 7 dias
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentTrades = trades?.filter(t => 
            new Date(t.entry_date) >= sevenDaysAgo
        ).length || 0;

        // Último trade
        const sortedTrades = [...(trades || [])].sort((a, b) => 
            new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
        );
        const lastTradeDate = sortedTrades[0]?.entry_date;

        mentees.push({
            menteeId: invite.mentee_id,
            menteeName: invite.mentee_email?.split('@')[0] || 'Mentorado',
            menteeEmail: invite.mentee_email || 'Email não disponível',
            menteeAvatar: undefined,
            permission: invite.permission as MentorPermission,
            totalTrades,
            winRate,
            recentTradesCount: recentTrades,
            lastTradeDate,
        });
    }

    return mentees;
}

/**
 * Busca os trades de um aluno específico.
 * @param {string} menteeId - O ID do aluno.
 * @param {string} [accountId] - O ID da carteira (opcional).
 * @returns {Promise<Trade[]>} Lista de trades do aluno.
 * @example
 * const trades = await getMenteeTrades('mentee-id', 'account-id');
 */
export async function getMenteeTrades(menteeId: string, accountId?: string): Promise<Trade[]> {
    let query = supabase
        .from('trades')
        .select('*')
        .eq('user_id', menteeId)
        .order('entry_date', { ascending: false });

    if (accountId) {
        query = query.eq('account_id', accountId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Erro ao buscar trades do aluno:', error);
        return [];
    }

    // Map from DB format to Trade format
    return (data || []).map((dbTrade: DBTrade) => mapTradeFromDB(dbTrade));
}

/**
 * Busca as entradas de diário de um aluno em uma data específica.
 * @param {string} menteeId - O ID do aluno.
 * @param {string} date - A data no formato YYYY-MM-DD.
 * @param {string} [accountId] - O ID da carteira (opcional).
 * @returns {Promise<JournalEntry[]>} Lista de entradas de diário.
 * @example
 * const entries = await getMenteeJournalEntries('mentee-id', '2025-12-06');
 */
export async function getMenteeJournalEntries(menteeId: string, date: string, accountId?: string): Promise<JournalEntry[]> {
    let query = supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', menteeId)
        .eq('date', date)
        .order('created_at', { ascending: false });
    
    if (accountId) {
        query = query.eq('account_id', accountId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Erro ao buscar entradas de diário do aluno:', error);
        return [];
    }

    // Map from DB format to JournalEntry format
    return (data || []).map(db => ({
        id: db.id,
        userId: db.user_id,
        accountId: db.account_id,
        date: db.date,
        title: db.title,
        asset: db.asset,
        tradeId: db.trade_id,
        images: db.images || [],
        emotion: db.emotion,
        analysis: db.analysis,
        notes: db.notes,
        createdAt: db.created_at,
        updatedAt: db.updated_at,
    }));
}

/**
 * Busca a rotina diária de um aluno em uma data específica.
 * @param {string} menteeId - O ID do aluno.
 * @param {string} date - A data no formato YYYY-MM-DD.
 * @param {string} [accountId] - O ID da carteira (opcional).
 * @returns {Promise<DailyRoutine | null>} A rotina diária ou null.
 * @example
 * const routine = await getMenteeRoutine('mentee-id', '2025-12-06');
 */
export async function getMenteeRoutine(menteeId: string, date: string, accountId?: string): Promise<DailyRoutine | null> {
    let query = supabase
        .from('daily_routines')
        .select('*')
        .eq('user_id', menteeId)
        .eq('date', date);
    
    if (accountId) {
        query = query.eq('account_id', accountId);
    }

    // Rotinas são normalmente por dia, mas podem ser vinculadas a conta
    // Se passar accountId, tenta filtrar. Se não, pega a primeira encontrada.
    const { data, error } = await query.maybeSingle();

    if (error) {
        console.error('Erro ao buscar rotina do aluno:', error);
        return null;
    }

    if (!data) return null;

    // Map from DB format to DailyRoutine format
    return {
        id: data.id,
        userId: data.user_id,
        accountId: data.account_id,
        date: data.date,
        aerobic: data.aerobic,
        diet: data.diet,
        reading: data.reading,
        meditation: data.meditation,
        preMarket: data.pre_market,
        prayer: data.prayer,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
    };
}

// ============================================
// COMMENT FUNCTIONS
// ============================================

/**
 * Adiciona um comentário em um trade.
 * @param {string} tradeId - O ID do trade.
 * @param {string} content - O conteúdo do comentário.
 * @returns {Promise<TradeComment | null>} O comentário criado ou null.
 * @example
 * const comment = await addTradeComment('trade-id', 'Bom trade!');
 */
export async function addTradeComment(
    tradeId: string, 
    content: string
): Promise<TradeComment | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('trade_comments')
        .insert({
            trade_id: tradeId,
            user_id: user.id,
            content: content.trim(),
        })
        .select()
        .single();

    if (error) {
        console.error('Erro ao adicionar comentário:', error);
        return null;
    }

    return mapCommentFromDB(data);
}

/**
 * Busca todos os comentários de um trade.
 * @param {string} tradeId - O ID do trade.
 * @returns {Promise<TradeComment[]>} Lista de comentários.
 * @example
 * const comments = await getTradeComments('trade-id');
 */
export async function getTradeComments(tradeId: string): Promise<TradeComment[]> {
    const { data, error } = await supabase
        .from('trade_comments')
        .select('*')
        .eq('trade_id', tradeId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Erro ao buscar comentários:', error);
        return [];
    }

    return (data || []).map(item => ({
        ...mapCommentFromDB(item),
        userName: 'Mentor',
        userAvatar: undefined,
    }));
}

/**
 * Exclui um comentário pelo ID.
 * @param {string} commentId - O ID do comentário.
 * @returns {Promise<boolean>} True se sucesso, False caso contrário.
 * @example
 * const success = await deleteTradeComment('comment-id');
 */
export async function deleteTradeComment(commentId: string): Promise<boolean> {
    const { error } = await supabase
        .from('trade_comments')
        .delete()
        .eq('id', commentId);

    if (error) {
        console.error('Erro ao deletar comentário:', error);
        return false;
    }

    return true;
}

/**
 * Verifica se o usuário atual pode comentar em um trade específico.
 * @param {string} tradeId - O ID do trade.
 * @returns {Promise<boolean>} True se tiver permissão, False caso contrário.
 * @example
 * const canComment = await canCommentOnTrade('trade-id');
 */
export async function canCommentOnTrade(tradeId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Verificar se é dono do trade
    const { data: trade } = await supabase
        .from('trades')
        .select('user_id')
        .eq('id', tradeId)
        .single();

    if (trade?.user_id === user.id) return true;

    // Verificar se é mentor com permissão de comentar
    const { data: invite } = await supabase
        .from('mentor_invites')
        .select('permission')
        .eq('mentor_id', user.id)
        .eq('mentee_id', trade?.user_id)
        .eq('status', 'accepted')
        .eq('permission', 'comment')
        .maybeSingle();

    return invite !== null;
}

/**
 * Busca todos os mentores do usuário atual (mentorado).
 * @returns {Promise<MentorInvite[]>} Lista de mentores aceitos.
 */
export async function getMyMentors(): Promise<MentorInvite[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('mentor_invites')
        .select('*')
        .eq('mentee_id', user.id)
        .eq('status', 'accepted');

    if (error) {
        console.error('Erro ao buscar mentores:', error);
        return [];
    }

    // Mapear snake_case para camelCase
    return (data || []).map(invite => ({
        id: invite.id,
        mentorId: invite.mentor_id,
        mentorEmail: invite.mentor_email,
        // mentorName: não temos no DB, teria que buscar profile
        menteeId: invite.mentee_id,
        menteeEmail: invite.mentee_email,
        permission: invite.permission,
        status: invite.status,
        inviteToken: invite.invite_token,
        createdAt: invite.created_at,
        acceptedAt: invite.accepted_at,
        expiresAt: invite.expires_at,
    }));
}

// ============================================
// ACCOUNT PERMISSION FUNCTIONS
// ============================================

/**
 * Busca as permissões de carteiras que o mentorado compartilhou com um mentor específico.
 * Usado pelo MENTORADO para ver/gerenciar suas permissões.
 * @param {string} inviteId - O ID do convite de mentoria.
 * @returns {Promise<MentorAccountPermission[]>} Lista de permissões.
 */
export async function getAccountPermissions(inviteId: string): Promise<MentorAccountPermission[]> {
    const { data, error } = await supabase
        .from('mentor_account_permissions')
        .select(`
            *,
            accounts:account_id (name)
        `)
        .eq('invite_id', inviteId);

    if (error) {
        console.error('Erro ao buscar permissões:', error);
        return [];
    }

    return (data || []).map(db => ({
        id: db.id,
        inviteId: db.invite_id,
        accountId: db.account_id,
        accountName: db.accounts?.name,
        canViewTrades: db.can_view_trades,
        canViewJournal: db.can_view_journal,
        canViewRoutines: db.can_view_routines,
        createdAt: db.created_at,
        updatedAt: db.updated_at,
    }));
}

/**
 * Adiciona/atualiza permissão de uma carteira para um mentor.
 * Usado pelo MENTORADO para compartilhar uma carteira.
 * @param {string} inviteId - O ID do convite de mentoria.
 * @param {string} accountId - O ID da carteira.
 * @param {object} permissions - Permissões a serem definidas.
 * @returns {Promise<boolean>} True se sucesso, False caso contrário.
 */
export async function setAccountPermission(
    inviteId: string, 
    accountId: string, 
    permissions: { 
        canViewTrades?: boolean; 
        canViewJournal?: boolean; 
        canViewRoutines?: boolean;
    }
): Promise<boolean> {
    const { error } = await supabase
        .from('mentor_account_permissions')
        .upsert({
            invite_id: inviteId,
            account_id: accountId,
            can_view_trades: permissions.canViewTrades ?? true,
            can_view_journal: permissions.canViewJournal ?? true,
            can_view_routines: permissions.canViewRoutines ?? true,
            updated_at: new Date().toISOString(),
        }, {
            onConflict: 'invite_id,account_id'
        });

    if (error) {
        console.error('Erro ao definir permissão:', error);
        return false;
    }

    return true;
}

/**
 * Remove permissão de uma carteira para um mentor.
 * Usado pelo MENTORADO para revogar acesso a uma carteira.
 * @param {string} inviteId - O ID do convite de mentoria.
 * @param {string} accountId - O ID da carteira.
 * @returns {Promise<boolean>} True se sucesso, False caso contrário.
 */
export async function removeAccountPermission(
    inviteId: string, 
    accountId: string
): Promise<boolean> {
    const { error } = await supabase
        .from('mentor_account_permissions')
        .delete()
        .eq('invite_id', inviteId)
        .eq('account_id', accountId);

    if (error) {
        console.error('Erro ao remover permissão:', error);
        return false;
    }

    return true;
}

/**
 * Busca as carteiras permitidas de um mentorado para o mentor atual.
 * Usado pelo MENTOR para obter lista de carteiras que pode ver.
 * @param {string} menteeId - O ID do mentorado.
 * @returns {Promise<Array<{id: string; name: string; currency: string}>>} Lista de carteiras permitidas.
 */
export async function getMenteePermittedAccounts(menteeId: string): Promise<Array<{id: string; name: string; currency: string}>> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Buscar o invite ativo entre mentor e mentorado
    const { data: invite } = await supabase
        .from('mentor_invites')
        .select('id')
        .eq('mentor_id', user.id)
        .eq('mentee_id', menteeId)
        .eq('status', 'accepted')
        .maybeSingle();

    if (!invite) return [];

    // Buscar permissões de carteiras
    const { data, error } = await supabase
        .from('mentor_account_permissions')
        .select(`
            account_id,
            accounts:account_id (id, name, currency)
        `)
        .eq('invite_id', invite.id)
        .eq('can_view_trades', true);

    if (error) {
        console.error('Erro ao buscar carteiras permitidas:', error);
        return [];
    }

    // Usando cast para any para facilitar mapeamento do retorno complexo do Supabase
    const rows = data as any[];
    
    return rows
        .filter(d => d.accounts)
        .map(d => ({
            id: d.accounts.id,
            name: d.accounts.name,
            currency: d.accounts.currency,
        }));
}
