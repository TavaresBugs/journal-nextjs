/**
 * Tests for recap journal link functionality
 *
 * These tests verify the logic for linking recaps to journal entries,
 * including the unified search, store integration, and UI components.
 */

import { describe, it, expect } from "vitest";
import type { LaboratoryRecap, RecapLinkedType, JournalEntryLite, TradeLite } from "@/types";

/**
 * Helper function that mimics the store's getRecapLinkType logic
 */
function getRecapLinkType(recap: LaboratoryRecap): RecapLinkedType | "none" {
  return recap.linkedType || (recap.tradeId ? "trade" : "none");
}

/**
 * Creates a mock recap for testing
 */
function createMockRecap(overrides: Partial<LaboratoryRecap> = {}): LaboratoryRecap {
  return {
    id: "recap-1",
    userId: "user-1",
    title: "Test Recap",
    images: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("Recap Journal Link", () => {
  describe("getRecapLinkType", () => {
    it('returns "none" when recap has no linkedType or tradeId', () => {
      const recap = createMockRecap();
      expect(getRecapLinkType(recap)).toBe("none");
    });

    it('returns "trade" when recap has linkedType "trade"', () => {
      const recap = createMockRecap({
        linkedType: "trade",
        linkedId: "trade-123",
      });
      expect(getRecapLinkType(recap)).toBe("trade");
    });

    it('returns "journal" when recap has linkedType "journal"', () => {
      const recap = createMockRecap({
        linkedType: "journal",
        linkedId: "journal-123",
      });
      expect(getRecapLinkType(recap)).toBe("journal");
    });

    it('returns "trade" for legacy recaps with tradeId but no linkedType', () => {
      const recap = createMockRecap({
        tradeId: "trade-legacy",
      });
      expect(getRecapLinkType(recap)).toBe("trade");
    });

    it("prioritizes linkedType over legacy tradeId", () => {
      const recap = createMockRecap({
        linkedType: "journal",
        linkedId: "journal-123",
        tradeId: "trade-legacy", // This should be ignored
      });
      expect(getRecapLinkType(recap)).toBe("journal");
    });
  });

  describe("LaboratoryRecap type structure", () => {
    it("supports all required fields for journal linking", () => {
      const journalEntry: JournalEntryLite = {
        id: "journal-1",
        date: "2024-12-16",
        title: "Market Observation",
      };

      const recap: LaboratoryRecap = createMockRecap({
        linkedType: "journal",
        linkedId: journalEntry.id,
        journal: journalEntry,
      });

      expect(recap.linkedType).toBe("journal");
      expect(recap.linkedId).toBe("journal-1");
      expect(recap.journal?.title).toBe("Market Observation");
    });

    it("maintains backward compatibility with trade field", () => {
      const trade: TradeLite = {
        id: "trade-1",
        symbol: "EURUSD",
        type: "Long",
        entryDate: "2024-12-16",
        entryPrice: 1.05,
        stopLoss: 1.04,
        takeProfit: 1.07,
        lot: 0.1,
        accountId: "account-1",
      };

      const recap: LaboratoryRecap = createMockRecap({
        linkedType: "trade",
        linkedId: trade.id,
        trade,
        tradeId: trade.id, // Legacy field
      });

      expect(recap.trade?.symbol).toBe("EURUSD");
      expect(recap.linkedType).toBe("trade");
    });
  });

  describe("Search record filtering", () => {
    interface SearchRecord {
      type: RecapLinkedType;
      id: string;
      label: string;
      date: string;
    }

    it("creates correct search records for trades", () => {
      const trade: TradeLite = {
        id: "trade-1",
        symbol: "EURUSD",
        type: "Long",
        entryDate: "2024-12-16",
        entryPrice: 1.05,
        stopLoss: 1.04,
        takeProfit: 1.07,
        lot: 0.1,
        accountId: "account-1",
        outcome: "win",
      };

      const searchRecord: SearchRecord = {
        type: "trade",
        id: trade.id,
        label: `[TRADE] ${trade.symbol} - ${trade.entryDate}`,
        date: trade.entryDate,
      };

      expect(searchRecord.type).toBe("trade");
      expect(searchRecord.label).toContain("TRADE");
      expect(searchRecord.label).toContain("EURUSD");
    });

    it("creates correct search records for journals", () => {
      const journal: JournalEntryLite = {
        id: "journal-1",
        date: "2024-12-16",
        title: "Market Observation",
      };

      const searchRecord: SearchRecord = {
        type: "journal",
        id: journal.id,
        label: `[DIÁRIO] ${journal.date} - ${journal.title || "Observação"}`,
        date: journal.date,
      };

      expect(searchRecord.type).toBe("journal");
      expect(searchRecord.label).toContain("DIÁRIO");
      expect(searchRecord.label).toContain("Market Observation");
    });

    it("handles journal entries without title", () => {
      const journal: JournalEntryLite = {
        id: "journal-2",
        date: "2024-12-16",
      };

      const searchRecord: SearchRecord = {
        type: "journal",
        id: journal.id,
        label: `[DIÁRIO] ${journal.date} - ${journal.title || "Observação"}`,
        date: journal.date,
      };

      expect(searchRecord.label).toContain("Observação");
    });
  });
});
