import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import type { MentalLog } from "@/lib/database/repositories/MentalRepository";
import { IconActionButton } from "@/components/ui";

interface Props {
  entry: MentalLog;
  entryConfig: { emoji: string; label: string; color: string };
  onView: (entry: MentalLog) => void;
  onEdit: (entry: MentalLog) => void;
  onDelete: (id: string) => void;
}

export function HistoryCardCompact({ entry, entryConfig, onView, onEdit, onDelete }: Props) {
  const [isHovered, setIsHovered] = useState(false);

  // Parse date safely
  const dateObj = new Date(entry.createdAt);

  const formattedDate = format(dateObj, "dd 'de' MMM, HH:mm", {
    locale: ptBR,
  });

  const timeAgo = formatDistanceToNow(dateObj, {
    addSuffix: true,
    locale: ptBR,
  });

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  return (
    <div
      className="group relative flex items-center justify-between gap-4 rounded-lg border border-gray-700/50 bg-black/20 p-3 transition-all duration-200 hover:border-gray-600 hover:bg-black/40"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left Side - Info */}
      <div className="min-w-0 flex-1">
        {/* Primary Info - Horizontal Layout */}
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xl leading-none">{entryConfig.emoji}</span>

          <span className="text-sm font-medium text-gray-300">{formattedDate}</span>

          <span className="text-gray-600">•</span>

          <span className="text-xs text-gray-500">{timeAgo}</span>
        </div>

        {/* Secondary Info - Truncated */}
        <div className="flex items-center gap-2 truncate text-sm text-gray-400">
          <span className={`font-medium capitalize ${entryConfig.color}`}>
            {entryConfig.label}:
          </span>
          <span className="truncate text-gray-500">{truncateText(entry.step1Problem, 60)}</span>
        </div>
      </div>

      {/* Right Side - Actions */}
      <div className="flex items-center gap-1">
        <IconActionButton variant="view" onClick={() => onView(entry)} />
        <IconActionButton variant="edit" onClick={() => onEdit(entry)} />
        <IconActionButton variant="delete" onClick={() => onDelete(entry.id)} />
      </div>

      {/* Hover Effect Border */}
      <div
        className={`absolute top-0 bottom-0 left-0 w-1 rounded-l-lg bg-linear-to-b from-blue-500 to-purple-500 transition-opacity duration-200 ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
