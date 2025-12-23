"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Modal,
  Input,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  ModalFooterActions,
} from "@/components/ui";
import type { Account } from "@/types";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useAccountStore } from "@/store/useAccountStore";
import { useToast } from "@/providers/ToastProvider";
import { checkAccountHasTrades } from "@/actions/accounts";

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (account: Account) => Promise<void>;
  account: Account | null;
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

export function EditAccountModal({ isOpen, onClose, onSave, account }: EditAccountModalProps) {
  const { currencies, leverages } = useSettingsStore();
  const { accounts } = useAccountStore();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [initialBalance, setInitialBalance] = useState("100000");
  const [leverage, setLeverage] = useState("1:100");
  const [maxDrawdown, setMaxDrawdown] = useState("10");
  const [isLoading, setIsLoading] = useState(false);
  const [hasTrades, setHasTrades] = useState(false);

  // Load account data when modal opens or account changes
  useEffect(() => {
    if (account) {
      setName(account.name);
      setCurrency(account.currency);
      setInitialBalance(account.initialBalance.toString());
      setLeverage(account.leverage);
      setMaxDrawdown(account.maxDrawdown.toString());

      // Check if account has trades
      checkAccountHasTrades(account.id).then(setHasTrades);
    }
  }, [account, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    // Check for duplicate name (excluding current account)
    if (
      accounts.some(
        (acc) => acc.id !== account.id && acc.name.toLowerCase() === name.trim().toLowerCase()
      )
    ) {
      showToast("Já existe uma carteira com este nome. Por favor, escolha outro.", "error");
      return;
    }

    setIsLoading(true);

    try {
      const updatedAccount: Account = {
        ...account,
        name,
        currency: currency.toUpperCase(),
        initialBalance: parseFloat(initialBalance),
        // Recalculate current balance based on PnL difference if needed,
        // or just update initial balance and let current balance shift?
        // Usually, changing initial balance should shift current balance by the delta.
        // currentBalance = newInitial + (oldCurrent - oldInitial)
        currentBalance:
          parseFloat(initialBalance) + (account.currentBalance - account.initialBalance),
        leverage,
        maxDrawdown: parseFloat(maxDrawdown),
        updatedAt: new Date().toISOString(),
      };

      await onSave(updatedAccount);
      showToast("Carteira atualizada com sucesso!", "success");
      onClose();
    } catch (error) {
      console.error("Error updating account:", error);
      showToast("Erro ao atualizar carteira.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Carteira" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome"
          placeholder="Ex: FTMO 100k"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isLoading}
        />

        <div className="grid grid-cols-2 gap-4">
          {/* Currency Select with Flag */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-400">
              Moeda <span className="ml-1 text-red-500">*</span>
            </label>
            <Select value={currency} onValueChange={isLoading ? undefined : setCurrency}>
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
            disabled={isLoading || hasTrades} // Also disable initial balance as changing it affects PnL calculations relative to trades
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Leverage Select */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-400">
                Alavancagem <span className="ml-1 text-red-500">*</span>
              </label>
              {hasTrades && (
                <div className="group relative">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-amber-500"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <span className="pointer-events-none absolute top-1/2 left-full z-50 ml-2 w-max -translate-y-1/2 rounded bg-black/80 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                    Não editável com trades ativos
                  </span>
                </div>
              )}
            </div>
            <Select
              value={leverage}
              onValueChange={isLoading || hasTrades ? undefined : setLeverage}
            >
              <SelectTrigger
                className={`flex h-12 w-full items-center justify-between rounded-lg border border-gray-700 bg-[#232b32] px-3 text-sm text-gray-100 transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-cyan-500 focus:outline-none ${hasTrades ? "cursor-not-allowed opacity-50" : ""}`}
              >
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
            disabled={isLoading}
          />
        </div>

        <ModalFooterActions
          mode="save-cancel"
          onSecondary={onClose}
          isLoading={isLoading}
          isSubmit
          primaryLabel={isLoading ? "Salvando..." : "Salvar Alterações"}
          primaryVariant="gradient-success"
        />
      </form>
    </Modal>
  );
}
