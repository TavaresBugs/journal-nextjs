import { supabase } from '@/lib/supabase';
import {
    ExportData,
    Account,
    Trade,
    JournalEntry,
    Playbook,
    DailyRoutine,
    UserSettings
} from '@/types';
import { getCurrentUserId, mapAccountFromDB, getUserSettings } from './accountService';
import { mapTradeFromDB } from './tradeService';
import { mapJournalEntryFromDB } from './journalService';
import { mapDailyRoutineFromDB } from './routineService';

// ============================================
// HELPERS
// ============================================

/**
 * Fetches all records from a Supabase table, handling pagination automatically.
 * @param table The table name
 * @param userId The user ID to filter by
 * @param selectQuery The select query string (default: '*')
 */
async function fetchAll<T>(table: string, userId: string, selectQuery: string = '*'): Promise<T[]> {
    let allData: T[] = [];
    let page = 0;
    const PAGE_SIZE = 1000;
    let hasMore = true;

    while (hasMore) {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data, error } = await supabase
            .from(table)
            .select(selectQuery)
            .eq('user_id', userId)
            .range(from, to);

        if (error) {
            throw new Error(`Error fetching ${table} (page ${page}): ${error.message}`);
        }

        if (data && data.length > 0) {
            allData = [...allData, ...data] as T[];

            // If we received fewer items than requested, we've reached the end
            if (data.length < PAGE_SIZE) {
                hasMore = false;
            } else {
                page++;
            }
        } else {
            hasMore = false;
        }
    }

    return allData;
}

// ============================================
// EXPORT SERVICE
// ============================================

/**
 * Busca todos os dados do usuário para exportação.
 * @returns {Promise<ExportData>} Objeto com todos os dados do usuário.
 */
export async function exportAllData(): Promise<ExportData> {
    const userId = await getCurrentUserId();
    if (!userId) {
        throw new Error('User not authenticated');
    }

    // 1. Fetch Accounts
    // Accounts are unlikely to exceed 1000, but consistency is good.
    const accountsData = await fetchAll<any>('accounts', userId);
    const accounts: Account[] = accountsData.map(mapAccountFromDB);

    // 2. Fetch Trades (All accounts)
    const tradesData = await fetchAll<any>('trades', userId);
    const trades: Trade[] = tradesData.map(mapTradeFromDB);

    // 3. Fetch Journal Entries (All accounts)
    // We need to fetch images as well if we want to include them
    const journalData = await fetchAll<any>('journal_entries', userId, '*, journal_images(*)');
    const journalEntries: JournalEntry[] = journalData.map(mapJournalEntryFromDB);

    // 4. Fetch Playbooks
    const playbooksData = await fetchAll<any>('playbooks', userId);

    const playbooks: Playbook[] = playbooksData.map((row) => ({
        id: row.id,
        userId: row.user_id,
        accountId: row.account_id || undefined,
        name: row.name,
        description: row.description,
        icon: row.icon,
        color: row.color,
        ruleGroups: row.rule_groups || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }));

    // 5. Fetch Routines
    const routinesData = await fetchAll<any>('daily_routines', userId);
    const routines: DailyRoutine[] = routinesData.map(mapDailyRoutineFromDB);

    // 6. Fetch Settings
    const settings = await getUserSettings();

    return {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        accounts,
        trades,
        journalEntries,
        playbooks,
        routines,
        settings
    };
}

/**
 * Realiza o download dos dados em formato JSON.
 * @param {ExportData} data - Os dados a serem baixados.
 */
export function downloadAsJSON(data: ExportData): void {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Format filename: journal_backup_YYYY-MM-DD.json
    const date = new Date().toISOString().split('T')[0];
    const filename = `journal_backup_${date}.json`;

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

/**
 * Placeholder for potential ZIP download (optional as per prompt).
 */
export function downloadAsZIP(data: ExportData): void {
    console.warn('ZIP download not implemented yet.');
}
