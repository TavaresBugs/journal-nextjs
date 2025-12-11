import React from 'react';
import { ColumnMapping } from '@/services/importParsers';

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
