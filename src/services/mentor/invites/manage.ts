/**
 * Mentor Service - Manage Invites (Accept/Reject/Revoke)
 */

import { supabase } from '@/lib/supabase';
import { MentorAccountPermission } from '@/types';

/**
 * Aceita um convite de mentoria usando o token.
 */
export async function acceptInvite(token: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

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

// ============================================
// ACCOUNT PERMISSION FUNCTIONS
// ============================================

/**
 * Busca as permissões de carteiras.
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
 * Adiciona/atualiza permissão de uma carteira.
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
 * Remove permissão de uma carteira.
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
