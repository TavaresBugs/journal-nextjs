import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AssetBadge } from "@/components/ui/AssetBadge";
import { Input, Textarea } from "@/components/ui/Input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/Select";

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
    it("should render trigger button", () => {
      render(
        <Select value="1" onValueChange={() => {}}>
          <SelectTrigger>
            <SelectValue placeholder="Choose..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Option 1</SelectItem>
            <SelectItem value="2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should show placeholder when no value", () => {
      render(
        <Select value="" onValueChange={() => {}}>
          <SelectTrigger>
            <SelectValue placeholder="Choose..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(screen.getByText("Choose...")).toBeInTheDocument();
    });

    it("should show value when selected", () => {
      render(
        <Select value="test" onValueChange={() => {}}>
          <SelectTrigger>
            <SelectValue placeholder="Choose..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="test">Test Option</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(screen.getByText("test")).toBeInTheDocument();
    });

    it("should open dropdown on click", async () => {
      render(
        <Select value="" onValueChange={() => {}}>
          <SelectTrigger>
            <SelectValue placeholder="Choose..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Option 1</SelectItem>
            <SelectItem value="2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      );

      // Initially, content should not be visible
      expect(screen.queryByText("Option 1")).not.toBeInTheDocument();

      // Click the trigger
      fireEvent.click(screen.getByRole("button"));

      // Now options should be visible (in portal, so wait for it)
      await waitFor(() => {
        expect(document.body.querySelector("[data-select-content]")).toBeInTheDocument();
      });
      expect(document.body).toHaveTextContent("Option 1");
      expect(document.body).toHaveTextContent("Option 2");
    });

    // Skip: Testing portal interactions with jsdom is complex
    // The Select uses createPortal which renders outside the normal component tree
    // This functionality works correctly in the browser
    it("should call onValueChange when item clicked", async () => {
      const handleChange = vi.fn();
      render(
        <Select value="" onValueChange={handleChange}>
          <SelectTrigger>
            <SelectValue placeholder="Choose..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="selected">Selected Option</SelectItem>
          </SelectContent>
        </Select>
      );

      // Open dropdown
      fireEvent.click(screen.getByRole("button"));

      // Wait for portal to render
      await waitFor(() => {
        expect(document.body.querySelector("[data-select-content]")).toBeInTheDocument();
      });

      // Click the option
      // Since it's in a portal, regular screen queries should find it if it's in the document.
      // We use getByText which will find the text inside the Item.
      // Clicking the text should bubble up to the Item's onClick handler.
      const option = screen.getByText("Selected Option");
      fireEvent.click(option);

      // Callback should be called with the value
      expect(handleChange).toHaveBeenCalledWith("selected");
    });
  });
});
