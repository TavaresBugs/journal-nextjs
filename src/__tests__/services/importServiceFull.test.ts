/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  parseTradingFile,
  parseHTMLReport,
  parseTradeDate,
  normalizeTradeType,
  cleanSymbol,
  parseNinjaTraderMoney,
  parseNinjaTraderDate,
  parseNinjaTraderContent,
} from "../../services/trades/import";

// Shared mocks using vi.hoisted
const { mockLoad, mockGetWorksheet } = vi.hoisted(() => {
  return {
    mockLoad: vi.fn(),
    mockGetWorksheet: vi.fn(),
  };
});

// Mock ExcelJS as class
vi.mock("exceljs", () => {
  return {
    default: {
      Workbook: class MockWorkbook {
        xlsx: { load: any };

        getWorksheet: any;
        constructor() {
          this.xlsx = { load: mockLoad };
          this.getWorksheet = mockGetWorksheet;
        }
      },
    },
  };
});

// Mock FileReader manually to avoid JSDOM issues/timeouts
class MockFileReader {
  onload: ((e: any) => void) | null = null;

  onerror: ((e: any) => void) | null = null;

  result: any = null;

  readAsArrayBuffer(file: any) {
    try {
      let buffer;
      if (file._buffer) {
        buffer = file._buffer;
      } else {
        buffer = new ArrayBuffer(0);
      }

      this.result = buffer;
      if (this.onload) {
        this.onload({ target: { result: buffer } });
      }
    } catch (err: any) {
      if (this.onerror) {
        this.onerror(err);
      }
    }
  }
}

describe("Import Service Extended Tests", () => {
  const originalFileReader = global.FileReader;

  beforeEach(() => {
    vi.clearAllMocks();
    // Default success behavior
    mockLoad.mockResolvedValue(undefined);
    mockGetWorksheet.mockReturnValue({
      eachRow: vi.fn(),
    });

    // Replace FileReader

    global.FileReader = MockFileReader as any;
  });

  afterEach(() => {
    global.FileReader = originalFileReader;
  });

  const createMockFile = (content: ArrayBuffer | string, name: string, type: string) => {
    const blob = new Blob([content], { type });
    const file = new File([blob], name, { type });
    // Inject _buffer for our MockFileReader to find it easily
    if (typeof content === "string") {
      const encoder = new TextEncoder();

      (file as any)._buffer = encoder.encode(content).buffer;
    } else {
      (file as any)._buffer = content;
    }
    return file;
  };

  describe("parseTradingFile - File Detection", () => {
    it("detects regular CSV file", async () => {
      const csv = "Time,Symbol,Type,Price\n2025-01-01,EURUSD,Buy,1.0500";
      const file = createMockFile(csv, "test.csv", "text/csv");

      // We expect it to fail later finding "Positions" section,
      // but it confirms it entered the CSV path if it throws the specific "Positions" error
      // instead of "Not a valid XLSX"
      await expect(parseTradingFile(file)).rejects.toThrow(
        'Section "Positions"/"Posições" not found'
      );
    });

    it("throws error for invalid XLSX (not ZIP and not HTML)", async () => {
      const garbage = new Uint8Array([0x00, 0x01, 0x02, 0x03]); // Not PK..
      const file = createMockFile(garbage.buffer, "bad.xlsx", "application/octet-stream");

      await expect(parseTradingFile(file)).rejects.toThrow(
        "O arquivo não parece ser um Excel válido"
      );
    });

    it("handles ExcelJS disallowed character error", async () => {
      // Override mock for this specific test
      mockLoad.mockRejectedValue(new Error("disallowed character in sheet"));

      // Create a valid-looking ZIP header so it tries to use ExcelJS
      const zipHeader = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
      const file = createMockFile(
        zipHeader.buffer,
        "corrupt.xlsx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      await expect(parseTradingFile(file)).rejects.toThrow(
        "abra o arquivo Excel e salve-o com o mesmo nome novamente"
      );
    });
  });

  describe("parseHTMLReport - Encodings", () => {
    // Helper to generic HTML
    const getHtml = (price = "1.00") => `
      <html>
        <body>
          <table>
            <tr><td><b>Positions</b></td></tr>
            <tr>
              <td>Time</td><td>Ticket</td><td>Symbol</td><td>Type</td><td>Volume</td><td>Price</td>
              <td>S/L</td><td>T/P</td><td>Time</td><td>Price</td><td>Comm</td><td>Swap</td><td>Profit</td>
            </tr>
            <tr>
              <td>2025.01.01</td><td>1</td><td>EURUSD</td><td>buy</td><td>1</td><td>${price}</td>
              <td>0</td><td>0</td><td>2025.01.01</td><td>1.10</td><td>0</td><td>0</td><td>100.00</td>
            </tr>
          </table>
          <table>
             <tr><td>Total Net Profit:</td><td><b>100.00</b></td></tr>
          </table>
        </body>
      </html>
    `;

    it("parses UTF-16LE HTML report", async () => {
      const html = getHtml();
      const buffer = new ArrayBuffer(html.length * 2 + 2);
      const view = new Uint8Array(buffer);
      view[0] = 0xff;
      view[1] = 0xfe;
      for (let i = 0; i < html.length; i++) {
        const code = html.charCodeAt(i);
        view[2 + i * 2] = code & 0xff;
        view[2 + i * 2 + 1] = (code >> 8) & 0xff;
      }

      const file = createMockFile(buffer, "report.html", "text/html");
      const result = await parseHTMLReport(file);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].Symbol).toBe("EURUSD");
      expect(result.totalNetProfit).toBe(100);
    });

    it("parses UTF-16BE HTML report", async () => {
      const html = getHtml();
      const buffer = new ArrayBuffer(html.length * 2 + 2);
      const view = new Uint8Array(buffer);
      view[0] = 0xfe;
      view[1] = 0xff;
      for (let i = 0; i < html.length; i++) {
        const code = html.charCodeAt(i);
        view[2 + i * 2 + 1] = code & 0xff;
        view[2 + i * 2] = (code >> 8) & 0xff;
      }

      const file = createMockFile(buffer, "report_be.html", "text/html");
      const result = await parseHTMLReport(file);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].Symbol).toBe("EURUSD");
    });

    it("parses MT4 HTML report (13 columns)", async () => {
      const html = getHtml();
      const file = createMockFile(html, "mt4.html", "text/html");
      const result = await parseHTMLReport(file);

      expect(result.data[0].Profit).toBe("100.00");
    });
  });

  describe("parseTradingFile - XLSX", () => {
    it("parses valid XLSX with standard Columns", async () => {
      // Mock loading logic
      mockLoad.mockResolvedValue(undefined);

      const rows = [
        ["Positions"], // Row 1: Section Header
        [
          "Time",
          "Symbol",
          "Type",
          "Volume",
          "Price",
          "S / L",
          "T / P",
          "Time",
          "Price",
          "Commission",
          "Swap",
          "Profit",
        ], // Row 2: Header
        ["2025.01.01 10:00", "EURUSD", "buy", 1, 1.05, 0, 0, "2025.01.01 11:00", 1.06, 0, 0, 100], // Row 3: Data
      ];

      mockGetWorksheet.mockReturnValue({
        eachRow: (callback: any) => {
          rows.forEach((row, index) => {
            // ExcelJS uses 1-based indexing for rows
            callback({ values: [null, ...row] }, index + 1);
          });
        },
      });

      // Create ZIP header to pass "isZip" check
      const zipHeader = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
      const file = createMockFile(
        zipHeader.buffer,
        "trades.xlsx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      const result = await parseTradingFile(file);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].Symbol).toBe("EURUSD");
      expect(result.data[0].Profit).toBe(100);
    });
  });

  describe("parseTradingFile - CSV", () => {
    it("parses valid CSV", async () => {
      const csvContent = `Positions
Time,Symbol,Type,Volume,Entry Price,S / L,T / P,Exit Time,Exit Price,Commission,Swap,Profit
2025.01.01 10:00,GBPUSD,sell,1,1.25,0,0,2025.01.01 11:00,1.24,0,0,100`;

      const file = createMockFile(csvContent, "trades.csv", "text/csv");
      const result = await parseTradingFile(file);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].Symbol).toBe("GBPUSD");
      expect(result.data[0].Type).toBe("sell");
      // Note: CSV parser splits by comma, so numbers might be strings depending on implementation
      // The implementation maps cells to string | number.
      expect(Number(result.data[0].Profit)).toBe(100);
    });
  });
});

