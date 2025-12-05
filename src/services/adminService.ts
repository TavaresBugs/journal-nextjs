import { supabase } from '@/lib/supabase';
import { UserExtended, UserStatus, UserRole, AuditLog, AdminStats } from '@/types';
import { getCurrentUserId } from './accountService';

// ============================================
// DB TYPES
// ============================================

interface DBUserExtended {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
    status: string;
    role: string;
    approved_at: string | null;
    approved_by: string | null;
    notes: string | null;
    last_login_at: string | null;
    created_at: string;
    updated_at: string;
}

interface DBAuditLog {
    id: string;
    user_id: string | null;
    action: string;
    resource_type: string | null;
    resource_id: string | null;
    ip_address: string | null;
    user_agent: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
}

// ============================================
// MAPPERS
// ============================================

const mapUserFromDB = (db: DBUserExtended): UserExtended => ({
    id: db.id,
    email: db.email,
    name: db.name || undefined,
    avatarUrl: db.avatar_url || undefined,
    status: db.status as UserStatus,
    role: db.role as UserRole,
    approvedAt: db.approved_at || undefined,
    approvedBy: db.approved_by || undefined,
    notes: db.notes || undefined,
    lastLoginAt: db.last_login_at || undefined,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
});

const mapAuditLogFromDB = (db: DBAuditLog): AuditLog => ({
    id: db.id,
    userId: db.user_id || undefined,
    action: db.action,
    resourceType: db.resource_type || undefined,
    resourceId: db.resource_id || undefined,
    ipAddress: db.ip_address || undefined,
    userAgent: db.user_agent || undefined,
    metadata: db.metadata || undefined,
    createdAt: db.created_at,
});

// ============================================
// USER PROFILE
// ============================================

/**
 * Busca o perfil estendido do usuário logado.
 * @returns {Promise<UserExtended | null>} O perfil do usuário ou null.
 * @example
 * const user = await getCurrentUserExtended();
 */
export async function getCurrentUserExtended(): Promise<UserExtended | null> {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const { data, error } = await supabase
        .from('users_extended')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (error) {
        console.error('[getCurrentUserExtended] Error:', error);
        return null;
    }

    return data ? mapUserFromDB(data) : null;
}

/**
 * Verifica se o usuário logado é admin.
 * @returns {Promise<boolean>} True se for admin, False caso contrário.
 * @example
 * const isAdminUser = await isAdmin();
 */
export async function isAdmin(): Promise<boolean> {
    const user = await getCurrentUserExtended();
    return user?.role === 'admin';
}

/**
 * Verifica se o usuário está aprovado.
 * @returns {Promise<boolean>} True se aprovado, False caso contrário.
 * @example
 * const approved = await isApproved();
 */
export async function isApproved(): Promise<boolean> {
    const user = await getCurrentUserExtended();
    return user?.status === 'approved';
}

/**
 * Atualiza o último login do usuário.
 * @returns {Promise<void>}
 * @example
 * await updateLastLogin();
 */
export async function updateLastLogin(): Promise<void> {
    const userId = await getCurrentUserId();
    if (!userId) return;

    await supabase
        .from('users_extended')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId);
}

// ============================================
// ADMIN: USER MANAGEMENT
// ============================================

/**
 * Lista todos os usuários (admin only).
 * @returns {Promise<UserExtended[]>} Lista de usuários.
 * @example
 * const users = await getAllUsers();
 */
export async function getAllUsers(): Promise<UserExtended[]> {
    const admin = await isAdmin();
    if (!admin) {
        console.warn('[getAllUsers] Access denied: not admin');
        return [];
    }

    const { data, error } = await supabase
        .from('users_extended')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[getAllUsers] Error:', error);
        return [];
    }

    return data ? data.map(mapUserFromDB) : [];
}

/**
 * Busca usuário por ID (admin only).
 * @param {string} id - O ID do usuário.
 * @returns {Promise<UserExtended | null>} O usuário ou null.
 * @example
 * const user = await getUserById('user-id');
 */
export async function getUserById(id: string): Promise<UserExtended | null> {
    const admin = await isAdmin();
    if (!admin) {
        console.warn('[getUserById] Access denied: not admin');
        return null;
    }

    const { data, error } = await supabase
        .from('users_extended')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error) {
        console.error('[getUserById] Error:', error);
        return null;
    }

    return data ? mapUserFromDB(data) : null;
}

/**
 * Atualiza status do usuário (admin only).
 * @param {string} id - O ID do usuário.
 * @param {UserStatus} status - O novo status.
 * @param {string} [notes] - Notas opcionais.
 * @returns {Promise<boolean>} True se sucesso, False caso contrário.
 * @example
 * const success = await updateUserStatus('user-id', 'approved', 'User approved manually');
 */
export async function updateUserStatus(
    id: string, 
    status: UserStatus,
    notes?: string
): Promise<boolean> {
    const userId = await getCurrentUserId();
    const admin = await isAdmin();
    
    if (!admin || !userId) {
        console.warn('[updateUserStatus] Access denied');
        return false;
    }

    const updateData: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
    };

    if (status === 'approved') {
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = userId;
    }

    if (notes !== undefined) {
        updateData.notes = notes;
    }

    const { error } = await supabase
        .from('users_extended')
        .update(updateData)
        .eq('id', id);

    if (error) {
        console.error('[updateUserStatus] Error:', error);
        return false;
    }

    // Log da ação
    await logAction('user_status_change', 'user', id, { 
        new_status: status,
        notes 
    });

    return true;
}

