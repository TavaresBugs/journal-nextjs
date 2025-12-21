"use client";

import { useState } from "react";
import Image from "next/image";
import { Modal, Input, Button } from "@/components/ui";
import { useSettingsStore } from "@/store/useSettingsStore";

interface CurrencySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mapping of currency codes to flag SVG paths
const CURRENCY_FLAGS: Record<string, string> = {
  USD: "/assets/icons/flags/usd.svg",
  EUR: "/assets/icons/flags/eur.svg",
  GBP: "/assets/icons/flags/gbp.svg",
  JPY: "/assets/icons/flags/jpy.svg",
  AUD: "/assets/icons/flags/aud.svg",
  CAD: "/assets/icons/flags/cad.svg",
  CHF: "/assets/icons/flags/chf.svg",
  NZD: "/assets/icons/flags/nzd.svg",
  CNY: "/assets/icons/flags/cny.svg",
  BRL: "/assets/icons/flags/brl.svg",
};

// Currency flag component
function CurrencyFlag({ currency, size = 24 }: { currency: string; size?: number }) {
  const flagPath = CURRENCY_FLAGS[currency.toUpperCase()];

  if (!flagPath) {
    return (
      <span
        className="flex items-center justify-center rounded-full bg-linear-to-br from-gray-500 to-gray-700 text-[10px] font-bold text-white"
        style={{ width: size, height: size }}
      >
        {currency.slice(0, 2)}
      </span>
    );
  }

  return (
    <Image
      src={flagPath}
      alt={`${currency} flag`}
      width={size}
      height={size}
      className="rounded-full object-cover"
    />
  );
}

export function CurrencySettingsModal({ isOpen, onClose }: CurrencySettingsModalProps) {
  const {
    currencies,
    addCurrency: addCurrencyToStore,
    removeCurrency: removeCurrencyFromStore,
  } = useSettingsStore();

  const [newCurrency, setNewCurrency] = useState("");

  const addCurrency = () => {
    if (newCurrency.trim() && !currencies.includes(newCurrency.toUpperCase())) {
      addCurrencyToStore(newCurrency.toUpperCase());
      setNewCurrency("");
    }
  };

  const removeCurrency = (currency: string) => {
    removeCurrencyFromStore(currency);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="💰 Configurar Moedas" maxWidth="md">
      <div className="space-y-6">
        <p className="text-sm text-gray-400">
          Adicione ou remova moedas disponíveis para suas carteiras de trading.
        </p>

        {/* Add new currency */}
        <div className="flex gap-2">
          <Input
            placeholder="Nova moeda (ex: CAD)"
            value={newCurrency}
            onChange={(e) => setNewCurrency(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addCurrency()}
            className="flex-1 uppercase"
          />
          <Button
            variant="gradient-success"
            onClick={addCurrency}
            className="h-12 px-6 font-extrabold"
          >
            Adicionar
          </Button>
        </div>

        {/* Currency list */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {currencies.map((currency) => (
            <div
              key={currency}
              className="group flex items-center justify-between rounded-xl border border-gray-700/50 bg-gray-800/50 px-4 py-3 transition-all hover:border-gray-600 hover:bg-gray-800"
            >
              <div className="flex items-center gap-3">
                <CurrencyFlag currency={currency} />
                <span className="font-medium text-gray-200">{currency}</span>
              </div>
              <button
                onClick={() => removeCurrency(currency)}
                className="rounded-full p-1.5 text-gray-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
