/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { render, screen, fireEvent } from "@testing-library/react";

import { describe, it, expect, vi } from "vitest";
import { TradeLinker } from "@/components/journal/form/TradeLinker";

// Mock dependent components
vi.mock("@/components/ui", () => ({
  GlassCard: ({ children, className }: any) => (
    <div className={className} data-testid="glass-card">
      {children}
    </div>
  ),
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick} data-testid="add-trade-btn">
      {children}
    </button>
  ),
}));

vi.mock("@/lib/calculations", () => ({
  formatCurrency: (val: number) => `$${val}`,
}));

describe("TradeLinker", () => {
  const mockTrades: any[] = [
    {
      id: "1",
      symbol: "EURUSD",
      entryDate: "2023-01-01",
      entryTime: "10:00",
      type: "Long",
      pnl: 100,
      entryPrice: 1.05,
      exitPrice: 1.06,
      accountId: "acc1",
    },
    {
      id: "2",
      symbol: "BTCUSD",
      entryDate: "2023-01-01",
      entryTime: "11:00",
      type: "Short",
      pnl: -50,
      entryPrice: 50000,
      exitPrice: 50100,
      ticket: "124",
      accountId: "acc1",
    },
  ];

  const defaultProps = {
    trades: [],
    onLinkTradeOpen: vi.fn(),
    onRemoveTrade: vi.fn(),
  };

  it("renders empty state correctly", () => {
    // @ts-ignore
    render(<TradeLinker {...defaultProps} />);
    expect(screen.getByText("Nenhum trade vinculado a esta entrada.")).toBeInTheDocument();
    expect(screen.queryByText("EURUSD")).not.toBeInTheDocument();
  });

  it("renders list of trades correctly", () => {
    // @ts-ignore
    render(<TradeLinker {...defaultProps} trades={mockTrades} />);
    expect(screen.getByText("EURUSD")).toBeInTheDocument();
    expect(screen.getByText("BTCUSD")).toBeInTheDocument();
    expect(screen.getByText("$100")).toBeInTheDocument();
    expect(screen.getByText("$-50")).toBeInTheDocument();
  });

  it("calls onLinkTradeOpen when add button is clicked", () => {
    // @ts-ignore
    render(<TradeLinker {...defaultProps} />);
    fireEvent.click(screen.getByTestId("add-trade-btn"));
    expect(defaultProps.onLinkTradeOpen).toHaveBeenCalled();
  });

  it("calls onRemoveTrade when remove button is clicked", () => {
    // @ts-ignore
    render(<TradeLinker {...defaultProps} trades={mockTrades} />);
    // Select all remove buttons (assuming one per trade)
    // Since we mocked Button as the "add trade" button too, we need to be careful.
    // In our mock, Button is generic.
    // The component renders one "Adicionar Trade" button at the top, and one remove button per trade.
    // Let's rely on the svg presence or specific class if our mock preserved it, but our mock is simple.

    // Actually, let's improve the Mock Button to distinguish or just find all buttons.
    // The "Adicionar Trade" is the first one. The remove buttons follow.

    const buttons = screen.getAllByTestId("add-trade-btn"); // Our mock sets this testid for all Buttons

    // buttons[0] is Add Trade
    // buttons[1] is Remove Trade 1
    // buttons[2] is Remove Trade 2

    fireEvent.click(buttons[1]);
    expect(defaultProps.onRemoveTrade).toHaveBeenCalledWith("1");

    fireEvent.click(buttons[2]);
    expect(defaultProps.onRemoveTrade).toHaveBeenCalledWith("2");
  });
});
