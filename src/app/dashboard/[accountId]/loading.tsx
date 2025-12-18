import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";

/**
 * Loading state for the dashboard route
 * Automatically shown by Next.js App Router during navigation
 */
export default function Loading() {
  return <DashboardSkeleton />;
}
