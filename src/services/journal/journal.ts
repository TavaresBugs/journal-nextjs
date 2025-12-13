import { supabase } from '@/lib/supabase';
import { handleServiceError } from '@/lib/errorHandler';
import { base64ToBlob, ensureFreshImageUrl } from '@/lib/utils/general';
import { compressToWebP, base64ToFile } from '@/lib/utils/imageCompression';
import { JournalEntry } from '@/types';
import { DBJournalEntry, DBJournalImage, DBJournalEntryTrade } from '@/types/database';
import { getCurrentUserId } from '@/services/core/account';

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
    // Support both new junction table and legacy trade_id
    tradeIds: db.journal_entry_trades?.map((jet: DBJournalEntryTrade) => jet.trade_id) ||
              (db.trade_id ? [db.trade_id] : []),
    images: db.journal_images ? db.journal_images.map((img: DBJournalImage) => ({
        id: img.id,
        userId: img.user_id,
        journalEntryId: img.journal_entry_id,
        url: ensureFreshImageUrl(img.url), // Force fresh fetch to avoid cache issues
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
export const mapJournalEntryToDB = (app: JournalEntry): Omit<DBJournalEntry, 'journal_images' | 'journal_entry_trades'> => ({
    id: app.id,
    user_id: app.userId,
    account_id: app.accountId,
    date: app.date,
    title: app.title,
    asset: app.asset,
    // trade_id is deprecated, trades are saved via junction table
    trade_id: app.tradeIds?.[0], // Keep first for backward compatibility
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
        handleServiceError(new Error('User not authenticated'), 'journalService.getJournalEntries', { severity: 'silent' });
        return [];
    }

    const { data, error } = await supabase
        .from('journal_entries')
        .select('*, journal_images(*), journal_entry_trades(trade_id)')
        .eq('account_id', accountId)
        .eq('user_id', userId)
        .order('date', { ascending: false });

    if (error) {
        handleServiceError(error, 'journalService.getJournalEntries');
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
        handleServiceError(new Error('User not authenticated'), 'journalService.saveJournalEntry', { severity: 'silent' });
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
        handleServiceError(entryError, 'journalService.saveJournalEntry', { showToast: true });
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
                            // Convert base64 to File for WebP compression
                            const file = base64ToFile(base64, `image-${timeframe}-${i}.png`);
                            
                            // Compress to WebP + JPEG
                            const compressed = await compressToWebP(file, {
                                maxWidth: 1920,
                                maxHeight: 1080,
                                qualityWebP: 0.8,
                                qualityJpeg: 0.85,
                            });

                            // Organize by Year/Month/Day
                            const [year, month, day] = entry.date.split('-');
                            const sanitizedAsset = (entry.asset || 'Diario').replace(/[^a-zA-Z0-9]/g, '-');
                            const shortId = entry.id.slice(0, 8);
                            const basePath = `${userId}/${entry.accountId}/${year}/${month}/${day}/${sanitizedAsset}-${timeframe}-${i}-${shortId}`;
                            
                            // Upload WebP (primary format)
                            const webpFileName = `${basePath}.webp`;
                            keptFileNames.add(webpFileName);
                            
                            const { error: webpError } = await supabase.storage
                                .from('journal-images')
                                .upload(webpFileName, compressed.webp, {
                                    contentType: 'image/webp',
                                    upsert: true
                                });

                            if (webpError) {
                                handleServiceError(webpError, `journalService.uploadWebP.${timeframe}`, { severity: 'warn' });
                            }

                            // Upload JPEG fallback
                            const jpegFileName = `${basePath}.jpg`;
                            keptFileNames.add(jpegFileName);
                            
                            const { error: jpegError } = await supabase.storage
                                .from('journal-images')
                                .upload(jpegFileName, compressed.jpeg, {
                                    contentType: 'image/jpeg',
                                    upsert: true
                                });

                            if (jpegError) {
                                handleServiceError(jpegError, `journalService.uploadJPEG.${timeframe}`, { severity: 'warn' });
                            }

                            // Get public URLs
                            const { data: { publicUrl: webpUrl } } = supabase.storage
                                .from('journal-images')
                                .getPublicUrl(webpFileName);

                            const { data: { publicUrl: jpegUrl } } = supabase.storage
                                .from('journal-images')
                                .getPublicUrl(jpegFileName);

                            // Store WebP URL (smaller) with cache buster
                            // Browser will load WebP if supported, otherwise we have JPEG available
                            const primaryUrl = `${webpUrl}?t=${new Date().getTime()}`;

                            imagesToSave.push({
                                id: crypto.randomUUID(),
                                user_id: userId,
                                journal_entry_id: entry.id,
                                url: primaryUrl,
                                path: webpFileName,
                                timeframe: timeframe,
                                display_order: displayOrder++,
                                created_at: new Date().toISOString()
                            });

                            // Log compression stats in development
                            if (process.env.NODE_ENV === 'development') {
                                const savings = ((1 - compressed.compressedSizeWebP / compressed.originalSize) * 100).toFixed(1);
                                console.log(`[Journal] Image ${timeframe}-${i}: ${(compressed.originalSize / 1024).toFixed(0)}KB → ${(compressed.compressedSizeWebP / 1024).toFixed(0)}KB (-${savings}%)`);
                            }
                        } catch (err) {
                            handleServiceError(err, `journalService.processImage.${timeframe}`, { severity: 'warn' });
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
                handleServiceError(cleanupError, 'journalService.cleanupOrphanedImages', { severity: 'warn' });
            }
        }

        // Always delete existing rows and re-insert to avoid duplicates and ensure sync
        // This is safe because we already handled file cleanup above
        const { error: deleteError } = await supabase
            .from('journal_images')
            .delete()
            .eq('journal_entry_id', entry.id);

        if (deleteError) {
            handleServiceError(deleteError, 'journalService.deleteOldImageRows', { severity: 'warn' });
        }

        if (imagesToSave.length > 0) {
            const { error: imagesError } = await supabase
                .from('journal_images')
                .insert(imagesToSave);

            if (imagesError) {
                handleServiceError(imagesError, 'journalService.saveImages', { severity: 'warn' });
            }
        }
    }

    // 3. Save linked trades to junction table
    if (entry.tradeIds && entry.tradeIds.length > 0) {
        // Delete existing trade links and re-insert
        const { error: deleteTradesError } = await supabase
            .from('journal_entry_trades')
            .delete()
            .eq('journal_entry_id', entry.id);

        if (deleteTradesError) {
            handleServiceError(deleteTradesError, 'journalService.deleteTradeLinks', { severity: 'warn' });
        }

        const tradeLinks = entry.tradeIds.map(tradeId => ({
            journal_entry_id: entry.id,
            trade_id: tradeId
        }));

        const { error: insertTradesError } = await supabase
            .from('journal_entry_trades')
            .insert(tradeLinks);

        if (insertTradesError) {
            handleServiceError(insertTradesError, 'journalService.saveTradeLinks', { severity: 'warn' });
        }
    } else {
        // No trades linked, ensure junction table is clean
        const { error: deleteTradesError } = await supabase
            .from('journal_entry_trades')
            .delete()
            .eq('journal_entry_id', entry.id);

        if (deleteTradesError) {
            handleServiceError(deleteTradesError, 'journalService.cleanTradeLinks', { severity: 'warn' });
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
        handleServiceError(new Error('User not authenticated'), 'journalService.deleteJournalEntry', { severity: 'silent' });
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
            handleServiceError(storageError, 'journalService.deleteImagesStorage', { severity: 'warn' });
        }
    }

    // 2. Delete the entry (Cascade will delete DB rows for images)
    const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

    if (error) {
        handleServiceError(error, 'journalService.deleteJournalEntry', { showToast: true });
        return false;
    }

    return true;
}
