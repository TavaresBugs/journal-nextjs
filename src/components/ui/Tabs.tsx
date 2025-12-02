'use client';

import React from 'react';

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
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-2 border border-gray-700/50">
            <nav className="flex gap-1" aria-label="Tabs">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onChange(tab.id)}
                            className={`
                                flex-1 px-6 py-3 font-medium text-sm rounded-lg
                                transition-all duration-300 ease-out
                                ${isActive
                                    ? 'bg-linear-to-r from-cyan-500/20 to-cyan-400/10 text-cyan-400 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                                }
                            `}
                        >
                            <span className="flex items-center justify-center gap-2">
                                {tab.icon && <span className="text-lg">{tab.icon}</span>}
                                <span className={isActive ? 'font-semibold' : ''}>{tab.label}</span>
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

    return (
        <div className="mt-6">
            {children}
        </div>
    );
}
