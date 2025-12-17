import React from 'react';
import { DataSource } from '@/services/trades/importParsers';

interface ImportStepUploadProps {
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>, source: DataSource) => void;
  onSourceSelect: (source: DataSource) => void;
  selectedSource: DataSource;
  onCancel: () => void;
  error: string | null;
}

export const ImportStepUpload: React.FC<ImportStepUploadProps> = ({
    onFileSelect,
    onSourceSelect,
    selectedSource,
    onCancel,
    error
}) => {

    // Hooks must be at top level
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = React.useState<string | null>(null);

    // If no source selected, show source selection
    if (!selectedSource) {
        return (
            <div className="py-8">
                <h3 className="text-center text-xl font-bold text-white mb-8">Selecione a Fonte de Dados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto px-4">
                    {/* MetaTrader Option */}
                     <button
                        onClick={() => onSourceSelect('metatrader')}
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
                        onClick={() => onSourceSelect('ninjatrader')}
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

                {/* API Option (Disabled) */}
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
                        onClick={onCancel}
                        className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                     >
                        Cancelar
                     </button>
                 </div>
            </div>
        );
    }

    // NinjaTrader Upload UI
    if (selectedSource === 'ninjatrader') {
        const handleNinjaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                setFileName(file.name);
                onFileSelect(e, 'ninjatrader');
            }
        };

        const handleNinjaClearFile = (e: React.MouseEvent) => {
            e.stopPropagation();
            setFileName(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        };

        const handleNinjaChooseFileClick = () => {
            fileInputRef.current?.click();
        };

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

              <div className="flex flex-col items-center gap-3 w-full max-w-md">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleNinjaFileChange}
                  className="hidden"
                />

                {!fileName ? (
                    <button 
                        onClick={handleNinjaChooseFileClick}
                        className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-lg transition-colors"
                    >
                        Escolher Arquivo
                    </button>
                ) : (
                    <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700 w-full justify-between group/file">
                        <div className="flex items-center gap-2 overflow-hidden">
                           <svg className="w-5 h-5 text-orange-500 min-w-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                           </svg>
                           <span className="text-gray-300 text-sm truncate">{fileName}</span>
                        </div>
                        <button 
                            onClick={handleNinjaClearFile}
                            className="text-gray-500 hover:text-red-400 p-1 hover:bg-gray-700 rounded transition-colors"
                            title="Remover arquivo"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}
              </div>

              {error && <p className="mt-4 text-red-500 text-sm bg-red-500/10 px-3 py-1 rounded">{error}</p>}
            </div>

            {/* Back Button */}
            <div className="flex justify-center">
              <button
                onClick={() => onSourceSelect(null)}
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                ← Voltar para seleção
              </button>
            </div>
          </div>
        );
    }

    // MetaTrader Upload UI Logic
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
            onFileSelect(e, 'metatrader');
            // Reset input value to allow re-selection of same file if needed (e.g. after error fix)
            // But we keep the fileName state to show what was selected until user clears it or selects new
            // Actually, if we reset immediately, we might lose the file object if onFileSelect relies on e.target.files persistence?
            // Usually React synthetic events are pooled but the file object persists.
            // Let's reset it when "X" is clicked OR when a new file is successfully picked?
            // If we reset immediately, the user can't "see" it in the native input anyway (which is hidden).
        }
    };

    const handleClearFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFileName(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        // Also simpler: verify if we need to notify parent to clear error?
        // The parent handles error display based on previous attempt.
        // If we clear the file visual, maybe we should also clear the error?
        // But the error prop is passed down. We can't clear it from here unless we have a callback.
        // For now, visual clear is enough for the user to "try again".
    };

    const handleChooseFileClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-700 hover:border-cyan-500/50 rounded-lg bg-gray-900/50 hover:bg-gray-800/50 transition-all duration-300 group">
            <div className="p-4 rounded-full bg-cyan-500/10 mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-10 h-10 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
            </div>
            
            <p className="mb-2 text-gray-200 font-medium">Arraste e solte ou clique para enviar</p>
            <p className="mb-6 text-sm text-gray-500">Suporta arquivos .xlsx e .html (MetaTrader)</p>
            
            <div className="flex flex-col items-center gap-3 w-full max-w-md">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.html,.htm"
                    onChange={handleFileChange}
                    className="hidden"
                />

                {!fileName ? (
                    <button 
                        onClick={handleChooseFileClick}
                        className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors"
                    >
                        Escolher Arquivo
                    </button>
                ) : (
                    <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700 w-full justify-between group/file">
                        <div className="flex items-center gap-2 overflow-hidden">
                           <svg className="w-5 h-5 text-cyan-500 min-w-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                           </svg>
                           <span className="text-gray-300 text-sm truncate">{fileName}</span>
                        </div>
                        <button 
                            onClick={handleClearFile}
                            className="text-gray-500 hover:text-red-400 p-1 hover:bg-gray-700 rounded transition-colors"
                            title="Remover arquivo"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {error && (
                <div className={`mt-4 text-sm px-3 py-2 rounded flex items-start gap-2 ${
                    error.includes('Para sua segurança') 
                    ? 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20' 
                    : 'text-red-500 bg-red-500/10'
                }`}>
                    {error.includes('Para sua segurança') && (
                        <svg className="w-5 h-5 min-w-[20px] text-yellow-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    )}
                    <span>{error}</span>
                </div>
            )}

         {/* Back Button */}
         <div className="flex justify-center mt-6">
              <button
                onClick={() => onSourceSelect(null)}
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                ← Voltar para seleção
              </button>
            </div>
        </div>
    );
};
