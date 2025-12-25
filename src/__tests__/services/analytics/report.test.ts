/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateReport } from "@/services/analytics/report";
import { getTradesAction } from "@/app/actions/trades";
import { Trade } from "@/types";

// Mock dependencies
vi.mock("@/app/actions/trades");

// Fix ExcelJS mock to support constructor usage
vi.mock("exceljs", () => {
  const MockWorkbook = vi.fn();

  // Implementation must be a function, not an arrow function, to be constructable if Vitest tries to new it directly
  MockWorkbook.mockImplementation(function (this: any) {
    return {
      creator: "",
      created: null,
      addWorksheet: vi.fn().mockReturnValue({
        columns: [],
        addRows: vi.fn(),
        addRow: vi.fn().mockReturnValue({
          getCell: vi.fn().mockReturnValue({ numFmt: "", font: {} }),
        }),
        getRow: vi.fn().mockReturnValue({
          getCell: vi.fn().mockReturnValue({ numFmt: "", font: {} }),
          font: {},
          fill: {},
        }),
      }),
      xlsx: {
        writeBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
      },
    };
  });

  return {
    Workbook: MockWorkbook,
    default: { Workbook: MockWorkbook },
  };
});

describe("Report Service", () => {
  const mockTrades: Trade[] = [
    {
      id: "1",
      userId: "user1",
      accountId: "acc1",
      symbol: "EURUSD",
      type: "Long",
      outcome: "win",
      pnl: 100,
      entryDate: "2023-10-01T10:00:00.000Z",
      entryPrice: 1.05,
      exitPrice: 1.06,
      status: "Closed",
    } as unknown as Trade,
    {
      id: "2",
      userId: "user1",
      accountId: "acc1",
      symbol: "GBPUSD",
      type: "Short",
      outcome: "loss",
      pnl: -50,
      entryDate: "2023-10-02T10:00:00.000Z",
      entryPrice: 1.25,
      exitPrice: 1.26,
      status: "Closed",
    } as unknown as Trade,
    {
      id: "3",
      userId: "user1",
      accountId: "acc1",
      symbol: "EURUSD",
      type: "Long",
      outcome: "win",
      pnl: 200,
      entryDate: "2023-11-01T10:00:00.000Z", // Distinct month
      entryPrice: 1.05,
      exitPrice: 1.07,
      status: "Closed",
    } as unknown as Trade,
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (getTradesAction as any).mockResolvedValue(mockTrades);
  });

  it("should generate a report blob successfully", async () => {
    const startDate = new Date("2023-01-01");
    const endDate = new Date("2023-12-31");
    const blob = await generateReport("acc1", startDate, endDate);

    expect(getTradesAction).toHaveBeenCalledWith("acc1");
    expect(blob).toBeInstanceOf(Blob);
  });

  it("should calculate summary metrics correctly", async () => {
    const startDate = new Date("2023-01-01");
    const endDate = new Date("2023-12-31");

    // Trigger generation
    await generateReport("acc1", startDate, endDate);

    // access mock from module
    const exceljs = await import("exceljs");
    const MockWorkbook = exceljs.Workbook as unknown as ReturnType<typeof vi.fn>;

    expect(MockWorkbook).toHaveBeenCalled();

    // Get the instance created
    const workbookInstance = MockWorkbook.mock.results[0].value;
    expect(workbookInstance.addWorksheet).toHaveBeenCalledWith("Resumo");

    // Find the 'Resumo' sheet mock
    // addWorksheet returns the same sheet mock object in our implementation, so we can just check calls
    const sheetMock = workbookInstance.addWorksheet.mock.results[0].value;
    const addRowsCalls = sheetMock.addRows.mock.calls;

    // Assuming Resumo is first call to addWorksheet and first call to addRows
    const summaryRows = addRowsCalls[0][0];

    expect(summaryRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ metric: "Total de Trades", value: 3 }),
        expect.objectContaining({ metric: "Lucro/Prejuízo Total", value: 250 }),
        expect.objectContaining({ metric: "Profit Factor", value: 6 }),
      ])
    );
  });

  it("should filter trades by date range", async () => {
    const startDate = new Date("2023-10-01");
    const endDate = new Date("2023-10-31");

    await generateReport("acc1", startDate, endDate);

    const exceljs = await import("exceljs");
    const MockWorkbook = exceljs.Workbook as unknown as ReturnType<typeof vi.fn>;
    const workbookInstance = MockWorkbook.mock.results[0].value;
    const sheetMock = workbookInstance.addWorksheet.mock.results[0].value;
    const summaryRows = sheetMock.addRows.mock.calls[0][0];

    // Should only have 2 trades (Oct 1 and Oct 2)
    expect(summaryRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ metric: "Total de Trades", value: 2 }),
        expect.objectContaining({ metric: "Lucro/Prejuízo Total", value: 50 }),
      ])
    );
  });

  it("should populate monthly metrics correctly", async () => {
    const startDate = new Date("2023-01-01");
    const endDate = new Date("2023-12-31");

    await generateReport("acc1", startDate, endDate);

    const exceljs = await import("exceljs");
    const MockWorkbook = exceljs.Workbook as unknown as ReturnType<typeof vi.fn>;
    const workbookInstance = MockWorkbook.mock.results[0].value;
    const sheetMock = workbookInstance.addWorksheet.mock.results[0].value;
    const addRowCalls = sheetMock.addRow.mock.calls;

    // Find expected monthly rows
    const OctoberRow = addRowCalls.find((call: any) => call[0].month === "Outubro 2023");
    const NovemberRow = addRowCalls.find((call: any) => call[0].month === "Novembro 2023");

    expect(OctoberRow[0]).toMatchObject({ trades: 2, wins: 1, losses: 1, pnl: 50 });
    expect(NovemberRow[0]).toMatchObject({ trades: 1, wins: 1, losses: 0, pnl: 200 });
  });
});
