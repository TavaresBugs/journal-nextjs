/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RecapFormModal } from "@/components/laboratory/RecapFormModal";

// Mock UI components
vi.mock("@/components/ui", () => ({
  Modal: ({ isOpen, children, title }: any) =>
    isOpen ? (
      <div data-testid="modal">
        <div data-testid="modal-title">{title}</div>
        {children}
      </div>
    ) : null,
  GlassCard: ({ children, className }: any) => (
    <div className={className} data-testid="glass-card">
      {children}
    </div>
  ),
  WeekPicker: ({ selectedWeek, onWeekChange }: any) => (
    <input
      data-testid="week-picker"
      value={selectedWeek}
      onChange={(e) => onWeekChange(e.target.value)}
    />
  ),
  SegmentedToggle: ({ value, onChange, options }: any) => (
    <div data-testid="segmented-toggle">
      {options.map((opt: any) => (
        <button
          key={opt.value}
          data-testid={`toggle-${opt.value}`}
          onClick={() => onChange(opt.value)}
          data-active={value === opt.value}
        >
          {typeof opt.label === "object" ? opt.value : opt.label}
        </button>
      ))}
    </div>
  ),
  IconActionButton: ({ variant, onClick }: any) => (
    <button onClick={onClick} data-testid={`icon-btn-${variant}`}>
      {variant}
    </button>
  ),
  ModalFooterActions: ({ onPrimary, primaryLabel, disabled, isLoading }: any) => (
    <div data-testid="modal-footer">
      <button
        type="submit"
        onClick={onPrimary}
        disabled={disabled || isLoading}
        data-testid="btn-submit"
      >
        {isLoading ? "Salvando..." : primaryLabel}
      </button>
    </div>
  ),
}));

// Mock CustomCheckbox
vi.mock("@/components/checklist/CustomCheckbox", () => ({
  CustomCheckbox: ({ checked, onChange }: any) => (
    <input
      type="checkbox"
      data-testid="custom-checkbox"
      checked={checked}
      onChange={() => onChange(!checked)}
    />
  ),
}));

