/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RecapFormModal } from "@/components/laboratory/RecapFormModal";

// Mock UI components
vi.mock("@/components/ui", () => ({
  Modal: ({ isOpen, children, title }: any) =>
    isOpen ? (
      <div data-testid="modal">
        <h1>{title}</h1>
        {children}
      </div>
    ) : null,
  GlassCard: ({ children }: any) => <div>{children}</div>,
  WeekPicker: () => <input data-testid="week-picker" />,
  SegmentedToggle: ({ onChange, options }: any) => (
    <div>
      {options.map((opt: any) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          data-testid={`toggle-${opt.value}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  ),
  IconActionButton: ({ onClick, variant }: any) => (
    <button onClick={onClick} data-testid={`icon-btn-${variant}`} />
  ),
  ModalFooterActions: ({ onCancel, onConfirm, isLoading }: any) => (
    <div>
      <button onClick={onCancel}>Cancelar</button>
      <button onClick={onConfirm} disabled={isLoading}>
        Salvar
      </button>
    </div>
  ),
}));

vi.mock("@/components/checklist/CustomCheckbox", () => ({
  CustomCheckbox: ({ checked, onChange }: any) => (
    <input type="checkbox" checked={checked} onChange={onChange} data-testid="checkbox" />
  ),
}));

describe("RecapFormModal", () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  const mockTrades = [
    {
      id: "t1",
      symbol: "EURUSD",
      entryDate: "2023-12-01T10:00:00",
      outcome: "win",
      pnl: 100,
      type: "Long",
    },
    {
      id: "t2",
      symbol: "GBPUSD",
      entryDate: "2023-12-02T10:00:00",
      outcome: "loss",
      pnl: -50,
      type: "Short",
    },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    mode: "create" as const,
    onSubmit: mockOnSubmit,
    trades: mockTrades as any[],
    journalEntries: [],
    isLoading: false,
  };

  it("should render in create mode", () => {
    render(<RecapFormModal {...defaultProps} />);
    expect(screen.getByText("📝 Novo Recap")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ex: Análise do trade/)).toBeInTheDocument();
  });

  it("should toggle review type", async () => {
    render(<RecapFormModal {...defaultProps} />);

    // Initially daily
    expect(screen.getByText("Vincular a um registro (opcional)")).toBeInTheDocument();

    // Click weekly
    fireEvent.click(screen.getByTestId("toggle-weekly"));

    // Check for week picker (only in weekly mode)
    expect(screen.getByTestId("week-picker")).toBeInTheDocument();
  });

  it("should handle form submission", async () => {
    render(<RecapFormModal {...defaultProps} />);

    const titleInput = screen.getByPlaceholderText(/Ex: Análise do trade/);
    fireEvent.change(titleInput, { target: { value: "My Recap" } });

    const saveBtn = screen.getByText("Salvar");
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "My Recap",
          reviewType: "daily",
        }),
        []
      );
    });
  });

  it("should search and select a record", async () => {
    render(<RecapFormModal {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("Buscar por ativo, data ou diário...");
    fireEvent.change(searchInput, { target: { value: "EUR" } });
    fireEvent.focus(searchInput);

    // Should show results
    await waitFor(() => {
      expect(screen.getByText("EURUSD")).toBeInTheDocument();
    });

    // Select result
    fireEvent.click(screen.getByText("EURUSD"));

    // Check if input updated
    expect(searchInput).toHaveValue("EURUSD");
  });

  it("should populate data in edit mode", () => {
    const initialData = {
      id: "recap-1",
      title: "Existing Recap",
      type: "daily",
      whatWorked: "Patience",
      images: ["img1.jpg"],
    };

    render(<RecapFormModal {...defaultProps} mode="edit" initialData={initialData as any} />);

    expect(screen.getByText("✏️ Existing Recap")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Existing Recap")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Patience")).toBeInTheDocument();
  });
});
