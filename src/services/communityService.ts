// ============================================
// COMMUNITY SERVICE
// Serviço para features de comunidade
// ============================================

import { supabase } from '@/lib/supabase';
import { 
    SharedPlaybook, 
    LeaderboardEntry, 
    LeaderboardOptIn,
    Playbook 
} from '@/types';

// ============================================
// DB TYPES (snake_case)
// ============================================

interface DBSharedPlaybook {
    id: string;
    playbook_id: string;
    user_id: string;
    is_public: boolean;
    description: string | null;
    stars: number;
    downloads: number;
    created_at: string;
    updated_at: string;
}

interface DBLeaderboardOptIn {
    user_id: string;
    display_name: string;
    show_win_rate: boolean;
    show_profit_factor: boolean;
    show_total_trades: boolean;
    show_pnl: boolean;
    created_at: string;
    updated_at: string;
}

// ============================================
// MAPPING FUNCTIONS
// ============================================

function mapSharedPlaybookFromDB(db: DBSharedPlaybook): SharedPlaybook {
    return {
        id: db.id,
        playbookId: db.playbook_id,
        userId: db.user_id,
        isPublic: db.is_public,
        description: db.description || undefined,
        stars: db.stars,
        downloads: db.downloads,
        createdAt: db.created_at,
        updatedAt: db.updated_at,
    };
}

function mapLeaderboardOptInFromDB(db: DBLeaderboardOptIn): LeaderboardOptIn {
    return {
        userId: db.user_id,
        displayName: db.display_name,
        showWinRate: db.show_win_rate,
        showProfitFactor: db.show_profit_factor,
        showTotalTrades: db.show_total_trades,
        showPnl: db.show_pnl,
        createdAt: db.created_at,
        updatedAt: db.updated_at,
    };
}

// ============================================
// PLAYBOOK SHARING FUNCTIONS
// ============================================

/**
 * Compartilha um playbook publicamente ou atualiza um compartilhamento existente.
 * @param {string} playbookId - O ID do playbook.
 * @param {string} [description] - Descrição opcional.
 * @returns {Promise<SharedPlaybook | null>} O playbook compartilhado ou null.
 * @example
 * const shared = await sharePlaybook('playbook-id', 'Minha estratégia');
 */
export async function sharePlaybook(
    playbookId: string, 
    description?: string
): Promise<SharedPlaybook | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Verificar se playbook já está compartilhado
    const { data: existing } = await supabase
        .from('shared_playbooks')
        .select()
        .eq('playbook_id', playbookId)
        .maybeSingle();

    if (existing) {
        // Atualizar para público
        const { data, error } = await supabase
            .from('shared_playbooks')
            .update({ 
                is_public: true, 
                description,
                updated_at: new Date().toISOString() 
            })
            .eq('id', existing.id)
            .select()
            .single();

        if (error) {
            console.error('Erro ao atualizar share:', error);
            return null;
        }

        return mapSharedPlaybookFromDB(data);
    }

    // Criar novo share
    const { data, error } = await supabase
        .from('shared_playbooks')
        .insert({
            playbook_id: playbookId,
            user_id: user.id,
            is_public: true,
            description,
        })
        .select()
        .single();

    if (error) {
        console.error('Erro ao compartilhar playbook:', error);
        return null;
    }

    return mapSharedPlaybookFromDB(data);
}

/**
 * Remove o compartilhamento de um playbook (torna privado).
 * @param {string} playbookId - O ID do playbook.
 * @returns {Promise<boolean>} True se sucesso, False caso contrário.
 * @example
 * const success = await unsharePlaybook('playbook-id');
 */
export async function unsharePlaybook(playbookId: string): Promise<boolean> {
    const { error } = await supabase
        .from('shared_playbooks')
        .update({ is_public: false })
        .eq('playbook_id', playbookId);

    if (error) {
        console.error('Erro ao remover compartilhamento:', error);
        return false;
    }

    return true;
}

