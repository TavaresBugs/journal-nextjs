import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfluenceTags } from "../shared/ConfluenceTags";

describe("ConfluenceTags", () => {
  const defaultProps = {
    tagsList: [],
    tagInput: "",
    onTagsChange: vi.fn(),
    onInputChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render with empty tags list", () => {
      render(<ConfluenceTags {...defaultProps} />);
      expect(screen.getByPlaceholderText("FVG Breaker OB")).toBeInTheDocument();
    });

    it("should render existing tags", () => {
      render(<ConfluenceTags {...defaultProps} tagsList={["FVG", "Breaker", "OB"]} />);

      // Tags are rendered with emoji prefix
      expect(screen.getByText(/FVG/)).toBeInTheDocument();
      expect(screen.getByText(/Breaker/)).toBeInTheDocument();
      expect(screen.getByText(/OB/)).toBeInTheDocument();
    });

    it("should not show placeholder when tags exist", () => {
      render(<ConfluenceTags {...defaultProps} tagsList={["FVG"]} />);
      expect(screen.queryByPlaceholderText("FVG Breaker OB")).not.toBeInTheDocument();
    });

    it("should show each tag with emoji badge", () => {
      render(<ConfluenceTags {...defaultProps} tagsList={["Test"]} />);
      expect(screen.getByText(/Test/)).toBeInTheDocument();
    });
  });

  describe("Adding Tags", () => {
    it("should call onInputChange when typing", () => {
      const onInputChange = vi.fn();
      render(<ConfluenceTags {...defaultProps} onInputChange={onInputChange} />);

      const input = screen.getByPlaceholderText("FVG Breaker OB");
      fireEvent.change(input, { target: { value: "NewTag" } });

      expect(onInputChange).toHaveBeenCalledWith("NewTag");
    });

    it("should add tag on Enter key", () => {
      const onTagsChange = vi.fn();
      render(
        <ConfluenceTags
          {...defaultProps}
          tagInput="NewTag"
          onTagsChange={onTagsChange}
          onInputChange={vi.fn()}
        />
      );

      const input = screen.getByRole("textbox");
      fireEvent.keyDown(input, { key: "Enter" });

      expect(onTagsChange).toHaveBeenCalledWith(expect.any(Function));
    });

    it("should add tag on Space key", () => {
      const onTagsChange = vi.fn();
      render(
        <ConfluenceTags
          {...defaultProps}
          tagInput="NewTag"
          onTagsChange={onTagsChange}
          onInputChange={vi.fn()}
        />
      );

      const input = screen.getByRole("textbox");
      fireEvent.keyDown(input, { key: " " });

      expect(onTagsChange).toHaveBeenCalledWith(expect.any(Function));
    });

    it("should not add empty tags", () => {
      const onTagsChange = vi.fn();
      render(<ConfluenceTags {...defaultProps} tagInput="   " onTagsChange={onTagsChange} />);

      const input = screen.getByRole("textbox");
      fireEvent.keyDown(input, { key: "Enter" });

      expect(onTagsChange).not.toHaveBeenCalled();
    });

    it("should not add duplicate tags", () => {
      const onTagsChange = vi.fn();
      render(
        <ConfluenceTags
          {...defaultProps}
          tagsList={["ExistingTag"]}
          tagInput="ExistingTag"
          onTagsChange={onTagsChange}
        />
      );

      const input = screen.getByRole("textbox");
      fireEvent.keyDown(input, { key: "Enter" });

      expect(onTagsChange).not.toHaveBeenCalled();
    });
  });

  describe("Removing Tags", () => {
    it("should remove tag on Backspace when input is empty", () => {
      const onTagsChange = vi.fn();
      render(
        <ConfluenceTags
          {...defaultProps}
          tagsList={["Tag1", "Tag2"]}
          tagInput=""
          onTagsChange={onTagsChange}
        />
      );

      const input = screen.getByRole("textbox");
      fireEvent.keyDown(input, { key: "Backspace" });

      expect(onTagsChange).toHaveBeenCalledWith(expect.any(Function));
    });

    it("should not remove tag on Backspace when input has text", () => {
      const onTagsChange = vi.fn();
      render(
        <ConfluenceTags
          {...defaultProps}
          tagsList={["Tag1"]}
          tagInput="some text"
          onTagsChange={onTagsChange}
        />
      );

      const input = screen.getByRole("textbox");
      fireEvent.keyDown(input, { key: "Backspace" });

      expect(onTagsChange).not.toHaveBeenCalled();
    });

    it("should remove specific tag when clicking X button", () => {
      const onTagsChange = vi.fn();
      render(
        <ConfluenceTags {...defaultProps} tagsList={["Tag1", "Tag2"]} onTagsChange={onTagsChange} />
      );

      const removeButtons = screen.getAllByRole("button");
      fireEvent.click(removeButtons[0]);

      expect(onTagsChange).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe("Accessibility", () => {
    it("should focus input when container is clicked", () => {
      render(<ConfluenceTags {...defaultProps} />);

      const container = screen.getByPlaceholderText("FVG Breaker OB").closest("div");
      fireEvent.click(container!);

      expect(document.getElementById("tags-input")).toHaveFocus();
    });
  });
});
