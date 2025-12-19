import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AssetBadge } from "@/components/ui/AssetBadge";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

// Mock AssetIcon since it's used in AssetBadge
vi.mock("@/components/shared/AssetIcon", () => ({
  AssetIcon: ({ symbol }: { symbol: string }) => <div data-testid="asset-icon">{symbol}</div>,
}));

describe("UI Components", () => {
  describe("AssetBadge", () => {
    it("should render correctly", () => {
      render(<AssetBadge symbol="EURUSD" />);
      const elements = screen.getAllByText("EURUSD");
      expect(elements.length).toBeGreaterThan(0);
      expect(screen.getByTestId("asset-icon")).toHaveTextContent("EURUSD");
    });

    it("should apply size classes", () => {
      const { container } = render(<AssetBadge symbol="BTC" size="sm" />);
      // Check for small padding class
      expect(container.firstChild).toHaveClass("px-2 py-0.5");
    });
  });

  describe("Input", () => {
    it("should render with label", () => {
      render(<Input label="Username" id="user" />);
      expect(screen.getByLabelText("Username")).toBeInTheDocument();
    });

    it("should render error message", () => {
      render(<Input error="Required field" />);
      expect(screen.getByText("Required field")).toBeInTheDocument();
      expect(screen.getByRole("textbox")).toHaveClass("border-red-500");
    });

    it("should render warning message", () => {
      render(<Input warning="Be careful" />);
      expect(screen.getByText("Be careful")).toBeInTheDocument();
      expect(screen.getByRole("textbox")).toHaveClass("border-amber-500");
    });
  });

  describe("Textarea", () => {
    it("should render with label", () => {
        render(<Textarea label="Notes" id="notes" />);
        expect(screen.getByLabelText("Notes")).toBeInTheDocument();
    });

    it("should render error message", () => {
        render(<Textarea error="Too long" />);
        expect(screen.getByText("Too long")).toBeInTheDocument();
        expect(screen.getByRole("textbox")).toHaveClass("border-red-500");
    });
  });

  describe("Select", () => {
    const options = [
        { value: "1", label: "Option 1" },
        { value: "2", label: "Option 2" },
    ];

    it("should render options", () => {
        render(<Select options={options} defaultValue="1" />);
        expect(screen.getByRole("combobox")).toBeInTheDocument();
        expect(screen.getByText("Option 1")).toBeInTheDocument();
        expect(screen.getByText("Option 2")).toBeInTheDocument();
    });

    it("should render placeholder", () => {
        render(<Select options={options} placeholder="Choose..." defaultValue="" />);
        expect(screen.getByText("Choose...")).toBeInTheDocument();
    });

    it("should render error", () => {
        render(<Select options={options} error="Selection required" />);
        expect(screen.getByText("Selection required")).toBeInTheDocument();
        expect(screen.getByRole("combobox")).toHaveClass("border-red-500");
    });
  });
});
