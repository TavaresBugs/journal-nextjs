"use client";
import { supabase } from "@/lib/supabase";
import { TradeRepository } from "@/lib/repositories/TradeRepository";
import { useEffect, useState } from "react";

interface TestResult {
  name: string;
  status: "running" | "pass" | "fail";
  duration?: number;
  data?: unknown;
  error?: string;
}

export default function TestRepoPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function runTests() {
      const repo = new TradeRepository(supabase);
      const testResults: TestResult[] = [];

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      if (!user) {
        setResults([
          {
            name: "Auth Check",
            status: "fail",
            error: "Not logged in. Please login first.",
          },
        ]);
        return;
      }

      // Test 1: getByJournalId with a real journal
      console.log("🧪 Test 1: getByJournalId");
      const test1Start = performance.now();
      try {
        // First get a journal ID from the database
        const { data: journals } = await supabase
          .from("journal_entries")
          .select("id")
          .eq("user_id", user.id)
          .limit(1);

        if (journals && journals.length > 0) {
          const result = await repo.getByJournalId(journals[0].id, { detailed: false });
          const duration = performance.now() - test1Start;

          console.info("Test 1 Result:", {
            tradeCount: result.data?.length,
            error: result.error,
            duration: `${duration.toFixed(2)}ms`,
          });

          testResults.push({
            name: "getByJournalId (basic fragment)",
            status: result.error ? "fail" : "pass",
            duration,
            data: { tradesCount: result.data?.length, firstTrade: result.data?.[0] },
            error: result.error?.message,
          });
        } else {
          testResults.push({
            name: "getByJournalId",
            status: "fail",
            error: "No journals found in database",
          });
        }
      } catch (err) {
        testResults.push({
          name: "getByJournalId",
          status: "fail",
          error: String(err),
        });
      }

      // Test 2: getByIdDomain with a real trade
      console.log("🧪 Test 2: getByIdDomain");
      const test2Start = performance.now();
      try {
        const { data: trades } = await supabase
          .from("trades")
          .select("id")
          .eq("user_id", user.id)
          .limit(1);

        if (trades && trades.length > 0) {
          const result = await repo.getByIdDomain(trades[0].id, user.id);
          const duration = performance.now() - test2Start;

          console.info("Test 2 Result:", {
            tradeId: result.data?.id,
            error: result.error,
            duration: `${duration.toFixed(2)}ms`,
          });

          testResults.push({
            name: "getByIdDomain (with auth)",
            status: result.error ? "fail" : "pass",
            duration,
            data: result.data,
            error: result.error?.message,
          });
        } else {
          testResults.push({
            name: "getByIdDomain",
            status: "fail",
            error: "No trades found in database",
          });
        }
      } catch (err) {
        testResults.push({
          name: "getByIdDomain",
          status: "fail",
          error: String(err),
        });
      }

      // Test 3: getByIdWithAuth with WRONG userId (should fail)
      console.log("🧪 Test 3: getByIdWithAuth (unauthorized)");
      const test3Start = performance.now();
      try {
        const { data: trades } = await supabase
          .from("trades")
          .select("id")
          .eq("user_id", user.id)
          .limit(1);

        if (trades && trades.length > 0) {
          const result = await repo.getByIdWithAuth(trades[0].id, "fake-wrong-user-id");
          const duration = performance.now() - test3Start;

          console.warn("Test 3 Result (should be error):", {
            error: result.error,
            duration: `${duration.toFixed(2)}ms`,
          });

          // This test PASSES if we get an auth error
          const isExpectedError = result.error?.code === "AUTH_FORBIDDEN";
          testResults.push({
            name: "getByIdWithAuth (wrong userId - should fail)",
            status: isExpectedError ? "pass" : "fail",
            duration,
            data: null,
            error: isExpectedError ? "Correctly rejected (AUTH_FORBIDDEN)" : result.error?.message,
          });
        } else {
          testResults.push({
            name: "getByIdWithAuth",
            status: "fail",
            error: "No trades found in database",
          });
        }
      } catch (err) {
        testResults.push({
          name: "getByIdWithAuth",
          status: "fail",
          error: String(err),
        });
      }

      // Test 4: getByAccountId
      console.log("🧪 Test 4: getByAccountId");
      const test4Start = performance.now();
      try {
        const { data: accounts } = await supabase
          .from("accounts")
          .select("id")
          .eq("user_id", user.id)
          .limit(1);

        if (accounts && accounts.length > 0) {
          const result = await repo.getByAccountId(accounts[0].id, { detailed: false });
          const duration = performance.now() - test4Start;

          console.info("Test 4 Result:", {
            tradesCount: result.data?.length,
            duration: `${duration.toFixed(2)}ms`,
          });

          testResults.push({
            name: "getByAccountId",
            status: result.error ? "fail" : "pass",
            duration,
            data: { tradesCount: result.data?.length },
            error: result.error?.message,
          });
        } else {
          testResults.push({
            name: "getByAccountId",
            status: "fail",
            error: "No accounts found",
          });
        }
      } catch (err) {
        testResults.push({
          name: "getByAccountId",
          status: "fail",
          error: String(err),
        });
      }

      setResults(testResults);
    }

    runTests();
  }, []);

  const passCount = results.filter((r) => r.status === "pass").length;
  const failCount = results.filter((r) => r.status === "fail").length;

  return (
    <div className="min-h-screen bg-gray-900 p-8 text-white">
      <h1 className="mb-4 text-2xl font-bold">🧪 TradeRepository Manual Tests</h1>

      <div className="mb-4">
        <p>
          User ID:{" "}
          <code className="rounded bg-gray-700 px-2 py-1">{userId || "Not logged in"}</code>
        </p>
      </div>

      <div className="mb-4 flex gap-4">
        <span className="text-green-400">✅ Passed: {passCount}</span>
        <span className="text-red-400">❌ Failed: {failCount}</span>
      </div>

      <div className="space-y-4">
        {results.map((result, i) => (
          <div
            key={i}
            className={`rounded border p-4 ${
              result.status === "pass"
                ? "border-green-500 bg-green-900/20"
                : result.status === "fail"
                  ? "border-red-500 bg-red-900/20"
                  : "border-yellow-500 bg-yellow-900/20"
            }`}
          >
            <div className="mb-2 flex items-center gap-2">
              <span>
                {result.status === "pass" ? "✅" : result.status === "fail" ? "❌" : "⏳"}
              </span>
              <strong>{result.name}</strong>
              {result.duration && (
                <span className="text-sm text-gray-400">({result.duration.toFixed(2)}ms)</span>
              )}
            </div>

            {result.error && <div className="mb-2 text-sm text-red-300">Error: {result.error}</div>}

            {result.data !== null && result.data !== undefined ? (
              <pre className="max-h-40 overflow-auto rounded bg-gray-800 p-2 text-xs">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-8 text-sm text-gray-400">
        <p>Open browser DevTools (F12) to see structured logs from Logger.</p>
        <p>Check for slow query warnings if any query takes more than 1000ms.</p>
      </div>
    </div>
  );
}
