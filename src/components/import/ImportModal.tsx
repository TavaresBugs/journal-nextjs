"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { IconActionButton } from "@/components/ui/IconActionButton";
import { RawTradeData, processImportFile, parseNinjaTraderCSV } from "@/services/trades/import";
import {
  parseTradovateCSV,
  determineTradovateDirection,
  cleanTradovateSymbol,
  parseTradovateMoney,
} from "@/services/trades/tradovateParser";
import {
  ColumnMapping,
  DataSource,
  detectColumnMapping,
  transformTrades,
} from "@/services/trades/importParsers";
import { getAccountsAction } from "@/app/actions/accounts";
import {
  saveTradesBatchAction,
  getTradeHistoryLiteAction,
  deleteTradesByAccountAction,
} from "@/app/actions/trades";

// Helper for chunking array
const chunkArray = <T,>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};
import { ImportStepUpload } from "./steps/ImportStepUpload";
import { ImportStepMapping } from "./steps/ImportStepMapping";
import { ImportStepReview } from "./steps/ImportStepReview";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
  defaultAccountId?: string;
}

type ImportStep = "source_selection" | "upload" | "mapping" | "importing" | "complete";

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  defaultAccountId,
}) => {
  const [step, setStep] = useState<ImportStep>("source_selection");
  const [dataSource, setDataSource] = useState<DataSource>(null);

  const [error, setError] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(defaultAccountId || "");

  // Timezone State
  const [brokerTimezone, setBrokerTimezone] = useState<string>("Europe/Helsinki"); // Default MT4

  // Import Mode State (Append vs Replace)
  const [importMode, setImportMode] = useState<"append" | "replace">("append");

  // Parsed data state
  const [rawData, setRawData] = useState<RawTradeData[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);

  const [mapping, setMapping] = useState<ColumnMapping>({
    entryDate: "",
    symbol: "",
    direction: "",
    volume: "",
    entryPrice: "",
    exitDate: "",
    exitPrice: "",
    profit: "",
    commission: "",
    swap: "",
    sl: "",
    tp: "",
  });

  // Stats
  const [importStats, setImportStats] = useState({ total: 0, success: 0, failed: 0, skipped: 0 });
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    if (isOpen) {
      loadAccounts();
      resetState();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAccounts = async () => {
    // Use defaultAccountId if provided, otherwise load first account
    if (defaultAccountId) {
      setSelectedAccountId(defaultAccountId);
    } else {
      const loadedAccounts = await getAccountsAction();
      if (loadedAccounts.length > 0) {
        setSelectedAccountId(loadedAccounts[0].id);
      }
    }
  };

  const resetState = () => {
    setStep("source_selection");
    setDataSource(null);
    setError(null);
    setRawData([]);
    setHeaders([]);
    setImportStats({ total: 0, success: 0, failed: 0, skipped: 0 });
    setImportProgress({ current: 0, total: 0 });
    setBrokerTimezone("Europe/Helsinki");
    setImportMode("append");
  };

  const handleSourceSelect = (source: DataSource) => {
    setDataSource(source);
    if (source) {
      setStep("upload");
    } else {
      setStep("source_selection");
    }
  };

  // Handle file uploads (both MT4/5 and NinjaTrader)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, source: DataSource) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);

    try {
      let data: RawTradeData[] = [];
      let detectedHeaders: string[] = [];

      if (source === "metatrader") {
        if (selectedFile.name.endsWith(".csv")) {
          throw new Error("Arquivos CSV não são suportados para MetaTrader. Use HTML ou Excel.");
        }
        const result = await processImportFile(selectedFile);
        data = result.data;
        if (data.length === 0) throw new Error("No data found in file.");
        detectedHeaders = Object.keys(data[0]);

        // Auto-detect mappings
        setMapping(detectColumnMapping(detectedHeaders));
        setBrokerTimezone("Europe/Helsinki"); // Default for MT4
      } else if (source === "ninjatrader") {
        if (!selectedFile.name.endsWith(".csv")) {
          throw new Error("NinjaTrader aceita apenas arquivos .csv do Grid de Negociações.");
        }
        const result = await parseNinjaTraderCSV(selectedFile);
        data = result.data;
        if (data.length === 0) throw new Error("Nenhum dado encontrado no arquivo.");
        detectedHeaders = Object.keys(data[0]);

        // Auto-map NinjaTrader columns using detected headers
        setMapping(detectColumnMapping(detectedHeaders));
        setBrokerTimezone("America/Sao_Paulo"); // Default for NinjaTrader users in Brazil
      } else if (source === "tradovate") {
        const isPdf = selectedFile.name.endsWith(".pdf");
        const isCsv = selectedFile.name.endsWith(".csv");

        if (!isCsv && !isPdf) {
          throw new Error("Tradovate aceita apenas arquivos .csv ou .pdf de Performance.");
        }

        // Import the PDF parser dynamically
        const { parseTradovatePDF } = await import("@/services/trades/tradovateParser");

        // Use appropriate parser based on file type
        const result = isPdf
          ? await parseTradovatePDF(selectedFile)
          : await parseTradovateCSV(selectedFile);

        // Convert Tradovate format to RawTradeData format
        data = result.data.map((trade) => {
          const direction = determineTradovateDirection(trade.boughtTimestamp, trade.soldTimestamp);
          const isLong = direction === "Long";

          return {
            "Entry Time": isLong ? trade.boughtTimestamp : trade.soldTimestamp,
            "Exit Time": isLong ? trade.soldTimestamp : trade.boughtTimestamp,
            Symbol: cleanTradovateSymbol(trade.symbol),
            Type: direction,
            Volume: trade.qty,
            "Entry Price": isLong ? trade.buyPrice : trade.sellPrice,
            "Exit Price": isLong ? trade.sellPrice : trade.buyPrice,
            Profit: String(parseTradovateMoney(trade.pnl)),
          } as RawTradeData;
        });

        if (data.length === 0) throw new Error("Nenhum dado encontrado no arquivo.");
        detectedHeaders = Object.keys(data[0]);

        // Set standard mapping for Tradovate converted data
        setMapping({
          entryDate: "Entry Time",
          exitDate: "Exit Time",
          symbol: "Symbol",
          direction: "Type",
          volume: "Volume",
          entryPrice: "Entry Price",
          exitPrice: "Exit Price",
          profit: "Profit",
          commission: "",
          swap: "",
          sl: "",
          tp: "",
        });
        setBrokerTimezone("America/New_York"); // Tradovate uses EST
      }

      setRawData(data);
      setHeaders(detectedHeaders);
      setStep("mapping");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to parse file");
    }
  };

  const handleImport = async () => {
    if (!selectedAccountId) {
      setError("Please select an account.");
      return;
    }

    setStep("importing");
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    try {
      // Optional: Replace Mode - Delete all existing trades
      if (importMode === "replace") {
        const result = await deleteTradesByAccountAction(selectedAccountId);
        if (!result.success) {
          throw new Error("Failed to clear existing trades: " + result.error);
        }
      }

      let existingSignatures = new Set<string>();

      // Only fetch existing trades for deduplication if we are appending
      if (importMode === "append") {
        const existingTrades = await getTradeHistoryLiteAction(selectedAccountId);
        existingSignatures = new Set(
          existingTrades.map((t) => {
            const time = t.entryTime ? t.entryTime.substring(0, 5) : "00:00";
            return `${t.entryDate}|${time}|${t.symbol}|${t.type}|${t.entryPrice}`;
          })
        );
      }

      // Use Service Parser to transform raw data to Trade objects
      const allTrades = transformTrades(
        rawData,
        mapping,
        dataSource,
        brokerTimezone,
        selectedAccountId
      );

      // Filter valid trades and handle deduplication
      const validTrades = allTrades.filter((trade) => {
        // Deduplication Check
        const entryTime = trade.entryTime || "00:00:00";
        const signature = `${trade.entryDate}|${entryTime.substring(0, 5)}|${trade.symbol}|${trade.type}|${trade.entryPrice}`;

        if (importMode === "append" && existingSignatures.has(signature)) {
          skippedCount++;
          return false;
        }
        return true;
      });

      // Prepare for batch processing
      const BATCH_SIZE = 50; // Process 50 trades at a time
      const chunks = chunkArray(validTrades, BATCH_SIZE);
      const totalToProcess = validTrades.length;
      let processedCount = 0;

      // Initialize progress
      setImportProgress({ current: 0, total: totalToProcess });

      for (const chunk of chunks) {
        // Call server action for this batch
        const result = await saveTradesBatchAction(chunk);

        if (result.success) {
          successCount += result.count;
        } else {
          // If batch fails, we assume all in batch failed (or we could retry individually)
          failedCount += chunk.length;
          console.error("Batch failed:", result.error);
        }

        processedCount += chunk.length;
        setImportProgress({ current: processedCount, total: totalToProcess });
      }

      // Calculate failed/skipped based on raw data difference
      // Trades that failed transformTrades are (rawData.length - allTrades.length)
      // Trades that were duplicates are skippedCount
      // Trades that failed batch save are in failedCount (from batch response)

      const transformFailures = rawData.length - allTrades.length;
      failedCount += transformFailures;
    } catch (err) {
      console.error("Failed import process", err);
      setError("Erro na importação. Tente novamente.");
      setStep("mapping");
      return;
    }

    setImportStats({
      total: rawData.length,
      success: successCount,
      failed: failedCount,
      skipped: skippedCount,
    });
    setStep("complete");
    if (onImportComplete) onImportComplete();
  };

  const renderStepContent = () => {
    switch (step) {
      case "source_selection":
      case "upload":
        return (
          <ImportStepUpload
            onSourceSelect={handleSourceSelect}
            onFileSelect={handleFileSelect}
            selectedSource={dataSource}
            error={error}
          />
        );

      case "mapping":
        return (
          <ImportStepMapping
            rawData={rawData}
            headers={headers}
            mapping={mapping}
            setMapping={setMapping}
            selectedAccountId={selectedAccountId}
            brokerTimezone={brokerTimezone}
            setBrokerTimezone={setBrokerTimezone}
            importMode={importMode}
            setImportMode={setImportMode}
            onImport={handleImport}
            onCancel={resetState}
          />
        );

      case "importing":
      case "complete":
        return (
          <ImportStepReview
            status={step === "importing" ? "importing" : "complete"}
            stats={importStats}
            progress={importProgress}
            onClose={onClose}
          />
        );

      default:
        return null;
    }
  };

  // Dynamic title with back button when in upload step with source selected
  const renderTitle = () => {
    if (step === "complete") return "Resultado da Importação";

    if (step === "upload" && dataSource) {
      return (
        <div className="flex items-center gap-2">
          <IconActionButton
            variant="back"
            onClick={() => handleSourceSelect(null)}
            title="Voltar para seleção"
          />
          <span className="text-xl font-bold text-gray-100">Importar Trades</span>
        </div>
      );
    }

    return "Importar Trades";
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={renderTitle()} maxWidth="4xl">
      {renderStepContent()}
    </Modal>
  );
};
