"use client";

import React from "react";
import { cn } from "@/lib/utils/general";

interface Tab {
  id: string;
  label: string;
  icon?: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-900/80 p-1 shadow-lg backdrop-blur-md">
      <nav className="grid grid-cols-2 gap-2 md:flex md:gap-1" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "flex-1 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap md:px-6",
                "flex items-center justify-center transition-all duration-300 ease-out",
                isActive
                  ? "border-cyan-500/50 bg-linear-to-r from-cyan-500/20 to-cyan-400/10 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                  : "bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-gray-200 md:bg-transparent"
              )}
            >
              <span className="flex items-center justify-center gap-2">
                {tab.icon && <span className="text-lg">{tab.icon}</span>}
                <span className={isActive ? "font-semibold" : ""}>{tab.label}</span>
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

interface TabPanelProps {
  children: React.ReactNode;
  value: string;
  activeTab: string;
}

export function TabPanel({ children, value, activeTab }: TabPanelProps) {
  if (value !== activeTab) return null;

  return <div className="mt-6">{children}</div>;
}
