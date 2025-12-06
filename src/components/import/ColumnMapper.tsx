import React, { useEffect } from 'react';

export interface ColumnMapping {
  entryDate: string;
  symbol: string;
  direction: string;
  volume: string;
  entryPrice: string;
  exitDate: string;
  exitPrice: string;
  profit: string;
  commission: string;
  swap: string;
}

interface ColumnMapperProps {
  headers: string[];
  mapping: ColumnMapping;
  onChange: (newMapping: ColumnMapping) => void;
}

const REQUIRED_FIELDS: (keyof ColumnMapping)[] = [
  'entryDate',
  'symbol',
  'direction',
  'volume',
  'entryPrice',
];

const OPTIONAL_FIELDS: (keyof ColumnMapping)[] = [
  'exitDate',
  'exitPrice',
  'profit',
  'commission',
  'swap',
];

const FIELD_LABELS: Record<keyof ColumnMapping, string> = {
  entryDate: 'Entry Date/Time',
  symbol: 'Symbol',
  direction: 'Type (Buy/Sell)',
  volume: 'Volume/Lots',
  entryPrice: 'Entry Price',
  exitDate: 'Exit Date/Time',
  exitPrice: 'Exit Price',
  profit: 'Profit (PnL)',
  commission: 'Commission',
  swap: 'Swap',
};

export const ColumnMapper: React.FC<ColumnMapperProps> = ({ headers, mapping, onChange }) => {

  // Auto-map on first load // Auto-map columns when headers change
  // Auto-map columns when headers change
  useEffect(() => {
    const newMapping = { ...mapping };
    let hasChanges = false;

    headers.forEach(header => {
      const lowerHeader = header.toLowerCase().trim();
      
      // Helper to set mapping if empty
      const tryMap = (key: keyof ColumnMapping, keywords: string[]) => {
        if (!newMapping[key] && keywords.some(k => lowerHeader.includes(k))) {
            // Avoid mapping 'Time' to Exit Time if it's the first Time column (usually Entry)
            // But here we iterate headers.
            // Simple heuristic: if we already have entryDate, maybe map exitDate?
            // Existing logic matches specific keywords.
            newMapping[key] = header;
            hasChanges = true;
        }
      };

      tryMap('entryDate', ['time', 'date', 'data', 'hora', 'entry time', 'time (entry)']);
      tryMap('entryPrice', ['price', 'preço', 'entry price', 'price (entry)']);
      tryMap('symbol', ['symbol', 'ativo', 'par']);
      tryMap('direction', ['type', 'tipo', 'direction', 'direção']);
      tryMap('volume', ['volume', 'lots', 'lotes', 'size', 'tamanho']);
      tryMap('exitDate', ['exit time', 'time (exit)', 'fechamento']);
      tryMap('exitPrice', ['exit price', 'price (exit)']);
      tryMap('profit', ['profit', 'lucro', 'pnl', 'resultado']);
      tryMap('commission', ['commission', 'comissão', 'taxas']);
      tryMap('swap', ['swap']);
    });

    if (hasChanges) {
        onChange(newMapping);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headers]);

  const handleChange = (field: keyof ColumnMapping, value: string) => {
    onChange({
      ...mapping,
      [field]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <h3 className="font-medium text-gray-200 mb-4 border-b border-gray-700 pb-2">Campos Obrigatórios</h3>
            <div className="space-y-4">
            {REQUIRED_FIELDS.map((field) => (
                <div key={field}>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                    {FIELD_LABELS[field]} <span className="text-red-500">*</span>
                </label>
                <select
                    value={mapping[field] || ''}
                    onChange={(e) => handleChange(field, e.target.value)}
                    className="block w-full rounded-md border-gray-700 bg-gray-800 text-gray-200 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm p-2.5"
                >
                    <option value="">Selecione a coluna...</option>
                    {headers.map((header) => (
                    <option key={header} value={header}>
                        {header}
                    </option>
                    ))}
                </select>
                </div>
            ))}
            </div>
        </div>

        <div>
            <h3 className="font-medium text-gray-200 mb-4 border-b border-gray-700 pb-2">Campos Opcionais</h3>
             <div className="space-y-4">
            {OPTIONAL_FIELDS.map((field) => (
                <div key={field}>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                    {FIELD_LABELS[field]}
                </label>
                <select
                    value={mapping[field] || ''}
                    onChange={(e) => handleChange(field, e.target.value)}
                    className="block w-full rounded-md border-gray-700 bg-gray-800 text-gray-200 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm p-2.5"
                >
                    <option value="">(Pular)</option>
                    {headers.map((header) => (
                    <option key={header} value={header}>
                        {header}
                    </option>
                    ))}
                </select>
                </div>
            ))}
            </div>
        </div>
      </div>
    </div>
  );
};
