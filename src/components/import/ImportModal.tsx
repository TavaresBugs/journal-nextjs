'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ColumnMapper, ColumnMapping } from './ColumnMapper';
import { parseTradingFile, RawTradeData, parseTradeDate, normalizeTradeType, cleanSymbol } from '@/services/importService';
import { getAccounts } from '@/services/accountService';
import { saveTrade } from '@/services/tradeService';
import { Account, Trade } from '@/types';
import { cn } from '@/lib/utils';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
  defaultAccountId?: string;
}

type ImportStep = 'upload' | 'mapping' | 'importing' | 'complete';

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImportComplete, defaultAccountId }) => {
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  // Parsed data state
  const [rawData, setRawData] = useState<RawTradeData[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);

  // Mapping state
  const [mapping, setMapping] = useState<ColumnMapping>({
    entryDate: '',
    symbol: '',
    direction: '',
    volume: '',
    entryPrice: '',
    exitDate: '',
    exitPrice: '',
    profit: '',
    commission: '',
    swap: '',
  });

  // Stats
  const [importStats, setImportStats] = useState({ total: 0, success: 0, failed: 0 });

  useEffect(() => {
    if (isOpen) {
      loadAccounts();
      resetState();
    }
  }, [isOpen]);

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
    setStep('upload');
    setFile(null);
    setError(null);
    setRawData([]);
    setHeaders([]);
    setImportStats({ total: 0, success: 0, failed: 0 });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);

    try {
      const data = await parseTradingFile(selectedFile);
      if (data.length === 0) {
        throw new Error('No data found in file.');
      }

      const detectedHeaders = Object.keys(data[0]);
      setHeaders(detectedHeaders);
      setRawData(data);
      setStep('mapping');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    }
  };

  const handleImport = async () => {
    if (!selectedAccountId) {
        setError('Please select an account.');
        return;
    }

    setStep('importing');
    let successCount = 0;
    let failedCount = 0;

    for (const row of rawData) {
        try {
            const entryDate = parseTradeDate(row[mapping.entryDate]);
            if (!entryDate) {
                // Skip invalid rows without valid entry date
                failedCount++;
                continue;
            }

            const symbol = cleanSymbol(String(row[mapping.symbol]));
            const type = normalizeTradeType(String(row[mapping.direction]));

            // Required fields check
            if (!symbol || !type) {
                failedCount++;
                continue;
            }

            const trade: Trade = {
                id: crypto.randomUUID(),
                userId: '', // handled by service
                accountId: selectedAccountId,
                symbol: symbol,
                type: type,
                entryDate: entryDate.toISOString().split('T')[0],
                entryTime: entryDate.toTimeString().split(' ')[0], // HH:MM:SS

                entryPrice: Number(row[mapping.entryPrice]) || 0,
                lot: Number(row[mapping.volume]) || 0,

                stopLoss: 0, // Not in mapping requirement but required in Trade type. Default 0.
                takeProfit: 0, // Not in mapping requirement but required in Trade type. Default 0.

                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            // Optional fields
            if (mapping.exitDate && row[mapping.exitDate]) {
                 const exitDate = parseTradeDate(row[mapping.exitDate]);
                 if (exitDate) {
                     trade.exitDate = exitDate.toISOString().split('T')[0];
                     trade.exitTime = exitDate.toTimeString().split(' ')[0];
                 }
            }

            if (mapping.exitPrice && row[mapping.exitPrice]) {
                trade.exitPrice = Number(row[mapping.exitPrice]);
            }

            if (mapping.profit && row[mapping.profit]) {
                trade.pnl = Number(row[mapping.profit]);

                // Calculate outcome based on PnL
                if (trade.pnl > 0) trade.outcome = 'win';
                else if (trade.pnl < 0) trade.outcome = 'loss';
                else trade.outcome = 'breakeven';
            }

            // Commission & Swap?
            // Trade interface doesn't strictly have commission/swap fields visible in the definition I read earlier (in src/types/index.ts).
            // Let me double check src/types/index.ts content I read.
            // Trade interface: id, userId, accountId, symbol, type, entryPrice, stopLoss, takeProfit, exitPrice, lot, tfAnalise, tfEntrada, tags, strategy, setup, notes, entryDate, entryTime, exitDate, exitTime, pnl, outcome.
            // It does NOT have commission or swap.
            // So I will ignore them for now or put them in notes?
            // The prompt asked to map them. Maybe I should put them in notes.

            const notesParts = [];
            if (mapping.commission && row[mapping.commission]) {
                notesParts.push(`Comm: ${row[mapping.commission]}`);
            }
            if (mapping.swap && row[mapping.swap]) {
                notesParts.push(`Swap: ${row[mapping.swap]}`);
            }
            if (notesParts.length > 0) {
                trade.notes = notesParts.join(', ');
            }

            const saved = await saveTrade(trade);
            if (saved) {
                successCount++;
            } else {
                failedCount++;
            }

        } catch (e) {
            console.error('Error importing row', row, e);
            failedCount++;
        }
    }

    setImportStats({
        total: rawData.length,
        success: successCount,
        failed: failedCount
    });
    setStep('complete');
    if (onImportComplete) onImportComplete();
  };

  const renderStepContent = () => {
    switch (step) {
      case 'upload':
        return (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-600 rounded-lg bg-gray-800/50">
            <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mb-4 text-gray-300">Drag & Drop or Click to Upload (.xlsx, .csv)</p>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-600 file:text-white
                hover:file:bg-indigo-700
                cursor-pointer"
            />
            {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}
          </div>
        );

      case 'mapping':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Target Account</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
                ))}
              </select>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg overflow-x-auto">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Data Preview (First 5 rows)</h4>
              <table className="min-w-full text-xs text-left text-gray-400">
                <thead className="border-b border-gray-700 bg-gray-700/50">
                  <tr>
                    {headers.map(h => <th key={h} className="px-2 py-1">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rawData.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b border-gray-700/50">
                      {headers.map(h => <td key={h} className="px-2 py-1">{row[h]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white p-4 rounded-lg text-gray-900">
                <ColumnMapper
                    headers={headers}
                    mapping={mapping}
                    onChange={setMapping}
                />
            </div>

            <div className="flex justify-end gap-2 mt-4">
                 <button
                    onClick={resetState}
                    className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600"
                >
                    Cancel
                </button>
                <button
                    onClick={handleImport}
                    disabled={!selectedAccountId}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                    Import {rawData.length} Trades
                </button>
            </div>
          </div>
        );

      case 'importing':
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
            <p className="text-gray-300">Importing trades...</p>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center py-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-100">Import Complete</h3>
            <div className="mt-2 text-sm text-gray-400">
              <p>Total processed: {importStats.total}</p>
              <p className="text-green-400">Successfully imported: {importStats.success}</p>
              {importStats.failed > 0 && (
                 <p className="text-red-400">Failed: {importStats.failed}</p>
              )}
            </div>
             <div className="mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Close
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Trades"
      maxWidth="4xl"
    >
      {renderStepContent()}
    </Modal>
  );
};
