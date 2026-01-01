/* eslint-disable @typescript-eslint/no-explicit-any */

import { render, screen, fireEvent } from "@testing-library/react";

import { describe, it, expect, vi } from "vitest";
import { EntryHeader } from "@/components/journal/form/EntryHeader";

// Mock dependent components
vi.mock("@/components/ui", () => ({
  Input: ({ label, value, onChange }: any) => (
    <div>
      <label>{label}</label>
      <input data-testid="title-input" value={value} onChange={onChange} />
    </div>
  ),
  DebouncedInput: ({ label, value, onDebouncedChange }: any) => (
    <div>
      <label>{label}</label>
      <input
        data-testid="title-input"
        value={value}
        onChange={(e) => onDebouncedChange(e.target.value)}
      />
    </div>
  ),
}));

vi.mock("@/components/shared", () => ({
  AssetCombobox: ({ value, onChange }: any) => (
    <select data-testid="asset-select" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select Asset</option>
      <option value="EURUSD">EURUSD</option>
      <option value="BTCUSD">BTCUSD</option>
    </select>
  ),
}));

vi.mock("@/components/ui/DateTimePicker", () => ({
  DatePickerInput: ({ label, value, onChange }: any) => (
    <div>
      <label>{label}</label>
      <input data-testid="date-input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  ),
}));

describe("EntryHeader", () => {
  const defaultProps = {
    title: "Test Title",
    setTitle: vi.fn(),
    asset: "EURUSD",
    setAsset: vi.fn(),
    date: "2023-01-01",
    setDate: vi.fn(),
  };

  it("renders correctly with initial values", () => {
    render(<EntryHeader {...defaultProps} />);

    expect(screen.getByTestId("title-input")).toHaveValue("Test Title");
    expect(screen.getByTestId("asset-select")).toHaveValue("EURUSD");
    expect(screen.getByTestId("date-input")).toHaveValue("2023-01-01");
  });

  it("calls setTitle when title changes", () => {
    render(<EntryHeader {...defaultProps} />);
    const input = screen.getByTestId("title-input");
    fireEvent.change(input, { target: { value: "New Title" } });
    expect(defaultProps.setTitle).toHaveBeenCalledWith("New Title");
  });

  it("calls setAsset when asset changes", () => {
    render(<EntryHeader {...defaultProps} />);
    const select = screen.getByTestId("asset-select");
    fireEvent.change(select, { target: { value: "BTCUSD" } });
    expect(defaultProps.setAsset).toHaveBeenCalledWith("BTCUSD");
  });

  it("calls setDate when date changes", () => {
    render(<EntryHeader {...defaultProps} />);
    const dateInput = screen.getByTestId("date-input");
    fireEvent.change(dateInput, { target: { value: "2023-01-02" } });
    expect(defaultProps.setDate).toHaveBeenCalledWith("2023-01-02");
  });
});
