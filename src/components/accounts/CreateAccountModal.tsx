"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Modal,
  Input,
  Button,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui";
import type { Account } from "@/types";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useAccountStore } from "@/store/useAccountStore";
import { useToast } from "@/providers/ToastProvider";

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAccount: (account: Omit<Account, "id" | "createdAt" | "updatedAt" | "userId">) => void;
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
};

// Currency flag component
function CurrencyFlag({ currency, size = 20 }: { currency: string; size?: number }) {
  const flagPath = CURRENCY_FLAGS[currency.toUpperCase()];

  if (!flagPath) {
    // Fallback: show currency text in a colored circle
    return (
      <span
        className="flex items-center justify-center rounded-full bg-gray-600 text-[10px] font-bold text-white"
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

export function CreateAccountModal({ isOpen, onClose, onCreateAccount }: CreateAccountModalProps) {
  const { currencies, leverages } = useSettingsStore();
  const { accounts } = useAccountStore();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState(currencies[0] || "USD");
  const [initialBalance, setInitialBalance] = useState("100000");
  const [leverage, setLeverage] = useState(leverages[0] || "1:100");
  const [maxDrawdown, setMaxDrawdown] = useState("10");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check for duplicate name
    if (accounts.some((acc) => acc.name.toLowerCase() === name.trim().toLowerCase())) {
      showToast("Já existe uma carteira com este nome. Por favor, escolha outro.", "error");
      return;
    }

    const accountData = {
      name,
      currency: currency.toUpperCase(),
      initialBalance: parseFloat(initialBalance),
      currentBalance: parseFloat(initialBalance),
      leverage,
      maxDrawdown: parseFloat(maxDrawdown),
    };

    onCreateAccount(accountData);

    // Reset form
    setName("");
    setCurrency(currencies[0] || "USD");
    setInitialBalance("100000");
    setLeverage(leverages[0] || "1:100");
    setMaxDrawdown("10");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Carteira" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome"
          placeholder="Ex: FTMO 100k"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          {/* Currency Select with Flag */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-400">
              Moeda <span className="ml-1 text-red-500">*</span>
            </label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="flex h-12 w-full items-center justify-between rounded-lg border border-gray-700 bg-[#232b32] px-3 text-sm text-gray-100 transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-cyan-500 focus:outline-none">
                <div className="flex items-center gap-2.5">
                  <CurrencyFlag currency={currency} />
                  <span className="uppercase">{currency}</span>
                </div>
              </SelectTrigger>
              <SelectContent className="border-gray-700 bg-[#232b32]">
                {currencies.map((curr) => (
                  <SelectItem
                    key={curr}
                    value={curr}
                    className="cursor-pointer py-2.5 text-gray-100 hover:bg-gray-700 focus:bg-gray-700"
                  >
                    <div className="flex items-center gap-2.5">
                      <CurrencyFlag currency={curr} />
                      <span className="uppercase">{curr}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Input
            label="Saldo Inicial"
            type="number"
            placeholder="100000"
            value={initialBalance}
            onChange={(e) => setInitialBalance(e.target.value)}
            step="100"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Leverage Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-400">
              Alavancagem <span className="ml-1 text-red-500">*</span>
            </label>
            <Select value={leverage} onValueChange={setLeverage}>
              <SelectTrigger className="flex h-12 w-full items-center justify-between rounded-lg border border-gray-700 bg-[#232b32] px-3 text-sm text-gray-100 transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-cyan-500 focus:outline-none">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent className="border-gray-700 bg-[#232b32]">
                {leverages.map((lev) => (
                  <SelectItem
                    key={lev}
                    value={lev}
                    className="cursor-pointer py-2.5 text-gray-100 hover:bg-gray-700 focus:bg-gray-700"
                  >
                    {lev}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Input
            label="Max Drawdown (%)"
            type="number"
            placeholder="10"
            value={maxDrawdown}
            onChange={(e) => setMaxDrawdown(e.target.value)}
            step="0.5"
            min="0"
            max="100"
            required
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="gradient-danger"
            onClick={onClose}
            className="flex-1 font-extrabold"
          >
            Cancelar
          </Button>
          <Button type="submit" variant="gradient-success" className="flex-1 font-extrabold">
            Criar Carteira
          </Button>
        </div>
      </form>
    </Modal>
  );
}