describe("RecapFormModal", () => {
  const mockTrades = [
    {
      id: "trade-1",
      accountId: "acc-1",
      symbol: "EURUSD",
      type: "Long" as const,
      entryDate: new Date().toISOString().split("T")[0],
      entryPrice: 1.1,
      stopLoss: 1.095,
      takeProfit: 1.11,
      lot: 1.0,
      pnl: 100,
      outcome: "win" as const,
    },
    {
      id: "trade-2",
      accountId: "acc-1",
      symbol: "GBPUSD",
      type: "Short" as const,
      entryDate: new Date().toISOString().split("T")[0],
      entryPrice: 1.27,
      stopLoss: 1.275,
      takeProfit: 1.26,
      lot: 0.5,
      pnl: -50,
      outcome: "loss" as const,
    },
  ];

  const mockJournalEntries = [
    {
      id: "journal-1",
      date: new Date().toISOString().split("T")[0],
      asset: "EURUSD",
      title: "Daily Analysis",
    },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    mode: "create" as const,
    initialData: null,
    onSubmit: vi.fn().mockResolvedValue(undefined),
    trades: mockTrades,
    journalEntries: mockJournalEntries,
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly in create mode", () => {
    render(<RecapFormModal {...defaultProps} />);

    expect(screen.getByTestId("modal")).toBeInTheDocument();
    expect(screen.getByTestId("segmented-toggle")).toBeInTheDocument();
    expect(screen.getByTestId("toggle-daily")).toBeInTheDocument();
    expect(screen.getByTestId("toggle-weekly")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<RecapFormModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
  });

  it("switches between daily and weekly mode", () => {
    render(<RecapFormModal {...defaultProps} />);

    // Initially in daily mode
    expect(screen.getByTestId("toggle-daily")).toHaveAttribute("data-active", "true");

    // Switch to weekly
    fireEvent.click(screen.getByTestId("toggle-weekly"));

    // Should show week picker in weekly mode
    expect(screen.getByTestId("week-picker")).toBeInTheDocument();
  });

  it("updates title field", () => {
    render(<RecapFormModal {...defaultProps} />);

    const titleInput = screen.getByPlaceholderText(/Ex: Análise do trade/i);
    fireEvent.change(titleInput, { target: { value: "My Recap Title" } });

    expect(titleInput).toHaveValue("My Recap Title");
  });

  it("shows record search in daily mode", () => {
    render(<RecapFormModal {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/Buscar por ativo/i);
    expect(searchInput).toBeInTheDocument();
  });

  it("disables submit when title is empty", () => {
    render(<RecapFormModal {...defaultProps} />);

    const submitButton = screen.getByTestId("btn-submit");
    expect(submitButton).toBeDisabled();
  });

  it("enables submit when title has value in daily mode", () => {
    render(<RecapFormModal {...defaultProps} />);

    const titleInput = screen.getByPlaceholderText(/Ex: Análise do trade/i);
    fireEvent.change(titleInput, { target: { value: "Valid Title" } });

    const submitButton = screen.getByTestId("btn-submit");
    expect(submitButton).not.toBeDisabled();
  });

  it("shows emotion options", () => {
    render(<RecapFormModal {...defaultProps} />);

    // Should have emotion buttons
    expect(screen.getByText("Confiante")).toBeInTheDocument();
    expect(screen.getByText("Neutro")).toBeInTheDocument();
    expect(screen.getByText("Ansioso")).toBeInTheDocument();
  });

  it("selects emotion when clicked", () => {
    render(<RecapFormModal {...defaultProps} />);

    const confianteBtn = screen.getByText("Confiante").closest("button");
    fireEvent.click(confianteBtn!);

    // Button should have active styling (cyan border)
    expect(confianteBtn).toHaveClass("border-cyan-500/50");
  });

  it("updates whatWorked textarea", () => {
    render(<RecapFormModal {...defaultProps} />);

    const whatWorkedInput = screen.getByPlaceholderText(/Pontos positivos/i);
    fireEvent.change(whatWorkedInput, { target: { value: "Good entry timing" } });

    expect(whatWorkedInput).toHaveValue("Good entry timing");
  });

  it("updates whatFailed textarea", () => {
    render(<RecapFormModal {...defaultProps} />);

    const whatFailedInput = screen.getByPlaceholderText(/O que poderia melhorar/i);
    fireEvent.change(whatFailedInput, { target: { value: "Need better risk management" } });

    expect(whatFailedInput).toHaveValue("Need better risk management");
  });

  it("updates lessonsLearned textarea", () => {
    render(<RecapFormModal {...defaultProps} />);

    const lessonsInput = screen.getByPlaceholderText(/O que você aprendeu/i);
    fireEvent.change(lessonsInput, { target: { value: "Always wait for confirmation" } });

    expect(lessonsInput).toHaveValue("Always wait for confirmation");
  });

  it("submits form with correct data", async () => {
    render(<RecapFormModal {...defaultProps} />);

    // Fill title
    const titleInput = screen.getByPlaceholderText(/Ex: Análise do trade/i);
    fireEvent.change(titleInput, { target: { value: "Test Recap" } });

    // Fill whatWorked
    const whatWorkedInput = screen.getByPlaceholderText(/Pontos positivos/i);
    fireEvent.change(whatWorkedInput, { target: { value: "Good timing" } });

    // Submit
    const form = screen.getByTestId("modal").querySelector("form");

    await act(async () => {
      fireEvent.submit(form!);
    });

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalled();
    });
  });

  it("calls onClose when modal is closed", async () => {
    render(<RecapFormModal {...defaultProps} />);

    // Fill title and submit (which triggers handleClose)
    const titleInput = screen.getByPlaceholderText(/Ex: Análise do trade/i);
    fireEvent.change(titleInput, { target: { value: "Test" } });

    const form = screen.getByTestId("modal").querySelector("form");

    await act(async () => {
      fireEvent.submit(form!);
    });

    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it("renders in edit mode with initial data", () => {
    const initialData = {
      id: "recap-1",
      userId: "user-1",
      type: "daily" as const,
      title: "Existing Recap",
      linkedType: "trade" as const,
      linkedId: "trade-1",
      whatWorked: "Good entry",
      whatFailed: "Poor exit",
      emotionalState: "confiante" as const,
      lessonsLearned: "Be patient",
      images: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(<RecapFormModal {...defaultProps} mode="edit" initialData={initialData} />);

    const titleInput = screen.getByPlaceholderText(/Ex: Análise do trade/i);
    expect(titleInput).toHaveValue("Existing Recap");
  });

  it("shows weekly mode features correctly", () => {
    render(<RecapFormModal {...defaultProps} />);

    // Switch to weekly mode
    fireEvent.click(screen.getByTestId("toggle-weekly"));

    // Should show week picker
    expect(screen.getByTestId("week-picker")).toBeInTheDocument();

    // Should show trade selection options
    expect(screen.getByText(/Trades da Semana/i)).toBeInTheDocument();
  });
});
