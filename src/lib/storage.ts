// ============================================
// STORAGE - Camada de Abstração de Persistência
// ============================================

import { supabase } from './supabase';
import type {
    Account,
    Trade,
    JournalEntry,
    DailyRoutine,
    Settings,
} from '@/types';

// ============================================
// HELPER - Get Authenticated User ID
// ============================================

async function getCurrentUserId(): Promise<string | null> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        console.error('User not authenticated:', error);
        return null;
    }
    return user.id;
}

// ============================================
// MAPPERS (CamelCase <-> SnakeCase)
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

const mapAccountToDB = (app: Account): any => ({
    id: app.id,
    user_id: app.userId,
    name: app.name,
    currency: app.currency,
    initial_balance: app.initialBalance,
    current_balance: app.currentBalance,
    leverage: app.leverage,
    max_drawdown: app.maxDrawdown,
    created_at: app.createdAt,
    updated_at: new Date().toISOString(),
});

const mapTradeFromDB = (db: any): Trade => ({
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

const mapTradeToDB = (app: Trade): any => ({
    id: app.id,
    user_id: app.userId,
    account_id: app.accountId,
    symbol: app.symbol,
    type: app.type,
    entry_price: app.entryPrice,
    stop_loss: app.stopLoss,
    take_profit: app.takeProfit,
    exit_price: app.exitPrice,
    lot: app.lot,
    tf_analise: app.tfAnalise,
    tf_entrada: app.tfEntrada,
    tags: app.tags,
    strategy: app.strategy,
    setup: app.setup,
    notes: app.notes,
    entry_date: app.entryDate,
    entry_time: app.entryTime,
    exit_date: app.exitDate,
    exit_time: app.exitTime,
    pnl: app.pnl,
    outcome: app.outcome,
    created_at: app.createdAt,
    updated_at: new Date().toISOString(),
});

const mapJournalEntryFromDB = (db: any): JournalEntry => ({
    id: db.id,
    userId: db.user_id,
    accountId: db.account_id,
    date: db.date,
    title: db.title,
    asset: db.asset,
    tradeId: db.trade_id,
    images: db.journal_images ? db.journal_images.map((img: any) => ({
        id: img.id,
        userId: img.user_id,
        journalEntryId: img.journal_entry_id,
        url: img.url,
        path: img.path,
        timeframe: img.timeframe,
        displayOrder: img.display_order,
        createdAt: img.created_at,
    })) : [],
    emotion: db.emotion,
    analysis: db.analysis,
    notes: db.notes,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
});

const mapJournalEntryToDB = (app: JournalEntry): any => ({
    id: app.id,
    user_id: app.userId,
    account_id: app.accountId,
    date: app.date,
    title: app.title,
    asset: app.asset,
    trade_id: app.tradeId,
    // Images are saved separately
    emotion: app.emotion,
    analysis: app.analysis,
    notes: app.notes,
    created_at: app.createdAt,
    updated_at: new Date().toISOString(),
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

const mapDailyRoutineToDB = (app: DailyRoutine): any => ({
    id: app.id,
    user_id: app.userId,
    account_id: app.accountId,
    date: app.date,
    aerobic: app.aerobic,
    diet: app.diet,
    reading: app.reading,
    meditation: app.meditation,
    pre_market: app.preMarket,
    prayer: app.prayer,
    created_at: app.createdAt,
    updated_at: new Date().toISOString(),
});

const mapSettingsFromDB = (db: any): Settings => ({
    id: db.id,
    userId: db.user_id,
    accountId: db.account_id,
    currencies: db.currencies,
    leverages: db.leverages,
    assets: db.assets,
    strategies: db.strategies,
    setups: db.setups,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
});

const mapSettingsToDB = (app: Settings): any => ({
    id: app.id,
    user_id: app.userId,
    account_id: app.accountId,
    currencies: app.currencies,
    leverages: app.leverages,
    assets: app.assets,
    strategies: app.strategies,
    setups: app.setups,
    created_at: app.createdAt,
    updated_at: new Date().toISOString(),
});

// ============================================
// ACCOUNTS
// ============================================

export async function getAccounts(): Promise<Account[]> {
    const userId = await getCurrentUserId();
    if (!userId) {
        console.error('User not authenticated');
        return [];
    }

    const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching accounts:', error);
        return [];
    }

    return data ? data.map(mapAccountFromDB) : [];
}

export async function getAccount(id: string): Promise<Account | null> {
    const userId = await getCurrentUserId();
    if (!userId) {
        console.error('User not authenticated');
        return null;
    }

    const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

    if (error) {
        console.error('Error fetching account:', error);
        return null;
    }

    return data ? mapAccountFromDB(data) : null;
}

export async function saveAccount(account: Account): Promise<boolean> {
    const userId = await getCurrentUserId();
    if (!userId) {
        console.error('User not authenticated');
        return false;
    }

    // Ensure account has correct userId
    const accountWithUser = {
        ...account,
        userId
    };

    const { error } = await supabase
        .from('accounts')
        .upsert(mapAccountToDB(accountWithUser));

    if (error) {
        console.error('Error saving account:', error);
        return false;
    }

    return true;
}

export async function deleteAccount(id: string): Promise<boolean> {
    const userId = await getCurrentUserId();
    if (!userId) {
        console.error('User not authenticated');
        return false;
    }

    const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

    if (error) {
        console.error('Error deleting account:', error);
        return false;
    }

    return true;
}

// ============================================
// TRADES
// ============================================

export async function getTrades(accountId: string): Promise<Trade[]> {
    const userId = await getCurrentUserId();
    if (!userId) {
        console.error('User not authenticated');
        return [];
    }

    const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('account_id', accountId)
        .eq('user_id', userId)
        .order('entry_date', { ascending: false });

    if (error) {
        console.error('Error fetching trades:', error);
        return [];
    }

    return data ? data.map(mapTradeFromDB) : [];
}

export async function saveTrade(trade: Trade): Promise<boolean> {
    const userId = await getCurrentUserId();
    if (!userId) {
        console.error('User not authenticated');
        return false;
    }

    const tradeWithUser = {
        ...trade,
        userId
    };

    const { error } = await supabase
        .from('trades')
        .upsert(mapTradeToDB(tradeWithUser));

    if (error) {
        console.error('Error saving trade:', error);
        return false;
    }

    return true;
}

export async function deleteTrade(id: string): Promise<boolean> {
    const userId = await getCurrentUserId();
    if (!userId) {
        console.error('User not authenticated');
        return false;
    }

    const { error } = await supabase
        .from('trades')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

    if (error) {
        console.error('Error deleting trade:', error);
        return false;
    }

    return true;
}

// ============================================
// JOURNAL ENTRIES
// ============================================

export async function getJournalEntries(accountId: string): Promise<JournalEntry[]> {
    const userId = await getCurrentUserId();
    if (!userId) {
        console.error('User not authenticated');
        return [];
    }

    const { data, error } = await supabase
        .from('journal_entries')
        .select('*, journal_images(*)')
        .eq('account_id', accountId)
        .eq('user_id', userId)
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching journal entries:', error);
        return [];
    }

    return data ? data.map(mapJournalEntryFromDB) : [];
}

export async function saveJournalEntry(entry: JournalEntry): Promise<boolean> {
    const userId = await getCurrentUserId();
    if (!userId) {
        console.error('User not authenticated');
        return false;
    }

    const entryWithUser = {
        ...entry,
        userId
    };

    // 1. Save the Journal Entry
    const { error: entryError } = await supabase
        .from('journal_entries')
        .upsert(mapJournalEntryToDB(entryWithUser));

    if (entryError) {
        console.error('Error saving journal entry:', entryError);
        return false;
    }

    // 2. Save the Images
    // 2. Save the Images
    if (entry.images) {
        let imagesToSave: any[] = [];

        if (Array.isArray(entry.images)) {
            // Already in correct format (JournalImage[])
            imagesToSave = entry.images.map(img => ({
                id: img.id,
                user_id: userId,
                journal_entry_id: entry.id,
                url: img.url,
                path: img.path,
                timeframe: img.timeframe,
                display_order: img.displayOrder,
                created_at: img.createdAt
            }));
        } else if (typeof entry.images === 'object') {
            // It's a map of timeframe -> base64[] (from Modal)
            const imagesMap = entry.images as Record<string, string[]>;
            let displayOrder = 0;
            
            // Track which files we are keeping/updating to identify orphans
            const keptFileNames = new Set<string>();

            for (const [timeframe, base64Array] of Object.entries(imagesMap)) {
                if (!Array.isArray(base64Array)) continue;

                for (let i = 0; i < base64Array.length; i++) {
                    const base64 = base64Array[i];
                    if (typeof base64 === 'string' && base64.startsWith('data:image')) {
                        try {
                            const blob = base64ToBlob(base64);
                            const mimeMatch = base64.match(/data:(.*?);base64/);
                            const mime = mimeMatch ? mimeMatch[1] : 'image/png';
                            const ext = mime.split('/')[1] || 'png';
                            
                            // Organize by Year/Month/Day
                            const [year, month, day] = entry.date.split('-');
                            const sanitizedAsset = (entry.asset || 'Diario').replace(/[^a-zA-Z0-9]/g, '-');
                            // Use Asset-Timeframe-Index-ShortID in filename for readability and uniqueness in the shared Day folder
                            const shortId = entry.id.slice(0, 8);
                            const fileName = `${userId}/${entry.accountId}/${year}/${month}/${day}/${sanitizedAsset}-${timeframe}-${i}-${shortId}.${ext}`;
                            keptFileNames.add(fileName);
                            
                            const { error: uploadError } = await supabase.storage
                                .from('journal-images')
                                .upload(fileName, blob, {
                                    contentType: mime,
                                    upsert: true
                                });

                            if (uploadError) {
                                console.error(`Error uploading image for ${timeframe} index ${i}:`, uploadError);
                                continue;
                            }

                            const { data: { publicUrl } } = supabase.storage
                                .from('journal-images')
                                .getPublicUrl(fileName);

                            // Add timestamp to URL to bypass browser cache after update
                            const publicUrlWithCacheBuster = `${publicUrl}?t=${new Date().getTime()}`;

                            imagesToSave.push({
                                id: crypto.randomUUID(),
                                user_id: userId,
                                journal_entry_id: entry.id,
                                url: publicUrlWithCacheBuster,
                                path: fileName,
                                timeframe: timeframe,
                                display_order: displayOrder++,
                                created_at: new Date().toISOString()
                            });
                        } catch (err) {
                            console.error(`Error processing image for ${timeframe} index ${i}:`, err);
                        }
                    } else if (typeof base64 === 'string' && base64.startsWith('http')) {
                        // Existing image URL
                        let path = '';
                        try {
                            const urlObj = new URL(base64);
                            // Handle both standard Supabase URLs and custom domains if any
                            // Format: .../storage/v1/object/public/journal-images/path/to/file
                            const pathParts = urlObj.pathname.split('/journal-images/');
                            if (pathParts.length > 1) {
                                path = decodeURIComponent(pathParts[1]);
                                keptFileNames.add(path);
                            } else {
                                console.warn('Could not extract path from URL (split failed):', base64);
                            }
                        } catch (e) {
                            console.warn('Could not parse existing image URL to extract path:', base64, e);
                        }

                        if (path) {
                            imagesToSave.push({
                                id: crypto.randomUUID(),
                                user_id: userId,
                                journal_entry_id: entry.id,
                                url: base64,
                                path: path, 
                                timeframe: timeframe,
                                display_order: displayOrder++,
                                created_at: new Date().toISOString()
                            });
                        }
                    }
                }
            }

            // Cleanup: Delete images that are in DB for this entry but NOT in keptFileNames
            try {
                const { data: dbImages, error: dbError } = await supabase
                    .from('journal_images')
                    .select('path')
                    .eq('journal_entry_id', entry.id);

                if (!dbError && dbImages) {
                    const filesToDelete = dbImages
                        .map(img => img.path)
                        .filter(path => path && !keptFileNames.has(path));

                    if (filesToDelete.length > 0) {
                        console.log('Deleting orphaned images from storage:', filesToDelete);
                        await supabase.storage
                            .from('journal-images')
                            .remove(filesToDelete);
                    }
                }
            } catch (cleanupError) {
                console.error('Error cleaning up orphaned images:', cleanupError);
            }
        }

        // Always delete existing rows and re-insert to avoid duplicates and ensure sync
        // This is safe because we already handled file cleanup above
        const { error: deleteError } = await supabase
            .from('journal_images')
            .delete()
            .eq('journal_entry_id', entry.id);

        if (deleteError) {
            console.error('Error deleting old image rows:', deleteError);
            // We proceed anyway, but this might cause duplicates if delete failed
        }

        if (imagesToSave.length > 0) {
            const { error: imagesError } = await supabase
                .from('journal_images')
                .insert(imagesToSave);

            if (imagesError) {
                console.error('Error saving journal images:', imagesError);
            }
        }
    }

    return true;
}

export async function deleteJournalEntry(id: string): Promise<boolean> {
    const userId = await getCurrentUserId();
    if (!userId) {
        console.error('User not authenticated');
        return false;
    }

    // 1. Get all images for this entry to delete them from Storage
    const { data: images } = await supabase
        .from('journal_images')
        .select('path')
        .eq('journal_entry_id', id);

    if (images && images.length > 0) {
        const pathsToDelete = images.map(img => img.path);
        console.log('Deleting images from storage:', pathsToDelete);
        
        const { error: storageError } = await supabase.storage
            .from('journal-images')
            .remove(pathsToDelete);

        if (storageError) {
            console.error('Error deleting images from storage:', storageError);
            // We continue to delete the entry even if storage deletion fails
            // to avoid getting stuck.
        }
    }

    // 2. Delete the entry (Cascade will delete DB rows for images)
    const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

    if (error) {
        console.error('Error deleting journal entry:', error);
        return false;
    }

    return true;
}

// ============================================
// DAILY ROUTINES
// ============================================

export async function getDailyRoutines(accountId: string): Promise<DailyRoutine[]> {
    const userId = await getCurrentUserId();
    if (!userId) {
        console.error('User not authenticated');
        return [];
    }

    const { data, error } = await supabase
        .from('daily_routines')
        .select('*')
        .eq('account_id', accountId)
        .eq('user_id', userId)
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching daily routines:', error);
        return [];
    }

    return data ? data.map(mapDailyRoutineFromDB) : [];
}

export async function saveDailyRoutine(routine: DailyRoutine): Promise<boolean> {
    const userId = await getCurrentUserId();
    if (!userId) {
        console.error('User not authenticated');
        return false;
    }

    const routineWithUser = {
        ...routine,
        userId
    };

    const { error } = await supabase
        .from('daily_routines')
        .upsert(mapDailyRoutineToDB(routineWithUser));

    if (error) {
        console.error('Error saving daily routine:', error);
        return false;
    }

    return true;
}

export async function deleteDailyRoutine(id: string): Promise<boolean> {
    const userId = await getCurrentUserId();
    if (!userId) {
        console.error('User not authenticated');
        return false;
    }

    const { error } = await supabase
        .from('daily_routines')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

    if (error) {
        console.error('Error deleting daily routine:', error);
        return false;
    }

    return true;
}

// ============================================
// SETTINGS
// ============================================

export async function getSettings(accountId?: string): Promise<Settings | null> {
    const userId = await getCurrentUserId();
    if (!userId) {
        console.error('User not authenticated');
        return null;
    }

    const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('account_id', accountId || null)
        .eq('user_id', userId)
        .single();

    if (error) {
        console.error('Error fetching settings:', error);
        return null;
    }

    return data ? mapSettingsFromDB(data) : null;
}

export async function saveSettings(settings: Settings): Promise<boolean> {
    const userId = await getCurrentUserId();
    if (!userId) {
        console.error('User not authenticated');
        return false;
    }

    const settingsWithUser = {
        ...settings,
        userId
    };

    const { error } = await supabase
        .from('settings')
        .upsert(mapSettingsToDB(settingsWithUser));

    if (error) {
        console.error('Error saving settings:', error);
        return false;
    }

    return true;
}

// ============================================
// MIGRATION HELPER
// ============================================

// Helper to convert Base64 to Blob
function base64ToBlob(base64: string): Blob {
    try {
        const arr = base64.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    } catch (e) {
        console.error('Error converting base64 to blob:', e);
        return new Blob([], { type: 'image/png' });
    }
}

/**
 * Migrar dados do localStorage para Supabase
 */
export async function migrateLocalStorageToSupabase(): Promise<boolean> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            console.error('❌ User not authenticated. Cannot migrate.');
            return false;
        }

        console.log('🚀 Starting migration to Supabase...');

        // Migrar accounts
        const accountsData = localStorage.getItem('tj_accounts');
        const accounts: Account[] = accountsData ? JSON.parse(accountsData) : [];
        console.log(`Found ${accounts.length} accounts to migrate.`);
        for (const account of accounts) {
            await saveAccount({ ...account, userId });
        }

        // Migrar trades
        const allTradesData = localStorage.getItem('tj_trades');
        const allTrades: Trade[] = allTradesData ? JSON.parse(allTradesData) : [];
        console.log(`Found ${allTrades.length} trades to migrate.`);
        for (const trade of allTrades) {
            await saveTrade({ ...trade, userId });
        }

        // Migrar journal entries
        const allEntriesData = localStorage.getItem('tj_journal');
        const allEntries: any[] = allEntriesData ? JSON.parse(allEntriesData) : [];
        console.log(`Found ${allEntries.length} journal entries to migrate.`);
        
        for (const entry of allEntries) {
            console.log(`Migrating images for entry ${entry.id}...`);
            const newImages: any[] = [];
            
            // Check if images is the old object structure or already an array
            if (entry.images && !Array.isArray(entry.images)) {
                const oldImages = entry.images;
                
                for (const [tf, base64] of Object.entries(oldImages)) {
                    if (typeof base64 === 'string' && base64.startsWith('data:image')) {
                        try {
                            const blob = base64ToBlob(base64);
                            const mime = base64.substring("data:".length, base64.indexOf(";base64"));
                            const ext = mime.split('/')[1] || 'png';
                            
                            const fileName = `${userId}/${entry.accountId}/${entry.date.split('-')[0]}/${entry.date.split('-')[1]}/${entry.date.split('-')[2]}/${entry.asset}-${tf}-${crypto.randomUUID()}.${ext}`;
                            
                            const { error } = await supabase.storage
                                .from('journal-images')
                                .upload(fileName, blob, {
                                    contentType: mime,
                                    upsert: true
                                });
                                
                            if (error) {
                                console.error(`Error uploading image for TF ${tf}:`, error);
                                continue;
                            }
                            
                            const { data: { publicUrl } } = supabase.storage
                                .from('journal-images')
                                .getPublicUrl(fileName);
                            
                            newImages.push({
                                id: crypto.randomUUID(),
                                userId,
                                journalEntryId: entry.id,
                                url: publicUrl,
                                path: fileName,
                                timeframe: tf,
                                displayOrder: newImages.length,
                                createdAt: new Date().toISOString()
                            });
                        } catch (err) {
                            console.error(`Error processing image for TF ${tf}:`, err);
                        }
                    }
                }
            } else if (Array.isArray(entry.images)) {
                // Already migrated format - just add userId
                newImages.push(...entry.images.map((img: any) => ({ ...img, userId })));
            }
            
            const entryWithImages = {
                ...entry,
                userId,
                images: newImages
            };
            
            await saveJournalEntry(entryWithImages);
        }

        // Migrar daily routines
        const allRoutinesData = localStorage.getItem('tj_routines');
        const allRoutines: DailyRoutine[] = allRoutinesData ? JSON.parse(allRoutinesData) : [];
        console.log(`Found ${allRoutines.length} daily routines to migrate.`);
        for (const routine of allRoutines) {
            await saveDailyRoutine({ ...routine, userId });
        }

        // Migrar settings
        const settingsData = localStorage.getItem('tj_settings');
        if (settingsData) {
            const settings: Settings = JSON.parse(settingsData);
            await saveSettings({ ...settings, userId });
            console.log('Settings migrated.');
        }

        console.log('✅ Migration completed successfully!');
        return true;
    } catch (error) {
        console.error('❌ Migration failed:', error);
        return false;
    }
}

