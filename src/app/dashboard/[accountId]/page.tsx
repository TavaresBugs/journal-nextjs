import { notFound } from "next/navigation";
import { isValidUUID } from "@/lib/validation/uuid";
import { getAccountById } from "@/app/actions/accounts";
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

  // Fetch account on server for instant LCP
  const account = await getAccountById(accountId);

  if (!account) {
    notFound();
  }

  const { date: queryDate } = await searchParams;

  // Pass prefetched account to client component for immediate rendering
  return (
    <DashboardClient accountId={accountId} prefetchedAccount={account} queryDate={queryDate} />
  );
}
