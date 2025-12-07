"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { TradeCalendar } from "@/components/trades/TradeCalendar";
import { MenteeDayDetailModal } from "@/components/mentor/MenteeDayDetailModal";
import { getMenteeTrades, getMenteePermittedAccounts } from "@/services/mentor/inviteService";
import { Trade } from "@/types";

interface StudentCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  menteeId: string;
  menteeName: string;
}

interface AccountOption {
  id: string;
  name: string;
  currency: string;
}

export function StudentCalendarModal({
  isOpen,
  onClose,
  menteeId,
  menteeName,
}: StudentCalendarModalProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  
  // Day detail modal state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTrades, setSelectedTrades] = useState<Trade[]>([]);
  const [isDayDetailOpen, setIsDayDetailOpen] = useState(false);

  // Fetch permitted accounts on open
  useEffect(() => {
    if (isOpen && menteeId) {
      const fetchAccounts = async () => {
        try {
          const accs = await getMenteePermittedAccounts(menteeId);
          setAccounts(accs);
          // Auto-select first account if available and none selected
          if (accs.length > 0 && !selectedAccountId) {
            setSelectedAccountId(accs[0].id);
          }
        } catch (error) {
          console.error("Error fetching accounts:", error);
        }
      };
      fetchAccounts();
    }
  }, [isOpen, menteeId]);

  // Fetch trades when account changes or modal opens
  useEffect(() => {
    if (isOpen && menteeId) {
      const fetchTrades = async () => {
        setLoading(true);
        try {
          // Pass selectedAccountId to filter trades. 
          // If empty, it might fetch all or none depending on backend logic, 
          // but our service is flexible.
          const data = await getMenteeTrades(menteeId, selectedAccountId || undefined);
          setTrades(data);
        } catch (error) {
          console.error("Error fetching mentee trades:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchTrades();
    }
  }, [isOpen, menteeId, selectedAccountId]);

  const handleDayClick = (date: string, dayTrades: Trade[]) => {
    setSelectedDate(date);
    setSelectedTrades(dayTrades);
    setIsDayDetailOpen(true);
  };

  const handleCloseDayDetail = () => {
    setIsDayDetailOpen(false);
    setSelectedDate(null);
    setSelectedTrades([]);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="7xl"
        title={
          <div className="flex flex-col md:flex-row items-center justify-between w-full pr-8">
            <span>📊 Calendário de {menteeName}</span>
            
            {/* Account Selector */}
            {accounts.length > 0 && (
              <div className="mt-2 md:mt-0 flex items-center gap-2">
                <span className="text-sm text-gray-400 font-normal">Carteira:</span>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2"
                >
                  <option value="">Todas (se permitido)</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.currency})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        }
      >
        <div>
          {loading ? (
            <div className="flex items-center justify-center h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
            </div>
          ) : (
            <div>
              {/* Instruction */}
              <p className="text-gray-400 text-sm mb-4 text-center">
                Clique em um dia para ver os detalhes dos trades
                {selectedAccountId && " desta carteira"}
              </p>
              
              {/* Calendar */}
              <TradeCalendar
                trades={trades}
                entries={[]}
                onDayClick={handleDayClick}
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Day Detail Modal */}
      {selectedDate && (
        <MenteeDayDetailModal
          isOpen={isDayDetailOpen}
          onClose={handleCloseDayDetail}
          date={selectedDate}
          trades={selectedTrades}
          menteeName={menteeName}
          menteeId={menteeId}
          accountId={selectedAccountId || undefined}
        />
      )}
    </>
  );
}
