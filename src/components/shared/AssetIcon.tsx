"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/general";
import { getAssetIconConfig } from "@/constants/assetIcons";

// ============================================
// TYPES
// ============================================

interface AssetIconProps {
  /** Asset symbol (e.g., "EURUSD", "ES", "BTCUSD") */
  symbol: string;
  /** Icon size */
  size?: "sm" | "md" | "lg" | "xl";
  /** Additional CSS classes */
  className?: string;
  /** Show outer border (only for single icons) */
  showBorder?: boolean;
}

// Size configurations
const SIZE_MAP = {
  sm: { container: 28, icon: 20 }, // 28px container, 20px icons (70%)
  md: { container: 38, icon: 26 }, // 38px container, 26px icons
  lg: { container: 48, icon: 34 }, // 48px container, 34px icons
  xl: { container: 58, icon: 40 }, // 58px container, 40px icons
};

const FALLBACK_ICON = "/assets/icons/fallback.svg";

// ============================================
// COMPONENT
// ============================================

/**
 * AssetIcon - Displays trading asset icons (TradingView style)
 *
 * Features:
 * - Forex pairs: Diagonal layout with white ring on front flag
 * - Flag 1: Top-left (behind)
 * - Flag 2: Bottom-right with white border (in front)
 */
export function AssetIcon({ symbol, size = "md", className, showBorder = false }: AssetIconProps) {
  const iconConfig = useMemo(() => getAssetIconConfig(symbol), [symbol]);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  const isPair = iconConfig.icons.length === 2;
  const sizeConfig = SIZE_MAP[size];

  const handleImageError = (index: number) => {
    setFailedImages((prev) => new Set(prev).add(index));
  };

  const getImageSrc = (index: number) => {
    return failedImages.has(index) ? FALLBACK_ICON : iconConfig.icons[index];
  };

  // ===== FOREX PAIR: Diagonal layout (TradingView style) =====
  if (isPair) {
    return (
      <div
        className={cn("relative", className)}
        style={{
          width: sizeConfig.container,
          height: sizeConfig.container,
        }}
      >
        {/* Flag 1 (back) - TOP RIGHT */}
        <div
          className="absolute top-0 right-0 overflow-hidden rounded-full"
          style={{
            width: sizeConfig.icon,
            height: sizeConfig.icon,
            zIndex: 10,
          }}
        >
          <Image
            src={getImageSrc(1)}
            alt={symbol.substring(3, 6)}
            fill
            className="object-cover"
            onError={() => handleImageError(1)}
            unoptimized
          />
        </div>

        {/* Flag 2 (front) - BOTTOM LEFT with background-colored ring */}
        <div
          className="absolute bottom-0 left-0 overflow-hidden rounded-full ring-[2px] ring-slate-800"
          style={{
            width: sizeConfig.icon,
            height: sizeConfig.icon,
            zIndex: 20,
          }}
        >
          <Image
            src={getImageSrc(0)}
            alt={symbol.substring(0, 3)}
            fill
            className="object-cover"
            onError={() => handleImageError(0)}
            unoptimized
          />
        </div>
      </div>
    );
  }

  // ===== SINGLE ICON: 1 circular icon (90% of container) =====
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-full",
        showBorder && "ring-2 ring-white/20",
        className
      )}
      style={{
        width: sizeConfig.container,
        height: sizeConfig.container,
      }}
    >
      {/* Inner wrapper at 90% for balanced visual */}
      <div
        className="relative overflow-hidden rounded-full"
        style={{
          width: sizeConfig.icon * 1.15,
          height: sizeConfig.icon * 1.15,
        }}
      >
        <Image
          src={getImageSrc(0)}
          alt={symbol}
          fill
          className="object-cover"
          onError={() => handleImageError(0)}
          unoptimized
        />
      </div>
    </div>
  );
}