describe("Import Utils", () => {
  describe("parseTradeDate", () => {
    it("parses various date formats", () => {
      expect(parseTradeDate("2023.10.01 10:00:00")?.toISOString()).toContain("2023-10-01");
      expect(parseTradeDate("2023/10/01 10:00:00")?.toISOString()).toContain("2023-10-01");
      expect(parseTradeDate("01-10-2023 10:00:00")?.toISOString()).toContain("2023-10-01");
      // expect(parseTradeDate(45200)?.getFullYear()).toBe(2023); // Approximate excel date, might vary by timezone
    });
  });

  describe("normalizeTradeType", () => {
    it("normalizes types", () => {
      expect(normalizeTradeType("Buy")).toBe("Long");
      expect(normalizeTradeType("sell")).toBe("Short");
      expect(normalizeTradeType("Compra")).toBe(null); // Unless "Comprada" matches
    });
  });

  describe("cleanSymbol", () => {
    it("cleans symbols", () => {
      expect(cleanSymbol("EURUSD.cash")).toBe("EURUSD");
      expect(cleanSymbol("MNQ 12-25")).toBe("MNQ");
      expect(cleanSymbol("ES 03-25")).toBe("ES");
    });
  });

  describe("NinjaTrader Parsers", () => {
    it("parses money formats", () => {
      expect(parseNinjaTraderMoney("$ 1,000.00")).toBe(1000);
      expect(parseNinjaTraderMoney("1.000,00")).toBe(1000); // PT
      expect(parseNinjaTraderMoney("($ 100.00)")).toBe(-100);
    });

    it("parses dates", () => {
      // 12/19/2024 8:44:03 AM
      const d = parseNinjaTraderDate("12/19/2024 8:44:03 AM");
      expect(d?.getDate()).toBe(19);
      expect(d?.getFullYear()).toBe(2024);
    });
  });

  describe("parseNinjaTraderContent", () => {
    it("parses valid NinjaTrader CSV content", () => {
      const content = `Instrument;Market position;Avg. entry price;Avg. exit price;Time of entry;Time of exit;Trade number
ES 03-25;Long;4000;4010;2023-01-01 10:00;2023-01-01 11:00;101`;

      const result = parseNinjaTraderContent(content);
      expect(result.data).toHaveLength(1);
      // Check column extraction
      expect(result.data[0]["Instrument"]).toBe("ES 03-25");
      expect(result.data[0]["Trade number"]).toBe("101");
    });
  });
});
