import { supabase } from '@/lib/supabase';

/**
 * Creates a share link for a journal entry that expires in 3 days
 * @param journalEntryId - The ID of the journal entry to share
 * @returns The share URL or null if failed
 */
export async function createShareLink(journalEntryId: string): Promise<string | null> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        // Set expiration to 3 days from now
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 3);

        const { data, error } = await supabase
            .from('shared_journals')
            .insert({
                journal_entry_id: journalEntryId,
                user_id: user.id,
                expires_at: expiresAt.toISOString(),
            })
            .select('share_token')
            .single();

        if (error) throw error;

        const shareUrl = `${window.location.origin}/share/${data.share_token}`;
        return shareUrl;
    } catch (error) {
        console.error('Error creating share link:', error);
        return null;
    }
}

/**
 * Copies text to clipboard
 * @param text - The text to copy
 * @returns True if successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Error copying to clipboard:', error);
        return false;
    }
}
