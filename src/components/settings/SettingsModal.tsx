'use client';

import { useState, useEffect } from 'react';
import { Modal, Input, Button } from '@/components/ui';
import { useSettingsStore } from '@/store/useSettingsStore';
import { exportAllData, downloadAsJSON } from '@/services/exportService';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    accountId?: string;
    currentBalance?: number;
    onUpdateBalance?: (newBalance: number) => void;
}



export function SettingsModal({ isOpen, onClose, accountId, currentBalance, onUpdateBalance }: SettingsModalProps) {
    const [newBalance, setNewBalance] = useState(currentBalance?.toString() || '');
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
        strategies,
        addStrategy: addStrategyToStore,
        removeStrategy: removeStrategyFromStore,
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
    const [newStrategy, setNewStrategy] = useState('');
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

    const addStrategy = () => {
        if (newStrategy.trim() && !strategies.includes(newStrategy)) {
            addStrategyToStore(newStrategy);
            setNewStrategy('');
        }
    };

    const removeStrategy = (strategy: string) => {
        removeStrategyFromStore(strategy);
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

    const handleSaveBalance = () => {
        const balance = parseFloat(newBalance);
        if (!isNaN(balance) && balance > 0 && onUpdateBalance) {
            onUpdateBalance(balance);
            alert('Saldo atualizado com sucesso!');
        }
    };

    const isGlobalMode = !accountId;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isGlobalMode ? "⚙️ Configurações Globais" : "⚙️ Configurações"} maxWidth="4xl">
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                
                {/* Global Settings Sections - ONLY visible in Global Mode */}
                {isGlobalMode ? (
                    <>
                        <p className="text-gray-400 text-sm">Ajuste as listas usadas no modal de criação de conta.</p>
                        
                        {/* Moedas */}
                        <section>
                            <h3 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
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
                            <h3 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
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
                    </>
                ) : (
                    <>
                        {/* Dashboard Settings - ONLY visible when inside a dashboard (accountId exists) */}
                        
                        {/* Ativos & Multiplicadores */}
                        <section>
                            <h3 className="text-lg font-semibold text-cyan-400 mb-3">
                                ATIVOS & MULTIPLICADORES
                            </h3>
                            
                            {/* Add new asset */}
                            {/* Add new asset */}
                            <div className="grid grid-cols-3 gap-2 mb-2">
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
                                        className="bg-gray-800/50 rounded-lg p-2 border border-gray-700 flex items-center justify-between"
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
                                            🗑️
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Estratégias e Setups lado a lado */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Estratégias */}
                            <section>
                                <h3 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                                    🧠 Estratégias
                                </h3>
                                <div className="flex gap-2 mb-2">
                                    <Input
                                        placeholder="Nova Estratégia"
                                        value={newStrategy}
                                        onChange={(e) => setNewStrategy(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addStrategy()}
                                    />
                                    <Button variant="gradient-success" onClick={addStrategy} className="w-20 font-extrabold h-10">
                                        Add
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {strategies.map((strategy) => (
                                        <span
                                            key={strategy}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-800/80 border border-gray-700 rounded-lg text-gray-200 text-sm"
                                        >
                                            {strategy}
                                            <Button
                                                variant="danger"
                                                size="icon"
                                                onClick={() => removeStrategy(strategy)}
                                                className="w-6 h-6 p-0"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                            </Button>
                                        </span>
                                    ))}
                                </div>
                            </section>

                            {/* Tipos de Entrada (Setups) */}
                            <section>
                                <h3 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                                    🎯 Tipos de Entrada (Setups)
                                </h3>
                                <div className="flex gap-2 mb-2">
                                    <Input
                                        placeholder="Novo Setup"
                                        value={newSetup}
                                        onChange={(e) => setNewSetup(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addSetup()}
                                    />
                                    <Button variant="gradient-success" onClick={addSetup} className="w-20 font-extrabold h-10">
                                        Add
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {setups.map((setup) => (
                                        <span
                                            key={setup}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-800/80 border border-gray-700 rounded-lg text-gray-200 text-sm"
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
                        </div>

                        {/* Ajuste de Saldo */}
                        {currentBalance !== undefined && (
                            <section>
                                <h3 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                                    💰 Ajuste de Saldo
                                </h3>
                                <div className="space-y-3">
                                    <Input
                                        label="Novo Saldo"
                                        type="number"
                                        value={newBalance}
                                        onChange={(e) => setNewBalance(e.target.value)}
                                    />
                                    <Button variant="gradient-success" onClick={handleSaveBalance} className="w-full font-extrabold h-10">
                                        Salvar Saldo
                                    </Button>
                                </div>
                            </section>
                        )}
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
