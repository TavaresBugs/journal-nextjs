import { DailyRoutine } from './index';

export type HabitKey = keyof Omit<
  DailyRoutine,
  "id" | "accountId" | "date" | "createdAt" | "updatedAt"
>;

export type TradeOutcome = "win" | "loss" | "breakeven" | "pending";

export type TimeframeKey = "daily" | "h4" | "h1" | "m30" | "m15" | "m5";
