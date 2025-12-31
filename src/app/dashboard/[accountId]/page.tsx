import { notFound } from "next/navigation";
import { isValidUUID } from "@/lib/validation/uuid";
import { getDashboardAccountAction, DashboardInitResult } from "@/app/actions/_batch/dashboardInit";
import { DashboardClient } from "./DashboardClient";

/**
 * Dashboard Page - Server Component
 *
 * LCP OPTIMIZATION: Fetches account data on the server before sending HTML.
 * This allows the browser to render the header with account name immediately,
 * reducing LCP from ~10s (client-side fetch) to ~1-2s (server render).
 */
export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ accountId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { accountId } = await params;

  // Validate UUID format
  if (!isValidUUID(accountId)) {
    notFound();
  }

  // Fetch ONLY account data on server for instant LCP (Fast)
  // The rest (Metrics, Trades) will be fetched by the client (Lazy)
  // This solves the 31s LCP issue by unblocking the initial HTML response.
  const accountData = await getDashboardAccountAction(accountId);

  if (!accountData) {
    notFound();
  }

  const { date: queryDate } = await searchParams;

  // Pass only account data, let client fetch the rest
  const initialData: DashboardInitResult = {
    account: accountData,
    metrics: null,
    trades: undefined,
    // metrics and trades are undefined, triggering client-side fetch
  };

  return <DashboardClient accountId={accountId} initialData={initialData} queryDate={queryDate} />;
}
