import React from 'react';
import { ColumnMapper } from '../ColumnMapper';
import { ColumnMapping, convertToNYTime } from '@/services/importParsers';
import { RawTradeData, parseTradeDate } from '@/services/importService';
import { Account } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns-tz';

interface ImportStepMappingProps {
    rawData: RawTradeData[];
    headers: string[];
    mapping: ColumnMapping;
    setMapping: (mapping: ColumnMapping) => void;
    accounts: Account[];
    selectedAccountId: string;
    setSelectedAccountId: (id: string) => void;
    brokerTimezone: string;
    setBrokerTimezone: (tz: string) => void;
    importMode: 'append' | 'replace';
    setImportMode: (mode: 'append' | 'replace') => void;
    onImport: () => void;
    onCancel: () => void;
}

export const ImportStepMapping: React.FC<ImportStepMappingProps> = ({
    rawData,
    headers,
    mapping,
    setMapping,
    accounts,
    selectedAccountId,
    setSelectedAccountId,
    brokerTimezone,
    setBrokerTimezone,
    importMode,
    setImportMode,
    onImport,
    onCancel
}) => {
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
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
                >
                    Cancelar
                </button>
                <button
                    onClick={onImport}
                    disabled={!selectedAccountId}
                    className="px-6 py-2 text-sm font-medium text-white bg-linear-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 rounded-lg shadow-lg shadow-cyan-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    Importar {rawData.length} Trades
                </button>
            </div>
          </div>
    );
};
