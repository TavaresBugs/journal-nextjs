'use client';

import { useState } from 'react';
import { Modal, Input, Button } from '@/components/ui';
import { useSettingsStore } from '@/store/useSettingsStore';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    accountId?: string;
    currentBalance?: number;
    onUpdateBalance?: (newBalance: number) => void;
}

interface Asset {
    symbol: string;
    multiplier: number;
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
        removeSetup: removeSetupFromStore
    } = useSettingsStore();
    
    const [newCurrency, setNewCurrency] = useState('');
    const [newLeverage, setNewLeverage] = useState('');
    const [newAsset, setNewAsset] = useState('');
    const [newMultiplier, setNewMultiplier] = useState('1');
    const [newStrategy, setNewStrategy] = useState('');
    const [newSetup, setNewSetup] = useState('');

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
                            <div className="flex gap-2 mb-3">
                                <Input
                                    placeholder="NOVA MOEDA (EX: CAD)"
                                    value={newCurrency}
                                    onChange={(e) => setNewCurrency(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addCurrency()}
                                    className="uppercase"
                                />
                                <Button variant="success" onClick={addCurrency} size="sm">
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
                                        <button
                                            onClick={() => removeCurrency(currency)}
                                            className="text-red-400 hover:text-red-300 transition-colors"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </section>

                        {/* Alavancagem */}
                        <section>
                            <h3 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                                ⚖️ Alavancagem
                            </h3>
                            <div className="flex gap-2 mb-3">
                                <Input
                                    placeholder="Nova Alavancagem (ex: 1:300)"
                                    value={newLeverage}
                                    onChange={(e) => setNewLeverage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addLeverage()}
                                />
                                <Button variant="success" onClick={addLeverage} size="sm">
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
                                        <button
                                            onClick={() => removeLeverage(leverage)}
                                            className="text-red-400 hover:text-red-300 transition-colors"
                                        >
                                            ×
                                        </button>
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
                            <div className="flex gap-2 mb-3">
                                <Input
                                    placeholder="Ativo (Ex: US30)"
                                    value={newAsset}
                                    onChange={(e) => setNewAsset(e.target.value)}
                                    className="flex-1 uppercase"
                                />
                                <Input
                                    type="number"
                                    placeholder="1"
                                    value={newMultiplier}
                                    onChange={(e) => setNewMultiplier(e.target.value)}
                                    className="w-24"
                                />
                                <Button variant="success" onClick={addAsset} size="sm">
                                    +
                                </Button>
                            </div>

                            {/* Asset list */}
                            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                                {assets.map((asset) => (
                                    <div
                                        key={asset.symbol}
                                        className="bg-gray-800/50 rounded-lg p-3 border border-gray-700 flex items-center justify-between"
                                    >
                                        <div>
                                            <div className="font-semibold text-gray-200">{asset.symbol}</div>
                                            <div className="text-xs text-gray-500">x{asset.multiplier}</div>
                                        </div>
                                        <button
                                            onClick={() => removeAsset(asset.symbol)}
                                            className="text-red-400 hover:text-red-300 transition-colors"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Estratégias */}
                        <section>
                            <h3 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                                🧠 Estratégias
                            </h3>
                            <div className="flex gap-2 mb-3">
                                <Input
                                    placeholder="Nova Estratégia"
                                    value={newStrategy}
                                    onChange={(e) => setNewStrategy(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addStrategy()}
                                />
                                <Button variant="success" onClick={addStrategy} size="sm">
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
                                        <button
                                            onClick={() => removeStrategy(strategy)}
                                            className="text-red-400 hover:text-red-300 transition-colors"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </section>

                        {/* Tipos de Entrada (Setups) */}
                        <section>
                            <h3 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                                🎯 Tipos de Entrada (Setups)
                            </h3>
                            <div className="flex gap-2 mb-3">
                                <Input
                                    placeholder="Novo Setup"
                                    value={newSetup}
                                    onChange={(e) => setNewSetup(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addSetup()}
                                />
                                <Button variant="success" onClick={addSetup} size="sm">
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
                                        <button
                                            onClick={() => removeSetup(setup)}
                                            className="text-red-400 hover:text-red-300 transition-colors"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </section>

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
                                    <Button variant="success" onClick={handleSaveBalance} className="w-full">
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
                <div className="mt-6 pt-4 border-t border-gray-700 flex justify-end">
                    <Button variant="primary" onClick={onClose} className="w-32">
                        Fechar
                    </Button>
                </div>
            )}
        </Modal>
    );
}
