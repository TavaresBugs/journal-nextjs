// ============================================
// PLAYBOOK SERVICE
// Serviço para features de compartilhamento de playbooks
// ============================================

import { supabase } from '@/lib/supabase';
import { 
    SharedPlaybook, 
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
    // OPTIMIZAÇÃO: Buscar todos os trades de uma vez para evitar N+1 queries
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
    
    // Coletar todos os pares (user_id, strategy) necessários
    const playbookPairs = (data || [])
        .filter(item => item.playbook?.name)
        .map(item => ({
            userId: item.user_id,
            strategy: item.playbook.name,
            key: `${item.user_id}:${item.playbook_id}`
        }));
    
    // Buscar TODOS os trades necessários em uma única query
    if (playbookPairs.length > 0) {
        // Construir filtro OR para todos os pares (user_id, strategy)
        const uniqueUserIds = [...new Set(playbookPairs.map(p => p.userId))];
        const uniqueStrategies = [...new Set(playbookPairs.map(p => p.strategy))];
        
        const { data: allTrades } = await supabase
            .from('trades')
            .select(`
                user_id,
                strategy,
                outcome, 
                pnl,
                entry_date,
                entry_time,
                exit_date,
                exit_time,
                entry_price,
                exit_price,
                stop_loss,
                symbol
            `)
            .in('user_id', uniqueUserIds)
            .in('strategy', uniqueStrategies);
        
        // Agrupar trades por (user_id:strategy)
        const tradesMap = new Map<string, typeof allTrades>();
        
        for (const trade of (allTrades || [])) {
            // Encontrar o playbook_id correspondente
            const matchingPair = playbookPairs.find(
                p => p.userId === trade.user_id && p.strategy === trade.strategy
            );
            if (!matchingPair) continue;
            
            const key = matchingPair.key;
            if (!tradesMap.has(key)) {
                tradesMap.set(key, []);
            }
            tradesMap.get(key)!.push(trade);
        }
        
        // Calcular stats para cada playbook
        for (const pair of playbookPairs) {
            const trades = tradesMap.get(pair.key) || [];
            if (trades.length === 0) continue;
            
            // Conversão de tipos
            const typedTrades = trades.map(t => ({
                outcome: t.outcome as string,
                pnl: t.pnl as number,
                entryDate: t.entry_date as string,
                entryTime: t.entry_time as string,
                exitDate: t.exit_date as string,
                exitTime: t.exit_time as string,
                entryPrice: t.entry_price as number,
                exitPrice: t.exit_price as number,
                stopLoss: t.stop_loss as number,
                symbol: t.symbol as string
            }));

            const wins = typedTrades.filter(t => t.outcome === 'win').length;
            const losses = typedTrades.filter(t => t.outcome === 'loss').length;
            const netPnl = typedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

            // Calcular Streak
            let currentStreak = 0;
            let maxStreak = 0;
            const sortedTrades = [...typedTrades].sort((a, b) => 
                new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
            );
            
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
            
            authorStats.set(pair.key, {
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
