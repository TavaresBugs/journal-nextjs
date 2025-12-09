'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ColumnMapper, ColumnMapping } from './ColumnMapper';
import { 
  RawTradeData, 
  processImportFile, 
  parseTradeDate, 
  normalizeTradeType, 
  cleanSymbol,
  parseNinjaTraderCSV,
  parseNinjaTraderDate,
  parseNinjaTraderMoney,
  parseNinjaTraderPrice,
  getNinjaTraderAutoMapping
} from '@/services/importService';
import { getAccounts } from '@/services/accountService';
import { saveTrade } from '@/services/tradeService';
import { Account, Trade } from '@/types';
import { cn } from '@/lib/utils';
import { calculateSession } from '@/utils/tradeUtils';
import { fromZonedTime, toZonedTime, format } from 'date-fns-tz';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
  defaultAccountId?: string;
}

type ImportStep = 'source_selection' | 'upload' | 'upload_ninjatrader' | 'mapping' | 'importing' | 'complete';
type DataSource = 'metatrader' | 'ninjatrader' | null;

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImportComplete, defaultAccountId }) => {
  const [step, setStep] = useState<ImportStep>('source_selection');
  const [dataSource, setDataSource] = useState<DataSource>(null);

  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  
  // Timezone State
  const [brokerTimezone, setBrokerTimezone] = useState<string>('Europe/Helsinki'); // Default MT4

  // Import Mode State (Append vs Replace)
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');

  // Parsed data state
  const [rawData, setRawData] = useState<RawTradeData[]>([]);
  // columnMapping unused, removed.
  const [headers, setHeaders] = useState<string[]>([]);
  
  // ... (Mapping Check: keep as is) ...
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
    setStep('source_selection');
    setDataSource(null);
    setError(null);
    setRawData([]);
    setHeaders([]);
    setImportStats({ total: 0, success: 0, failed: 0, skipped: 0 });
    setBrokerTimezone('Europe/Helsinki');
    setImportMode('append');
    setImportMode('append');
  };

  // ... (handleFileUpload - keep as is) ...
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;


    setError(null);

    if (selectedFile.name.endsWith('.csv')) {
        setError('Arquivos CSV não são suportados para MetaTrader. Use HTML ou Excel.');
        return;
    }

    try {
      const { data } = await processImportFile(selectedFile);
      if (data.length === 0) {
        throw new Error('No data found in file.');
      }

      const detectedHeaders = Object.keys(data[0]);
      setHeaders(detectedHeaders);
      setRawData(data); // data is RawTradeData[]
      // setTotalNetProfit(fileTotalNetProfit); // Removed as per request

      // Auto-detect mappings from first row
      const firstRow = data[0];
      const autoMapping: ColumnMapping = {
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
      };
      if (firstRow) {
        const headers = Object.keys(firstRow);
        
        // Helper: Find header case-insensitive
        const findHeader = (candidates: string[]) => 
            headers.find(h => candidates.some(c => h.toLowerCase() === c.toLowerCase()));

        if (firstRow['Open Time']) autoMapping.entryDate = 'Open Time';
        else {
             const h = findHeader(['Open Time', 'Time', 'Data Abertura', 'Hora Entrada']);
             if (h) autoMapping.entryDate = h;
        }

        if (firstRow['Symbol']) autoMapping.symbol = 'Symbol';
        else {
             const h = findHeader(['Symbol', 'Ativo', 'Instrumento']);
             if (h) autoMapping.symbol = h;
        }

        if (firstRow['Type']) autoMapping.direction = 'Type';
        else {
             const h = findHeader(['Type', 'Tipo', 'Direção', 'Direcao']);
             if (h) autoMapping.direction = h;
        }
        
        if (firstRow['Volume']) autoMapping.volume = 'Volume';
        else {
             const h = findHeader(['Volume', 'Size', 'Lote', 'Qtd', 'Quantidade']);
             if (h) autoMapping.volume = h;
        }

        if (firstRow['Open Price']) autoMapping.entryPrice = 'Open Price';
        else {
             const h = findHeader(['Open Price', 'Price', 'Preço Entrada', 'Preco Entrada']);
             if (h) autoMapping.entryPrice = h;
        }

        if (firstRow['Close Time']) autoMapping.exitDate = 'Close Time';
        else {
             const h = findHeader(['Close Time', 'Data Fechamento', 'Hora Saída', 'Hora Saida']);
             if (h) autoMapping.exitDate = h;
        }

        if (firstRow['Close Price']) autoMapping.exitPrice = 'Close Price';
        else {
             const h = findHeader(['Close Price', 'Preço Saída', 'Preco Saida']);
             if (h) autoMapping.exitPrice = h;
        }
        
        if (firstRow['Profit']) autoMapping.profit = 'Profit';
        else {
             const h = findHeader(['Profit', 'Lucro', 'P/L', 'PnL']);
             if (h) autoMapping.profit = h;
        }

        // Enhanced mappings for Fees/Commission/Swap
        const commHeader = findHeader(['Commission', 'Comission', 'Comissao', 'Comissão', 'Fee', 'Fees', 'Corretagem', 'Cost']);
        if (commHeader) autoMapping.commission = commHeader;
        
        const swapHeader = findHeader(['Swap', 'Swaps', 'Rollover', 'Taxes', 'Taxa', 'Taxas']);
        if (swapHeader) autoMapping.swap = swapHeader;
      }
      setMapping(autoMapping);

      setStep('mapping');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    }
  };

  // Handle NinjaTrader CSV upload
  const handleNinjaTraderFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);

    if (!selectedFile.name.endsWith('.csv')) {
      setError('NinjaTrader aceita apenas arquivos .csv do Grid de Negociações.');
      return;
    }

    try {
      const { data } = await parseNinjaTraderCSV(selectedFile);
      if (data.length === 0) {
        throw new Error('Nenhum dado encontrado no arquivo.');
      }

      const detectedHeaders = Object.keys(data[0]);
      setHeaders(detectedHeaders);
      setRawData(data);
      // setTotalNetProfit(fileTotalNetProfit); // Removed as per request
      
      // Auto-map NinjaTrader columns
      const autoMapping = getNinjaTraderAutoMapping();
      setMapping(autoMapping);
      
      // Set default timezone for NinjaTrader - São Paulo (user's local time)
      // System converts to UTC for storage, then displays in NY time
      setBrokerTimezone('America/Sao_Paulo');
      
      setStep('mapping');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Falha ao processar arquivo');
    }
  };



  // Convert from source timezone to NY timezone for NinjaTrader
  // CSV is in Brasília time, but we want to store in NY time
  const convertToNYTime = (date: Date, sourceTimezone: string): Date => {
      // Extrair componentes de data/hora sem interferência de timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      const isoString = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      
      // First convert to UTC
      const utcDate = fromZonedTime(isoString, sourceTimezone);
      
      // Then convert UTC to NY time and return as if it were a local date
      const nyDate = toZonedTime(utcDate, 'America/New_York');
      return nyDate;
  };

  const handleImport = async () => {
    if (!selectedAccountId) {
        setError('Please select an account.');
        return;
    }

    setStep('importing');
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    try {
        const { getTradeHistoryLite, deleteTradesByAccount } = await import('@/services/tradeService');

        // Optional: Replace Mode - Delete all existing trades
        if (importMode === 'replace') {
             const deleted = await deleteTradesByAccount(selectedAccountId);
             if (!deleted) {
                 throw new Error('Failed to clear existing trades.');
             }
        }

        let existingSignatures = new Set<string>();
        
        // Only fetch existing trades for deduplication if we are appending
        if (importMode === 'append') {
            const existingTrades = await getTradeHistoryLite(selectedAccountId);
            // Normalize time to HH:mm (ignore seconds/milliseconds) to avoid duplicates
            // caused by timestamp precision differences between import files and DB
            existingSignatures = new Set(existingTrades.map(t => {
                // Take only HH:mm from entryTime (first 5 chars), ignoring seconds
                const time = t.entryTime ? t.entryTime.substring(0, 5) : '00:00';
                return `${t.entryDate}|${time}|${t.symbol}|${t.type}|${t.entryPrice}`;
            }));
        }

        const tradesToSave: Trade[] = [];

        for (const row of rawData) {
            try {
                // Use appropriate parser based on data source
                let entryDate: Date | null;
                if (dataSource === 'ninjatrader') {
                    entryDate = parseNinjaTraderDate(row[mapping.entryDate]);
                } else {
                    entryDate = parseTradeDate(row[mapping.entryDate]);
                }
                
                if (!entryDate) {
                    failedCount++;
                    continue;
                }

                // Apply Timezone Conversion - Always convert to NY time
                // Broker timezone (EET for FTMO, etc) -> NY time
                if (brokerTimezone) {
                    entryDate = convertToNYTime(entryDate, brokerTimezone);
                }

                const symbol = cleanSymbol(String(row[mapping.symbol]));
                const type = normalizeTradeType(String(row[mapping.direction]));

                if (!symbol || !type) {
                    failedCount++;
                    continue;
                }

                // Format date/time for storage (NY time directly from entryDate)
                // entryDate is already in NY time from convertToNYTime
                const entryDateStr = format(entryDate, 'yyyy-MM-dd');
                const entryTimeStr = format(entryDate, 'HH:mm:ss');
                
                // DEBUG: Log to verify correct values
                console.log('[Import Save Debug]', {
                    symbol: cleanSymbol(String(row[mapping.symbol])),
                    originalTime: row[mapping.entryDate],
                    brokerTimezone,
                    entryDateStr,
                    entryTimeStr,
                    expectedNY: 'Should be NY time'
                });
                
                // Use appropriate price parser based on data source
                let entryPrice: number;
                if (dataSource === 'ninjatrader') {
                    entryPrice = parseNinjaTraderPrice(row[mapping.entryPrice]);
                } else {
                    entryPrice = Number(row[mapping.entryPrice]) || 0;
                }


                const signature = `${entryDateStr}|${entryTimeStr.substring(0, 5)}|${symbol}|${type}|${entryPrice}`;
                
                // Deduplication Check (Only relevant in Append mode, as set is empty in Replace mode)
                // Note: signature uses only HH:mm to match existing trades normalization
                if (existingSignatures.has(signature)) {
                     skippedCount++;
                     continue;
                }

                // Parse volume/quantity
                let volume: number;
                if (dataSource === 'ninjatrader') {
                    volume = parseNinjaTraderPrice(row[mapping.volume]); // Uses same format
                } else {
                    volume = Number(row[mapping.volume]) || 0;
                }

                const trade: Trade = {
                    id: crypto.randomUUID(),
                    userId: '',
                    accountId: selectedAccountId,
                    symbol: symbol,
                    type: type,
                    entryDate: entryDateStr,
                    entryTime: entryTimeStr,
                    entryPrice: entryPrice,
                    lot: volume,
                    stopLoss: 0, 
                    takeProfit: 0, 
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    session: calculateSession(entryTimeStr),
                };

                // Exit Date/Price logic - adapted for NinjaTrader
                if (mapping.exitDate && row[mapping.exitDate]) {
                     let exitDate: Date | null;
                     if (dataSource === 'ninjatrader') {
                         exitDate = parseNinjaTraderDate(row[mapping.exitDate]);
                     } else {
                         exitDate = parseTradeDate(row[mapping.exitDate]);
                     }
                     if (exitDate) {
                         // Apply Timezone Conversion - Always convert to NY time
                         if (brokerTimezone) {
                             exitDate = convertToNYTime(exitDate, brokerTimezone);
                         }
                         // Store NY time directly
                         trade.exitDate = format(exitDate, 'yyyy-MM-dd');
                         trade.exitTime = format(exitDate, 'HH:mm:ss');
                     }
                }

                if (mapping.exitPrice && row[mapping.exitPrice]) {
                    if (dataSource === 'ninjatrader') {
                        trade.exitPrice = parseNinjaTraderPrice(row[mapping.exitPrice]);
                    } else {
                        trade.exitPrice = Number(row[mapping.exitPrice]);
                    }
                }

                if (mapping.profit && row[mapping.profit]) {
                    if (dataSource === 'ninjatrader') {
                        trade.pnl = parseNinjaTraderMoney(row[mapping.profit]);
                    } else {
                        trade.pnl = Number(row[mapping.profit]);
                    }

                    // Add commission and swap to PnL if they exist
                    // Note: commission and swap are usually negative numbers for costs
                    if (mapping.commission && row[mapping.commission]) {
                         const commVal = dataSource === 'ninjatrader' 
                            ? -Math.abs(parseNinjaTraderMoney(row[mapping.commission])) // Ninja is positive, make negative
                            : Number(row[mapping.commission]);
                         if (!isNaN(commVal)) trade.pnl += commVal;
                    }
                    if (mapping.swap && row[mapping.swap]) {
                         const swapVal = Number(row[mapping.swap]);
                         if (!isNaN(swapVal)) trade.pnl += swapVal;
                    }

                    if (trade.pnl > 0) trade.outcome = 'win';
                    else if (trade.pnl < 0) trade.outcome = 'loss';
                    else trade.outcome = 'breakeven';
                }

                const notesParts: string[] = [];
                // Only add other things to notes if needed.
                /* 
                if (mapping.commission && row[mapping.commission]) {
                    notesParts.push(`Comm: ${row[mapping.commission]}`);
                }
                if (mapping.swap && row[mapping.swap]) {
                    notesParts.push(`Swap: ${row[mapping.swap]}`);
                }
                */
                if (notesParts.length > 0) {
                    trade.notes = notesParts.join(', ');
                }

                // Map Commission and Swap directly
                if (mapping.commission && row[mapping.commission]) {
                     let commVal: number;
                     if (dataSource === 'ninjatrader') {
                         commVal = parseNinjaTraderMoney(row[mapping.commission]);
                         // NinjaTrader reports commission as positive, but we store as negative (cost)
                         if (commVal > 0) commVal = -commVal;
                     } else {
                         commVal = Number(row[mapping.commission]);
                     }
                     if (!isNaN(commVal)) trade.commission = commVal;
                }
                
                if (mapping.swap && row[mapping.swap]) {
                     const swapVal = Number(row[mapping.swap]);
                     if (!isNaN(swapVal)) trade.swap = swapVal;
                }

                tradesToSave.push(trade);

            } catch (e) {
                console.error('Error importing row', row, e);
                failedCount++;
            }
        }



        for (const trade of tradesToSave) {
            const saved = await saveTrade(trade);
            if (saved) {
                successCount++;
            } else {
                failedCount++;
            }
        }

    } catch (err) {
        console.error('Failed import process', err);
        setError('Erro na importação. Tente novamente.');
        setStep('mapping');
        return;
    }
    
    // ... (Stats update - keep as is) ...
    setImportStats({
        total: rawData.length,
        success: successCount,
        failed: failedCount,
        skipped: skippedCount
    });
    setStep('complete');
    if (onImportComplete) onImportComplete();
  };

  // ... (renderStepContent -> case 'mapping' update)
  // Inside return <div className="space-y-6"> ...
  // Add controls between "Conta de Destino" and "Preview" or nearby.

  // Let's scroll down to where renderStepContent is defined.
  // ...


  const renderStepContent = () => {
    switch (step) {
      case 'source_selection':
        return (
            <div className="py-8">
                <h3 className="text-center text-xl font-bold text-white mb-8">Selecione a Fonte de Dados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto px-4">
                    {/* MetaTrader Option */}
                     <button
                        onClick={() => { setDataSource('metatrader'); setStep('upload'); }}
                        className="flex flex-col items-center justify-center p-8 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-750 hover:border-green-500/50 transition-all group"
                    >
                        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                             <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <h4 className="text-lg font-semibold text-white mb-2">MetaTrader 4 / 5</h4>
                        <p className="text-sm text-gray-400 text-center">Relatórios HTML ou Excel exportados do MT4/MT5.</p>
                    </button>

                    {/* NinjaTrader Option */}
                    <button
                        onClick={() => { setDataSource('ninjatrader'); setStep('upload_ninjatrader'); }}
                        className="flex flex-col items-center justify-center p-8 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-750 hover:border-orange-500/50 transition-all group"
                    >
                        <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                             <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h4 className="text-lg font-semibold text-white mb-2">NinjaTrader</h4>
                        <p className="text-sm text-gray-400 text-center">Arquivo CSV do Grid de Negociações.</p>
                    </button>
                </div>

                {/* API Option (Disabled) - Full Width */}
                <div className="max-w-2xl mx-auto px-4 mt-4">
                    <div className="flex flex-col items-center justify-center p-6 bg-gray-900/50 border border-gray-800 rounded-xl opacity-60 cursor-not-allowed relative overflow-hidden">
                        <div className="absolute top-3 right-3 bg-gray-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded text-gray-400">Em Breve</div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gray-700/30 flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            </div>
                            <div className="text-left">
                                <h4 className="text-base font-semibold text-gray-400">Conexão via API</h4>
                                <p className="text-xs text-gray-500">Binance, Bybit e outras exchanges automaticamente.</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                 <div className="flex justify-center mt-8">
                     <button
                        onClick={onClose}
                        className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                     >
                        Cancelar
                     </button>
                 </div>
            </div>
        );

      case 'upload':
        return (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-700 hover:border-cyan-500/50 rounded-lg bg-gray-900/50 hover:bg-gray-800/50 transition-all duration-300 group">
            <div className="p-4 rounded-full bg-cyan-500/10 mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-10 h-10 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
            </div>
            <p className="mb-2 text-gray-200 font-medium">Arraste e solte ou clique para enviar</p>
            <p className="mb-6 text-sm text-gray-500">Suporta arquivos .xlsx e .html (MetaTrader)</p>
            
            <div className="relative">
                <input
                    type="file"
                    accept=".xlsx,.xls,.html,.htm"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-400
                        file:mr-4 file:py-2.5 file:px-6
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-cyan-600 file:text-white
                        hover:file:bg-cyan-500
                        file:cursor-pointer file:transition-colors
                        cursor-pointer"
                />
            </div>
            {error && <p className="mt-4 text-red-500 text-sm bg-red-500/10 px-3 py-1 rounded">{error}</p>}
          </div>
        );

      case 'upload_ninjatrader':
        return (
          <div className="space-y-6">
            {/* Instructions Box */}
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-orange-400 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Como exportar do NinjaTrader
              </h4>
              <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                <li>Abra a janela <span className="text-orange-300 font-medium">Trade Performance</span> ou <span className="text-orange-300 font-medium">Account Performance</span></li>
                <li>Vá na aba <span className="text-orange-300 font-medium">Grid</span> (Trades/Executions)</li>
                <li>Clique com o botão direito → <span className="text-orange-300 font-medium">Export</span></li>
                <li>Salve como arquivo <span className="text-orange-300 font-medium">.csv</span></li>
              </ol>
            </div>

            {/* Upload Area */}
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-700 hover:border-orange-500/50 rounded-lg bg-gray-900/50 hover:bg-gray-800/50 transition-all duration-300 group">
              <div className="p-4 rounded-full bg-orange-500/10 mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-10 h-10 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="mb-2 text-gray-200 font-medium">Arraste e solte ou clique para enviar</p>
              <p className="mb-6 text-sm text-gray-500">Apenas arquivos <span className="text-orange-400 font-medium">.csv</span> do NinjaTrader Grid</p>
              
              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleNinjaTraderFileUpload}
                  className="block w-full text-sm text-gray-400
                      file:mr-4 file:py-2.5 file:px-6
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-orange-600 file:text-white
                      hover:file:bg-orange-500
                      file:cursor-pointer file:transition-colors
                      cursor-pointer"
                />
              </div>
              {error && <p className="mt-4 text-red-500 text-sm bg-red-500/10 px-3 py-1 rounded">{error}</p>}
            </div>

            {/* Back Button */}
            <div className="flex justify-center">
              <button
                onClick={resetState}
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                ← Voltar para seleção
              </button>
            </div>
          </div>
        );

      case 'mapping':
        return (
          <div className="space-y-6">
            {/* Import Mode Selection */}
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => setImportMode('append')}
                    className={cn(
                        "p-4 rounded-lg border text-left transition-all",
                        importMode === 'append' 
                            ? "bg-cyan-500/10 border-cyan-500 ring-1 ring-cyan-500" 
                            : "bg-gray-800 border-gray-700 hover:bg-gray-750"
                    )}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <div className={cn("w-2 h-2 rounded-full", importMode === 'append' ? "bg-cyan-500" : "bg-gray-500")} />
                        <span className={cn("font-semibold text-sm", importMode === 'append' ? "text-cyan-400" : "text-gray-300")}>
                            Adicionar (Padrão)
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 pl-4">
                        Adiciona novos trades. <span className="text-gray-400">Pula duplicados</span> automaticamente.
                    </p>
                </button>

                <button
                    onClick={() => setImportMode('replace')}
                    className={cn(
                        "p-4 rounded-lg border text-left transition-all",
                        importMode === 'replace' 
                            ? "bg-red-500/10 border-red-500 ring-1 ring-red-500" 
                            : "bg-gray-800 border-gray-700 hover:bg-gray-750"
                    )}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <div className={cn("w-2 h-2 rounded-full", importMode === 'replace' ? "bg-red-500" : "bg-gray-500")} />
                        <span className={cn("font-semibold text-sm", importMode === 'replace' ? "text-red-400" : "text-gray-300")}>
                            Substituir Tudo
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 pl-4">
                        <span className="text-red-400 font-bold">⚠️ Apaga tudo</span> da conta selecionada antes de importar.
                    </p>
                </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Conta de Destino</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="block w-full rounded-lg border-gray-700 bg-gray-800 text-gray-200 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm p-2.5"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
                ))}
              </select>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
              <div className="px-4 py-2 border-b border-gray-800 bg-gray-800/50">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pré-visualização dos Dados</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs text-left text-gray-400">
                    <thead className="bg-gray-800/30">
                    <tr>
                        {headers.map(h => <th key={h} className="px-3 py-2 font-medium text-gray-300 whitespace-nowrap">{h}</th>)}
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                    {rawData.slice(0, 5).map((row, i) => (
                        <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                        {headers.map(h => <td key={h} className="px-3 py-2 whitespace-nowrap">{row[h]}</td>)}
                        </tr>
                    ))}
                    </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg text-gray-200">
                <div className="mb-4 pb-4 border-b border-gray-800">
                    <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Ajuste de Fuso Horário (DST Aware ☀️)
                    </h4>
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Qual o fuso do seu Broker/Arquivo? 🌍</label>
                            <select
                                value={brokerTimezone}
                                onChange={(e) => setBrokerTimezone(e.target.value)}
                                className="block w-full rounded-lg border-gray-700 bg-gray-800 text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm p-2"
                            >
                                <option value="Europe/Helsinki">Europe/Helsinki (FTMO, Eightcap, MT4 Default)</option>
                                <option value="Etc/UTC">UTC (Universal Time)</option>
                                <option value="Europe/London">Europe/London (UK)</option>
                                <option value="America/New_York">America/New_York (US Eastern)</option>
                                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                                <option value="America/Sao_Paulo">America/Sao_Paulo (Brasília)</option>
                            </select>
                        </div>
                        <div className="flex-2 text-xs text-gray-500 bg-gray-800/50 p-2 rounded border border-gray-700/50">
                            <p>O sistema converterá automaticamente considerando horários de verão (DST).</p>
                            <p className="mt-1 text-cyan-500/80">Recomendado: <b>Europe/Helsinki</b> para a maioria dos Brokers MetaTrader.</p>
                        </div>
                    </div>
                    
                    {/* Visual Preview */}
                    {rawData.length > 0 && mapping.entryDate && mapping.entryDate !== '' && (
                        <div className="mt-3 p-3 bg-black/20 rounded border border-gray-700/50 space-y-2">
                             <h5 className="text-[10px] uppercase tracking-wider text-gray-500 font-bold border-b border-gray-800 pb-1 mb-2">Diagnóstico de Data</h5>
                             
                             {(() => {
                                 const rawValue = rawData[0][mapping.entryDate];
                                 const parsed = parseTradeDate(rawValue);
                                 
                                 if (!parsed) return <div className="text-red-400 text-xs">Data Inválida ou Não Mapeada</div>;

                                 // Face Value (Local interpretation of the numbers)
                                 const faceValue = format(parsed, 'dd/MM/yyyy HH:mm:ss');
                                 
                                 // Convert directly to NY time
                                 const nyDate = convertToNYTime(parsed, brokerTimezone);
                                 const nyStr = format(nyDate, 'dd/MM/yyyy HH:mm:ss');

                                 return (
                                     <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                         <div>
                                             <span className="block text-[10px] text-gray-500">1. Original (Arquivo)</span>
                                             <span className="font-mono text-yellow-500">{String(rawValue)}</span>
                                         </div>
                                         <div>
                                             <span className="block text-[10px] text-gray-500">2. Timezone do Broker</span>
                                             <span className="font-mono text-blue-400">{brokerTimezone}</span>
                                         </div>
                                         <div>
                                             <span className="block text-[10px] text-gray-500">3. Interpretado como</span>
                                             <span className="font-mono text-gray-300">{faceValue} ({brokerTimezone.split('/')[1]})</span>
                                         </div>
                                         <div>
                                             <span className="block text-[10px] text-gray-500">4. Resultado Final (NY)</span>
                                             <span className="font-mono text-green-400 font-bold">{nyStr}</span>
                                         </div>
                                     </div>
                                 );
                             })()}
                        </div>
                    )}
                </div>

                <ColumnMapper
                    headers={headers}
                    mapping={mapping}
                    onChange={setMapping}
                />
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-800">
                 <button
                    onClick={resetState}
                    className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleImport}
                    disabled={!selectedAccountId}
                    className="px-6 py-2 text-sm font-medium text-white bg-linear-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 rounded-lg shadow-lg shadow-cyan-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    Importar {rawData.length} Trades
                </button>
            </div>
          </div>
        );

      case 'importing':
        return (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 border-4 border-gray-800 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-gray-300 font-medium">Importando trades...</p>
            <p className="text-sm text-gray-500 mt-2">Isso pode levar alguns segundos</p>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center py-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/10 mb-6">
              <svg className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Importação Concluída</h3>
            <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700 max-w-sm mx-auto space-y-2">
              <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Processado:</span>
                  <span className="text-white font-medium">{importStats.total}</span>
              </div>
              <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Sucesso:</span>
                  <span className="text-emerald-400 font-medium">{importStats.success}</span>
              </div>
              {importStats.skipped > 0 && (
                 <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Duplicados (Pularam):</span>
                    <span className="text-yellow-400 font-medium">{importStats.skipped}</span>
                 </div>
              )}
              {importStats.failed > 0 && (
                 <div className="flex justify-between text-sm pt-2 border-t border-gray-700 mt-2">
                    <span className="text-gray-400">Falhas:</span>
                    <span className="text-red-400 font-medium">{importStats.failed}</span>
                 </div>
              )}
            </div>
             <div className="mt-8">
              <button
                onClick={onClose}
                className="px-8 py-2.5 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors shadow-lg shadow-cyan-900/20"
              >
                Concluir
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
