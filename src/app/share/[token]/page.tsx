import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ensureFreshImageUrl } from "@/lib/utils/general";
import {
  MarketConditionsCard,
  type MarketConditionsCardProps,
} from "@/components/shared/MarketConditionsCard";
import {
  mapMarketConditionFromDb,
  mapEntryQualityFromDb,
} from "@/components/trades/hooks/useTradeForm";
import { ImageGalleryClient } from "@/components/share/ImageGalleryClient";
import type { JournalEntry, JournalImage } from "@/types";

// Validate UUID format
function isValidUUID(token: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(token);
}

// Server-side data fetching
async function getSharedEntry(token: string) {
  // Validate token format
  if (!isValidUUID(token)) {
    return { error: "Link inválido" };
  }

  try {
    // Get shared journal by token
    const { data: sharedData, error: sharedError } = await supabase
      .from("shared_journals")
      .select("journal_entry_id, expires_at")
      .eq("share_token", token)
      .single();

    if (sharedError || !sharedData) {
      return { error: "Link inválido ou expirado" };
    }

    // Check expiration
    if (new Date(sharedData.expires_at) < new Date()) {
      return { error: "Este link expirou" };
    }

    // Increment view count (non-blocking background operation)
    void (async () => {
      try {
        await supabase
          .from("shared_journals")
          .update({
            view_count: supabase.rpc("increment", { row_id: sharedData.journal_entry_id }),
          })
          .eq("share_token", token);
      } catch (err) {
        console.error("Failed to increment view count:", err);
      }
    })();

    // Parallel fetch for better performance
    const [entryResult, imagesResult, bridgeResult] = await Promise.all([
      // Get journal entry
      supabase.from("journal_entries").select("*").eq("id", sharedData.journal_entry_id).single(),

      // Get images
      supabase
        .from("journal_images")
        .select("*")
        .eq("journal_entry_id", sharedData.journal_entry_id)
        .order("display_order", { ascending: true }),

      // Get linked trade via Bridge (RPC)
      supabase.rpc("get_shared_entry_bridge", { token_input: token }),
    ]);

    const { data: entryData, error: entryError } = entryResult;
    if (entryError || !entryData) {
      return { error: "Entrada não encontrada" };
    }

    // Map entry data
    const entry: JournalEntry = {
      id: entryData.id,
      userId: entryData.user_id,
      accountId: entryData.account_id,
      date: entryData.date,
      title: entryData.title,
      asset: entryData.asset,
      tradeIds: entryData.trade_id ? [entryData.trade_id] : [],
      images: [],
      emotion: entryData.emotion,
      analysis: entryData.analysis,
      notes: entryData.notes,
      createdAt: entryData.created_at,
      updatedAt: entryData.updated_at,
    };

    // Map images from DB snake_case to camelCase format
    const images: JournalImage[] = (imagesResult.data || []).map(
      (img: {
        id: string;
        user_id: string;
        journal_entry_id: string;
        url: string;
        path: string;
        timeframe: string;
        display_order: number;
        created_at: string;
      }) => ({
        id: img.id,
        userId: img.user_id,
        journalEntryId: img.journal_entry_id,
        url: ensureFreshImageUrl(img.url),
        path: img.path,
        timeframe: img.timeframe,
        displayOrder: img.display_order,
        createdAt: img.created_at,
      })
    );

    // Process trade context
    let tradeContext: MarketConditionsCardProps | null = null;

    const { data: bridgeResponse, error: bridgeError } = bridgeResult;
    if (bridgeError) {
      console.error("[SharePage] Bridge RPC error:", bridgeError);
    } else if (bridgeResponse?.error) {
      console.error("[SharePage] Bridge logic error:", bridgeResponse.error);
    } else if (bridgeResponse?.data) {
      const tradeData = bridgeResponse.data;

      const confluencesArray = tradeData.tags
        ? tradeData.tags
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean)
        : [];

      const hasData = Boolean(
        tradeData.market_condition_v2 ||
        tradeData.strategy ||
        tradeData.tf_analise ||
        tradeData.tf_entrada ||
        tradeData.setup ||
        tradeData.htf_aligned !== null ||
        confluencesArray.length > 0 ||
        tradeData.entry_quality ||
        tradeData.pd_array
      );

      if (hasData) {
        tradeContext = {
          condition: mapMarketConditionFromDb(tradeData.market_condition_v2) || undefined,
          strategy: tradeData.strategy || undefined,
          strategyIcon: tradeData.strategy_icon || undefined,
          tfAnalise: tradeData.tf_analise || undefined,
          tfEntrada: tradeData.tf_entrada || undefined,
          setup: tradeData.setup || undefined,
          htfAligned: tradeData.htf_aligned ?? undefined,
          confluences: confluencesArray.length > 0 ? confluencesArray : undefined,
          evaluation: mapEntryQualityFromDb(tradeData.entry_quality) || undefined,
          pdArray: tradeData.pd_array || undefined,
        };
      }
    }

    return { entry, images, tradeContext };
  } catch (err) {
    console.error("Error loading shared entry:", err);
    return { error: "Erro ao carregar entrada compartilhada" };
  }
}

