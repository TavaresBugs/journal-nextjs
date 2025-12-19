/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { JournalEntryForm } from "@/components/journal/form/JournalEntryForm";

// Mock sub-components
vi.mock("@/components/journal/form/EntryHeader", () => ({
  EntryHeader: ({ title, setTitle }: any) => (
    <div data-testid="entry-header">
      <input
        data-testid="header-title-input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
    </div>
  ),
}));

vi.mock("@/components/journal/form/TradeLinker", () => ({
  TradeLinker: ({ onLinkTradeOpen }: any) => (
    <div data-testid="trade-linker">
      <button onClick={onLinkTradeOpen} data-testid="open-link-modal-btn">
        Link Trade
      </button>
    </div>
  ),
}));

vi.mock("@/components/journal/form/JournalAnalysis", () => ({
  JournalAnalysis: ({ emotion, setEmotion }: any) => (
    <div data-testid="journal-analysis">
      <input
        data-testid="analysis-emotion-input"
        value={emotion}
        onChange={(e) => setEmotion(e.target.value)}
      />
    </div>
  ),
}));

vi.mock("@/components/journal/form/JournalReview", () => ({
  JournalReview: () => <div data-testid="journal-review" />,
}));

vi.mock("@/components/journal/form/LinkTradeModal", () => ({
  LinkTradeModal: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="link-trade-modal">
        <button onClick={onClose} data-testid="close-link-modal-btn">
          Close
        </button>
      </div>
    ) : null,
}));

// Mock UI components
vi.mock("@/components/ui", () => ({
  Modal: ({ isOpen, children }: any) => (isOpen ? <div data-testid="modal">{children}</div> : null),
  IconActionButton: () => <button>Back</button>,
  ModalFooterActions: () => (
    <button type="submit" data-testid="submit-btn">
      Save
    </button>
  ),
}));

// Mock Hooks
vi.mock("@/store/useSettingsStore", () => ({
  useSettingsStore: () => ({}),
}));

vi.mock("@/hooks/useImageUpload", () => ({
  useImageUpload: () => ({
    images: {},
    handlePasteImage: vi.fn(),
    handleFileSelect: vi.fn(),
    removeLastImage: vi.fn(),
  }),
}));

vi.mock("@/hooks/useBlockBodyScroll", () => ({
  useBlockBodyScroll: vi.fn(),
}));

describe("JournalEntryForm", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    accountId: "acc1",
  };

  it("renders correctly", () => {
    // @ts-ignore
    render(<JournalEntryForm {...defaultProps} />);

    expect(screen.getByTestId("modal")).toBeInTheDocument();
    expect(screen.getByTestId("entry-header")).toBeInTheDocument();
    expect(screen.getByTestId("trade-linker")).toBeInTheDocument();
    expect(screen.getByTestId("journal-analysis")).toBeInTheDocument();
    expect(screen.getByTestId("journal-review")).toBeInTheDocument();
  });

  it("updates state correctly through sub-components (EntryHeader)", () => {
    // @ts-ignore
    render(<JournalEntryForm {...defaultProps} />);

    const input = screen.getByTestId("header-title-input");
    fireEvent.change(input, { target: { value: "New Title" } });

    expect(input).toHaveValue("New Title");
  });

  it("opens link trade modal", () => {
    // @ts-ignore
    render(<JournalEntryForm {...defaultProps} />);

    expect(screen.queryByTestId("link-trade-modal")).not.toBeInTheDocument();

    act(() => {
        fireEvent.click(screen.getByTestId("open-link-modal-btn"));
    });

    expect(screen.getByTestId("link-trade-modal")).toBeInTheDocument();
  });

  it("submits the form", async () => {
    // @ts-ignore
    render(<JournalEntryForm {...defaultProps} />);

    fireEvent.click(screen.getByTestId("submit-btn"));

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalled();
    });
  });
});
