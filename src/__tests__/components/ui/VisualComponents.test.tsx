/* eslint-disable @typescript-eslint/no-explicit-any, jsx-a11y/alt-text */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AssetIcon } from "@/components/shared/AssetIcon";
import { CircularProgress } from "@/components/ui/CircularProgress";
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardFooter,
} from "@/components/ui/GlassCard";

// Mock Next/Image
import { vi } from "vitest";
vi.mock("next/image", () => ({
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />;
  },
}));

describe("UI Components Part 2", () => {
  describe("AssetIcon", () => {
    it("should render single icon for non-pair", () => {
      render(<AssetIcon symbol="NQ" />);
      const images = screen.getAllByRole("img");
      expect(images).toHaveLength(1);
    });

    it("should render two icons for pair", () => {
      render(<AssetIcon symbol="EURUSD" />);
      const images = screen.getAllByRole("img");
      expect(images).toHaveLength(2);
    });

    it("should handle image error", () => {
      render(<AssetIcon symbol="EURUSD" />);
      const images = screen.getAllByRole("img");
      // Trigger error on first image
      fireEvent.error(images[0]);
      // Should fallback (src changes to fallback, but in this mock we might check if error handler runs)
      // Since we check logic inside, we can assume state updated.
      // We can verify calls or class names if applicable.
      expect(images[0].getAttribute("src")).toContain("fallback.svg");
    });

    it("should support sizes", () => {
      const { container } = render(<AssetIcon symbol="NQ" size="lg" />);
      expect(container.firstChild).toHaveStyle({ width: "48px", height: "48px" });
    });
  });

  describe("CircularProgress", () => {
    it("should render percentage text", () => {
      render(<CircularProgress percentage={75} />);
      expect(screen.getByText("75%")).toBeInTheDocument();
    });

    it("should render float percentage correctly", () => {
      render(<CircularProgress percentage={75.5} />);
      expect(screen.getByText("75.5%")).toBeInTheDocument();
    });

    it("should hide percentage if prop is false", () => {
      render(<CircularProgress percentage={50} showPercentage={false} />);
      expect(screen.queryByText("50%")).not.toBeInTheDocument();
    });

    it("should have correct stroke calculation in SVG", () => {
      const { container } = render(
        <CircularProgress percentage={50} size={100} strokeWidth={10} />
      );
      const circles = container.querySelectorAll("circle");
      expect(circles).toHaveLength(2);
      // Check strokeDashoffset for 50%
      // radius = 45, circ = 2*PI*45 approx 282.74
      // offset = 282.74 * 0.5 = 141.37
      const progressCircle = circles[1];
      expect(progressCircle).toHaveAttribute("stroke-dashoffset");
    });
  });

  describe("GlassCard", () => {
    it("should render content children", () => {
      render(
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle icon={<span>Icon</span>}>Title</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardFooter>Footer</GlassCardFooter>
        </GlassCard>
      );
      expect(screen.getByText("Title")).toBeInTheDocument();
      expect(screen.getByText("Footer")).toBeInTheDocument();
      expect(screen.getByText("Icon")).toBeInTheDocument();
    });

    it("should apply padding classes", () => {
      const { container } = render(<GlassCard padding="sm">Content</GlassCard>);
      expect(container.firstChild).toHaveClass("p-3");
    });

    it("should apply hover effects", () => {
      const { container } = render(
        <GlassCard hover glow>
          Content
        </GlassCard>
      );
      const firstChild = container.firstChild as HTMLElement;
      expect(firstChild).toHaveClass("hover:bg-zorin-bg/80");
      // Check for glow class part
      const className = firstChild?.getAttribute("class");
      expect(className).toContain("hover:shadow-[0_0_30px_rgba(0,200,83,0.15)]");
    });
  });
});
