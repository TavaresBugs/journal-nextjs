'use client';

import { useState } from 'react';
import { ChecklistModal } from './ChecklistModal';

interface ChecklistFabProps {
    onTradeStart?: () => void;
}

export function ChecklistFab({ onTradeStart }: ChecklistFabProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 flex items-center justify-center group hover:scale-110"
                title="Pre-Flight Checklist"
            >
                {/* Checklist Icon */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="group-hover:scale-110 transition-transform"
                >
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>

                {/* Pulse animation ring */}
                <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-20" />
            </button>

            {/* Modal */}
            <ChecklistModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onTradeStart={onTradeStart}
            />
        </>
    );
}
