import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RiskRewardCards } from "../shared/RiskRewardCards";

describe("RiskRewardCards", () => {
  describe("Rendering", () => {
    it("should render risk and reward cards", () => {
      render(<RiskRewardCards risk={100} reward={200} />);

      expect(screen.getByText("Risco")).toBeInTheDocument();
      expect(screen.getByText("Retorno")).toBeInTheDocument();
    });

    it("should display formatted risk value", () => {
      render(<RiskRewardCards risk={150.5} reward={0} />);

      expect(screen.getByText("$ 150.50")).toBeInTheDocument();
    });

    it("should display formatted reward value", () => {
      render(<RiskRewardCards risk={0} reward={300.75} />);

      expect(screen.getByText("$ 300.75")).toBeInTheDocument();
    });

    it("should handle zero values", () => {
      render(<RiskRewardCards risk={0} reward={0} />);

      const zeroValues = screen.getAllByText(/0\.00/);
      expect(zeroValues).toHaveLength(2);
    });

    it("should handle small decimal values", () => {
      render(<RiskRewardCards risk={0.01} reward={0.99} />);

      expect(screen.getByText("$ 0.01")).toBeInTheDocument();
      expect(screen.getByText("$ 0.99")).toBeInTheDocument();
    });

    it("should handle large values", () => {
      render(<RiskRewardCards risk={10000} reward={50000} />);

      expect(screen.getByText("$ 10000.00")).toBeInTheDocument();
      expect(screen.getByText("$ 50000.00")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should have risk card with red styling", () => {
      const { container } = render(<RiskRewardCards risk={100} reward={200} />);

      const riskCard = container.querySelector(".border-red-500\\/40");
      expect(riskCard).toBeInTheDocument();
    });

    it("should have reward card with accent styling", () => {
      const { container } = render(<RiskRewardCards risk={100} reward={200} />);

      const rewardCard = container.querySelector(".border-zorin-accent\\/40");
      expect(rewardCard).toBeInTheDocument();
    });
  });
});
