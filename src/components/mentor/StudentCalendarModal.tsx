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
import { getMenteePermittedAccountsAction as getMenteePermittedAccounts } from "@/app/actions/mentor";
import { useMenteeDataStore } from "@/store/useMenteeDataStore";
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
  // Get data and functions from store
  const {
    getMenteeCalendarData,
    loadMenteeCalendarData,
    isLoading: storeLoading,
  } = useMenteeDataStore();

  // Get cached data (will be populated by eager loading on mentor page)
  const cachedData = getMenteeCalendarData(menteeId);

  // Derive state from store
  const trades = cachedData?.trades || [];
  const journalAvailability = cachedData?.journalAvailability || {};

  // Loading state: loading if no cached data AND store is loading
  const loading = !cachedData && storeLoading;

  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  // Day detail modal state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTrades, setSelectedTrades] = useState<Trade[]>([]);
  const [isDayDetailOpen, setIsDayDetailOpen] = useState(false);

  // Fetch permitted accounts on open (still needed for account selector)
  useEffect(() => {
    if (isOpen && menteeId) {
      const fetchAccounts = async () => {
        try {
          const accs = await getMenteePermittedAccounts(menteeId);
          setAccounts(accs);
          if (accs.length > 0 && !selectedAccountId) {
            setSelectedAccountId(accs[0].id);
          }
        } catch (error) {
          console.error("Error fetching accounts:", error);
        }
      };
      fetchAccounts();
    }
  }, [isOpen, menteeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // If no cached data when modal opens, trigger load via store
  useEffect(() => {
    if (isOpen && menteeId && !cachedData) {
      console.log("[StudentCalendarModal] No cached data, loading via store...");
      loadMenteeCalendarData(menteeId);
    } else if (isOpen && cachedData) {
      console.log("[StudentCalendarModal] Using cached data - INSTANT!");
    }
  }, [isOpen, menteeId, cachedData, loadMenteeCalendarData]);

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

  // Account change handler - reload data for specific account
  const handleAccountChange = async (newAccountId: string) => {
    setSelectedAccountId(newAccountId);
    if (newAccountId && newAccountId !== "all") {
      loadMenteeCalendarData(menteeId, newAccountId);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="7xl"
        title={
          <div className="flex w-full flex-col items-center justify-between pr-8 md:flex-row">
            <span className="text-lg font-bold text-gray-100">📊 Calendário de {menteeName}</span>

            {/* Account Selector */}
            {accounts.length > 0 && (
              <div className="mt-2 flex items-center gap-2 md:mt-0">
                <span className="text-sm font-normal text-gray-400">Carteira:</span>
                <Select value={selectedAccountId} onValueChange={handleAccountChange}>
                  <SelectTrigger className="flex h-9 min-w-[200px] items-center justify-between rounded-lg border border-gray-700 bg-gray-800 px-3 text-sm text-gray-200 focus:border-cyan-500 focus:ring-cyan-500">
                    <SelectValue placeholder="Todas (se permitido)" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-700 bg-gray-800">
                    <SelectItem
                      value="all"
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

              {/* Calendar - OPTIMIZED: pass journalAvailability for instant badges */}
              <TradeCalendar
                trades={trades}
                entries={[]}
                journalAvailability={journalAvailability}
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
