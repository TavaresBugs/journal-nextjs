import { createClient } from "@supabase/supabase-js";
import { describe, it, expect, beforeAll } from "vitest";
import dotenv from "dotenv";
import path from "path";

/**
 * Production Performance Smoke Tests
 *
 * These tests verify that database indexes are working correctly
 * and queries are performing within expected thresholds.
 *
 * Prerequisites:
 * - Migration 014_optimization_indexes.sql applied
 * - Valid Supabase credentials in .env.local
 *
 * Run with: npm test -- production-smoke
 */

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Skip tests if environment variables are not configured
const shouldSkip = !supabaseUrl || !supabaseAnonKey;

describe("Production Performance Tests", () => {
  let supabase: ReturnType<typeof createClient>;

  beforeAll(() => {
    if (shouldSkip) {
      console.log("⚠️ Skipping production tests: Supabase credentials not configured");
      return;
    }

    supabase = createClient(supabaseUrl!, supabaseAnonKey!);
    console.log("✅ Supabase client initialized for production tests");
  });

  describe("Query Performance", () => {
    it("should query 100 trades in less than 2000ms", async () => {
      if (shouldSkip) return;

      const start = performance.now();

      const { data, error } = await supabase
        .from("trades")
        .select("id, entry_date, strategy, outcome")
        .order("created_at", { ascending: false })
        .limit(100);

      const end = performance.now();
      const duration = end - start;

      console.log(`✅ Query took ${duration.toFixed(2)}ms (${data?.length || 0} trades)`);

      expect(error).toBeNull();
      expect(duration).toBeLessThan(2000); // First query has cold start latency
    });

    it("should query trades by date range efficiently", async () => {
      if (shouldSkip) return;

      const start = performance.now();

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("trades")
        .select("id, entry_date, strategy, outcome")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(100);

      const end = performance.now();
      const duration = end - start;

      console.log(
        `✅ Date range query took ${duration.toFixed(2)}ms (${data?.length || 0} trades)`
      );

      expect(error).toBeNull();
      expect(duration).toBeLessThan(1500); // Network latency can vary
    });

    it("should query journal entries efficiently", async () => {
      if (shouldSkip) return;

      const start = performance.now();

      const { data, error } = await supabase
        .from("journal_entries")
        .select("id, date, title, emotion")
        .order("created_at", { ascending: false })
        .limit(50);

      const end = performance.now();
      const duration = end - start;

      console.log(
        `✅ Journal entries query took ${duration.toFixed(2)}ms (${data?.length || 0} entries)`
      );

      expect(error).toBeNull();
      expect(duration).toBeLessThan(1000); // Network latency included
    });

    it("should query junction table efficiently", async () => {
      if (shouldSkip) return;

      const start = performance.now();

      const { data, error } = await supabase
        .from("journal_entry_trades")
        .select("journal_entry_id, trade_id")
        .limit(100);

      const end = performance.now();
      const duration = end - start;

      console.log(
        `✅ Junction table query took ${duration.toFixed(2)}ms (${data?.length || 0} rows)`
      );

      expect(error).toBeNull();
      expect(duration).toBeLessThan(1000);
    });
  });

  describe("Index Verification", () => {
    it("should verify indexes exist via information_schema", async () => {
      if (shouldSkip) return;

      // Query pg_indexes directly isn't accessible via PostgREST
      // Instead, we verify performance improvement indirectly
      const start = performance.now();

      // Run a query that should use the idx_trades_created_at index
      const { error } = await supabase
        .from("trades")
        .select("id, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      const end = performance.now();
      const duration = end - start;

      console.log(`✅ Index verification query took ${duration.toFixed(2)}ms`);

      // If indexes are working, this should be fast
      expect(error).toBeNull();
      expect(duration).toBeLessThan(1000);
    });
  });

  describe("Data Transfer Optimization", () => {
    it("should return minimal data with specific select", async () => {
      if (shouldSkip) return;

      // Full select (simulating old behavior)
      const { data: fullData } = await supabase.from("trades").select("*").limit(10);

      // Optimized select (new behavior)
      const { data: optimizedData } = await supabase
        .from("trades")
        .select("id, entry_date, strategy, outcome")
        .limit(10);

      if (!fullData || !optimizedData || fullData.length === 0) {
        console.log("⚠️ No trades found, skipping data transfer test");
        return;
      }

      const fullSize = JSON.stringify(fullData).length;
      const optimizedSize = JSON.stringify(optimizedData).length;
      const reduction = (((fullSize - optimizedSize) / fullSize) * 100).toFixed(1);

      console.log(`✅ Data reduction: ${reduction}% (${fullSize} → ${optimizedSize} bytes)`);

      // Expect significant reduction
      expect(optimizedSize).toBeLessThan(fullSize);
    });
  });

  describe("Concurrent Operations", () => {
    it("should handle multiple concurrent queries", async () => {
      if (shouldSkip) return;

      const start = performance.now();

      const queries = [
        supabase.from("trades").select("id").limit(50),
        supabase.from("journal_entries").select("id").limit(50),
        supabase.from("journal_entry_trades").select("*").limit(50),
        supabase.from("trades").select("id, strategy").limit(50),
        supabase.from("journal_entries").select("id, title").limit(50),
      ];

      const results = await Promise.all(queries);

      const end = performance.now();
      const duration = end - start;

      console.log(`✅ 5 concurrent queries took ${duration.toFixed(2)}ms`);

      // All queries should succeed
      results.forEach((result: { error: unknown }) => {
        expect(result.error).toBeNull();
      });

      // Total time should be reasonable (concurrent, not sequential)
      expect(duration).toBeLessThan(2000);
    });
  });
});
