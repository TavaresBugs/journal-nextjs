import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseTradovateCSV, parseTradovatePDF } from "../../services/trades/tradovateParser";

// Mock pdfjs-dist
vi.mock("pdfjs-dist", () => {
  return {
    default: {
      GlobalWorkerOptions: {
        workerSrc: "",
      },
      getDocument: vi.fn(),
    },
    GlobalWorkerOptions: {
      workerSrc: "",
    },
    getDocument: vi.fn(),
  };
});

describe("Tradovate Extended Parser Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("parseTradovateCSV", () => {
    // Helper to create mock File
    const createMockFile = (content: string, type = "text/csv") => {
      const blob = new Blob([content], { type });
      return new File([blob], "test.csv", { type });
    };

    // Helper to create UTF-16LE buffer
    const createUtf16LeFile = (content: string) => {
      const buffer = new ArrayBuffer(content.length * 2 + 2);
      const view = new Uint8Array(buffer);
      // BOM
      view[0] = 0xff;
      view[1] = 0xfe;
      // Content
      for (let i = 0; i < content.length; i++) {
        const code = content.charCodeAt(i);
        view[2 + i * 2] = code & 0xff;
        view[2 + i * 2 + 1] = (code >> 8) & 0xff;
      }
      return new File([buffer], "test_utf16.csv", { type: "text/csv" });
    };

    it("parses UTF-8 CSV file correctly", async () => {
      const csvContent = `symbol,qty,buyPrice,sellPrice,pnl,boughtTimestamp,soldTimestamp,duration
NQZ5,1,25501.00,25513.75,$255.00,11/30/2025 20:15:41,11/30/2025 20:21:56,6min`;

      const file = createMockFile(csvContent);
      const result = await parseTradovateCSV(file);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].symbol).toBe("NQZ5");
      expect(result.totalPnL).toBe(255);
    });

    it("parses UTF-16LE CSV file correctly (Tradovate default export)", async () => {
      const csvContent = `symbol,qty,buyPrice,sellPrice,pnl,boughtTimestamp,soldTimestamp,duration
ESZ5,1,5800.00,5805.00,$250.00,11/30/2025 20:15:41,11/30/2025 20:21:56,6min`;

      const file = createUtf16LeFile(csvContent);
      const result = await parseTradovateCSV(file);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].symbol).toBe("ESZ5");
      expect(result.totalPnL).toBe(250);
    });

    it("handles empty file error", async () => {
      const file = new File([], "empty.csv");
      await expect(parseTradovateCSV(file)).rejects.toThrow("File is empty");
    });
  });

  describe("parseTradovatePDF", () => {
    it("parses PDF text content with Standard Regex", async () => {
      // Mock pdfjs-dist
      const pdfjs = await import("pdfjs-dist");

      const mockPage = {
        getTextContent: vi.fn().mockResolvedValue({
          items: [
            { str: "TRADES" },
            { str: "Symbol Qty Buy Price" },
            {
              str: "NQZ5 1 25501.00 11/30/2025 20:15:41 6min 11/30/2025 20:21:56 25513.75 $255.00",
            },
          ],
        }),
      };

      const mockPdf = {
        numPages: 1,
        getPage: vi.fn().mockResolvedValue(mockPage),
      };

      (pdfjs.getDocument as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        promise: Promise.resolve(mockPdf),
      });

      const file = new File(["dummy pdf content"], "test.pdf", { type: "application/pdf" });
      const result = await parseTradovatePDF(file);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].symbol).toBe("NQZ5");
      expect(result.data[0].pnl).toBe("$255.00");
    });

    it("parses PDF with Flex Regex (fallback)", async () => {
      const pdfjs = await import("pdfjs-dist");

      const mockPage = {
        getTextContent: vi.fn().mockResolvedValue({
          items: [
            { str: "TRADES" },
            // Slightly different format that standard regex might miss, but flex should catch
            // e.g. multi-line or different spacing
            {
              str: "MNQZ5 1 18,500.00 11/30/2025 10:00:00 ... 11/30/2025 10:05:00 18,510.00 $20.00",
            },
          ],
        }),
      };

      const mockPdf = {
        numPages: 1,
        getPage: vi.fn().mockResolvedValue(mockPage),
      };

      (pdfjs.getDocument as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        promise: Promise.resolve(mockPdf),
      });

      const file = new File(["dummy"], "test.pdf");
      const result = await parseTradovatePDF(file);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].symbol).toBe("MNQZ5");
      expect(result.totalPnL).toBe(20);
    });

    it("throws error if no trades found", async () => {
      const pdfjs = await import("pdfjs-dist");

      const mockPage = {
        getTextContent: vi.fn().mockResolvedValue({
          items: [{ str: "Just some random text header" }, { str: "No trades here" }],
        }),
      };

      const mockPdf = {
        numPages: 1,
        getPage: vi.fn().mockResolvedValue(mockPage),
      };

      (pdfjs.getDocument as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        promise: Promise.resolve(mockPdf),
      });

      const file = new File(["dummy"], "empty.pdf");
      await expect(parseTradovatePDF(file)).rejects.toThrow("Nenhum trade encontrado");
    });
  });
});
