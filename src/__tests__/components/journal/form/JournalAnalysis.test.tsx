/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { render, screen, fireEvent } from "@testing-library/react";

import { describe, it, expect, vi } from "vitest";
import { JournalAnalysis } from "@/components/journal/form/JournalAnalysis";

// Mock dependent components
vi.mock("@/components/ui", () => ({
  Input: ({ value, onChange, placeholder }: any) => (
    <input
      data-testid="emotion-input"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  ),
  Textarea: ({ value, onChange, placeholder }: any) => (
    <textarea
      data-testid="analysis-textarea"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  ),
}));

vi.mock("@/components/shared", () => ({
  TimeframeImageGrid: () => <div data-testid="timeframe-image-grid">Timeframe Grid</div>,
}));

describe("JournalAnalysis", () => {
  const defaultProps = {
    emotion: "Happy",
    setEmotion: vi.fn(),
    analysis: "Good trade",
    setAnalysis: vi.fn(),
    images: {},
    onPasteImage: vi.fn(),
    onFileSelect: vi.fn(),
    onRemoveImage: vi.fn(),
    timeframes: [{ key: "tf1", label: "TF1" }],
  };

  it("renders correctly", () => {
    // @ts-ignore
    render(<JournalAnalysis {...defaultProps} />);

    expect(screen.getByTestId("emotion-input")).toHaveValue("Happy");
    expect(screen.getByTestId("analysis-textarea")).toHaveValue("Good trade");
    expect(screen.getByTestId("timeframe-image-grid")).toBeInTheDocument();
  });

  it("calls setEmotion when emotion input changes", () => {
    // @ts-ignore
    render(<JournalAnalysis {...defaultProps} />);
    const input = screen.getByTestId("emotion-input");
    fireEvent.change(input, { target: { value: "Sad" } });
    expect(defaultProps.setEmotion).toHaveBeenCalledWith("Sad");
  });

  it("calls setAnalysis when analysis textarea changes", () => {
    // @ts-ignore
    render(<JournalAnalysis {...defaultProps} />);
    const textarea = screen.getByTestId("analysis-textarea");
    fireEvent.change(textarea, { target: { value: "Bad trade" } });
    expect(defaultProps.setAnalysis).toHaveBeenCalledWith("Bad trade");
  });
});
