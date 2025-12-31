"use client";

import { memo } from "react";
import { Input } from "@/components/ui";
import { DatePickerInput } from "@/components/ui/DateTimePicker";
import { AssetCombobox } from "@/components/shared";

interface EntryHeaderProps {
  title: string;
  setTitle: (value: string) => void;
  asset: string;
  setAsset: (value: string) => void;
  date: string;
  setDate: (value: string) => void;
}

const EntryHeaderComponent = ({
  title,
  setTitle,
  asset,
  setAsset,
  date,
  setDate,
}: EntryHeaderProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="md:col-span-1">
        <Input
          label="Título / Resumo do Dia"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Diário - 02/12/2025"
          required
        />
      </div>
      <div className="md:col-span-1">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-400">
            Ativo <span className="ml-1 text-red-500">*</span>
          </label>
          <AssetCombobox
            value={asset}
            onChange={setAsset}
            className="h-12 border-gray-700 bg-[#232b32]"
          />
        </div>
      </div>
      <div className="md:col-span-1">
        <DatePickerInput
          label="Data"
          value={date}
          onChange={setDate}
          required
          openDirection="bottom"
        />
      </div>
    </div>
  );
};

export const EntryHeader = memo(EntryHeaderComponent);
