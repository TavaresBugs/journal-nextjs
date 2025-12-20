import React from "react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui";
import { ColumnMapping } from "@/services/trades/importParsers";

interface ColumnMapperProps {
  headers: string[];
  mapping: ColumnMapping;
  onChange: (newMapping: ColumnMapping) => void;
}

const REQUIRED_FIELDS: (keyof ColumnMapping)[] = [
  "entryDate",
  "symbol",
  "direction",
  "volume",
  "entryPrice",
];

const OPTIONAL_FIELDS: (keyof ColumnMapping)[] = [
  "exitDate",
  "exitPrice",
  "profit",
  "commission",
  "swap",
  "sl",
  "tp",
];

const FIELD_LABELS: Record<keyof ColumnMapping, string> = {
  entryDate: "Entry Date/Time",
  symbol: "Symbol",
  direction: "Type (Buy/Sell)",
  volume: "Volume/Lots",
  entryPrice: "Entry Price",
  exitDate: "Exit Date/Time",
  exitPrice: "Exit Price",
  profit: "Profit (PnL)",
  commission: "Commission",
  swap: "Swap",
  sl: "Stop Loss",
  tp: "Take Profit",
};

export const ColumnMapper: React.FC<ColumnMapperProps> = ({ headers, mapping, onChange }) => {
  const handleChange = (field: keyof ColumnMapping, value: string) => {
    onChange({
      ...mapping,
      [field]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <h3 className="mb-4 border-b border-gray-700 pb-2 font-medium text-gray-200">
            Campos Obrigatórios
          </h3>
          <div className="space-y-4">
            {REQUIRED_FIELDS.map((field) => (
              <div key={field}>
                <label className="mb-1 block text-sm font-medium text-gray-400">
                  {FIELD_LABELS[field]} <span className="text-red-500">*</span>
                </label>
                <Select
                  value={mapping[field] || ""}
                  onValueChange={(value) => handleChange(field, value)}
                >
                  <SelectTrigger className="flex h-10 w-full items-center justify-between rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-gray-200 focus:border-cyan-500 focus:ring-cyan-500">
                    <SelectValue placeholder="Selecione a coluna..." />
                  </SelectTrigger>
                  <SelectContent className="border-gray-700 bg-gray-800">
                    <SelectItem
                      value=""
                      className="cursor-pointer py-2 text-gray-400 hover:bg-gray-700 focus:bg-gray-700"
                    >
                      Selecione a coluna...
                    </SelectItem>
                    {headers.map((header) => (
                      <SelectItem
                        key={header}
                        value={header}
                        className="cursor-pointer py-2 text-gray-200 hover:bg-gray-700 focus:bg-gray-700"
                      >
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-4 border-b border-gray-700 pb-2 font-medium text-gray-200">
            Campos Opcionais
          </h3>
          <div className="space-y-4">
            {OPTIONAL_FIELDS.map((field) => (
              <div key={field}>
                <label className="mb-1 block text-sm font-medium text-gray-400">
                  {FIELD_LABELS[field]}
                </label>
                <Select
                  value={mapping[field] || ""}
                  onValueChange={(value) => handleChange(field, value)}
                >
                  <SelectTrigger className="flex h-10 w-full items-center justify-between rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-gray-200 focus:border-cyan-500 focus:ring-cyan-500">
                    <SelectValue placeholder="(Pular)" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-700 bg-gray-800">
                    <SelectItem
                      value=""
                      className="cursor-pointer py-2 text-gray-400 hover:bg-gray-700 focus:bg-gray-700"
                    >
                      (Pular)
                    </SelectItem>
                    {headers.map((header) => (
                      <SelectItem
                        key={header}
                        value={header}
                        className="cursor-pointer py-2 text-gray-200 hover:bg-gray-700 focus:bg-gray-700"
                      >
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
