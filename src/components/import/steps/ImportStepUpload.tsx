import React from "react";
import { DataSource } from "@/services/trades/importParsers";

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
  error,
}) => {
  // Hooks must be at top level
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);

  // If no source selected, show source selection
  if (!selectedSource) {
    return (
      <div className="py-8">
        <h3 className="mb-8 text-center text-xl font-bold text-white">
          Selecione a Fonte de Dados
        </h3>
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-6 px-4 md:grid-cols-2">
          {/* MetaTrader Option */}
          <button
            onClick={() => onSourceSelect("metatrader")}
            className="hover:bg-gray-750 group flex flex-col items-center justify-center rounded-xl border border-gray-700 bg-gray-800 p-8 transition-all hover:border-green-500/50"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 transition-transform group-hover:scale-110">
              <svg
                className="h-8 w-8 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <h4 className="mb-2 text-lg font-semibold text-white">MetaTrader 4 / 5</h4>
            <p className="text-center text-sm text-gray-400">
              Relatórios HTML ou Excel exportados do MT4/MT5.
            </p>
          </button>

          {/* NinjaTrader Option */}
          <button
            onClick={() => onSourceSelect("ninjatrader")}
            className="hover:bg-gray-750 group flex flex-col items-center justify-center rounded-xl border border-gray-700 bg-gray-800 p-8 transition-all hover:border-orange-500/50"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10 transition-transform group-hover:scale-110">
              <svg
                className="h-8 w-8 text-orange-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h4 className="mb-2 text-lg font-semibold text-white">NinjaTrader</h4>
            <p className="text-center text-sm text-gray-400">Arquivo CSV do Grid de Negociações.</p>
          </button>

          {/* Tradovate Option */}
          <button
            onClick={() => onSourceSelect("tradovate")}
            className="hover:bg-gray-750 group flex flex-col items-center justify-center rounded-xl border border-gray-700 bg-gray-800 p-8 transition-all hover:border-blue-500/50"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 transition-transform group-hover:scale-110">
              <svg
                className="h-8 w-8 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h4 className="mb-2 text-lg font-semibold text-white">Tradovate</h4>
            <p className="text-center text-sm text-gray-400">Arquivo CSV ou PDF de Performance.</p>
          </button>
        </div>

        {/* API Option (Disabled) */}
        <div className="mx-auto mt-4 max-w-2xl px-4">
          <div className="relative flex cursor-not-allowed flex-col items-center justify-center overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50 p-6 opacity-60">
            <div className="absolute top-3 right-3 rounded bg-gray-800 px-2 py-0.5 text-[10px] font-bold text-gray-400 uppercase">
              Em Breve
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-700/30">
                <svg
                  className="h-6 w-6 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
              </div>
              <div className="text-left">
                <h4 className="text-base font-semibold text-gray-400">Conexão via API</h4>
                <p className="text-xs text-gray-500">
                  Binance, Bybit e outras exchanges automaticamente.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={onCancel}
            className="text-sm text-gray-500 transition-colors hover:text-gray-300"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  // NinjaTrader Upload UI
  if (selectedSource === "ninjatrader") {
    const handleNinjaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setFileName(file.name);
        onFileSelect(e, "ninjatrader");
      }
    };

    const handleNinjaClearFile = (e: React.MouseEvent) => {
      e.stopPropagation();
      setFileName(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    const handleNinjaChooseFileClick = () => {
      fileInputRef.current?.click();
    };

    return (
      <div className="space-y-6">
        {/* Instructions Box */}
        <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-orange-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Como exportar do NinjaTrader
          </h4>
          <ol className="list-inside list-decimal space-y-1 text-xs text-gray-400">
            <li>
              Abra a janela <span className="font-medium text-orange-300">Trade Performance</span>{" "}
              ou <span className="font-medium text-orange-300">Account Performance</span>
            </li>
            <li>
              Vá na aba <span className="font-medium text-orange-300">Grid</span> opção (
              <span className="font-medium text-orange-300">Trades</span>)
            </li>
            <li>
              Clique com o botão direito →{" "}
              <span className="font-medium text-orange-300">Export</span>
            </li>
            <li>
              Salve como arquivo <span className="font-medium text-orange-300">.csv</span>
            </li>
          </ol>
        </div>

        {/* Upload Area */}
        <div className="group flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-700 bg-gray-900/50 p-8 transition-all duration-300 hover:border-orange-500/50 hover:bg-gray-800/50">
          <div className="mb-4 rounded-full bg-orange-500/10 p-4 transition-transform duration-300 group-hover:scale-110">
            <svg
              className="h-10 w-10 text-orange-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <p className="mb-2 font-medium text-gray-200">Arraste e solte ou clique para enviar</p>
          <p className="mb-6 text-sm text-gray-500">
            Apenas arquivos <span className="font-medium text-orange-400">.csv</span> do NinjaTrader
            Grid
          </p>

          <div className="flex w-full max-w-md flex-col items-center gap-3">
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
                className="rounded-lg bg-orange-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-orange-500"
              >
                Escolher Arquivo
              </button>
            ) : (
              <div className="group/file flex w-full items-center justify-between gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <svg
                    className="h-5 w-5 min-w-[20px] text-orange-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="truncate text-sm text-gray-300">{fileName}</span>
                </div>
                <button
                  onClick={handleNinjaClearFile}
                  className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-700 hover:text-red-400"
                  title="Remover arquivo"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {error && (
            <p className="mt-4 rounded bg-red-500/10 px-3 py-1 text-sm text-red-500">{error}</p>
          )}
        </div>
      </div>
    );
  }

  // Tradovate Upload UI
  if (selectedSource === "tradovate") {
    const handleTradovateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setFileName(file.name);
        onFileSelect(e, "tradovate");
      }
    };

    const handleTradovateClearFile = (e: React.MouseEvent) => {
      e.stopPropagation();
      setFileName(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    const handleTradovateChooseFileClick = () => {
      fileInputRef.current?.click();
    };

    return (
      <div className="space-y-6">
        {/* Instructions Box */}
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Como exportar do Tradovate
          </h4>
          <ol className="list-inside list-decimal space-y-1 text-xs text-gray-400">
            <li>
              Acesse sua conta e vá em <span className="font-medium text-blue-300">Reports</span>
            </li>
            <li>
              Selecione a aba <span className="font-medium text-blue-300">Orders</span>
            </li>
            <li>
              Clique em <span className="font-medium text-blue-300">Download CSV</span> ou{" "}
              <span className="font-medium text-blue-300">Download PDF</span>
            </li>
          </ol>
        </div>

        {/* Upload Area */}
        <div className="group flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-700 bg-gray-900/50 p-8 transition-all duration-300 hover:border-blue-500/50 hover:bg-gray-800/50">
          <div className="mb-4 rounded-full bg-blue-500/10 p-4 transition-transform duration-300 group-hover:scale-110">
            <svg
              className="h-10 w-10 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <p className="mb-2 font-medium text-gray-200">Arraste e solte ou clique para enviar</p>
          <p className="mb-6 text-sm text-gray-500">
            Arquivos <span className="font-medium text-blue-400">.csv</span> ou{" "}
            <span className="font-medium text-blue-400">.pdf</span> do Tradovate
          </p>

          <div className="flex w-full max-w-md flex-col items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.pdf"
              onChange={handleTradovateFileChange}
              className="hidden"
            />

            {!fileName ? (
              <button
                onClick={handleTradovateChooseFileClick}
                className="rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-blue-500"
              >
                Escolher Arquivo
              </button>
            ) : (
              <div className="group/file flex w-full items-center justify-between gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <svg
                    className="h-5 w-5 min-w-[20px] text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="truncate text-sm text-gray-300">{fileName}</span>
                </div>
                <button
                  onClick={handleTradovateClearFile}
                  className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-700 hover:text-red-400"
                  title="Remover arquivo"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {error && (
            <p className="mt-4 rounded bg-red-500/10 px-3 py-1 text-sm text-red-500">{error}</p>
          )}
        </div>
      </div>
    );
  }

  // MetaTrader Upload UI Logic
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      onFileSelect(e, "metatrader");
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
      fileInputRef.current.value = "";
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
    <div className="space-y-6">
      {/* Instructions Box */}
      <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
        <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Como exportar do MetaTrader
        </h4>
        <ol className="list-inside list-decimal space-y-1 text-xs text-gray-400">
          <li>
            Vá na aba <span className="font-medium text-green-300">Histórico</span>
          </li>
          <li>Clique com o botão direito sobre um trade</li>
          <li>
            Selecione <span className="font-medium text-green-300">Relatório</span>
          </li>
          <li>
            Salve como <span className="font-medium text-green-300">.html</span> ou{" "}
            <span className="font-medium text-green-300">.xlsx</span>
          </li>
        </ol>
      </div>

      {/* Upload Area */}
      <div className="group flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-700 bg-gray-900/50 p-8 transition-all duration-300 hover:border-green-500/50 hover:bg-gray-800/50">
        <div className="mb-4 rounded-full bg-green-500/10 p-4 transition-transform duration-300 group-hover:scale-110">
          <svg
            className="h-10 w-10 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        <p className="mb-2 font-medium text-gray-200">Arraste e solte ou clique para enviar</p>
        <p className="mb-6 text-sm text-gray-500">
          Arquivos <span className="font-medium text-green-400">.xlsx</span> ou{" "}
          <span className="font-medium text-green-400">.html</span> do MetaTrader
        </p>

        <div className="flex w-full max-w-md flex-col items-center gap-3">
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
              className="rounded-lg bg-green-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-green-500"
            >
              Escolher Arquivo
            </button>
          ) : (
            <div className="group/file flex w-full items-center justify-between gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <svg
                  className="h-5 w-5 min-w-[20px] text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="truncate text-sm text-gray-300">{fileName}</span>
              </div>
              <button
                onClick={handleClearFile}
                className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-700 hover:text-red-400"
                title="Remover arquivo"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div
          className={`mt-4 flex items-start gap-2 rounded px-3 py-2 text-sm ${
            error.includes("Para sua segurança")
              ? "border border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
              : "bg-red-500/10 text-red-500"
          }`}
        >
          {error.includes("Para sua segurança") && (
            <svg
              className="mt-0.5 h-5 w-5 min-w-[20px] text-yellow-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          )}
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
