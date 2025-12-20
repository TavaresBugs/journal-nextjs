import { createMockTrade } from "../utils/factories";

export const mockTrades = {
  standard: createMockTrade(),
  winner: createMockTrade({ pnl: 100, outcome: "win" }),
  loser: createMockTrade({ pnl: -50, outcome: "loss" }),
  breakeven: createMockTrade({ pnl: 0, outcome: "breakeven" }),
  open: createMockTrade({ exitPrice: undefined, exitDate: undefined }),
};

export const mockTradeList = [mockTrades.winner, mockTrades.loser, mockTrades.breakeven];