/**
 * Atualiza role do usuário (admin only).
 * @param {string} id - O ID do usuário.
 * @param {UserRole} role - O novo role.
 * @returns {Promise<boolean>} True se sucesso, False caso contrário.
 * @example
 * const success = await updateUserRole('user-id', 'admin');
 */
export async function updateUserRole(id: string, role: UserRole): Promise<boolean> {
    const admin = await isAdmin();
    if (!admin) {
        console.warn('[updateUserRole] Access denied');
        return false;
    }

    const { error } = await supabase
        .from('users_extended')
        .update({ 
            role,
            updated_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) {
        console.error('[updateUserRole] Error:', error);
        return false;
    }

    await logAction('user_role_change', 'user', id, { new_role: role });

    return true;
}

// ============================================
// ADMIN: STATS
// ============================================

/**
 * Busca estatísticas para o dashboard admin.
 * @returns {Promise<AdminStats | null>} As estatísticas ou null.
 * @example
 * const stats = await getAdminStats();
 */
export async function getAdminStats(): Promise<AdminStats | null> {
    const admin = await isAdmin();
    if (!admin) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: users, error: usersError } = await supabase
        .from('users_extended')
        .select('status, role, created_at, last_login_at');

    if (usersError) {
        console.error('[getAdminStats] Error:', usersError);
        return null;
    }

    if (!users) return null;

    const stats: AdminStats = {
        totalUsers: users.length,
        pendingUsers: users.filter(u => u.status === 'pending').length,
        approvedUsers: users.filter(u => u.status === 'approved').length,
        suspendedUsers: users.filter(u => u.status === 'suspended').length,
        bannedUsers: users.filter(u => u.status === 'banned').length,
        adminUsers: users.filter(u => u.role === 'admin').length,
        todayLogins: users.filter(u => 
            u.last_login_at && new Date(u.last_login_at) >= today
        ).length,
        todaySignups: users.filter(u => 
            new Date(u.created_at) >= today
        ).length,
    };

    return stats;
}

// ============================================
// AUDIT LOGS
// ============================================

/**
 * Registra uma ação no audit log.
 * @param {string} action - A ação realizada.
 * @param {string} [resourceType] - Tipo do recurso afetado.
 * @param {string} [resourceId] - ID do recurso afetado.
 * @param {Record<string, unknown>} [metadata] - Metadados adicionais.
 * @returns {Promise<string | null>} O ID do log ou null.
 * @example
 * await logAction('create_user', 'user', 'user-id', { role: 'admin' });
 */
export async function logAction(
    action: string,
    resourceType?: string,
    resourceId?: string,
    metadata?: Record<string, unknown>
): Promise<string | null> {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
        .from('audit_logs')
        .insert({
            user_id: userId,
            action,
            resource_type: resourceType,
            resource_id: resourceId,
            metadata: metadata || {},
        })
        .select('id')
        .single();

    if (error) {
        console.error('[logAction] Error:', error);
        return null;
    }

    return data?.id || null;
}

/**
 * Lista audit logs (admin only).
 * @param {object} [options] - Opções de filtro e paginação.
 * @param {string} [options.userId] - Filtrar por usuário.
 * @param {string} [options.action] - Filtrar por ação.
 * @param {string} [options.resourceType] - Filtrar por tipo de recurso.
 * @param {number} [options.limit] - Limite de registros.
 * @param {number} [options.offset] - Deslocamento para paginação.
 * @returns {Promise<AuditLog[]>} Lista de logs.
 * @example
 * const logs = await getAuditLogs({ limit: 10 });
 */
export async function getAuditLogs(options?: {
    userId?: string;
    action?: string;
    resourceType?: string;
    limit?: number;
    offset?: number;
}): Promise<AuditLog[]> {
    const admin = await isAdmin();
    if (!admin) {
        console.warn('[getAuditLogs] Access denied');
        return [];
    }

    let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

    if (options?.userId) {
        query = query.eq('user_id', options.userId);
    }

    if (options?.action) {
        query = query.eq('action', options.action);
    }

    if (options?.resourceType) {
        query = query.eq('resource_type', options.resourceType);
    }

    if (options?.limit) {
        query = query.limit(options.limit);
    }

    if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
        console.error('[getAuditLogs] Error:', error);
        return [];
    }

    return data ? data.map(mapAuditLogFromDB) : [];
}

/**
 * Lista ações únicas para filtro.
 * @returns {Promise<string[]>} Lista de ações únicas.
 * @example
 * const actions = await getUniqueActions();
 */
export async function getUniqueActions(): Promise<string[]> {
    const admin = await isAdmin();
    if (!admin) return [];

    const { data, error } = await supabase
        .from('audit_logs')
        .select('action')
        .order('action');

    if (error) {
        console.error('[getUniqueActions] Error:', error);
        return [];
    }

    const actions = new Set(data?.map(d => d.action) || []);
    return Array.from(actions);
}
