import { supabase } from '@/lib/supabase';
import { DailyRoutine } from '@/types';
import { DBDailyRoutine } from '@/types/database';
import { getCurrentUserId } from './accountService';

// ============================================
// MAPPERS
// ============================================

export const mapDailyRoutineFromDB = (db: DBDailyRoutine): DailyRoutine => ({
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

export const mapDailyRoutineToDB = (app: DailyRoutine): DBDailyRoutine => ({
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
