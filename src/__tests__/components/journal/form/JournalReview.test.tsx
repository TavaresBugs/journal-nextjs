/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { render, screen, fireEvent } from "@testing-library/react";

import { describe, it, expect, vi } from "vitest";
import { JournalReview } from "@/components/journal/form/JournalReview";

// Mock dependent components
vi.mock("@/components/ui", () => ({
  GlassCard: ({ children }: any) => <div>{children}</div>,
  Textarea: ({ value, onChange }: any) => (
    <textarea data-testid="review-textarea" value={value} onChange={onChange} />
  ),
}));

describe("JournalReview", () => {
  const defaultProps = {
    technicalWins: "Win 1",
    setTechnicalWins: vi.fn(),
    improvements: "Imp 1",
    setImprovements: vi.fn(),
    errors: "Err 1",
    setErrors: vi.fn(),
  };

  it("renders correctly", () => {
    // @ts-ignore
    render(<JournalReview {...defaultProps} />);

    // There are 3 textareas. `getByTestId` will fail if multiple. `getAllByTestId`.
    const textareas = screen.getAllByTestId("review-textarea");
    expect(textareas).toHaveLength(3);

    expect(textareas[0]).toHaveValue("Win 1");
    expect(textareas[1]).toHaveValue("Imp 1");
    expect(textareas[2]).toHaveValue("Err 1");
  });

  it("calls setTechnicalWins when first textarea changes", () => {
    // @ts-ignore
    render(<JournalReview {...defaultProps} />);
    const textareas = screen.getAllByTestId("review-textarea");
    fireEvent.change(textareas[0], { target: { value: "New Win" } });
    expect(defaultProps.setTechnicalWins).toHaveBeenCalledWith("New Win");
  });

  it("calls setImprovements when second textarea changes", () => {
    // @ts-ignore
    render(<JournalReview {...defaultProps} />);
    const textareas = screen.getAllByTestId("review-textarea");
    fireEvent.change(textareas[1], { target: { value: "New Imp" } });
    expect(defaultProps.setImprovements).toHaveBeenCalledWith("New Imp");
  });

  it("calls setErrors when third textarea changes", () => {
    // @ts-ignore
    render(<JournalReview {...defaultProps} />);
    const textareas = screen.getAllByTestId("review-textarea");
    fireEvent.change(textareas[2], { target: { value: "New Err" } });
    expect(defaultProps.setErrors).toHaveBeenCalledWith("New Err");
  });
});
