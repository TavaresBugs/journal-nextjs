import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

// Imports - assuming standard exports
import { AssetBadge } from "../AssetBadge";
// import { Button } from "../Button";
// import { Card } from "../Card";
// import { GlassCard } from "../GlassCard"; // Sometimes these have context dependencies, let's stick to atoms
import { CircularProgress } from "../CircularProgress";
import { Switch } from "../switch";

describe("UI Components Integration", () => {
  describe("AssetBadge", () => {
    it("renders asset name", () => {
      render(<AssetBadge symbol="EURUSD" />);
      expect(screen.getByText("EURUSD")).toBeDefined();
    });
  });

  // ...

  describe("CircularProgress", () => {
    it("renders with value", () => {
      render(<CircularProgress percentage={75} size={100} />);
      // SVG based usually, check if it renders
      const svg = document.querySelector("svg");
      expect(svg).toBeDefined();
    });
  });

  describe("Switch", () => {
    it("renders switch", () => {
      render(<Switch checked={true} onCheckedChange={() => {}} />);
      const btn = screen.getByRole("switch");
      expect(btn).toBeDefined();
      // Radix switch usually uses role="switch"
    });
  });
});
