"use client";

import React, { useCallback } from "react";
import { FormGroup } from "@/components/ui";

// Badge colors for confluence tags
const TAG_COLORS = [
  { bg: "bg-purple-500/20", text: "text-purple-300", border: "border-purple-500/30" },
  { bg: "bg-cyan-500/20", text: "text-cyan-300", border: "border-cyan-500/30" },
  { bg: "bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-500/30" },
  { bg: "bg-orange-500/20", text: "text-orange-300", border: "border-orange-500/30" },
  { bg: "bg-pink-500/20", text: "text-pink-300", border: "border-pink-500/30" },
  { bg: "bg-indigo-500/20", text: "text-indigo-300", border: "border-indigo-500/30" },
];

const getTagColor = (index: number) => TAG_COLORS[index % TAG_COLORS.length];

interface ConfluenceTagsProps {
  tagsList: string[];
  tagInput: string;
  onTagsChange: React.Dispatch<React.SetStateAction<string[]>>;
  onInputChange: (value: string) => void;
}

export const ConfluenceTags = React.memo(function ConfluenceTags({
  tagsList,
  tagInput,
  onTagsChange,
  onInputChange,
}: ConfluenceTagsProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        const newTag = tagInput.trim();
        if (newTag && !tagsList.includes(newTag)) {
          onTagsChange((prev) => [...prev, newTag]);
          onInputChange("");
        }
      } else if (e.key === "Backspace" && !tagInput && tagsList.length > 0) {
        onTagsChange((prev) => prev.slice(0, -1));
      }
    },
    [tagInput, tagsList, onTagsChange, onInputChange]
  );

  const handleRemoveTag = useCallback(
    (index: number) => {
      onTagsChange((prev) => prev.filter((_, i) => i !== index));
    },
    [onTagsChange]
  );

  const handleContainerClick = useCallback(() => {
    document.getElementById("tags-input")?.focus();
  }, []);

  return (
    <FormGroup label="Confluências">
      <div
        className="flex min-h-12 w-full flex-wrap items-center gap-1.5 rounded-lg border border-gray-700 bg-[#232b32] px-3 py-2 transition-all duration-200 focus-within:border-transparent focus-within:ring-2 focus-within:ring-cyan-500"
        onClick={handleContainerClick}
      >
        {tagsList.map((tag, index) => {
          const color = getTagColor(index);
          return (
            <span
              key={index}
              className={`rounded px-2 py-0.5 text-xs font-medium ${color.bg} ${color.text} border ${color.border} flex items-center gap-1`}
            >
              🏷️ {tag}
              <div
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveTag(index);
                }}
                className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-black/20 hover:text-white"
                title="Remover tag"
              >
                ×
              </div>
            </span>
          );
        })}
        <input
          id="tags-input"
          value={tagInput}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tagsList.length === 0 ? "FVG Breaker OB" : ""}
          className="min-w-[60px] flex-1 border-none bg-transparent text-sm text-gray-100 placeholder-gray-500 outline-none"
        />
      </div>
    </FormGroup>
  );
});
