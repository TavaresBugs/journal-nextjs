import { supabase } from '@/lib/supabase';
import { Account, Settings } from '@/types';
import { DBAccount, DBSettings } from '@/types/database';

// ============================================
// HELPERS
// ============================================

export async function getCurrentUserId(): Promise<string | null> {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) return null;
        return user.id;
    } catch (e) {
        console.error('[getCurrentUserId] Error:', e);
        return null;
    }
}

// ============================================
// MAPPERS
// ============================================

export const mapAccountFromDB = (db: DBAccount): Account => ({
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

export const mapAccountToDB = (app: Account): DBAccount => ({
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

export const mapSettingsFromDB = (db: DBSettings): Settings => ({
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

export const mapSettingsToDB = (app: Settings): DBSettings => ({
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
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            console.warn('[getAccounts] No userId - user not authenticated, returning empty array');
            return [];
        }

        const { data, error } = await supabase
            .from('accounts')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[getAccounts] Supabase error:', error);
            return [];
        }

        return data ? data.map(mapAccountFromDB) : [];
    } catch (err) {
        console.error('[getAccounts] Unexpected error:', err);
        return [];
    }
}

export async function getAccount(id: string): Promise<Account | null> {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle();

    if (error) {
        console.error('Error fetching account:', error);
        return null;
    }

    return data ? mapAccountFromDB(data) : null;
}

export async function saveAccount(account: Account): Promise<boolean> {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const accountWithUser = { ...account, userId };

    const { error } = await supabase
        .from('accounts')
        .upsert(mapAccountToDB(accountWithUser));

    if (error) {
        console.error('[saveAccount] Error saving account:', error);
        return false;
    }

    return true;
}

export async function deleteAccount(id: string): Promise<boolean> {
    const userId = await getCurrentUserId();
    if (!userId) return false;

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
// SETTINGS
// ============================================

export async function getSettings(accountId?: string): Promise<Settings | null> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return null;

        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .eq('account_id', accountId || null)
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            console.error('[getSettings] Supabase error:', error);
            return null;
        }

        return data ? mapSettingsFromDB(data) : null;
    } catch (err) {
        console.error('[getSettings] Unexpected error:', err);
        return null;
    }
}

export async function saveSettings(settings: Settings): Promise<boolean> {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const settingsWithUser = { ...settings, userId };

    const { error } = await supabase
        .from('settings')
        .upsert(mapSettingsToDB(settingsWithUser));

    if (error) {
        console.error('Error saving settings:', error);
        return false;
    }

    return true;
}

export async function getUserSettings(): Promise<import('@/types').UserSettings | null> {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) {
        console.error('[getUserSettings] Error loading user settings:', error);
        return null;
    }

    if (!data) return null;

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

export async function saveUserSettings(settings: import('@/types').UserSettings): Promise<boolean> {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const { error } = await supabase
        .from('settings')
        .upsert({
            user_id: userId,
            currencies: settings.currencies,
            leverages: settings.leverages,
            assets: settings.assets,
            strategies: settings.strategies,
            setups: settings.setups,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'user_id'
        });

    if (error) {
        console.error('Error saving user settings:', error);
        return false;
    }

    return true;
}
