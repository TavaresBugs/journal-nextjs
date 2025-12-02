import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_CURRENCIES, DEFAULT_LEVERAGES, DEFAULT_ASSETS, DEFAULT_STRATEGIES, DEFAULT_SETUPS } from '@/types';

interface Asset {
    symbol: string;
    multiplier: number;
}

interface SettingsStore {
    currencies: string[];
    leverages: string[];
    assets: Asset[];
    strategies: string[];
    setups: string[];
    
    // Actions
    addCurrency: (currency: string) => void;
    removeCurrency: (currency: string) => void;
    addLeverage: (leverage: string) => void;
    removeLeverage: (leverage: string) => void;
    addAsset: (asset: Asset) => void;
    removeAsset: (symbol: string) => void;
    addStrategy: (strategy: string) => void;
    removeStrategy: (strategy: string) => void;
    addSetup: (setup: string) => void;
    removeSetup: (setup: string) => void;
    resetDefaults: () => void;
}

// Convert DEFAULT_ASSETS record to array
const defaultAssetsArray = Object.entries(DEFAULT_ASSETS).map(([symbol, multiplier]) => ({
    symbol,
    multiplier
}));

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set) => ({
            currencies: DEFAULT_CURRENCIES,
            leverages: DEFAULT_LEVERAGES,
            assets: defaultAssetsArray,
            strategies: DEFAULT_STRATEGIES,
            setups: DEFAULT_SETUPS,

            addCurrency: (currency) => set((state) => ({
                currencies: [...state.currencies, currency]
            })),

            removeCurrency: (currency) => set((state) => ({
                currencies: state.currencies.filter((c) => c !== currency)
            })),

            addLeverage: (leverage) => set((state) => ({
                leverages: [...state.leverages, leverage]
            })),

            removeLeverage: (leverage) => set((state) => ({
                leverages: state.leverages.filter((l) => l !== leverage)
            })),

            addAsset: (asset) => set((state) => ({
                assets: [...state.assets, asset]
            })),

            removeAsset: (symbol) => set((state) => ({
                assets: state.assets.filter((a) => a.symbol !== symbol)
            })),

            addStrategy: (strategy) => set((state) => ({
                strategies: [...state.strategies, strategy]
            })),

            removeStrategy: (strategy) => set((state) => ({
                strategies: state.strategies.filter((s) => s !== strategy)
            })),

            addSetup: (setup) => set((state) => ({
                setups: [...state.setups, setup]
            })),

            removeSetup: (setup) => set((state) => ({
                setups: state.setups.filter((s) => s !== setup)
            })),

            resetDefaults: () => set({
                currencies: DEFAULT_CURRENCIES,
                leverages: DEFAULT_LEVERAGES,
                assets: defaultAssetsArray,
                strategies: DEFAULT_STRATEGIES,
                setups: DEFAULT_SETUPS
            })
        }),
        {
            name: 'settings-storage',
        }
    )
);
