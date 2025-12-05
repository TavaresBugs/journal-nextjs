// ============================================
// MENTOR SERVICE
// Serviço para gerenciamento de mentoria
// ============================================

import { supabase } from '@/lib/supabase';
import { 
    MentorInvite, 
    MentorPermission, 
    TradeComment, 
    MenteeOverview,
    Trade 
} from '@/types';

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
 * Verifica se o usuário atual é mentor:
 * 1. Tem role 'mentor' em users_extended, OU
 * 2. Tem pelo menos um mentorado aceito em mentor_invites
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
 * MENTOR convida MENTORADO para ser acompanhado
 * Fluxo: Mentor envia convite → Mentorado aceita → Mentor pode ver trades
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
 * Aceita um convite de mentoria usando o token (MENTORADO aceita)
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
 * Rejeita um convite de mentoria
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
 * Revoga um convite aceito
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
 * Lista convites enviados pelo usuário COMO MENTOR
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
 * Lista convites recebidos COMO MENTORADO (mentores querendo te acompanhar)
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
    const { data: allPending, error: debugError } = await supabase
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
 * Lista mentores do usuário (convites aceitos onde usuário é mentee)
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
 * Lista alunos do usuário (convites aceitos onde usuário é mentor)
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
 * Busca trades de um aluno específico (como mentor)
 */
export async function getMenteeTrades(menteeId: string): Promise<Trade[]> {
    const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', menteeId)
        .order('entry_date', { ascending: false });

    if (error) {
        console.error('Erro ao buscar trades do aluno:', error);
        return [];
    }

    // Map from DB format (would need to import from tradeService or duplicate mapping)
    return data || [];
}

// ============================================
// COMMENT FUNCTIONS
// ============================================

/**
 * Adiciona comentário em um trade
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
 * Busca comentários de um trade
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
 * Deleta um comentário (apenas o autor pode deletar)
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
 * Verifica se o usuário tem permissão de comentar em um trade
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
