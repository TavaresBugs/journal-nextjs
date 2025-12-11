import { supabase } from '@/lib/supabase';
import { handleServiceError } from '@/lib/errorHandler';
import { Account, Settings } from '@/types';
import { DBAccount, DBSettings } from '@/types/database';

// ============================================
// HELPERS
// ============================================

/**
 * Obtém o ID do usuário autenticado atual.
 * @returns {Promise<string | null>} O ID do usuário ou null se não autenticado.
 * @example
 * const userId = await getCurrentUserId();
 */
export async function getCurrentUserId(): Promise<string | null> {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) return null;
        return user.id;
    } catch (e) {
        handleServiceError(e, 'accountService.getCurrentUserId', { severity: 'silent' });
        return null;
    }
}

// ============================================
// MAPPERS
// ============================================

/**
 * Mapeia um objeto de conta do banco de dados para o tipo da aplicação.
 * @param {DBAccount} db - Objeto de conta do banco de dados.
 * @returns {Account} Objeto de conta da aplicação.
 * @example
 * const account = mapAccountFromDB(dbAccount);
 */
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

/**
 * Mapeia um objeto de conta da aplicação para o tipo do banco de dados.
 * @param {Account} app - Objeto de conta da aplicação.
 * @returns {DBAccount} Objeto de conta do banco de dados.
 * @example
 * const dbAccount = mapAccountToDB(account);
 */
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

/**
 * Mapeia um objeto de configurações do banco de dados para o tipo da aplicação.
 * @param {DBSettings} db - Objeto de configurações do banco de dados.
 * @returns {Settings} Objeto de configurações da aplicação.
 * @example
 * const settings = mapSettingsFromDB(dbSettings);
 */
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

/**
 * Mapeia um objeto de configurações da aplicação para o tipo do banco de dados.
 * @param {Settings} app - Objeto de configurações da aplicação.
 * @returns {DBSettings} Objeto de configurações do banco de dados.
 * @example
 * const dbSettings = mapSettingsToDB(settings);
 */
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

/**
 * Obtém todas as contas do usuário atual.
 * @returns {Promise<Account[]>} Lista de contas.
 * @example
 * const accounts = await getAccounts();
 */
export async function getAccounts(): Promise<Account[]> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return [];
        }

        const { data, error } = await supabase
            .from('accounts')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            handleServiceError(error, 'accountService.getAccounts');
            return [];
        }

        return data ? data.map(mapAccountFromDB) : [];
    } catch (err) {
        handleServiceError(err, 'accountService.getAccounts');
        return [];
    }
}

/**
 * Obtém uma conta específica pelo ID.
 * @param {string} id - O ID da conta.
 * @returns {Promise<Account | null>} A conta ou null se não encontrada.
 * @example
 * const account = await getAccount('account-id');
 */
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
        handleServiceError(error, 'accountService.getAccount');
        return null;
    }

    return data ? mapAccountFromDB(data) : null;
}

/**
 * Salva ou atualiza uma conta.
 * @param {Account} account - O objeto da conta a ser salvo.
 * @returns {Promise<boolean>} True se sucesso, False caso contrário.
 * @example
 * const success = await saveAccount(myAccount);
 */
export async function saveAccount(account: Account): Promise<boolean> {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const accountWithUser = { ...account, userId };

    const { error } = await supabase
        .from('accounts')
        .upsert(mapAccountToDB(accountWithUser));

    if (error) {
        handleServiceError(error, 'accountService.saveAccount', { showToast: true });
        return false;
    }

    return true;
}

/**
 * Exclui uma conta pelo ID.
 * @param {string} id - O ID da conta a ser excluída.
 * @returns {Promise<boolean>} True se sucesso, False caso contrário.
 * @example
 * const success = await deleteAccount('account-id');
 */
export async function deleteAccount(id: string): Promise<boolean> {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

    if (error) {
        handleServiceError(error, 'accountService.deleteAccount', { showToast: true });
        return false;
    }

    return true;
}

// ============================================
// SETTINGS
// ============================================

/**
 * Obtém as configurações de uma conta específica ou as configurações globais do usuário.
 * @param {string} [accountId] - Opcional. ID da conta.
 * @returns {Promise<Settings | null>} As configurações ou null se não encontradas.
 * @example
 * const settings = await getSettings('account-id');
 */
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
            handleServiceError(error, 'accountService.getSettings');
            return null;
        }

        return data ? mapSettingsFromDB(data) : null;
    } catch (err) {
        handleServiceError(err, 'accountService.getSettings');
        return null;
    }
}

/**
 * Salva ou atualiza as configurações.
 * @param {Settings} settings - O objeto de configurações a ser salvo.
 * @returns {Promise<boolean>} True se sucesso, False caso contrário.
 * @example
 * const success = await saveSettings(mySettings);
 */
export async function saveSettings(settings: Settings): Promise<boolean> {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const settingsWithUser = { ...settings, userId };

    const { error } = await supabase
        .from('settings')
        .upsert(mapSettingsToDB(settingsWithUser));

    if (error) {
        handleServiceError(error, 'accountService.saveSettings', { showToast: true });
        return false;
    }

    return true;
}

/**
 * Obtém as configurações globais do usuário.
 * @returns {Promise<import('@/types').UserSettings | null>} As configurações do usuário ou null.
 * @example
 * const userSettings = await getUserSettings();
 */
export async function getUserSettings(): Promise<import('@/types').UserSettings | null> {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) {
        handleServiceError(error, 'accountService.getUserSettings');
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

/**
 * Salva as configurações globais do usuário.
 * @param {import('@/types').UserSettings} settings - As configurações a serem salvas.
 * @returns {Promise<boolean>} True se sucesso, False caso contrário.
 * @example
 * const success = await saveUserSettings(settings);
 */
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
        handleServiceError(error, 'accountService.saveUserSettings', { showToast: true });
        return false;
    }

    return true;
}
