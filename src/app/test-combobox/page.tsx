'use client';

import { useState } from 'react';
import { AssetCombobox } from '@/components/shared/AssetCombobox';
import { AssetIcon } from '@/components/shared/AssetIcon';
import { AssetsModal } from '@/components/settings/AssetsModal';
import { ASSET_OPTIONS } from '@/constants/assetComboboxData';
import { Settings2 } from 'lucide-react';

export default function TestComboboxPage() {
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [preselected, setPreselected] = useState<string>('EURUSD');
  const [isAssetsModalOpen, setIsAssetsModalOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="container mx-auto max-w-4xl space-y-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Asset Combobox Test</h1>
            <p className="text-gray-400">
              Teste o seletor de ativos com ícones SVG, busca e agrupamento.
            </p>
          </div>
          
          {/* Button to open AssetsModal */}
          <button
            onClick={() => setIsAssetsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors"
          >
            <Settings2 className="w-4 h-4" />
            Configurar Ativos
          </button>
        </div>
        
        {/* Main Combobox */}
        <div className="max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Selecione um Ativo
            </label>
            <AssetCombobox
              value={selectedAsset}
              onChange={setSelectedAsset}
              placeholder="Buscar ativo..."
            />
          </div>
          
          {/* Preview do selecionado */}
          {selectedAsset && (
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400 mb-3">Ativo Selecionado:</p>
              <div className="flex items-center gap-3">
                <AssetIcon symbol={selectedAsset} size="lg" />
                <div>
                  <p className="font-bold text-lg">{selectedAsset}</p>
                  <p className="text-sm text-gray-400">
                    {ASSET_OPTIONS.find(a => a.value === selectedAsset)?.name}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Exemplos de uso */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Estado Vazio</h2>
            <AssetCombobox
              value=""
              onChange={() => {}}
              placeholder="Nenhum ativo selecionado"
            />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Pré-selecionado</h2>
            <AssetCombobox
              value={preselected}
              onChange={setPreselected}
            />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Desabilitado</h2>
            <AssetCombobox
              value="BTCUSD"
              onChange={() => {}}
              disabled
            />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Custom Width</h2>
            <AssetCombobox
              value="ES"
              onChange={() => {}}
              className="max-w-xs"
            />
          </div>
        </div>
        
        {/* Lista de todos os ícones */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Todos os Ativos Disponíveis</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {ASSET_OPTIONS.map((asset) => (
              <div 
                key={asset.value}
                className="flex items-center gap-2 p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <AssetIcon symbol={asset.value} size="sm" />
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{asset.label}</p>
                  <p className="text-xs text-gray-500 truncate">{asset.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Assets Modal */}
      <AssetsModal
        isOpen={isAssetsModalOpen}
        onClose={() => setIsAssetsModalOpen(false)}
        onSave={(configs) => {
          console.log('Saved configs:', configs);
        }}
      />
    </div>
  );
}
