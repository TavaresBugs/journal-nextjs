import { notFound } from "next/navigation";
import { isValidUUID } from "@/lib/validation/uuid";
import { batchDashboardInitAction } from "@/app/actions/_batch/dashboardInit";
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

  // Fetch ALL dashboard data on server for instant LCP
  // This includes Account, Metrics, and First Page of Trades
  const initData = await batchDashboardInitAction(accountId);

  if (!initData || !initData.account) {
    notFound();
  }

  const { date: queryDate } = await searchParams;

  // Pass full initial data to client component for immediate rendering
  return <DashboardClient accountId={accountId} initialData={initData} queryDate={queryDate} />;
}
