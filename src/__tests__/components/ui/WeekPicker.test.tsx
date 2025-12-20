import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { WeekPicker, WeekPickerCalendar } from "@/components/ui/WeekPicker";
import { startOfWeek } from "date-fns";

describe("WeekPicker", () => {
  describe("WeekPickerCalendar", () => {
    it("should render correctly", () => {
      const selectedDate = new Date(2025, 11, 19); // Dec 19 2025
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });

      render(<WeekPickerCalendar selectedWeekStart={weekStart} onWeekSelect={() => {}} />);

      expect(screen.getByText("Dezembro 2025")).toBeInTheDocument();
      expect(screen.getByText("SEG")).toBeInTheDocument();
      expect(screen.getByText("19")).toBeInTheDocument();
    });

    it("should navigate months", () => {
      const selectedDate = new Date(2025, 11, 19); // Dec 2025
      render(<WeekPickerCalendar selectedWeekStart={selectedDate} onWeekSelect={() => {}} />);

      // Previous month
      const prevBtn = screen.getAllByRole("button")[0]; // First button is prev
      fireEvent.click(prevBtn);
      expect(screen.getByText("Novembro 2025")).toBeInTheDocument();

      // Next month (back to Dec)
      const nextBtn = screen.getAllByRole("button")[1];
      fireEvent.click(nextBtn);
      expect(screen.getByText("Dezembro 2025")).toBeInTheDocument();
    });

    it("should select a week", () => {
      const onSelect = vi.fn();
      const selectedDate = new Date(2025, 11, 19);
      render(<WeekPickerCalendar selectedWeekStart={selectedDate} onWeekSelect={onSelect} />);

      // Click on day 15 (arbitrary day in month)
      fireEvent.click(screen.getByText("15"));
      expect(onSelect).toHaveBeenCalled();
    });

    it("should go to this week", () => {
      const onSelect = vi.fn();
      const selectedDate = new Date(2025, 0, 1); // Jan 1 2025
      render(<WeekPickerCalendar selectedWeekStart={selectedDate} onWeekSelect={onSelect} />);

      fireEvent.click(screen.getByText("Esta semana"));
      expect(onSelect).toHaveBeenCalled();
    });
  });

  describe("WeekPicker Component", () => {
    it("should render selected week info", () => {
      // 2025-W51 corresponds to mid-December 2025
      render(<WeekPicker selectedWeek="2025-W51" onWeekChange={() => {}} />);
      expect(screen.getByText(/Semana 51, 2025/)).toBeInTheDocument();
    });

    it("should toggle calendar on click", () => {
      render(<WeekPicker selectedWeek="2025-W51" onWeekChange={() => {}} />);

      const trigger = screen.getByRole("button");
      fireEvent.click(trigger);

      expect(screen.getByText("Dezembro 2025")).toBeInTheDocument(); // Calendar visible

      fireEvent.click(trigger);
      expect(screen.queryByText("Dezembro 2025")).not.toBeInTheDocument();
    });

    it("should close on outside click", () => {
      render(<WeekPicker selectedWeek="2025-W51" onWeekChange={() => {}} />);

      fireEvent.click(screen.getByRole("button"));
      expect(screen.getByText("Dezembro 2025")).toBeInTheDocument();

      fireEvent.mouseDown(document.body);
      expect(screen.queryByText("Dezembro 2025")).not.toBeInTheDocument();
    });
  });
});
