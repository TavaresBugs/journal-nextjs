import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TradeResultBadge } from "../shared/TradeResultBadge";

describe("TradeResultBadge", () => {
  const defaultProps = {
    entryPrice: "100",
    exitPrice: "110",
    type: "Long" as const,
    lot: "1",
    symbol: "EURUSD",
    commission: "0",
    swap: "0",
    rMultiplePreview: null,
  };

  describe("Win/Loss/BE Detection", () => {
    it("should display WIN for profitable Long trade", () => {
      render(<TradeResultBadge {...defaultProps} entryPrice="100" exitPrice="110" type="Long" />);

      expect(screen.getByText("WIN")).toBeInTheDocument();
    });

    it("should display LOSS for losing Long trade", () => {
      render(<TradeResultBadge {...defaultProps} entryPrice="110" exitPrice="100" type="Long" />);

      expect(screen.getByText("LOSS")).toBeInTheDocument();
    });

    it("should display WIN for profitable Short trade", () => {
      render(<TradeResultBadge {...defaultProps} entryPrice="110" exitPrice="100" type="Short" />);

      expect(screen.getByText("WIN")).toBeInTheDocument();
    });

    it("should display LOSS for losing Short trade", () => {
      render(<TradeResultBadge {...defaultProps} entryPrice="100" exitPrice="110" type="Short" />);

      expect(screen.getByText("LOSS")).toBeInTheDocument();
    });

    it("should display BE (breakeven) when entry equals exit", () => {
      render(<TradeResultBadge {...defaultProps} entryPrice="100" exitPrice="100" />);

      expect(screen.getByText("BE")).toBeInTheDocument();
    });
  });

  describe("R Multiple Display", () => {
    it("should display R multiple when provided", () => {
      render(<TradeResultBadge {...defaultProps} rMultiplePreview={2.5} />);

      expect(screen.getByText("+2.50R")).toBeInTheDocument();
    });

    it("should display negative R multiple", () => {
      render(
        <TradeResultBadge
          {...defaultProps}
          entryPrice="110"
          exitPrice="100"
          rMultiplePreview={-1}
        />
      );

      expect(screen.getByText("-1.00R")).toBeInTheDocument();
    });

    it("should not display R multiple when null", () => {
      render(<TradeResultBadge {...defaultProps} rMultiplePreview={null} />);

      expect(screen.queryByText(/R$/)).not.toBeInTheDocument();
    });
  });

  describe("Commission and Swap Impact", () => {
    it("should account for commission in result", () => {
      // Entry 100, Exit 110, Lot 1 = +10 profit
      // Commission 5 = net +5 (still WIN)
      render(<TradeResultBadge {...defaultProps} commission="5" />);

      expect(screen.getByText("WIN")).toBeInTheDocument();
    });

    it("should turn WIN into LOSS with high commission", () => {
      // Entry 100, Exit 110, Lot 1, EURUSD multiplier = 10 * 100000 = 1000000 profit
      // We need a very high commission to turn this into loss
      // Let's use a simpler asset without multiplier
      render(<TradeResultBadge {...defaultProps} symbol="UNKNOWN" commission="15" />);

      // With UNKNOWN asset (multiplier 1): 10 * 1 = 10 profit, commission 15 = -5 (LOSS)
      expect(screen.getByText("LOSS")).toBeInTheDocument();
    });

    it("should account for positive swap", () => {
      // Entry 100, Exit 100 = BE
      // Swap +5 = +5 profit (WIN)
      render(<TradeResultBadge {...defaultProps} entryPrice="100" exitPrice="100" swap="5" />);

      expect(screen.getByText("WIN")).toBeInTheDocument();
    });

    it("should account for negative swap", () => {
      // Entry 100, Exit 100 = BE
      // Swap -5 = -5 loss (LOSS)
      render(<TradeResultBadge {...defaultProps} entryPrice="100" exitPrice="100" swap="-5" />);

      expect(screen.getByText("LOSS")).toBeInTheDocument();
    });
  });

  describe("Lot Size Impact", () => {
    it("should multiply PnL by lot size", () => {
      // Entry 100, Exit 110 with lot 2 = +20 profit
      render(<TradeResultBadge {...defaultProps} lot="2" />);

      expect(screen.getByText("WIN")).toBeInTheDocument();
    });

    it("should handle decimal lot sizes", () => {
      render(<TradeResultBadge {...defaultProps} lot="0.5" />);

      expect(screen.getByText("WIN")).toBeInTheDocument();
    });

    it("should default to lot 1 if empty", () => {
      render(<TradeResultBadge {...defaultProps} lot="" />);

      expect(screen.getByText("WIN")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should have green styling for WIN", () => {
      const { container } = render(<TradeResultBadge {...defaultProps} />);

      const resultBadge = container.querySelector(".text-green-400");
      expect(resultBadge).toBeInTheDocument();
    });

    it("should have red styling for LOSS", () => {
      const { container } = render(
        <TradeResultBadge {...defaultProps} entryPrice="110" exitPrice="100" />
      );

      const resultBadge = container.querySelector(".text-red-400");
      expect(resultBadge).toBeInTheDocument();
    });

    it("should have yellow styling for BE", () => {
      const { container } = render(
        <TradeResultBadge {...defaultProps} entryPrice="100" exitPrice="100" />
      );

      const resultBadge = container.querySelector(".text-yellow-400");
      expect(resultBadge).toBeInTheDocument();
    });
  });
});
