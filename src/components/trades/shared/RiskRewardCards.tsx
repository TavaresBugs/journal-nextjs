"use client";

import React from "react";
import { FormRow } from "@/components/ui";

interface RiskRewardCardsProps {
  risk: number;
  reward: number;
}

export const RiskRewardCards = React.memo(function RiskRewardCards({
  risk,
  reward,
}: RiskRewardCardsProps) {
  return (
    <FormRow cols={2} className="pt-2">
      {/* Risk Card */}
      <div className="relative overflow-hidden rounded-xl border border-red-500/40 bg-linear-to-b from-red-500/20 to-transparent p-4 text-center shadow-[0_0_20px_rgba(239,68,68,0.15)]">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.08]">
          <svg className="h-16 w-16 text-red-400" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M16 18l2-2-6-6-6 6 2 2 4-4 4 4zm0-8l2-2-6-6-6 6 2 2 4-4 4 4z"
              transform="rotate(180 12 12)"
            />
          </svg>
        </div>
        <div className="relative z-10">
          <div className="mb-1 text-xs font-medium tracking-wider text-red-400/80 uppercase">
            Risco
          </div>
          <div className="font-mono text-2xl font-bold text-red-400 drop-shadow-md">
            $ {risk.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Reward Card */}
      <div className="from-zorin-accent/20 border-zorin-accent/40 relative overflow-hidden rounded-xl border bg-linear-to-b to-transparent p-4 text-center shadow-[0_0_20px_rgba(0,200,83,0.15)]">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.08]">
          <svg className="text-zorin-accent h-16 w-16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 18l2-2-6-6-6 6 2 2 4-4 4 4zm0-8l2-2-6-6-6 6 2 2 4-4 4 4z" />
          </svg>
        </div>
        <div className="relative z-10">
          <div className="text-zorin-accent/80 mb-1 text-xs font-medium tracking-wider uppercase">
            Retorno
          </div>
          <div className="text-zorin-accent font-mono text-2xl font-bold drop-shadow-md">
            $ {reward.toFixed(2)}
          </div>
        </div>
      </div>
    </FormRow>
  );
});
