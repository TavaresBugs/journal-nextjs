import { supabase } from "@/lib/supabase";
import { Account, Trade, JournalEntry, DailyRoutine, JournalImage, Settings } from "@/types";
import { base64ToBlob } from "@/lib/utils/general";
import { saveAccount, getCurrentUserId } from "@/services/core/account";
import { saveTradeAction } from "@/app/actions/trades";
import { saveJournalEntry } from "@/services/journal/journal";
import { saveDailyRoutine } from "@/services/journal/routine";
import { saveSettings } from "@/services/core/account";

// ============================================
// MIGRATION HELPER
// ============================================

/**
 * Migrar dados do localStorage para Supabase
 */
export async function migrateLocalStorageToSupabase(): Promise<boolean> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error("❌ User not authenticated. Cannot migrate.");
      return false;
    }

    console.log("🚀 Starting migration to Supabase...");

    // Migrar accounts
    const accountsData = localStorage.getItem("tj_accounts");
    const accounts: Account[] = accountsData ? JSON.parse(accountsData) : [];
    console.log(`Found ${accounts.length} accounts to migrate.`);
    for (const account of accounts) {
      await saveAccount({ ...account, userId });
    }

    // Migrar trades
    const allTradesData = localStorage.getItem("tj_trades");
    const allTrades: Trade[] = allTradesData ? JSON.parse(allTradesData) : [];
    console.log(`Found ${allTrades.length} trades to migrate.`);
    for (const trade of allTrades) {
      await saveTradeAction({ ...trade, userId });
    }

    // Migrar journal entries
    const allEntriesData = localStorage.getItem("tj_journal");
    const allEntries: unknown[] = allEntriesData ? JSON.parse(allEntriesData) : [];
    console.log(`Found ${allEntries.length} journal entries to migrate.`);

    // Define a type for the legacy entry structure
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type LegacyEntry = JournalEntry & { images?: Record<string, string> | any[] };

    for (const entry of allEntries as LegacyEntry[]) {
      console.log(`Migrating images for entry ${entry.id}...`);
      const newImages: JournalImage[] = [];

      // Check if images is the old object structure or already an array
      if (entry.images && !Array.isArray(entry.images)) {
        const oldImages = entry.images as Record<string, string>;

        for (const [tf, base64] of Object.entries(oldImages)) {
          if (typeof base64 === "string" && base64.startsWith("data:image")) {
            try {
              const blob = base64ToBlob(base64);
              const mime = base64.substring("data:".length, base64.indexOf(";base64"));
              const ext = mime.split("/")[1] || "png";

              const fileName = `${userId}/${entry.accountId}/${entry.date.split("-")[0]}/${entry.date.split("-")[1]}/${entry.date.split("-")[2]}/${entry.asset}-${tf}-${crypto.randomUUID()}.${ext}`;

              const { error } = await supabase.storage
                .from("journal-images")
                .upload(fileName, blob, {
                  contentType: mime,
                  upsert: true,
                });

              if (error) {
                console.error(`Error uploading image for TF ${tf}:`, error);
                continue;
              }

              const {
                data: { publicUrl },
              } = supabase.storage.from("journal-images").getPublicUrl(fileName);

              newImages.push({
                id: crypto.randomUUID(),
                userId: userId,
                journalEntryId: entry.id,
                url: publicUrl,
                path: fileName,
                timeframe: tf,
                displayOrder: newImages.length,
                createdAt: new Date().toISOString(),
              });
            } catch (err) {
              console.error(`Error processing image for TF ${tf}:`, err);
            }
          }
        }
      } else if (Array.isArray(entry.images)) {
        // Already migrated format - just ensure userId is set and map to App type if needed
        // Assuming entry.images are already in a format close to DB or App
        // If they are from localStorage, they might be any.
        // Let's map them to JournalImage
        newImages.push(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...entry.images.map((img: any) => ({
            id: img.id || crypto.randomUUID(),
            userId: userId,
            journalEntryId: entry.id,
            url: img.url,
            path: img.path || "",
            timeframe: img.timeframe || "",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            displayOrder: img.display_order || (img as any).displayOrder || 0,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            createdAt: img.created_at || (img as any).createdAt || new Date().toISOString(),
          }))
        );
      }

      const entryWithImages: JournalEntry = {
        ...entry,
        userId,
        images: newImages,
      };

      await saveJournalEntry(entryWithImages);
    }

    // Migrar daily routines
    const allRoutinesData = localStorage.getItem("tj_routines");
    const allRoutines: DailyRoutine[] = allRoutinesData ? JSON.parse(allRoutinesData) : [];
    console.log(`Found ${allRoutines.length} daily routines to migrate.`);
    for (const routine of allRoutines) {
      await saveDailyRoutine({ ...routine, userId });
    }

    // Migrar settings
    const settingsData = localStorage.getItem("tj_settings");
    if (settingsData) {
      const settings: Settings = JSON.parse(settingsData);
      await saveSettings({ ...settings, userId });
      console.log("Settings migrated.");
    }

    console.log("✅ Migration completed successfully!");
    return true;
  } catch (error) {
    console.error("❌ Migration failed:", error);
    return false;
  }
}
