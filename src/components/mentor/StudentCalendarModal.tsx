"use client";

import { useEffect, useState } from "react";
import {
  Modal,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui";
import { TradeCalendar } from "@/components/trades/TradeCalendar";
import { MenteeDayDetailModal } from "@/components/mentor/MenteeDayDetailModal";
import {
  getMenteeTradesAction as getMenteeTrades,
  getMenteePermittedAccountsAction as getMenteePermittedAccounts,
} from "@/app/actions/mentor";
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
  }, [isOpen, menteeId, selectedAccountId]);

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
          <div className="flex w-full flex-col items-center justify-between pr-8 md:flex-row">
            <span>📊 Calendário de {menteeName}</span>

            {/* Account Selector */}
            {accounts.length > 0 && (
              <div className="mt-2 flex items-center gap-2 md:mt-0">
                <span className="text-sm font-normal text-gray-400">Carteira:</span>
                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                  <SelectTrigger className="flex h-9 min-w-[200px] items-center justify-between rounded-lg border border-gray-700 bg-gray-800 px-3 text-sm text-gray-200 focus:border-cyan-500 focus:ring-cyan-500">
                    <SelectValue placeholder="Todas (se permitido)" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-700 bg-gray-800">
                    <SelectItem
                      value=""
                      className="cursor-pointer py-2 text-gray-200 hover:bg-gray-700 focus:bg-gray-700"
                    >
                      Todas (se permitido)
                    </SelectItem>
                    {accounts.map((acc) => (
                      <SelectItem
                        key={acc.id}
                        value={acc.id}
                        className="cursor-pointer py-2 text-gray-200 hover:bg-gray-700 focus:bg-gray-700"
                      >
                        {acc.name} ({acc.currency})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        }
      >
        <div>
          {loading ? (
            <div className="flex h-[400px] items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-cyan-500"></div>
            </div>
          ) : (
            <div>
              {/* Instruction */}
              <p className="mb-4 text-center text-sm text-gray-400">
                Clique em um dia para ver os detalhes dos trades
                {selectedAccountId && " desta carteira"}
              </p>

              {/* Calendar */}
              <TradeCalendar trades={trades} entries={[]} onDayClick={handleDayClick} />
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
