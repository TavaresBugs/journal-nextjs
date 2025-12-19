import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SelectValueWithIcon } from "../shared/SelectValueWithIcon";

describe("SelectValueWithIcon", () => {
  describe("Rendering", () => {
    it("should render icon and label", () => {
      render(<SelectValueWithIcon icon="📈" label="Long" />);

      expect(screen.getByText("📈")).toBeInTheDocument();
      expect(screen.getByText("Long")).toBeInTheDocument();
    });

    it("should render with emoji icons", () => {
      render(<SelectValueWithIcon icon="🎯" label="Target" />);

      expect(screen.getByText("🎯")).toBeInTheDocument();
      expect(screen.getByText("Target")).toBeInTheDocument();
    });

    it("should render with text icons", () => {
      render(<SelectValueWithIcon icon="★" label="Star" />);

      expect(screen.getByText("★")).toBeInTheDocument();
      expect(screen.getByText("Star")).toBeInTheDocument();
    });

    it("should handle empty icon", () => {
      render(<SelectValueWithIcon icon="" label="No Icon" />);

      expect(screen.getByText("No Icon")).toBeInTheDocument();
    });

    it("should handle empty label", () => {
      render(<SelectValueWithIcon icon="⚡" label="" />);

      expect(screen.getByText("⚡")).toBeInTheDocument();
    });

    it("should handle long labels", () => {
      const longLabel = "This is a very long label that should still render correctly";
      render(<SelectValueWithIcon icon="📊" label={longLabel} />);

      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });
  });

  describe("Structure", () => {
    it("should render icon and label in flex container", () => {
      const { container } = render(<SelectValueWithIcon icon="📈" label="Long" />);

      const flexContainer = container.querySelector(".flex");
      expect(flexContainer).toBeInTheDocument();
    });

    it("should have shrink-0 class on icon wrapper", () => {
      const { container } = render(<SelectValueWithIcon icon="📈" label="Long" />);

      const iconSpan = container.querySelector(".shrink-0");
      expect(iconSpan).toBeInTheDocument();
    });
  });
});
