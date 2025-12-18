"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import {
  RawTradeData,
  processImportFile,
  parseNinjaTraderCSV,
  getNinjaTraderAutoMapping,
} from "@/services/trades/import";
import {
  ColumnMapping,
  DataSource,
  detectColumnMapping,
  transformTrades,
} from "@/services/trades/importParsers";
import { getAccounts } from "@/services/core/account";
import { saveTrade } from "@/services/trades/trade";
import { Account } from "@/types";
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
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

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

  useEffect(() => {
    if (isOpen) {
      loadAccounts();
      resetState();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAccounts = async () => {
    const loadedAccounts = await getAccounts();
    setAccounts(loadedAccounts);
    if (defaultAccountId) {
      setSelectedAccountId(defaultAccountId);
    } else if (loadedAccounts.length > 0) {
      setSelectedAccountId(loadedAccounts[0].id);
    }
  };

  const resetState = () => {
    setStep("source_selection");
    setDataSource(null);
    setError(null);
    setRawData([]);
    setHeaders([]);
    setImportStats({ total: 0, success: 0, failed: 0, skipped: 0 });
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

        // Auto-map NinjaTrader columns
        setMapping(getNinjaTraderAutoMapping());
        setBrokerTimezone("America/Sao_Paulo"); // Default for NinjaTrader users in Brazil
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
      const { getTradeHistoryLite, deleteTradesByAccount } =
        await import("@/services/trades/trade");

      // Optional: Replace Mode - Delete all existing trades
      if (importMode === "replace") {
        const deleted = await deleteTradesByAccount(selectedAccountId);
        if (!deleted) {
          throw new Error("Failed to clear existing trades.");
        }
      }

      let existingSignatures = new Set<string>();

      // Only fetch existing trades for deduplication if we are appending
      if (importMode === "append") {
        const existingTrades = await getTradeHistoryLite(selectedAccountId);
        existingSignatures = new Set(
          existingTrades.map((t) => {
            const time = t.entryTime ? t.entryTime.substring(0, 5) : "00:00";
            return `${t.entryDate}|${time}|${t.symbol}|${t.type}|${t.entryPrice}`;
          })
        );
      }

      // Use Service Parser to transform raw data to Trade objects
      const tradesToSave = transformTrades(
        rawData,
        mapping,
        dataSource,
        brokerTimezone,
        selectedAccountId
      );

      // Filter valid trades and handle deduplication
      for (const trade of tradesToSave) {
        // Deduplication Check
        const entryTime = trade.entryTime || "00:00:00";
        const signature = `${trade.entryDate}|${entryTime.substring(0, 5)}|${trade.symbol}|${trade.type}|${trade.entryPrice}`;

        if (importMode === "append" && existingSignatures.has(signature)) {
          skippedCount++;
          continue;
        }

        const saved = await saveTrade(trade);
        if (saved) {
          successCount++;
        } else {
          failedCount++;
        }
      }

      // Also count rows that failed parsing in transformTrades (implicitly failed as they are not in tradesToSave)
      // Actually, transformTrades skips errors, so (rawData.length - tradesToSave.length) are parse failures.
      // We should add them to failedCount.
      failedCount += rawData.length - tradesToSave.length;
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
            onCancel={onClose}
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
            accounts={accounts}
            selectedAccountId={selectedAccountId}
            setSelectedAccountId={setSelectedAccountId}
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
            onClose={onClose}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === "complete" ? "Resultado da Importação" : "Importar Trades"}
      maxWidth="4xl"
    >
      {renderStepContent()}
    </Modal>
  );
};
