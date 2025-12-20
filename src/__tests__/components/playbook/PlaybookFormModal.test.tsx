/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PlaybookFormModal } from "@/components/playbook/PlaybookFormModal";

// Mock dnd-kit
vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: any) => <div data-testid="dnd-context">{children}</div>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: () => ({}),
  useSensors: () => [],
}));

vi.mock("@dnd-kit/sortable", () => ({
  arrayMove: (arr: any[], from: number, to: number) => {
    const result = [...arr];
    const [removed] = result.splice(from, 1);
    result.splice(to, 0, removed);
    return result;
  },
  SortableContext: ({ children }: any) => <div data-testid="sortable-context">{children}</div>,
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: {},
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: {
      toString: () => "",
    },
  },
}));

// Mock UI components
vi.mock("@/components/ui", () => ({
  Modal: ({ isOpen, children, title }: any) =>
    isOpen ? (
      <div data-testid="modal">
        <div data-testid="modal-title">{title}</div>
        {children}
      </div>
    ) : null,
  Input: ({ label, value, onChange, placeholder, ...props }: any) => (
    <div>
      {label && <label>{label}</label>}
      <input
        data-testid={`input-${label?.toLowerCase().replace(/\s/g, "-") || "unnamed"}`}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...props}
      />
    </div>
  ),
  Button: ({ children, onClick, disabled }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={`btn-${String(children).toLowerCase().replace(/\s/g, "-")}`}
    >
      {children}
    </button>
  ),
  GlassCard: ({ children, className }: any) => (
    <div className={className} data-testid="glass-card">
      {children}
    </div>
  ),
  IconActionButton: ({ variant, onClick }: any) => (
    <button onClick={onClick} data-testid={`icon-btn-${variant}`}>
      {variant}
    </button>
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
          {opt.label}
        </button>
      ))}
    </div>
  ),
  ModalFooterActions: ({ onPrimary, onSecondary, primaryLabel, disabled }: any) => (
    <div data-testid="modal-footer">
      {onSecondary && (
        <button onClick={onSecondary} data-testid="btn-cancel">
          Cancelar
        </button>
      )}
      <button onClick={onPrimary} disabled={disabled} data-testid="btn-primary">
        {primaryLabel}
      </button>
    </div>
  ),
}));

// Mock store
vi.mock("@/store/usePlaybookStore", () => ({
  usePlaybookStore: () => ({
    addPlaybook: vi.fn().mockResolvedValue(undefined),
    updatePlaybook: vi.fn().mockResolvedValue(undefined),
  }),
}));

describe("PlaybookFormModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    playbook: null,
    onBack: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly in create mode", () => {
    render(<PlaybookFormModal {...defaultProps} />);

    expect(screen.getByTestId("modal")).toBeInTheDocument();
    expect(screen.getByTestId("segmented-toggle")).toBeInTheDocument();
    expect(screen.getByTestId("toggle-general")).toBeInTheDocument();
    expect(screen.getByTestId("toggle-rules")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<PlaybookFormModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
  });

  it("switches tabs correctly", () => {
    render(<PlaybookFormModal {...defaultProps} />);

    // Click on rules tab
    fireEvent.click(screen.getByTestId("toggle-rules"));

    // Should show rules content (with sortable contexts for DnD - one per rule group)
    const sortableContexts = screen.getAllByTestId("sortable-context");
    expect(sortableContexts.length).toBeGreaterThan(0);
  });

  it("updates playbook name", () => {
    render(<PlaybookFormModal {...defaultProps} />);

    const nameInput = screen.getByTestId("input-nome-do-playbook");
    fireEvent.change(nameInput, { target: { value: "My Trading Strategy" } });

    expect(nameInput).toHaveValue("My Trading Strategy");
  });

  it("shows emoji selection grid", () => {
    render(<PlaybookFormModal {...defaultProps} />);

    // Should have emoji buttons in general tab
    const emojiButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.textContent?.match(/^[\u{1F300}-\u{1F9FF}]$/u));

    expect(emojiButtons.length).toBeGreaterThan(0);
  });

  it("shows color selection options", () => {
    render(<PlaybookFormModal {...defaultProps} />);

    // Should have color selection buttons
    const colorButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.className.includes("rounded-lg") && btn.style.backgroundColor);

    expect(colorButtons.length).toBeGreaterThan(0);
  });

  it("calls onBack when back button is clicked", () => {
    render(<PlaybookFormModal {...defaultProps} />);

    const backButton = screen.getByTestId("icon-btn-back");
    fireEvent.click(backButton);

    expect(defaultProps.onBack).toHaveBeenCalled();
  });

  it("disables submit when name is empty", () => {
    render(<PlaybookFormModal {...defaultProps} />);

    const nameInput = screen.getByTestId("input-nome-do-playbook");
    fireEvent.change(nameInput, { target: { value: "" } });

    const submitButton = screen.getByTestId("btn-primary");
    expect(submitButton).toBeDisabled();
  });

  it("enables submit when name has value", () => {
    render(<PlaybookFormModal {...defaultProps} />);

    const nameInput = screen.getByTestId("input-nome-do-playbook");
    fireEvent.change(nameInput, { target: { value: "Valid Name" } });

    const submitButton = screen.getByTestId("btn-primary");
    expect(submitButton).not.toBeDisabled();
  });

  it("shows rule groups in rules tab", () => {
    render(<PlaybookFormModal {...defaultProps} />);

    // Switch to rules tab
    fireEvent.click(screen.getByTestId("toggle-rules"));

    // Should have glass cards for rule groups
    const glassCards = screen.getAllByTestId("glass-card");
    expect(glassCards.length).toBeGreaterThan(0);
  });

  it("submits form and calls onSuccess", async () => {
    render(<PlaybookFormModal {...defaultProps} />);

    // Fill in name
    const nameInput = screen.getByTestId("input-nome-do-playbook");
    fireEvent.change(nameInput, { target: { value: "Test Playbook" } });

    // Submit
    const submitButton = screen.getByTestId("btn-primary");

    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });

  it("renders in edit mode with playbook data", () => {
    const playbook = {
      id: "pb-1",
      userId: "user-1",
      name: "Existing Playbook",
      description: "Test description",
      icon: "🎯",
      color: "#10B981",
      ruleGroups: [{ id: "market", name: "Condições de mercado", rules: ["Rule 1", "Rule 2"] }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(<PlaybookFormModal {...defaultProps} playbook={playbook} />);

    const nameInput = screen.getByTestId("input-nome-do-playbook");
    expect(nameInput).toHaveValue("Existing Playbook");
  });
});