/**
 * Lista todos os playbooks públicos, incluindo estatísticas e detalhes do autor.
 * @returns {Promise<SharedPlaybook[]>} Lista de playbooks compartilhados.
 * @example
 * const playbooks = await getPublicPlaybooks();
 */
export async function getPublicPlaybooks(): Promise<SharedPlaybook[]> {
    const { data: { user } } = await supabase.auth.getUser();

    // Buscar shared_playbooks com o playbook relacionado
    const { data, error } = await supabase
        .from('shared_playbooks')
        .select(`
            *,
            playbook:playbooks(*)
        `)
        .eq('is_public', true)
        .order('stars', { ascending: false });

    if (error) {
        console.error('Erro ao buscar playbooks públicos:', error);
        return [];
    }

    // Verificar se o usuário atual deu star em cada playbook
    let userStars: Set<string> = new Set();
    if (user) {
        const { data: stars } = await supabase
            .from('playbook_stars')
            .select('shared_playbook_id')
            .eq('user_id', user.id);

        userStars = new Set((stars || []).map(s => s.shared_playbook_id));
    }

    // Buscar nomes dos usuários de forma separada
    const userIds = [...new Set((data || []).map(item => item.user_id))];
    const userNames: Map<string, string> = new Map();
    
    if (userIds.length > 0) {
        const { data: users } = await supabase
            .from('users_extended')
            .select('id, name')
            .in('id', userIds);
        
        (users || []).forEach(u => {
            if (u.name) userNames.set(u.id, u.name);
        });
    }

    // Buscar stats do autor para cada playbook
    // const playbookNames = (data || []).map(item => item.playbook?.name).filter(Boolean);
    const authorStats: Map<string, { 
        totalTrades: number; 
        wins: number; 
        losses: number; 
        netPnl: number;
        avgRR: number;
        maxWinStreak: number;
        avgDuration?: string;
        preferredSymbol?: string;
        preferredSession?: string;
    }> = new Map();
    
    // Para cada user_id + playbook_name, buscar trades
    for (const item of (data || [])) {
        if (!item.playbook?.name) continue;
        
        const key = `${item.user_id}:${item.playbook_id}`;
        
        // Buscar trades do autor que usam este playbook/strategy
        // Usando aliases para camelCase para facilitar o uso
        const { data: trades } = await supabase
            .from('trades')
            .select(`
                outcome, 
                pnl,
                entryDate:entry_date,
                entryTime:entry_time,
                exitDate:exit_date,
                exitTime:exit_time,
                entryPrice:entry_price,
                exitPrice:exit_price,
                stopLoss:stop_loss,
                symbol
            `)
            .eq('user_id', item.user_id)
            .eq('strategy', item.playbook.name);
        
        if (trades && trades.length > 0) {
            // Conversão forçada de tipo para evitar erros de linter nos aliases
            const typedTrades = trades as unknown as {
                outcome: string;
                pnl: number;
                entryDate: string;
                entryTime: string;
                exitDate: string;
                exitTime: string;
                entryPrice: number;
                exitPrice: number;
                stopLoss: number;
                symbol: string;
            }[];

            const wins = typedTrades.filter(t => t.outcome === 'win').length;
            const losses = typedTrades.filter(t => t.outcome === 'loss').length;
            const netPnl = typedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

            // Calcular Streak
            let currentStreak = 0;
            let maxStreak = 0;
            // Ordenar por data para cálculo de streak
            const sortedTrades = [...typedTrades].sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());
            
            for (const trade of sortedTrades) {
                if (trade.outcome === 'win') {
                    currentStreak++;
                    if (currentStreak > maxStreak) maxStreak = currentStreak;
                } else {
                    currentStreak = 0;
                }
            }

            // Calcular Avg RR
            let totalRR = 0;
            let validRRTrades = 0;
            for (const trade of typedTrades) {
                if (trade.entryPrice && trade.stopLoss && trade.exitPrice) {
                    const risk = Math.abs(trade.entryPrice - trade.stopLoss);
                    const reward = Math.abs(trade.exitPrice - trade.entryPrice);
                    if (risk > 0) {
                        totalRR += reward / risk;
                        validRRTrades++;
                    }
                }
            }
            const avgRR = validRRTrades > 0 ? totalRR / validRRTrades : 0;

            // Calcular Tempo Médio
            let totalDurationMinutes = 0;
            let validDurationTrades = 0;
            for (const trade of typedTrades) {
                if (trade.entryDate && trade.entryTime && trade.exitDate && trade.exitTime) {
                    const entry = new Date(`${trade.entryDate}T${trade.entryTime}`);
                    const exit = new Date(`${trade.exitDate}T${trade.exitTime}`);
                    
                    const diffMs = exit.getTime() - entry.getTime();
                    if (diffMs > 0) {
                        totalDurationMinutes += diffMs / (1000 * 60);
                        validDurationTrades++;
                    }
                }
            }
            const avgDurationMinutes = validDurationTrades > 0 ? totalDurationMinutes / validDurationTrades : 0;
            const avgDuration = avgDurationMinutes > 60 
                ? `${Math.floor(avgDurationMinutes / 60)}h ${Math.round(avgDurationMinutes % 60)}m`
                : `${Math.round(avgDurationMinutes)}m`;

            // Ativo Preferido
            const symbolCounts: Record<string, number> = {};
            typedTrades.forEach(t => {
                if (t.symbol) symbolCounts[t.symbol] = (symbolCounts[t.symbol] || 0) + 1;
            });
            const preferredSymbol = Object.entries(symbolCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

            // Sessão Preferida
            const sessionCounts: Record<string, number> = {};
            typedTrades.forEach(t => {
                if (t.entryTime) {
                    const hour = parseInt(t.entryTime.split(':')[0]);
                    let session = 'Outros';
                    if (hour >= 22 || hour < 8) session = 'Asiática';
                    else if (hour >= 8 && hour < 14) session = 'Londres';
                    else if (hour >= 14 && hour < 22) session = 'New York';
                    
                    sessionCounts[session] = (sessionCounts[session] || 0) + 1;
                }
            });
            const preferredSession = Object.entries(sessionCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
            
            authorStats.set(key, {
                totalTrades: trades.length,
                wins,
                losses,
                netPnl,
                avgRR,
                maxWinStreak: maxStreak,
                avgDuration,
                preferredSymbol,
                preferredSession
            });
        }
    }

    return (data || []).map(item => {
        const key = `${item.user_id}:${item.playbook_id}`;
        const stats = authorStats.get(key);
        
        let authorStatsResult = undefined;
        if (stats && stats.totalTrades > 0) {
            const winRate = (stats.wins / stats.totalTrades) * 100;
            const totalWinAmount = Math.abs(stats.netPnl > 0 ? stats.netPnl : 0);
            const totalLossAmount = Math.abs(stats.netPnl < 0 ? stats.netPnl : 0);
            const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : (totalWinAmount > 0 ? 999 : 0);
            
            authorStatsResult = {
                totalTrades: stats.totalTrades,
                winRate,
                profitFactor,
                netPnl: stats.netPnl,
                avgRR: stats.avgRR,
                maxWinStreak: stats.maxWinStreak,
                avgDuration: stats.avgDuration,
                preferredSymbol: stats.preferredSymbol,
                preferredSession: stats.preferredSession
            };
        }
        
        // Map playbook properly including rule_groups -> ruleGroups
        let mappedPlaybook: Playbook | undefined = undefined;
        if (item.playbook) {
            mappedPlaybook = {
                ...item.playbook,
                ruleGroups: item.playbook.rule_groups || item.playbook.ruleGroups || []
            } as Playbook;
        }

        return {
            ...mapSharedPlaybookFromDB(item),
            playbook: mappedPlaybook,
            userName: userNames.get(item.user_id) || 'Trader Anônimo',
            userAvatar: undefined,
            hasUserStarred: userStars.has(item.id),
            authorStats: authorStatsResult,
        };
    });
}

/**
 * Busca os playbooks compartilhados pelo usuário atual.
 * @returns {Promise<SharedPlaybook[]>} Lista de playbooks compartilhados.
 * @example
 * const myPlaybooks = await getMySharedPlaybooks();
 */
export async function getMySharedPlaybooks(): Promise<SharedPlaybook[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('shared_playbooks')
        .select(`
            *,
            playbook:playbooks(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao buscar meus playbooks compartilhados:', error);
        return [];
    }

    return (data || []).map(item => ({
        ...mapSharedPlaybookFromDB(item),
        playbook: item.playbook as Playbook | undefined,
    }));
}

/**
 * Alterna (adiciona/remove) o "star" em um playbook compartilhado.
 * @param {string} sharedPlaybookId - O ID do playbook compartilhado.
 * @returns {Promise<boolean>} True se tiver star (adicionado), False se não tiver (removido).
 * @example
 * const isStarred = await togglePlaybookStar('shared-id');
 */
export async function togglePlaybookStar(sharedPlaybookId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('toggle_playbook_star', {
        p_shared_playbook_id: sharedPlaybookId
    });

    if (error) {
        console.error('Erro ao dar/remover star:', error);
        return false;
    }

    return data; // true = tem star, false = não tem
}

/**
 * Incrementa o contador de downloads de um playbook.
 * @param {string} sharedPlaybookId - O ID do playbook compartilhado.
 * @returns {Promise<void>}
 * @example
 * await incrementPlaybookDownloads('shared-id');
 */
export async function incrementPlaybookDownloads(sharedPlaybookId: string): Promise<void> {
    await supabase
        .from('shared_playbooks')
        .update({ 
            downloads: supabase.rpc('increment', { row_id: sharedPlaybookId })
        })
        .eq('id', sharedPlaybookId);
}

// ... (existing code)

/**
 * Busca o nome de exibição atual do usuário (para auto-preenchimento).
 * @returns {Promise<string | null>} O nome de exibição ou null.
 * @example
 * const name = await getCurrentUserDisplayName();
 */
export async function getCurrentUserDisplayName(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // 1. Tentar leaderboard_opt_in (se já entrou antes)
    const { data: leader } = await supabase
        .from('leaderboard_opt_in')
        .select('display_name')
        .eq('user_id', user.id)
        .maybeSingle();
    if (leader?.display_name) return leader.display_name;

    // 2. Tentar raw_user_metadata
    if (user.user_metadata?.first_name) return user.user_metadata.first_name;
    if (user.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user.user_metadata?.name) return user.user_metadata.name;

    return null;
}

/**
 * Inscreve o usuário no leaderboard com as preferências selecionadas.
 * @param {string} displayName - Nome de exibição público.
 * @param {object} [options] - Opções de privacidade.
 * @param {boolean} [options.showWinRate] - Mostrar Win Rate.
 * @param {boolean} [options.showProfitFactor] - Mostrar Fator de Lucro.
 * @param {boolean} [options.showTotalTrades] - Mostrar Total de Trades.
 * @param {boolean} [options.showPnl] - Mostrar PnL (Lucro/Prejuízo).
 * @returns {Promise<LeaderboardOptIn | null>} Dados da inscrição ou null.
 * @example
 * const entry = await joinLeaderboard('TraderPRO', { showWinRate: true });
 */
export async function joinLeaderboard(
    displayName: string,
    options: {
        showWinRate?: boolean;
        showProfitFactor?: boolean;
        showTotalTrades?: boolean;
        showPnl?: boolean;
    } = {}
): Promise<LeaderboardOptIn | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('leaderboard_opt_in')
        .upsert({
            user_id: user.id,
            display_name: displayName,
            show_win_rate: options.showWinRate ?? true,
            show_profit_factor: options.showProfitFactor ?? true,
            show_total_trades: options.showTotalTrades ?? true,
            show_pnl: options.showPnl ?? false,
            updated_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) {
        console.error('Erro ao entrar no leaderboard:', error);
        return null;
    }

    return mapLeaderboardOptInFromDB(data);
}

/**
 * Remove o usuário do leaderboard (Opt-out).
 * @returns {Promise<boolean>} True se sucesso, False caso contrário.
 * @example
 * const success = await leaveLeaderboard();
 */
export async function leaveLeaderboard(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
        .from('leaderboard_opt_in')
        .delete()
        .eq('user_id', user.id);

    if (error) {
        console.error('Erro ao sair do leaderboard:', error);
        return false;
    }

    return true;
}

/**
 * Verifica se o usuário já está no leaderboard e retorna seus dados.
 * @returns {Promise<LeaderboardOptIn | null>} Dados da inscrição ou null se não inscrito.
 * @example
 * const status = await getMyLeaderboardStatus();
 */
export async function getMyLeaderboardStatus(): Promise<LeaderboardOptIn | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('leaderboard_opt_in')
        .select()
        .eq('user_id', user.id)
        .maybeSingle();

    if (error || !data) return null;

    return mapLeaderboardOptInFromDB(data);
}

/**
 * Busca a lista completa do leaderboard ordenada por rank.
 * @returns {Promise<LeaderboardEntry[]>} Lista de entradas do leaderboard.
 * @example
 * const leaderboard = await getLeaderboard();
 */
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
    // Usar a view que já calcula as estatísticas
    const { data, error } = await supabase
        .from('leaderboard_view')
        .select('*')
        .limit(100);

    if (error) {
        console.error('Erro ao buscar leaderboard:', error);
        return [];
    }

    return (data || []).map((item, index) => ({
        userId: item.user_id,
        displayName: item.display_name,
        showWinRate: item.show_win_rate,
        showProfitFactor: item.show_profit_factor,
        showTotalTrades: item.show_total_trades,
        showPnl: item.show_pnl,
        totalTrades: item.total_trades,
        winRate: item.win_rate,
        totalPnl: item.total_pnl,
        avgRR: item.avg_rr, // Avg RR from view
        streak: item.streak, // Streak from view
        rank: index + 1,
    }));
}

/**
 * Atualiza as preferências de exibição do usuário no leaderboard.
 * @param {object} options - As opções a serem atualizadas.
 * @param {string} [options.displayName] - Nome de exibição.
 * @param {boolean} [options.showWinRate] - Mostrar Win Rate.
 * @param {boolean} [options.showProfitFactor] - Mostrar Fator de Lucro.
 * @param {boolean} [options.showTotalTrades] - Mostrar Total de Trades.
 * @param {boolean} [options.showPnl] - Mostrar PnL.
 * @returns {Promise<boolean>} True se sucesso, False caso contrário.
 * @example
 * const success = await updateLeaderboardPreferences({ showPnl: true });
 */
export async function updateLeaderboardPreferences(
    options: Partial<{
        displayName: string;
        showWinRate: boolean;
        showProfitFactor: boolean;
        showTotalTrades: boolean;
        showPnl: boolean;
    }>
): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
    };

    if (options.displayName !== undefined) updateData.display_name = options.displayName;
    if (options.showWinRate !== undefined) updateData.show_win_rate = options.showWinRate;
    if (options.showProfitFactor !== undefined) updateData.show_profit_factor = options.showProfitFactor;
    if (options.showTotalTrades !== undefined) updateData.show_total_trades = options.showTotalTrades;
    if (options.showPnl !== undefined) updateData.show_pnl = options.showPnl;

    const { error } = await supabase
        .from('leaderboard_opt_in')
        .update(updateData)
        .eq('user_id', user.id);

    if (error) {
        console.error('Erro ao atualizar preferências:', error);
        return false;
    }

    return true;
}
