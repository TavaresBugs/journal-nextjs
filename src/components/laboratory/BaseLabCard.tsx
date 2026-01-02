"use client";

import React from "react";
import { GlassCard, IconActionButton } from "@/components/ui";

interface BadgeConfig {
  label: string;
  color: string;
  bgColor: string;
  emoji?: string;
}

export interface ActionConfig {
  variant:
    | "edit"
    | "delete"
    | "promote"
    | "view"
    | "share"
    | "back"
    | "next"
    | "close"
    | "comments"
    | "journal"
    | "add"
    | "star"
    | "refresh";
  onClick: () => void;
  title?: string;
}

export interface BaseLabCardProps {
  title: string;
  thumbnail?: string;
  badges?: BadgeConfig[];
  date?: string;
  imageCount?: number;
  actions?: ActionConfig[];
  onClick?: () => void;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const datePart = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const [year, month, day] = datePart.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function BaseLabCard({
  title,
  thumbnail,
  badges = [],
  date,
  imageCount,
  actions = [],
  onClick,
  children,
  footer,
}: BaseLabCardProps) {
  return (
    <GlassCard
      className="group cursor-pointer transition-all duration-300 hover:border-cyan-500/50"
      onClick={onClick}
    >
      {/* Thumbnail */}
      {thumbnail && (
        <div className="relative -mx-4 -mt-4 mb-4 h-32 overflow-hidden rounded-t-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnail}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-t from-gray-900/80 to-transparent" />
        </div>
      )}

      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 flex-1 text-lg font-semibold text-white">{title}</h3>
        {badges.length > 0 && (
          <div className="flex items-center gap-1.5">
            {badges.map((badge, i) => (
              <span
                key={i}
                className={`rounded-full px-2 py-1 text-xs font-medium ${badge.bgColor} ${badge.color} flex items-center gap-1 whitespace-nowrap`}
              >
                {badge.emoji && <span>{badge.emoji}</span>}
                <span>{badge.label}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Custom Content */}
      {children}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-700/50 pt-3">
        <div className="flex items-center gap-3">
          {date && <span className="text-xs text-gray-500">{formatDate(date)}</span>}
          {imageCount !== undefined && imageCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {imageCount} imagem(ns)
            </span>
          )}
        </div>

        {(actions.length > 0 || footer) && (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {footer}
            {actions.map((action, i) => (
              <IconActionButton
                key={i}
                variant={action.variant}
                onClick={action.onClick}
                title={action.title}
              />
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
