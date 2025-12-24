import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_CURRENCIES,
  DEFAULT_LEVERAGES,
  DEFAULT_ASSETS,
  DEFAULT_STRATEGIES,
  DEFAULT_SETUPS,
} from "@/types";
import type { Asset } from "@/types";
import { getUserSettingsAction, saveUserSettingsAction } from "@/app/actions/accounts";

interface SettingsStore {
  currencies: string[];
  leverages: string[];
  assets: Asset[];
  strategies: string[];
  setups: string[];
  isLoading: boolean;
  isLoaded: boolean; // ✅ NEW: Prevents redundant API calls

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
  multiplier,
}));

// Helper to save settings to Supabase
const syncToSupabase = async (
  state: Pick<SettingsStore, "currencies" | "leverages" | "assets" | "strategies" | "setups">
) => {
  try {
    await saveUserSettingsAction({
      currencies: state.currencies,
      leverages: state.leverages,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      assets: state.assets as any, // Cast to any to handle type mismatch if needed, or fix Asset type
      strategies: state.strategies,
      setups: state.setups,
    });
  } catch (error) {
    console.error("Error syncing settings to Supabase:", error);
  }
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      currencies: DEFAULT_CURRENCIES,
      leverages: DEFAULT_LEVERAGES,
      assets: defaultAssetsArray,
      strategies: DEFAULT_STRATEGIES,
      setups: DEFAULT_SETUPS,
      isLoading: false,
      isLoaded: false, // ✅ NEW

      loadSettings: async () => {
        // ✅ OPTIMIZED: Skip if already loaded or loading
        if (get().isLoaded || get().isLoading) {
          return;
        }

        set({ isLoading: true });
        try {
          const settings = await getUserSettingsAction();
          if (settings) {
            set({
              currencies: settings.currencies.length > 0 ? settings.currencies : DEFAULT_CURRENCIES,
              leverages: settings.leverages.length > 0 ? settings.leverages : DEFAULT_LEVERAGES,
              assets: settings.assets.length > 0 ? settings.assets : defaultAssetsArray,
              strategies: settings.strategies || [],
              setups: settings.setups || [],
              isLoading: false,
              isLoaded: true, // ✅ Mark as loaded
            });
          } else {
            // No settings found - use defaults
            set({ isLoading: false, isLoaded: true });
          }
        } catch (error) {
          console.error("Error loading settings:", error);
          set({ isLoading: false, isLoaded: true }); // Mark as loaded even on error to prevent retries
        }
      },

      addCurrency: (currency) => {
        set((state) => {
          const newState = {
            ...state,
            currencies: [...state.currencies, currency],
          };
          syncToSupabase(newState);
          return newState;
        });
      },

      removeCurrency: (currency) => {
        set((state) => {
          const newState = {
            ...state,
            currencies: state.currencies.filter((c) => c !== currency),
          };
          syncToSupabase(newState);
          return newState;
        });
      },

      addLeverage: (leverage) => {
        set((state) => {
          const newState = {
            ...state,
            leverages: [...state.leverages, leverage],
          };
          syncToSupabase(newState);
          return newState;
        });
      },

      removeLeverage: (leverage) => {
        set((state) => {
          const newState = {
            ...state,
            leverages: state.leverages.filter((l) => l !== leverage),
          };
          syncToSupabase(newState);
          return newState;
        });
      },

      addAsset: (asset) => {
        set((state) => {
          const newState = {
            ...state,
            assets: [...state.assets, asset],
          };
          syncToSupabase(newState);
          return newState;
        });
      },

      removeAsset: (symbol) => {
        set((state) => {
          const newState = {
            ...state,
            assets: state.assets.filter((a) => a.symbol !== symbol),
          };
          syncToSupabase(newState);
          return newState;
        });
      },

      addStrategy: (strategy) => {
        set((state) => {
          const newState = {
            ...state,
            strategies: [...state.strategies, strategy],
          };
          syncToSupabase(newState);
          return newState;
        });
      },

      removeStrategy: (strategy) => {
        set((state) => {
          const newState = {
            ...state,
            strategies: state.strategies.filter((s) => s !== strategy),
          };
          syncToSupabase(newState);
          return newState;
        });
      },

      addSetup: (setup) => {
        set((state) => {
          const newState = {
            ...state,
            setups: [...state.setups, setup],
          };
          syncToSupabase(newState);
          return newState;
        });
      },

      removeSetup: (setup) => {
        set((state) => {
          const newState = {
            ...state,
            setups: state.setups.filter((s) => s !== setup),
          };
          syncToSupabase(newState);
          return newState;
        });
      },

      resetDefaults: () =>
        set({
          currencies: DEFAULT_CURRENCIES,
          leverages: DEFAULT_LEVERAGES,
          assets: defaultAssetsArray,
          strategies: DEFAULT_STRATEGIES,
          setups: DEFAULT_SETUPS,
        }),
    }),
    {
      name: "settings-storage",
    }
  )
);
