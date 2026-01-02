import { supabase } from "@/lib/supabase";

/**
 * Creates a share link for a journal entry that expires in 3 days
 * If a valid link already exists, it will be reused instead of creating a new one
 * @param journalEntryId - The ID of the journal entry to share
 * @returns The share URL or null if failed
 */
export async function createShareLink(journalEntryId: string): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Check if there's already a valid (non-expired) link for this entry
    const { data: existingShare, error: fetchError } = await supabase
      .from("shared_journals")
      .select("share_token, expires_at")
      .eq("journal_entry_id", journalEntryId)
      .eq("user_id", user.id)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // If valid link exists, reuse it
    if (existingShare && !fetchError) {
      const shareUrl = `${window.location.origin}/share/${existingShare.share_token}`;
      return shareUrl;
    }

    // Create new link only if no valid link exists
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 3);

    const { data, error } = await supabase
      .from("shared_journals")
      .insert({
        journal_entry_id: journalEntryId,
        user_id: user.id,
        expires_at: expiresAt.toISOString(),
      })
      .select("share_token")
      .single();

    if (error) throw error;

    const shareUrl = `${window.location.origin}/share/${data.share_token}`;
    return shareUrl;
  } catch (error) {
    console.error("Error creating share link:", error);
    return null;
  }
}

/**
 * Copies text to clipboard with fallback for mobile devices
 * Uses navigator.clipboard API when available, falls back to execCommand for mobile compatibility
 * @param text - The text to copy
 * @returns True if successful, false otherwise
 */
/**
 * Share a link using native share (mobile) or clipboard (desktop)
 * @param url - The URL to share
 * @param title - Optional title for the share
 * @returns Object with success status and method used
 */
export async function shareLink(
  url: string,
  title?: string
): Promise<{ success: boolean; method: "share" | "clipboard" | "failed" }> {
  // Try native share API first (works great on mobile)
  if (navigator.share) {
    try {
      await navigator.share({
        title: title || "Journal Entry",
        url: url,
      });
      return { success: true, method: "share" };
    } catch (error) {
      // User cancelled or share failed - try clipboard
      if ((error as Error).name !== "AbortError") {
        console.log("Share API failed, falling back to clipboard");
      }
    }
  }

  // Fallback to clipboard
  const copied = await copyToClipboard(url);
  return { success: copied, method: copied ? "clipboard" : "failed" };
}

export async function copyToClipboard(text: string): Promise<boolean> {
  // Try modern Clipboard API first
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to fallback method
    }
  }

  // Fallback for mobile devices and older browsers
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;

    // Prevent scrolling to bottom of page on iOS
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    textArea.style.opacity = "0";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    // For iOS Safari
    textArea.setSelectionRange(0, text.length);

    const success = document.execCommand("copy");
    document.body.removeChild(textArea);

    if (success) {
      return true;
    }
  } catch (error) {
    console.error("Fallback copy failed:", error);
  }

  return false;
}
