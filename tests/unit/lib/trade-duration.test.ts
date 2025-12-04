import { describe, test, expect } from "bun:test";
import dayjs from "dayjs";

describe("Trade Duration Calculation", () => {
  test("calculates duration with date and time correctly", () => {
    const trade = {
      entryDate: "2024-01-01",
      entryTime: "09:00",
      exitDate: "2024-01-01",
      exitTime: "10:30"
    };

    // Combine date and time
    const entryDateTime = `${trade.entryDate} ${trade.entryTime}`;
    const exitDateTime = `${trade.exitDate} ${trade.exitTime}`;
    
    const start = dayjs(entryDateTime);
    const end = dayjs(exitDateTime);
    const diffInMinutes = end.diff(start, "minute");
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    const duration = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:00`;

    expect(duration).toBe("01:30:00");
  });

  test("handles same entry and exit time", () => {
    const trade = {
      entryDate: "2024-01-01",
      entryTime: "09:00",
      exitDate: "2024-01-01",
      exitTime: "09:00"
    };

    const entryDateTime = `${trade.entryDate} ${trade.entryTime}`;
    const exitDateTime = `${trade.exitDate} ${trade.exitTime}`;
    
    const start = dayjs(entryDateTime);
    const end = dayjs(exitDateTime);
    const diffInMinutes = end.diff(start, "minute");
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    const duration = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:00`;

    expect(duration).toBe("00:00:00");
  });

  test("handles multi-day trades", () => {
    const trade = {
      entryDate: "2024-01-01",
      entryTime: "23:00",
      exitDate: "2024-01-02",
      exitTime: "01:30"
    };

    const entryDateTime = `${trade.entryDate} ${trade.entryTime}`;
    const exitDateTime = `${trade.exitDate} ${trade.exitTime}`;
    
    const start = dayjs(entryDateTime);
    const end = dayjs(exitDateTime);
    const diffInMinutes = end.diff(start, "minute");
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    const duration = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:00`;

    expect(duration).toBe("02:30:00");
  });

  test("handles trades without time (date only)", () => {
    const trade = {
      entryDate: "2024-01-01",
      exitDate: "2024-01-02"
    };

    const entryDateTime = trade.entryDate;
    const exitDateTime = trade.exitDate;
    
    const start = dayjs(entryDateTime);
    const end = dayjs(exitDateTime);
    const diffInMinutes = end.diff(start, "minute");
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    const duration = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:00`;

    expect(duration).toBe("24:00:00");
  });
});
