"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui";

interface ArgumentInputProps {
  onAdd: (value: string) => void;
  placeholder: string;
  color: "emerald" | "red";
  maxLength?: number;
}

export function ArgumentInput({ onAdd, placeholder, color, maxLength = 500 }: ArgumentInputProps) {
  const [hasValue, setHasValue] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    const value = inputRef.current?.value.trim();
    if (!value) return;

    onAdd(value);

    if (inputRef.current) {
      inputRef.current.value = "";
      setHasValue(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isNotEmpty = e.target.value.trim().length > 0;
    if (isNotEmpty !== hasValue) {
      setHasValue(isNotEmpty);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const borderClass =
    color === "emerald"
      ? "border-emerald-500/30 focus:border-emerald-500"
      : "border-red-500/30 focus:border-red-500";

  return (
    <div className="flex gap-2">
      <input
        ref={inputRef}
        type="text"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`flex-1 rounded-lg border bg-black/20 px-3 py-2 text-sm text-white transition-colors placeholder:text-gray-600 focus:outline-none ${borderClass}`}
      />
      {color === "emerald" ? (
        <Button
          variant="gradient-success"
          size="sm"
          onClick={handleAdd}
          disabled={!hasValue}
          className="px-3"
        >
          +
        </Button>
      ) : (
        <Button
          variant="danger"
          size="sm"
          onClick={handleAdd}
          disabled={!hasValue}
          className="border-none bg-red-500 px-3 text-white hover:bg-red-600"
        >
          +
        </Button>
      )}
    </div>
  );
}
