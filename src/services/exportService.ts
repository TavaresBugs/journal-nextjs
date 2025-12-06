import { supabase } from '@/lib/supabase';
import {
    Account,
    Trade,
    JournalEntry,
    Playbook,
    DailyRoutine,
    UserSettings
} from '@/types';
import { getCurrentUserId } from '@/services/accountService';

export interface ExportData {
    exportedAt: string;
    version: string;
    accounts: Account[];
    trades: Trade[];
    journalEntries: JournalEntry[];
    playbooks: Playbook[];
    routines: DailyRoutine[];
    settings: UserSettings | null;
}

/**
 * Helper to fetch all rows from a table, bypassing the default row limit.
 * @param tableName The name of the table to fetch from.
 * @param userId The ID of the user to fetch data for.
 * @returns An array of all rows.
 */
async function fetchAll<T>(tableName: string, userId: string): Promise<T[]> {
    let allData: T[] = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .eq('user_id', userId)
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error(`Error fetching data from ${tableName}:`, error);
            throw error;
        }

        if (!data || data.length === 0) {
            break;
        }

        allData = [...allData, ...data];

        if (data.length < pageSize) {
            break;
        }

        page++;
    }

    return allData;
}

/**
 * Export all user data.
 * @returns {Promise<ExportData>} The exported data.
 */
export async function exportAllData(): Promise<ExportData> {
    const userId = await getCurrentUserId();
    if (!userId) {
        throw new Error('User not authenticated');
    }

    const [
        accounts,
        trades,
        journalEntries,
        playbooks,
        routines,
        settingsData
    ] = await Promise.all([
        fetchAll<any>('accounts', userId),
        fetchAll<any>('trades', userId),
        fetchAll<any>('journal_entries', userId),
        fetchAll<any>('playbooks', userId),
        fetchAll<any>('daily_routines', userId),
        supabase.from('settings').select('*').eq('user_id', userId).maybeSingle()
    ]);


    const mapAccount = (db: any): Account => ({
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

    const mapTrade = (db: any): Trade => ({
        id: db.id,
        userId: db.user_id,
        accountId: db.account_id,
        symbol: db.symbol,
        type: db.type,
        entryPrice: Number(db.entry_price),
        stopLoss: Number(db.stop_loss),
        takeProfit: Number(db.take_profit),
        exitPrice: db.exit_price ? Number(db.exit_price) : undefined,
        lot: Number(db.lot),
        tfAnalise: db.tf_analise,
        tfEntrada: db.tf_entrada,
        tags: db.tags,
        strategy: db.strategy,
        setup: db.setup,
        notes: db.notes,
        entryDate: db.entry_date,
        entryTime: db.entry_time,
        exitDate: db.exit_date,
        exitTime: db.exit_time,
        pnl: db.pnl ? Number(db.pnl) : undefined,
        outcome: db.outcome,
        createdAt: db.created_at,
        updatedAt: db.updated_at,
    });

    const mapJournalEntry = (db: any): JournalEntry => ({
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
    });

    // We need to fetch journal_images
    const journalImages = await fetchAll<any>('journal_images', userId);

    const mapPlaybook = (db: any): Playbook => ({
        id: db.id,
        userId: db.user_id,
        accountId: db.account_id,
        name: db.name,
        description: db.description,
        icon: db.icon,
        color: db.color,
        ruleGroups: db.rule_groups || [],
        createdAt: db.created_at,
        updatedAt: db.updated_at,
    });

    const mapRoutine = (db: any): DailyRoutine => ({
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

    const mapSettings = (db: any): UserSettings => ({
        id: db.id,
        user_id: db.user_id,
        currencies: db.currencies || [],
        leverages: db.leverages || [],
        assets: db.assets || [],
        strategies: db.strategies || [],
        setups: db.setups || [],
        created_at: db.created_at,
        updated_at: db.updated_at
    });

    // Associate images with journal entries
    const mappedJournalEntries = journalEntries.map(entry => {
        const mapped = mapJournalEntry(entry);
        mapped.images = journalImages
            .filter(img => img.journal_entry_id === entry.id)
            .map(img => ({
                id: img.id,
                userId: img.user_id,
                journalEntryId: img.journal_entry_id,
                url: img.url,
                path: img.path,
                timeframe: img.timeframe,
                displayOrder: img.display_order,
                createdAt: img.created_at,
            }));
        return mapped;
    });

    return {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        accounts: accounts.map(mapAccount),
        trades: trades.map(mapTrade),
        journalEntries: mappedJournalEntries,
        playbooks: playbooks.map(mapPlaybook),
        routines: routines.map(mapRoutine),
        settings: settingsData.data ? mapSettings(settingsData.data) : null,
    };
}

/**
 * Triggers a download of the exported data as a JSON file.
 * @param {ExportData} data The data to download.
 */
export function downloadAsJSON(data: ExportData): void {
    if (typeof window === 'undefined') return;

    const filename = `journal_backup_${new Date().toISOString().split('T')[0]}.json`;
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Placeholder for ZIP download (optional)
 */
export function downloadAsZIP(data: ExportData): void {
    console.warn('ZIP download not implemented yet.');
}
