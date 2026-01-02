import { notFound } from "next/navigation";
import { prisma } from "@/lib/database";
import { ensureFreshImageUrl } from "@/lib/utils/general";
import {
  MarketConditionsCard,
  type MarketConditionsCardProps,
} from "@/components/shared/MarketConditionsCard";
import { mapMarketConditionFromDb, mapEntryQualityFromDb } from "@/lib/trade-mappings";
import { ImageGalleryClient } from "@/components/share/ImageGalleryClient";
import type { JournalEntry, JournalImage } from "@/types";
import { AssetBadge } from "@/components/ui/AssetBadge";
import { SharedArguments } from "@/components/share/SharedArguments";

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
    // Get shared journal by token using Prisma (bypasses RLS)
    const sharedData = await prisma.shared_journals.findUnique({
      where: { share_token: token },
      select: { journal_entry_id: true, expires_at: true },
    });

    if (!sharedData) {
      return { error: "Link inválido ou expirado" };
    }

    // Check expiration
    if (new Date(sharedData.expires_at) < new Date()) {
      return { error: "Este link expirou" };
    }

    // Increment view count (non-blocking background operation)
    void (async () => {
      try {
        await prisma.shared_journals.update({
          where: { share_token: token },
          data: { view_count: { increment: 1 } },
        });
      } catch (err) {
        console.error("Failed to increment view count:", err);
      }
    })();

    // Fetch Entry, Images, and Arguments
    const [entryData, imagesData, argumentsData] = await Promise.all([
      prisma.journal_entries.findUnique({
        where: { id: sharedData.journal_entry_id },
      }),
      prisma.journal_images.findMany({
        where: { journal_entry_id: sharedData.journal_entry_id },
        orderBy: { display_order: "asc" },
      }),
      prisma.trade_arguments.findMany({
        where: { journal_entry_id: sharedData.journal_entry_id },
        orderBy: { created_at: "asc" },
      }),
    ]);

    if (!entryData) {
      return { error: "Entrada não encontrada" };
    }

    // Map entry data
    const entry: JournalEntry = {
      id: entryData.id,
      userId: entryData.user_id || "",
      accountId: entryData.account_id,
      date: entryData.date.toISOString(),
      title: entryData.title,
      asset: entryData.asset || "",
      tradeIds: entryData.trade_id ? [entryData.trade_id] : [],
      images: [],
      emotion: entryData.emotion || "",
      analysis: entryData.analysis || "",
      notes: entryData.notes || "",
      createdAt: entryData.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: entryData.updated_at?.toISOString() || new Date().toISOString(),
    };

    // Map images from DB snake_case to camelCase format
    const images: JournalImage[] = imagesData.map((img) => ({
      id: img.id,
      userId: img.user_id || "",
      journalEntryId: img.journal_entry_id,
      url: ensureFreshImageUrl(img.url),
      path: img.path,
      timeframe: img.timeframe,
      displayOrder: img.display_order || 0,
      createdAt: img.created_at?.toISOString() || new Date().toISOString(),
    }));

    // Process trade context
    let tradeContext: MarketConditionsCardProps | null = null;
    let tradeId = entryData.trade_id;

    // Fallback: If no direct trade_id, check journal_entry_trades table
    if (!tradeId) {
      const linkedTrade = await prisma.journal_entry_trades.findFirst({
        where: { journal_entry_id: sharedData.journal_entry_id },
        select: { trade_id: true },
      });
      if (linkedTrade) {
        tradeId = linkedTrade.trade_id;
      }
    }

    if (tradeId) {
      const tradeData = await prisma.trades.findUnique({
        where: { id: tradeId },
      });

      if (tradeData) {
        const confluencesArray = tradeData.tags
          ? tradeData.tags
              .split(",")
              .map((t) => t.trim())
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
            condition:
              mapMarketConditionFromDb(tradeData.market_condition_v2 || undefined) || undefined,
            strategy: tradeData.strategy || undefined,
            strategyIcon: tradeData.strategy_icon || undefined,
            tfAnalise: tradeData.tf_analise || undefined,
            tfEntrada: tradeData.tf_entrada || undefined,
            setup: tradeData.setup || undefined,
            htfAligned: tradeData.htf_aligned ?? undefined,
            confluences: confluencesArray.length > 0 ? confluencesArray : undefined,
            evaluation: mapEntryQualityFromDb(tradeData.entry_quality || undefined) || undefined,
            pdArray: tradeData.pd_array || undefined,
          };
        }
      }
    }

    const bullishArgs = argumentsData
      .filter((arg) => arg.type === "pro")
      .map((arg) => ({ id: arg.id, text: arg.argument }));

    const bearishArgs = argumentsData
      .filter((arg) => arg.type === "contra")
      .map((arg) => ({ id: arg.id, text: arg.argument }));

    return { entry, images, tradeContext, bullishArgs, bearishArgs };
  } catch (err) {
    console.error("Error loading shared entry:", err);
    return { error: "Erro ao carregar entrada compartilhada" };
  }
}

// Server Component
export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
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

  const { entry, images, tradeContext, bullishArgs, bearishArgs } = result;

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
          <div className="flex items-center justify-center gap-3">
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700/50 bg-gray-800/60 px-2.5 py-1 backdrop-blur-sm">
              <span>📅</span>
              <span className="text-sm font-medium text-gray-300">
                {new Date(entry.date).toLocaleDateString("pt-BR")}
              </span>
            </div>

            {entry.asset && <AssetBadge symbol={entry.asset} size="md" />}
          </div>
        </div>

        {/* Market Conditions Section */}
        {tradeContext && (
          <div className="mb-8">
            <MarketConditionsCard {...tradeContext} />
          </div>
        )}

        {/* PD Array Analysis (Trade Arguments) */}
        {(bullishArgs?.length > 0 || bearishArgs?.length > 0) && (
          <div className="mb-8">
            <SharedArguments bullishArgs={bullishArgs} bearishArgs={bearishArgs} />
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
