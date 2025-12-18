"use client";

import { useEffect, useState, useRef } from "react";
import { GlassCard, Button } from "@/components/ui";
import {
  getMentalEntries,
  saveMentalEntry,
  deleteMentalEntry,
  searchProfiles,
  type MentalEntry,
  type MentalProfile,
} from "@/services/core/mental";

interface MentalGridProps {
  refreshTrigger?: number;
  onEntryChange?: () => void;
}

type ZoneType = "A-Game" | "B-Game" | "C-Game";

export function MentalGrid({ refreshTrigger, onEntryChange }: MentalGridProps) {
  const [entries, setEntries] = useState<MentalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New entry state
  const [newEntry, setNewEntry] = useState({
    triggerEvent: "",
    emotion: "",
    behavior: "",
    mistake: "",
    zoneDetected: "" as string,
  });

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<MentalProfile[]>([]);
  const [activeField, setActiveField] = useState<string | null>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadEntries();
  }, [refreshTrigger]);

  // Close autocomplete on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setSuggestions([]);
        setActiveField(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadEntries = async () => {
    setIsLoading(true);
    try {
      const data = await getMentalEntries(50);
      setEntries(data);
    } catch (error) {
      console.error("Error loading entries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (field: string, value: string) => {
    if (field === "emotion" || field === "behavior") {
      setActiveField(field);
      if (value.length >= 2) {
        try {
          const results = await searchProfiles(value);
          setSuggestions(results);
        } catch (error) {
          console.error("Error searching profiles:", error);
        }
      } else {
        setSuggestions([]);
      }
    }
  };

  const handleSelectSuggestion = (profile: MentalProfile) => {
    setNewEntry((prev) => ({
      ...prev,
      [activeField || "emotion"]: profile.description,
      zoneDetected: profile.zone,
    }));
    setSuggestions([]);
    setActiveField(null);
  };

  const handleAddEntry = async () => {
    if (!newEntry.triggerEvent.trim() && !newEntry.emotion.trim()) return;

    try {
      await saveMentalEntry({
        triggerEvent: newEntry.triggerEvent,
        emotion: newEntry.emotion,
        behavior: newEntry.behavior,
        mistake: newEntry.mistake,
        zoneDetected: (newEntry.zoneDetected as ZoneType) || undefined,
        source: "grid",
      });

      setNewEntry({
        triggerEvent: "",
        emotion: "",
        behavior: "",
        mistake: "",
        zoneDetected: "",
      });

      await loadEntries();
      onEntryChange?.();
    } catch (error) {
      console.error("Error adding entry:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta entrada?")) return;
    try {
      await deleteMentalEntry(id);
      await loadEntries();
      onEntryChange?.();
    } catch (error) {
      console.error("Error deleting entry:", error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getZoneBadge = (zone?: string) => {
    if (!zone) return null;
    const styles = {
      "A-Game": "bg-green-500/20 text-green-400 border-green-500/30",
      "B-Game": "bg-orange-500/20 text-orange-400 border-orange-500/30",
      "C-Game": "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return (
      <span
        className={`rounded-full border px-2 py-0.5 text-xs ${styles[zone as keyof typeof styles] || ""}`}
      >
        {zone}
      </span>
    );
  };

  return (
    <div className="relative" ref={autocompleteRef}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-wider text-gray-300 uppercase">Diário Mental</h3>
        <span className="text-xs text-gray-500">{entries.length} entradas</span>
      </div>

      {/* Table */}
      <GlassCard className="overflow-x-auto border-white/5">
        <table className="w-full text-sm">
          {/* Header */}
          <thead>
            <tr className="bg-zorin-bg/50 border-b border-white/5">
              <th className="w-24 px-3 py-2 text-left text-xs font-semibold tracking-wider text-gray-400 uppercase">
                Data
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold tracking-wider text-gray-400 uppercase">
                Gatilho
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold tracking-wider text-gray-400 uppercase">
                Emoção
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold tracking-wider text-gray-400 uppercase">
                Comportamento
              </th>
              <th className="w-24 px-3 py-2 text-left text-xs font-semibold tracking-wider text-gray-400 uppercase">
                Zona
              </th>
              <th className="w-16 px-3 py-2 text-center text-xs font-semibold tracking-wider text-gray-400 uppercase">
                Ações
              </th>
            </tr>
          </thead>

          <tbody>
            {/* New Entry Row */}
            <tr className="bg-zorin-primary/5 border-b border-white/5">
              <td className="px-3 py-2 text-xs text-gray-500">Novo</td>
              <td className="px-1 py-1">
                <input
                  type="text"
                  value={newEntry.triggerEvent}
                  onChange={(e) =>
                    setNewEntry((prev) => ({ ...prev, triggerEvent: e.target.value }))
                  }
                  placeholder="O que aconteceu?"
                  className="focus:border-zorin-primary/50 w-full rounded border border-white/5 bg-transparent px-2 py-1 text-sm text-gray-200 placeholder-gray-600 focus:outline-none"
                />
              </td>
              <td className="relative px-1 py-1">
                <input
                  type="text"
                  value={newEntry.emotion}
                  onChange={(e) => {
                    setNewEntry((prev) => ({ ...prev, emotion: e.target.value }));
                    handleSearch("emotion", e.target.value);
                  }}
                  placeholder="Medo, Ganância..."
                  className="focus:border-zorin-primary/50 w-full rounded border border-white/5 bg-transparent px-2 py-1 text-sm text-gray-200 placeholder-gray-600 focus:outline-none"
                />
                {/* Autocomplete Dropdown */}
                {activeField === "emotion" && suggestions.length > 0 && (
                  <GlassCard
                    className="absolute top-full right-0 left-0 z-50 mt-1 max-h-48 overflow-y-auto"
                    glow
                  >
                    {suggestions.map((profile) => (
                      <button
                        key={profile.id}
                        onClick={() => handleSelectSuggestion(profile)}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-white/5"
                      >
                        <span className="truncate text-sm text-gray-200">
                          {profile.description}
                        </span>
                        {getZoneBadge(profile.zone)}
                      </button>
                    ))}
                  </GlassCard>
                )}
              </td>
              <td className="relative px-1 py-1">
                <input
                  type="text"
                  value={newEntry.behavior}
                  onChange={(e) => {
                    setNewEntry((prev) => ({ ...prev, behavior: e.target.value }));
                    handleSearch("behavior", e.target.value);
                  }}
                  placeholder="O que fez?"
                  className="focus:border-zorin-primary/50 w-full rounded border border-white/5 bg-transparent px-2 py-1 text-sm text-gray-200 placeholder-gray-600 focus:outline-none"
                />
                {/* Autocomplete Dropdown */}
                {activeField === "behavior" && suggestions.length > 0 && (
                  <GlassCard
                    className="absolute top-full right-0 left-0 z-50 mt-1 max-h-48 overflow-y-auto"
                    glow
                  >
                    {suggestions.map((profile) => (
                      <button
                        key={profile.id}
                        onClick={() => handleSelectSuggestion(profile)}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-white/5"
                      >
                        <span className="truncate text-sm text-gray-200">
                          {profile.description}
                        </span>
                        {getZoneBadge(profile.zone)}
                      </button>
                    ))}
                  </GlassCard>
                )}
              </td>
              <td className="px-1 py-1">
                <select
                  value={newEntry.zoneDetected}
                  onChange={(e) =>
                    setNewEntry((prev) => ({ ...prev, zoneDetected: e.target.value }))
                  }
                  className="bg-zorin-bg focus:border-zorin-primary/50 w-full rounded border border-white/5 px-2 py-1 text-sm text-gray-200 focus:outline-none"
                >
                  <option value="" className="bg-gray-800">
                    Zona
                  </option>
                  <option value="A-Game" className="bg-gray-800">
                    A-Game
                  </option>
                  <option value="B-Game" className="bg-gray-800">
                    B-Game
                  </option>
                  <option value="C-Game" className="bg-gray-800">
                    C-Game
                  </option>
                </select>
              </td>
              <td className="px-3 py-1 text-center">
                <Button
                  onClick={handleAddEntry}
                  variant="zorin-ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  +
                </Button>
              </td>
            </tr>

            {/* Loading */}
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-gray-500">
                  Carregando...
                </td>
              </tr>
            )}

            {/* Empty State */}
            {!isLoading && entries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-gray-500">
                  Nenhuma entrada ainda. Use o Wizard ou adicione manualmente acima.
                </td>
              </tr>
            )}

            {/* Entries */}
            {!isLoading &&
              entries.map((entry, idx) => (
                <tr
                  key={entry.id}
                  className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${
                    idx % 2 === 0 ? "" : "bg-white/[0.01]"
                  }`}
                >
                  <td className="px-3 py-2 text-xs whitespace-nowrap text-gray-500">
                    {formatDate(entry.createdAt)}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-300">{entry.triggerEvent || "-"}</td>
                  <td className="px-3 py-2 text-sm text-gray-300">{entry.emotion || "-"}</td>
                  <td className="px-3 py-2 text-sm text-gray-300">
                    {entry.behavior || entry.correction || "-"}
                  </td>
                  <td className="px-3 py-2">{getZoneBadge(entry.zoneDetected)}</td>
                  <td className="px-3 py-2 text-center">
                    <Button
                      onClick={() => handleDelete(entry.id)}
                      variant="zorin-ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                      title="Excluir"
                    >
                      ×
                    </Button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </GlassCard>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
        <span>💡 Digite na Emoção ou Comportamento para ver sugestões</span>
      </div>
    </div>
  );
}
