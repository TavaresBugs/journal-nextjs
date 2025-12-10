import { supabase } from '@/lib/supabase';

export interface MentalLog {
    id: string;
    userId: string;
    moodTag: 'fear' | 'greed' | 'fomo' | 'tilt' | 'revenge' | 'hesitation' | 'overconfidence' | 'other';
    step1Problem: string;
    step2Validation?: string;
    step3Flaw?: string;
    step4Correction?: string;
    step5Logic?: string;
    createdAt: string;
}

export interface CreateMentalLogInput {
    moodTag: MentalLog['moodTag'];
    step1Problem: string;
    step2Validation?: string;
    step3Flaw?: string;
    step4Correction?: string;
    step5Logic?: string;
}

/**
 * Save a new mental log entry
 */
export async function saveMentalLog(data: CreateMentalLogInput): Promise<MentalLog | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: log, error } = await supabase
        .from('mental_logs')
        .insert({
            user_id: user.id,
            mood_tag: data.moodTag,
            step_1_problem: data.step1Problem,
            step_2_validation: data.step2Validation,
            step_3_flaw: data.step3Flaw,
            step_4_correction: data.step4Correction,
            step_5_logic: data.step5Logic,
        })
        .select()
        .single();

    if (error) {
        console.error('Error saving mental log:', error);
        throw error;
    }

    return log ? mapRowToMentalLog(log) : null;
}

/**
 * Get user's mental logs with optional limit
 */
export async function getMentalLogs(limit = 20): Promise<MentalLog[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('mental_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching mental logs:', error);
        throw error;
    }

    return (data || []).map(mapRowToMentalLog);
}

/**
 * Delete a mental log
 */
export async function deleteMentalLog(id: string): Promise<void> {
    const { error } = await supabase
        .from('mental_logs')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting mental log:', error);
        throw error;
    }
}

// Helper to map database row to interface
function mapRowToMentalLog(row: Record<string, unknown>): MentalLog {
    return {
        id: row.id as string,
        userId: row.user_id as string,
        moodTag: row.mood_tag as MentalLog['moodTag'],
        step1Problem: row.step_1_problem as string,
        step2Validation: row.step_2_validation as string | undefined,
        step3Flaw: row.step_3_flaw as string | undefined,
        step4Correction: row.step_4_correction as string | undefined,
        step5Logic: row.step_5_logic as string | undefined,
        createdAt: row.created_at as string,
    };
}
