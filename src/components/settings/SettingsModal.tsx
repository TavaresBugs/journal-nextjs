'use client';

import { useState, useEffect } from 'react';
import { Modal, Input, Button } from '@/components/ui';
import { useSettingsStore } from '@/store/useSettingsStore';
import { exportAllData, downloadAsJSON } from '@/services/trades/export';
import { MentorshipSettings } from './MentorshipSettings';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    accountId?: string;
    currentBalance?: number;
    onUpdateBalance?: (newBalance: number) => void;
}

// SVG Icon for Settings Header
const SettingsIcon = () => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="text-[#bde6fb]"
    >
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>
);

export function SettingsModal({ isOpen, onClose, accountId }: SettingsModalProps) {
    // Global Settings State from Store
    const { 
        currencies, 
        addCurrency: addCurrencyToStore, 
        removeCurrency: removeCurrencyFromStore,
        leverages,
        addLeverage: addLeverageToStore,
        removeLeverage: removeLeverageFromStore,
        assets,
        addAsset: addAssetToStore,
        removeAsset: removeAssetFromStore,
        setups,
        addSetup: addSetupToStore,
        removeSetup: removeSetupFromStore,
        loadSettings
    } = useSettingsStore();
    
    // Load settings from Supabase when modal opens
    useEffect(() => {
        if (isOpen) {
            loadSettings();
        }
    }, [isOpen, loadSettings]);
    
    const [newCurrency, setNewCurrency] = useState('');
    const [newLeverage, setNewLeverage] = useState('');
    const [newAsset, setNewAsset] = useState('');
    const [newMultiplier, setNewMultiplier] = useState('1');
    const [newSetup, setNewSetup] = useState('');
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const data = await exportAllData();
            downloadAsJSON(data);
        } catch (error) {
            console.error('Error exporting data:', error);
            alert('Erro ao exportar dados. Tente novamente.');
        } finally {
            setIsExporting(false);
        }
    };

    const addAsset = () => {
        if (newAsset.trim()) {
            addAssetToStore({ symbol: newAsset.toUpperCase(), multiplier: parseFloat(newMultiplier) || 1 });
            setNewAsset('');
            setNewMultiplier('1');
        }
    };

    const removeAsset = (symbol: string) => {
        removeAssetFromStore(symbol);
    };

    const addSetup = () => {
        if (newSetup.trim() && !setups.includes(newSetup)) {
            addSetupToStore(newSetup);
            setNewSetup('');
        }
    };

    const removeSetup = (setup: string) => {
        removeSetupFromStore(setup);
    };

    const addCurrency = () => {
        if (newCurrency.trim() && !currencies.includes(newCurrency.toUpperCase())) {
            addCurrencyToStore(newCurrency.toUpperCase());
            setNewCurrency('');
        }
    };

    const removeCurrency = (currency: string) => {
        removeCurrencyFromStore(currency);
    };

    const addLeverage = () => {
        if (newLeverage.trim() && !leverages.includes(newLeverage)) {
            addLeverageToStore(newLeverage);
            setNewLeverage('');
        }
    };

    const removeLeverage = (leverage: string) => {
        removeLeverageFromStore(leverage);
    };

    const isGlobalMode = !accountId;

    // Custom header with SVG icon
    const headerTitle = (
        <div className="flex items-center gap-3">
            <SettingsIcon />
            <span className="text-xl font-bold text-gray-100">
                {isGlobalMode ? "Configurações Globais" : "Configurações"}
            </span>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={headerTitle} maxWidth="4xl">
            <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-2">
                
                {/* Global Settings Sections - ONLY visible in Global Mode */}
                {isGlobalMode ? (
                    <>
                        <p className="text-gray-400 text-sm">Ajuste as listas usadas no modal de criação de conta.</p>
                        
                        {/* Moedas */}
                        <section>
                            <h3 className="text-lg font-semibold text-gray-200 mb-3 flex items-center gap-2">
                                💰 Moedas
                            </h3>
                            <div className="flex gap-2 mb-2">
                                <Input
                                    placeholder="NOVA MOEDA (EX: CAD)"
                                    value={newCurrency}
                                    onChange={(e) => setNewCurrency(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addCurrency()}
                                    className="uppercase"
                                />
                                <Button variant="gradient-success" onClick={addCurrency} className="w-20 font-extrabold h-10">
                                    Add
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {currencies.map((currency) => (
                                    <span
                                        key={currency}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-800/80 border border-gray-700 rounded-lg text-gray-200 text-sm"
                                    >
                                        {currency}
                                        <Button
                                            variant="danger"
                                            size="icon"
                                            onClick={() => removeCurrency(currency)}
                                            className="w-6 h-6 p-0"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                        </Button>
                                    </span>
                                ))}
                            </div>
                        </section>

                        {/* Alavancagem */}
                        <section>
                            <h3 className="text-lg font-semibold text-gray-200 mb-3 flex items-center gap-2">
                                ⚖️ Alavancagem
                            </h3>
                            <div className="flex gap-2 mb-2">
                                <Input
                                    placeholder="Nova Alavancagem (ex: 1:300)"
                                    value={newLeverage}
                                    onChange={(e) => setNewLeverage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addLeverage()}
                                    />
                                    <Button variant="gradient-success" onClick={addLeverage} className="w-20 font-extrabold h-10">
                                        Add
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {leverages.map((leverage) => (
                                        <span
                                            key={leverage}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-800/80 border border-gray-700 rounded-lg text-gray-200 text-sm"
                                        >
                                            {leverage}
                                            <Button
                                                variant="danger"
                                                size="icon"
                                                onClick={() => removeLeverage(leverage)}
                                                className="w-6 h-6 p-0"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                            </Button>
                                        </span>
                                    ))}
                                </div>
                            </section>
    
                            {/* Mentoria */}
                            <section>
                                <MentorshipSettings />
                            </section>
                        </>
                    ) : (
                    <>
                        {/* Dashboard Settings - ONLY visible when inside a dashboard (accountId exists) */}
                        
                        {/* Ativos & Multiplicadores */}
                        <section>
                            <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
                                📊 Ativos & Multiplicadores
                            </h3>
                            
                            {/* Add new asset */}
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                <Input
                                    placeholder="Ativo (Ex: US30)"
                                    value={newAsset}
                                    onChange={(e) => setNewAsset(e.target.value)}
                                    className="w-full uppercase"
                                />
                                <Input
                                    type="number"
                                    placeholder="1"
                                    value={newMultiplier}
                                    onChange={(e) => setNewMultiplier(e.target.value)}
                                    className="w-full"
                                />
                                <Button variant="gradient-success" onClick={addAsset} className="w-full font-extrabold text-lg h-10">
                                    +
                                </Button>
                            </div>

                            {/* Asset list */}
                            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                                {assets.map((asset) => (
                                    <div
                                        key={asset.symbol}
                                        className="bg-black/20 rounded-lg p-3 border border-white/5 flex items-center justify-between"
                                    >
                                        <div>
                                            <div className="font-semibold text-gray-200">{asset.symbol}</div>
                                            <div className="text-xs text-gray-500">x{asset.multiplier}</div>
                                        </div>
                                        <Button
                                            variant="danger"
                                            size="icon"
                                            onClick={() => removeAsset(asset.symbol)}
                                            className="w-8 h-8"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Tipos de Entrada (Setups) - Full width now since Estratégias is removed */}
                        <section>
                            <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
                                🎯 Tipos de Entrada (Setups)
                            </h3>
                            <div className="flex gap-2 mb-4">
                                <Input
                                    placeholder="Novo Setup (ex: ST, RE, ST+RE)"
                                    value={newSetup}
                                    onChange={(e) => setNewSetup(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addSetup()}
                                    className="flex-1"
                                />
                                <Button variant="gradient-success" onClick={addSetup} className="w-24 font-extrabold h-10">
                                    Add
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {setups.map((setup) => (
                                    <span
                                        key={setup}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-black/20 border border-white/5 rounded-lg text-gray-200 text-sm"
                                    >
                                        {setup}
                                        <Button
                                            variant="danger"
                                            size="icon"
                                            onClick={() => removeSetup(setup)}
                                            className="w-6 h-6 p-0"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                        </Button>
                                    </span>
                                ))}
                            </div>
                        </section>
                    </>
                )}
            </div>
            
            {/* Footer for Global Settings */}
            {isGlobalMode && (
                <div className="mt-6 pt-4 border-t border-gray-700 space-y-3">
                    <Button
                        variant="secondary"
                        onClick={handleExport}
                        className="w-full font-extrabold flex items-center justify-center gap-2"
                        disabled={isExporting}
                    >
                        {isExporting ? 'Exportando...' : '📥 Baixar Backup'}
                    </Button>
                    <Button variant="gradient-danger" onClick={onClose} className="w-full font-extrabold">
                        Fechar
                    </Button>
                </div>
            )}
        </Modal>
    );
}
