import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Asset {
    symbol: string;
    multiplier: number;
}

interface SettingsStore {
    assets: Asset[];
    strategies: string[];
    setups: string[];
    addAsset: (asset: Asset) => void;
    removeAsset: (symbol: string) => void;
    addStrategy: (strategy: string) => void;
    removeStrategy: (strategy: string) => void;
    addSetup: (setup: string) => void;
    removeSetup: (setup: string) => void;
}

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set) => ({
            assets: [
                { symbol: 'EURUSD', multiplier: 100000 },
                { symbol: 'GBPUSD', multiplier: 100000 },
                { symbol: 'USDJPY', multiplier: 100000 },
                { symbol: 'XAUUSD', multiplier: 100 },
                { symbol: 'BTCUSD', multiplier: 1 },
                { symbol: 'WINFUT', multiplier: 0.2 },
                { symbol: 'MNQ', multiplier: 2 },
                { symbol: 'NQ', multiplier: 20 },
            ],
            strategies: ['MMBM', 'MMSM', 'AMD'],
            setups: ['ST + RE', 'ST', '2CR'],
            
            addAsset: (asset) => set((state) => ({
                assets: [...state.assets, asset]
            })),
            
            removeAsset: (symbol) => set((state) => ({
                assets: state.assets.filter(a => a.symbol !== symbol)
            })),
            
            addStrategy: (strategy) => set((state) => ({
                strategies: state.strategies.includes(strategy) 
                    ? state.strategies 
                    : [...state.strategies, strategy]
            })),
            
            removeStrategy: (strategy) => set((state) => ({
                strategies: state.strategies.filter(s => s !== strategy)
            })),
            
            addSetup: (setup) => set((state) => ({
                setups: state.setups.includes(setup) 
                    ? state.setups 
                    : [...state.setups, setup]
            })),
            
            removeSetup: (setup) => set((state) => ({
                setups: state.setups.filter(s => s !== setup)
            })),
        }),
        {
            name: 'settings-storage',
        }
    )
);
