import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_CURRENCIES, DEFAULT_LEVERAGES, DEFAULT_ASSETS, DEFAULT_STRATEGIES, DEFAULT_SETUPS } from '@/types';
import type { Asset } from '@/types';
import { getUserSettings, saveUserSettings } from '@/lib/storage';

interface SettingsStore {
    currencies: string[];
    leverages: string[];
    assets: Asset[];
    strategies: string[];
    setups: string[];
    isLoading: boolean;
    
    // Actions
    loadSettings: () => Promise<void>;
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

// Helper to save settings to Supabase
const syncToSupabase = async (state: Pick<SettingsStore, 'currencies' | 'leverages' | 'assets' | 'strategies' | 'setups'>) => {
    try {
        await saveUserSettings({
            currencies: state.currencies,
            leverages: state.leverages,
            assets: state.assets,
            strategies: state.strategies,
            setups: state.setups
        });
    } catch (error) {
        console.error('Error syncing settings to Supabase:', error);
    }
};

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set) => ({
            currencies: DEFAULT_CURRENCIES,
            leverages: DEFAULT_LEVERAGES,
            assets: defaultAssetsArray,
            strategies: DEFAULT_STRATEGIES,
            setups: DEFAULT_SETUPS,
            isLoading: false,

            loadSettings: async () => {
                set({ isLoading: true });
                try {
                    const settings = await getUserSettings();
                    if (settings) {
                        set({
                            currencies: settings.currencies.length > 0 ? settings.currencies : DEFAULT_CURRENCIES,
                            leverages: settings.leverages.length > 0 ? settings.leverages : DEFAULT_LEVERAGES,
                            assets: settings.assets.length > 0 ? settings.assets : defaultAssetsArray,
                            strategies: settings.strategies || [],
                            setups: settings.setups || [],
                            isLoading: false
                        });
                    } else {
                        // No settings found - use defaults
                        set({ isLoading: false });
                    }
                } catch (error) {
                    console.error('Error loading settings:', error);
                    set({ isLoading: false });
                }
            },

            addCurrency: (currency) => {
                set((state) => {
                    const newState = {
                        ...state,
                        currencies: [...state.currencies, currency]
                    };
                    syncToSupabase(newState);
                    return newState;
                });
            },

            removeCurrency: (currency) => {
                set((state) => {
                    const newState = {
                        ...state,
                        currencies: state.currencies.filter((c) => c !== currency)
                    };
                    syncToSupabase(newState);
                    return newState;
                });
            },

            addLeverage: (leverage) => {
                set((state) => {
                    const newState = {
                        ...state,
                        leverages: [...state.leverages, leverage]
                    };
                    syncToSupabase(newState);
                    return newState;
                });
            },

            removeLeverage: (leverage) => {
                set((state) => {
                    const newState = {
                        ...state,
                        leverages: state.leverages.filter((l) => l !== leverage)
                    };
                    syncToSupabase(newState);
                    return newState;
                });
            },

            addAsset: (asset) => {
                set((state) => {
                    const newState = {
                        ...state,
                        assets: [...state.assets, asset]
                    };
                    syncToSupabase(newState);
                    return newState;
                });
            },

            removeAsset: (symbol) => {
                set((state) => {
                    const newState = {
                        ...state,
                        assets: state.assets.filter((a) => a.symbol !== symbol)
                    };
                    syncToSupabase(newState);
                    return newState;
                });
            },

            addStrategy: (strategy) => {
                set((state) => {
                    const newState = {
                        ...state,
                        strategies: [...state.strategies, strategy]
                    };
                    syncToSupabase(newState);
                    return newState;
                });
            },

            removeStrategy: (strategy) => {
                set((state) => {
                    const newState = {
                        ...state,
                        strategies: state.strategies.filter((s) => s !== strategy)
                    };
                    syncToSupabase(newState);
                    return newState;
                });
            },

            addSetup: (setup) => {
                set((state) => {
                    const newState = {
                        ...state,
                        setups: [...state.setups, setup]
                    };
                    syncToSupabase(newState);
                    return newState;
                });
            },

            removeSetup: (setup) => {
                set((state) => {
                    const newState = {
                        ...state,
                        setups: state.setups.filter((s) => s !== setup)
                    };
                    syncToSupabase(newState);
                    return newState;
                });
            },

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