// ============================================
// USER SETTINGS (for cross-device sync)
// ============================================

/**
 * Get user's custom settings (strategies, setups, assets, etc.)
 */
export async function getUserSettings(): Promise<import('@/types').UserSettings | null> {
    const userId = await getCurrentUserId();
    if (!userId) {
        console.error('User not authenticated');
        return null;
    }

    const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

    // PGRST116 means no rows found - this is expected for new users
    if (error && error.code !== 'PGRST116') {
        console.error('Error loading user settings:', error);
        return null;
    }

    if (!data) {
        return null;
    }

    // Convert postgres snake_case to camelCase
    return {
        id: data.id,
        user_id: data.user_id,
        currencies: data.currencies || [],
        leverages: data.leverages || [],
        assets: data.assets || [],
        strategies: data.strategies || [],
        setups: data.setups || [],
        created_at: data.created_at,
        updated_at: data.updated_at
    };
}

/**
 * Save user's custom settings to Supabase
 */
export async function saveUserSettings(settings: import('@/types').UserSettings): Promise<boolean> {
    const userId = await getCurrentUserId();
    if (!userId) {
        console.error('User not authenticated');
        return false;
    }

    const { error } = await supabase
        .from('user_settings')
        .upsert({
            user_id: userId,
            currencies: settings.currencies,
            leverages: settings.leverages,
            assets: settings.assets,
            strategies: settings.strategies,
            setups: settings.setups,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'user_id' // Use user_id to detect existing record
        });

    if (error) {
        console.error('Error saving user settings:', error);
        return false;
    }

    return true;
}
