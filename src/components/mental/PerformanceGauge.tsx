"use client";

import { useEffect, useState } from "react";
import { getZoneAverage, getZoneStats } from "@/services/core/mental";

interface PerformanceGaugeProps {
  refreshTrigger?: number; // Increment to force refresh
}

export function PerformanceGauge({ refreshTrigger }: PerformanceGaugeProps) {
  const [position, setPosition] = useState(0); // -1 to 1
  const [stats, setStats] = useState({ aGame: 0, bGame: 0, cGame: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [avg, zoneStats] = await Promise.all([getZoneAverage(5), getZoneStats(30)]);
        setPosition(avg);
        setStats(zoneStats);
      } catch (error) {
        console.error("Error loading gauge data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [refreshTrigger]);

  // Convert position (-1 to 1) to x coordinate on curve (50 to 350)
  const pointerX = 200 + position * 150;

  // Calculate y position on bell curve
  const getYOnCurve = (x: number) => {
    const normalizedX = (x - 200) / 100;
    const y = Math.exp(-0.5 * normalizedX * normalizedX) * 120;
    return 180 - y;
  };

  const pointerY = getYOnCurve(pointerX);

  const total = stats.aGame + stats.bGame + stats.cGame;
  const percentA = total > 0 ? Math.round((stats.aGame / total) * 100) : 0;
  const percentB = total > 0 ? Math.round((stats.bGame / total) * 100) : 0;
  const percentC = total > 0 ? Math.round((stats.cGame / total) * 100) : 0;

  return (
    <div className="relative">
      {/* SVG Bell Curve */}
      <svg viewBox="0 0 400 220" className="h-auto w-full" style={{ maxHeight: "180px" }}>
        <defs>
          {/* Gradient for C-Game zone (left - Burnout/Tilt) */}
          <linearGradient id="cGameGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.4" />
          </linearGradient>

          {/* Gradient for B-Game zone (middle-sides) */}
          <linearGradient id="bGameGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#00c853" stopOpacity="0.4" />
          </linearGradient>

          {/* Gradient for A-Game zone (center - Peak) */}
          <radialGradient id="aGameGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00c853" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#00c853" stopOpacity="0.3" />
          </radialGradient>

          {/* Glow filter for pointer */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background */}
        <rect x="0" y="0" width="400" height="220" fill="transparent" />

        {/* Zone labels at top */}
        <text x="70" y="25" fill="#ef4444" fontSize="11" fontWeight="bold" textAnchor="middle">
          C-GAME
        </text>
        <text x="200" y="25" fill="#00c853" fontSize="11" fontWeight="bold" textAnchor="middle">
          A-GAME
        </text>
        <text x="330" y="25" fill="#ef4444" fontSize="11" fontWeight="bold" textAnchor="middle">
          C-GAME
        </text>

        {/* C-Game Left Zone (Burnout) */}
        <path
          d="M 50 180 Q 80 180 100 150 Q 120 100 140 70 L 140 180 Z"
          fill="url(#cGameGradient)"
          opacity="0.6"
        />

        {/* B-Game Left Transition */}
        <path d="M 140 180 L 140 70 Q 155 50 170 45 L 170 180 Z" fill="#f97316" opacity="0.3" />

        {/* A-Game Center (Peak Performance) */}
        <ellipse cx="200" cy="60" rx="40" ry="25" fill="url(#aGameGradient)" />
        <path
          d="M 170 180 L 170 45 Q 185 35 200 32 Q 215 35 230 45 L 230 180 Z"
          fill="#00c853"
          opacity="0.4"
        />

        {/* B-Game Right Transition */}
        <path d="M 230 180 L 230 45 Q 245 50 260 70 L 260 180 Z" fill="#f97316" opacity="0.3" />

        {/* C-Game Right Zone (Tilt) */}
        <path
          d="M 260 180 L 260 70 Q 280 100 300 150 Q 320 180 350 180 Z"
          fill="url(#cGameGradient)"
          opacity="0.6"
        />

        {/* Bell Curve Outline */}
        <path
          d="M 50 180 Q 80 180 100 150 Q 130 80 160 50 Q 180 38 200 35 Q 220 38 240 50 Q 270 80 300 150 Q 320 180 350 180"
          fill="none"
          stroke="#6b7280"
          strokeWidth="2"
          opacity="0.5"
        />

        {/* Baseline */}
        <line x1="40" y1="180" x2="360" y2="180" stroke="#374151" strokeWidth="1" />

        {/* Zone tick marks */}
        <line x1="140" y1="175" x2="140" y2="185" stroke="#6b7280" strokeWidth="1" />
        <line x1="200" y1="175" x2="200" y2="185" stroke="#00c853" strokeWidth="2" />
        <line x1="260" y1="175" x2="260" y2="185" stroke="#6b7280" strokeWidth="1" />

        {/* Pointer (triangle) */}
        {!isLoading && (
          <g filter="url(#glow)">
            <polygon
              points={`${pointerX},${pointerY - 8} ${pointerX - 8},${pointerY + 8} ${pointerX + 8},${pointerY + 8}`}
              fill={position > 0.3 ? "#00c853" : position < -0.3 ? "#ef4444" : "#f97316"}
              stroke="white"
              strokeWidth="1"
              className="transition-all duration-500"
            />
            {/* Pointer line to base */}
            <line
              x1={pointerX}
              y1={pointerY + 8}
              x2={pointerX}
              y2="180"
              stroke={position > 0.3 ? "#00c853" : position < -0.3 ? "#ef4444" : "#f97316"}
              strokeWidth="2"
              strokeDasharray="4 2"
              opacity="0.5"
            />
          </g>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <text x="200" y="100" fill="#6b7280" fontSize="12" textAnchor="middle">
            Carregando...
          </text>
        )}
      </svg>

      {/* Stats Row */}
      <div className="mt-3 flex justify-around text-xs">
        <div className="text-center">
          <div className="font-bold text-red-400">{percentC}%</div>
          <div className="text-gray-500">C-Game</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-orange-400">{percentB}%</div>
          <div className="text-gray-500">B-Game</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-green-400">{percentA}%</div>
          <div className="text-gray-500">A-Game</div>
        </div>
      </div>
    </div>
  );
}
