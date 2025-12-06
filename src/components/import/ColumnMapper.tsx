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

  // Auto-map on first load if mapping is empty values
  useEffect(() => {
    const newMapping = { ...mapping };
    let changed = false;

    const findMatch = (field: string) => {
        const lowerField = field.toLowerCase();
        return headers.find(h => {
            const lowerH = h.toLowerCase();
            if (lowerH === lowerField) return true;
            // Fuzzy matches
            if (field === 'entryDate' && (lowerH.includes('entry') && lowerH.includes('time'))) return true;
            if (field === 'exitDate' && (lowerH.includes('exit') && lowerH.includes('time'))) return true;
            if (field === 'entryPrice' && (lowerH.includes('entry') && lowerH.includes('price'))) return true;
            if (field === 'exitPrice' && (lowerH.includes('exit') && lowerH.includes('price'))) return true;
            if (field === 'direction' && (lowerH === 'type' || lowerH === 'direction')) return true;
            return false;
        });
    };

    (Object.keys(FIELD_LABELS) as (keyof ColumnMapping)[]).forEach((field) => {
        if (!newMapping[field]) {
             const match = findMatch(field);
             if (match) {
                 newMapping[field] = match;
                 changed = true;
             }
        }
    });

    if (changed) {
        onChange(newMapping);
    }
  }, [headers]); // Run only when headers change (or on mount)

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
            <h3 className="font-medium text-gray-900 mb-4 border-b pb-2">Required Fields</h3>
            <div className="space-y-4">
            {REQUIRED_FIELDS.map((field) => (
                <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {FIELD_LABELS[field]} <span className="text-red-500">*</span>
                </label>
                <select
                    value={mapping[field] || ''}
                    onChange={(e) => handleChange(field, e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                >
                    <option value="">Select column...</option>
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
            <h3 className="font-medium text-gray-900 mb-4 border-b pb-2">Optional Fields</h3>
             <div className="space-y-4">
            {OPTIONAL_FIELDS.map((field) => (
                <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {FIELD_LABELS[field]}
                </label>
                <select
                    value={mapping[field] || ''}
                    onChange={(e) => handleChange(field, e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                >
                    <option value="">(Skip)</option>
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
