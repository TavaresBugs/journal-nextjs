"use client";

import { useState } from "react";
import { ChecklistModal } from "./ChecklistModal";

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
        className="bg-zorin-accent hover:bg-zorin-accent/90 shadow-zorin-accent/30 hover:shadow-zorin-accent/50 group fixed right-6 bottom-6 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-all duration-300 hover:scale-110"
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
          className="transition-transform group-hover:scale-110"
        >
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>

        {/* Pulse animation ring */}
        <span className="bg-zorin-accent absolute inset-0 animate-ping rounded-full opacity-20" />
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
