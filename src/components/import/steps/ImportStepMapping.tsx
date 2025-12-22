import React from "react";
import { ColumnMapper } from "../ColumnMapper";
import { ColumnMapping, convertToNYTime } from "@/services/trades/importParsers";
import { RawTradeData, parseTradeDate } from "@/services/trades/import";
import { cn } from "@/lib/utils/general";
import dayjs from "dayjs";
import {
  Button,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui";

interface ImportStepMappingProps {
  rawData: RawTradeData[];
  headers: string[];
  mapping: ColumnMapping;
  setMapping: (mapping: ColumnMapping) => void;
  selectedAccountId: string;
  brokerTimezone: string;
  setBrokerTimezone: (tz: string) => void;
  importMode: "append" | "replace";
  setImportMode: (mode: "append" | "replace") => void;
  onImport: () => void;
  onCancel: () => void;
}

export const ImportStepMapping: React.FC<ImportStepMappingProps> = ({
  rawData,
  headers,
  mapping,
  setMapping,
  selectedAccountId,
  brokerTimezone,
  setBrokerTimezone,
  importMode,
  setImportMode,
  onImport,
  onCancel,
}) => {
  return (
    <div className="space-y-6">
      {/* Import Mode Selection */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setImportMode("append")}
          className={cn(
            "rounded-lg border p-4 text-left transition-all",
            importMode === "append"
              ? "border-cyan-500 bg-cyan-500/10 ring-1 ring-cyan-500"
              : "hover:bg-gray-750 border-gray-700 bg-gray-800"
          )}
        >
          <div className="mb-1 flex items-center gap-2">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                importMode === "append" ? "bg-cyan-500" : "bg-gray-500"
              )}
            />
            <span
              className={cn(
                "text-sm font-semibold",
                importMode === "append" ? "text-cyan-400" : "text-gray-300"
              )}
            >
              Adicionar (Padrão)
            </span>
          </div>
          <p className="pl-4 text-xs text-gray-500">
            Adiciona novos trades. <span className="text-gray-400">Pula duplicados</span>{" "}
            automaticamente.
          </p>
        </button>

        <button
          onClick={() => setImportMode("replace")}
          className={cn(
            "rounded-lg border p-4 text-left transition-all",
            importMode === "replace"
              ? "border-red-500 bg-red-500/10 ring-1 ring-red-500"
              : "hover:bg-gray-750 border-gray-700 bg-gray-800"
          )}
        >
          <div className="mb-1 flex items-center gap-2">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                importMode === "replace" ? "bg-red-500" : "bg-gray-500"
              )}
            />
            <span
              className={cn(
                "text-sm font-semibold",
                importMode === "replace" ? "text-red-400" : "text-gray-300"
              )}
            >
              Substituir Tudo
            </span>
          </div>
          <p className="pl-4 text-xs text-gray-500">
            <span className="font-bold text-red-400">⚠️ Apaga tudo</span> da conta selecionada antes
            de importar.
          </p>
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
        <div className="border-b border-gray-800 bg-gray-800/50 px-4 py-2">
          <h4 className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
            Pré-visualização dos Dados
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs text-gray-400">
            <thead className="bg-gray-800/30">
              <tr>
                {headers.map((h) => (
                  <th key={h} className="px-3 py-2 font-medium whitespace-nowrap text-gray-300">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {rawData.slice(0, 5).map((row, i) => (
                <tr key={i} className="transition-colors hover:bg-gray-800/30">
                  {headers.map((h) => (
                    <td key={h} className="px-3 py-2 whitespace-nowrap">
                      {row[h]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 text-gray-200">
        <div className="mb-4 border-b border-gray-800 pb-4">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-300">
            <svg
              className="h-4 w-4 text-cyan-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Ajuste de Fuso Horário (DST Aware ☀️)
          </h4>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-500">
                Qual o fuso do seu Broker/Arquivo? 🌍
              </label>
              <Select value={brokerTimezone} onValueChange={setBrokerTimezone}>
                <SelectTrigger className="flex h-10 w-full items-center justify-between rounded-lg border border-gray-700 bg-gray-800 px-3 text-sm text-white focus:border-cyan-500 focus:ring-cyan-500">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="border-gray-700 bg-gray-800">
                  <SelectItem
                    value="Europe/Helsinki"
                    className="cursor-pointer py-2 text-gray-200 hover:bg-gray-700 focus:bg-gray-700"
                  >
                    Europe/Helsinki (FTMO, Eightcap, MT4 Default)
                  </SelectItem>
                  <SelectItem
                    value="Etc/UTC"
                    className="cursor-pointer py-2 text-gray-200 hover:bg-gray-700 focus:bg-gray-700"
                  >
                    UTC (Universal Time)
                  </SelectItem>
                  <SelectItem
                    value="Europe/London"
                    className="cursor-pointer py-2 text-gray-200 hover:bg-gray-700 focus:bg-gray-700"
                  >
                    Europe/London (UK)
                  </SelectItem>
                  <SelectItem
                    value="America/New_York"
                    className="cursor-pointer py-2 text-gray-200 hover:bg-gray-700 focus:bg-gray-700"
                  >
                    America/New_York (US Eastern)
                  </SelectItem>
                  <SelectItem
                    value="Asia/Tokyo"
                    className="cursor-pointer py-2 text-gray-200 hover:bg-gray-700 focus:bg-gray-700"
                  >
                    Asia/Tokyo (JST)
                  </SelectItem>
                  <SelectItem
                    value="America/Sao_Paulo"
                    className="cursor-pointer py-2 text-gray-200 hover:bg-gray-700 focus:bg-gray-700"
                  >
                    America/Sao_Paulo (Brasília)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-2 rounded border border-gray-700/50 bg-gray-800/50 p-2 text-xs text-gray-500">
              <p>O sistema converterá automaticamente considerando horários de verão (DST).</p>
              <p className="mt-1 text-cyan-500/80">
                Recomendado: <b>Europe/Helsinki</b> para a maioria dos Brokers MetaTrader.
              </p>
            </div>
          </div>

          {/* Visual Preview */}
          {rawData.length > 0 && mapping.entryDate && mapping.entryDate !== "" && (
            <div className="mt-3 space-y-2 rounded border border-gray-700/50 bg-black/20 p-3">
              <h5 className="mb-2 border-b border-gray-800 pb-1 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                Diagnóstico de Data
              </h5>

              {(() => {
                const rawValue = rawData[0][mapping.entryDate];
                const parsed = parseTradeDate(rawValue);

                if (!parsed)
                  return <div className="text-xs text-red-400">Data Inválida ou Não Mapeada</div>;

                // Face Value (Local interpretation of the numbers)
                const faceValue = dayjs(parsed).format("DD/MM/YYYY HH:mm:ss");

                // Convert directly to NY time
                const nyDate = convertToNYTime(parsed, brokerTimezone);
                const nyStr = dayjs(nyDate).format("DD/MM/YYYY HH:mm:ss");

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
                      <span className="font-mono text-gray-300">
                        {faceValue} ({brokerTimezone.split("/")[1]})
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-500">
                        4. Resultado Final (NY)
                      </span>
                      <span className="font-mono font-bold text-green-400">{nyStr}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        <ColumnMapper headers={headers} mapping={mapping} onChange={setMapping} />
      </div>

      <div className="mt-6 flex justify-end gap-3 border-t border-gray-800 pt-4">
        <Button variant="gradient-danger" onClick={onCancel} className="font-extrabold">
          Cancelar
        </Button>
        <button
          onClick={onImport}
          disabled={!selectedAccountId}
          className="rounded-lg bg-linear-to-r from-cyan-600 to-teal-600 px-6 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-900/20 transition-all hover:from-cyan-500 hover:to-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Importar {rawData.length} Trades
        </button>
      </div>
    </div>
  );
};