// Server Component
export default async function SharePage({ params }: { params: { token: string } }) {
  const { token } = params;
  const result = await getSharedEntry(token);

  // Handle errors
  if ("error" in result) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8)), url(/images/share-bg.jpg)",
        }}
      >
        <div className="text-center">
          <div className="mb-4 text-6xl">🔗</div>
          <h1 className="mb-2 text-2xl font-bold text-gray-100">{result.error}</h1>
          <p className="text-gray-400">Este link pode ter expirado ou sido removido.</p>
        </div>
      </div>
    );
  }

  const { entry, images, tradeContext } = result;

  if (!entry) {
    notFound();
  }

  // Parse notes JSON
  const parsedNotes = entry?.notes
    ? (() => {
        try {
          return JSON.parse(entry.notes);
        } catch {
          return null;
        }
      })()
    : null;

  return (
    <div className="relative min-h-screen px-4 py-12">
      {/* Fixed Background for better mobile support */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.55)), url(/images/share-bg.jpg)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2">
            <span className="text-emerald-400">🔗</span>
            <span className="text-sm font-medium text-emerald-400">Entrada Compartilhada</span>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-100">{entry.title}</h1>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
            <span>📅 {new Date(entry.date).toLocaleDateString("pt-BR")}</span>
            {entry.asset && <span>📊 {entry.asset}</span>}
          </div>
        </div>

        {/* Market Conditions Section */}
        {tradeContext && (
          <div className="mb-8">
            <MarketConditionsCard {...tradeContext} />
          </div>
        )}

        {/* Analyses (Images) Section - Client Component for interactivity */}
        <ImageGalleryClient images={images} />

        {/* Analysis & Notes */}
        <div className="space-y-6">
          {entry.emotion && (
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
              <h3 className="mb-3 text-lg font-semibold text-gray-200">🧠 Estado Emocional</h3>
              <p className="text-gray-300">{entry.emotion}</p>
            </div>
          )}

          {entry.analysis && (
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
              <h3 className="mb-3 text-lg font-semibold text-gray-200">📊 Análise</h3>
              <p className="whitespace-pre-wrap text-gray-300">{entry.analysis}</p>
            </div>
          )}

          {parsedNotes && (
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-200">
                <span>📜</span> Review
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <h4 className="mb-2 text-xs font-bold text-green-400 uppercase">Acertos</h4>
                  <p className="text-sm whitespace-pre-wrap text-gray-300">
                    {parsedNotes.technicalWins || "-"}
                  </p>
                </div>
                <div>
                  <h4 className="mb-2 text-xs font-bold text-yellow-400 uppercase">Melhorias</h4>
                  <p className="text-sm whitespace-pre-wrap text-gray-300">
                    {parsedNotes.improvements || "-"}
                  </p>
                </div>
                <div>
                  <h4 className="mb-2 text-xs font-bold text-red-400 uppercase">Erros</h4>
                  <p className="text-sm whitespace-pre-wrap text-gray-300">
                    {parsedNotes.errors || "-"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>⏰ Este link expira em breve</p>
        </div>
      </div>
    </div>
  );
}
