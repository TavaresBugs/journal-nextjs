/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { render, screen, fireEvent } from "@testing-library/react";

import { describe, it, expect, vi } from "vitest";
import { LinkTradeModal } from "@/components/journal/form/LinkTradeModal";

// Mock dependent components and createPortal
vi.mock("react-dom", () => ({
  createPortal: (node: any) => node,
}));

vi.mock("@/components/ui", () => ({
  GlassCard: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/lib/calculations", () => ({
  formatCurrency: (val: number) => `$${val}`,
}));

describe("LinkTradeModal", () => {
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
      status: "Closed",
      quantity: 1,
      ticket: "123",
      accountId: "acc1",
    },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    availableTrades: mockTrades,
    onSelectTrade: vi.fn(),
  };

  it("renders when open", () => {
    // @ts-ignore
    render(<LinkTradeModal {...defaultProps} />);
    expect(screen.getByText("🔗 Vincular Trade")).toBeInTheDocument();
    expect(screen.getByText("EURUSD")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    // @ts-ignore
    render(<LinkTradeModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText("🔗 Vincular Trade")).not.toBeInTheDocument();
  });

  it("calls onSelectTrade when a trade is clicked", () => {
    // @ts-ignore
    render(<LinkTradeModal {...defaultProps} />);
    // The button wraps the trade info.
    const tradeButton = screen.getByText("EURUSD").closest("button");
    fireEvent.click(tradeButton!);
    expect(defaultProps.onSelectTrade).toHaveBeenCalledWith(mockTrades[0]);
  });

  it("calls onClose when close button is clicked", () => {
    // @ts-ignore
    render(<LinkTradeModal {...defaultProps} />);
    // The close button has an SVG. Let's find by the SVG inside it or just the button element.
    // The component has a dedicated close button with an SVG.
    // Assuming it's the first button in the header.
    const closeButton = screen.getAllByRole("button")[0];
    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("renders empty message when no trades available", () => {
    // @ts-ignore
    render(<LinkTradeModal {...defaultProps} availableTrades={[]} />);
    expect(screen.getByText("Nenhum trade encontrado")).toBeInTheDocument();
  });
});
