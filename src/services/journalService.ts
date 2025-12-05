import { supabase } from '@/lib/supabase';
import { base64ToBlob } from '@/lib/utils';
import { JournalEntry, JournalImage } from '@/types';
import { DBJournalEntry, DBJournalImage } from '@/types/database';
import { getCurrentUserId } from './accountService';

// ============================================
// MAPPERS
// ============================================

/**
 * Mapeia uma entrada de journal do banco de dados para o tipo da aplicação.
 * @param {DBJournalEntry} db - Objeto de journal entry do banco de dados.
 * @returns {JournalEntry} Objeto de journal entry da aplicação.
 * @example
 * const entry = mapJournalEntryFromDB(dbEntry);
 */
export const mapJournalEntryFromDB = (db: DBJournalEntry): JournalEntry => ({
    id: db.id,
    userId: db.user_id,
    accountId: db.account_id,
    date: db.date,
    title: db.title || '',
    asset: db.asset,
    tradeId: db.trade_id,
    images: db.journal_images ? db.journal_images.map((img: DBJournalImage) => ({
        id: img.id,
        userId: img.user_id,
        journalEntryId: img.journal_entry_id,
        url: img.url,
        path: img.path || '',
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

/**
 * Mapeia uma entrada de journal da aplicação para o tipo do banco de dados (sem imagens).
 * @param {JournalEntry} app - Objeto de journal entry da aplicação.
 * @returns {Omit<DBJournalEntry, 'journal_images'>} Objeto de journal entry do banco de dados.
 * @example
 * const dbEntry = mapJournalEntryToDB(entry);
 */
export const mapJournalEntryToDB = (app: JournalEntry): Omit<DBJournalEntry, 'journal_images'> => ({
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

// ============================================
// JOURNAL ENTRIES
// ============================================

/**
 * Obtém as entradas de journal de uma conta específica.
 * @param {string} accountId - O ID da conta.
 * @returns {Promise<JournalEntry[]>} Lista de entradas de journal.
 * @example
 * const entries = await getJournalEntries('account-id');
 */
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

/**
 * Salva ou atualiza uma entrada de journal, incluindo o upload e gerenciamento de imagens.
 * @param {JournalEntry} entry - A entrada de journal a ser salva.
 * @returns {Promise<boolean>} True se sucesso, False caso contrário.
 * @example
 * const success = await saveJournalEntry(entry);
 */
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
    if (entry.images) {
        let imagesToSave: Partial<DBJournalImage>[] = [];

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

/**
 * Exclui uma entrada de journal e suas imagens associadas.
 * @param {string} id - O ID da entrada de journal.
 * @returns {Promise<boolean>} True se sucesso, False caso contrário.
 * @example
 * const success = await deleteJournalEntry('entry-id');
 */
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
