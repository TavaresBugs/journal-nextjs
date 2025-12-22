import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parseTradingFile, parseHTMLReport } from "../../services/trades/import";

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        xlsx: { load: any };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onload: ((e: any) => void) | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onerror: ((e: any) => void) | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: any = null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (file as any)._buffer = encoder.encode(content).buffer;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
});
