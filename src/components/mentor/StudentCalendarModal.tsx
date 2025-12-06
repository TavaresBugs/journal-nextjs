"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { TradeCalendar } from "@/components/trades/TradeCalendar";
import { getMenteeTrades } from "@/services/mentor/inviteService";
import { Trade } from "@/types";

interface StudentCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  menteeId: string;
  menteeName: string;
}

export function StudentCalendarModal({
  isOpen,
  onClose,
  menteeId,
  menteeName,
}: StudentCalendarModalProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && menteeId) {
      const fetchTrades = async () => {
        setLoading(true);
        try {
          const data = await getMenteeTrades(menteeId);
          setTrades(data);
        } catch (error) {
          console.error("Error fetching mentee trades:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchTrades();
    }
  }, [isOpen, menteeId]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="6xl"
      title={`Calendário de ${menteeName}`}
    >
      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
          </div>
        ) : (
          <TradeCalendar
            trades={trades}
            entries={[]}
            // onDayClick is optional in TradeCalendar, we can skip it or add functionality later
          />
        )}
      </div>
    </Modal>
  );
}
