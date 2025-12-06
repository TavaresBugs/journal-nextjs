import { supabase } from '@/lib/supabase';
import {
    ExportData,
    Account,
    Trade,
    JournalEntry,
    Playbook,
    DailyRoutine,
    UserSettings,
    RuleGroup
} from '@/types';
import { mapTradeFromDB } from './tradeService';

// ============================================
// HELPERS
// ============================================

const getCurrentUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
};

// ============================================
// MAPPERS
// ============================================

const mapAccountFromDB = (db: any): Account => ({
    id: db.id,
    userId: db.user_id,
    name: db.name,
    currency: db.currency,
    initialBalance: Number(db.initial_balance),
    currentBalance: Number(db.current_balance),
    leverage: db.leverage,
    maxDrawdown: Number(db.max_drawdown),
    createdAt: db.created_at,
    updatedAt: db.updated_at,
});

const mapJournalEntryFromDB = (db: any): JournalEntry => ({
    id: db.id,
    userId: db.user_id,
    accountId: db.account_id,
    date: db.date,
    title: db.title,
    asset: db.asset,
    tradeId: db.trade_id,
    images: db.images || [], // Assuming it's joined or stored as JSON, but typically it's a relation. We will need to fetch images separately or join.
    emotion: db.emotion,
    analysis: db.analysis,
    notes: db.notes,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
});

const mapPlaybookFromDB = (db: any): Playbook => ({
    id: db.id,
    userId: db.user_id,
    accountId: db.account_id,
    name: db.name,
    description: db.description,
    icon: db.icon,
    color: db.color,
    ruleGroups: db.rule_groups ? (typeof db.rule_groups === 'string' ? JSON.parse(db.rule_groups) : db.rule_groups) : [],
    createdAt: db.created_at,
    updatedAt: db.updated_at,
});

const mapDailyRoutineFromDB = (db: any): DailyRoutine => ({
    id: db.id,
    userId: db.user_id,
    accountId: db.account_id,
    date: db.date,
    aerobic: db.aerobic,
    diet: db.diet,
    reading: db.reading,
    meditation: db.meditation,
    preMarket: db.pre_market,
    prayer: db.prayer,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
});

const mapSettingsFromDB = (db: any): UserSettings => ({
    id: db.id,
    user_id: db.user_id,
    currencies: db.currencies,
    leverages: db.leverages,
    assets: db.assets, // JSON
    strategies: db.strategies,
    setups: db.setups,
    created_at: db.created_at,
    updated_at: db.updated_at,
});

// ============================================
// EXPORT FUNCTIONS
// ============================================

/**
 * Busca todos os dados do usuário para backup.
 * @returns {Promise<ExportData>} Objeto com todos os dados.
 */
export async function exportAllData(): Promise<ExportData> {
    const userId = await getCurrentUserId();
    if (!userId) {
        throw new Error('Usuário não autenticado');
    }

    // 1. Fetch Accounts
    const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId);

    if (accountsError) throw new Error(`Erro ao buscar contas: ${accountsError.message}`);

    // 2. Fetch Trades
    // Fetch all trades, loop if pagination limit is hit (Supabase default is 1000).
    // Using a recursive helper or just a large range for now (assuming < 10000 for standard usage, but let's be safe with a chunk loader if needed, but simplest is fetch all with higher limit or pages).
    // For simplicity, we'll try to fetch all in one go up to a reasonable limit, or implement simple pagination loop.

    let allTrades: any[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from('trades')
            .select('*')
            .eq('user_id', userId)
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw new Error(`Erro ao buscar trades: ${error.message}`);

        if (data && data.length > 0) {
            allTrades = [...allTrades, ...data];
            if (data.length < pageSize) hasMore = false;
            else page++;
        } else {
            hasMore = false;
        }
    }

    // 3. Fetch Journal Entries (and images)
    // We need to fetch images related to entries too.
    // Ideally we join them.
    const { data: journalData, error: journalError } = await supabase
        .from('journal_entries')
        .select(`
            *,
            images:journal_images(*)
        `)
        .eq('user_id', userId);

    if (journalError) throw new Error(`Erro ao buscar diário: ${journalError.message}`);

    // 4. Fetch Playbooks
    const { data: playbooksData, error: playbooksError } = await supabase
        .from('playbooks')
        .select('*')
        .eq('user_id', userId);

    if (playbooksError) throw new Error(`Erro ao buscar playbooks: ${playbooksError.message}`);

    // 5. Fetch Daily Routines
    const { data: routinesData, error: routinesError } = await supabase
        .from('daily_routines')
        .select('*')
        .eq('user_id', userId);

    if (routinesError) throw new Error(`Erro ao buscar rotinas: ${routinesError.message}`);

    // 6. Fetch Settings
    const { data: settingsData, error: settingsError } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (settingsError && settingsError.code !== 'PGRST116') { // PGRST116 is "Row not found" which is acceptable
        throw new Error(`Erro ao buscar configurações: ${settingsError.message}`);
    }

    return {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        accounts: accountsData.map(mapAccountFromDB),
        trades: allTrades.map(mapTradeFromDB),
        journalEntries: journalData.map(entry => ({
            ...mapJournalEntryFromDB(entry),
            images: entry.images || [] // Map images properly if needed, but structure should match DB response relation
        })),
        playbooks: playbooksData.map(mapPlaybookFromDB),
        routines: routinesData.map(mapDailyRoutineFromDB),
        settings: settingsData ? mapSettingsFromDB(settingsData) : null
    };
}

/**
 * Gera um arquivo JSON e inicia o download.
 * @param {ExportData} data - Dados a serem exportados.
 */
export function downloadAsJSON(data: ExportData): void {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Format date for filename: YYYY-MM-DD
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `journal_backup_${dateStr}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
