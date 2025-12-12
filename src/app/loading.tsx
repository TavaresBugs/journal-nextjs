import { AccountSelectionSkeleton } from '@/components/accounts/AccountSelectionSkeleton';

/**
 * Loading state for the root route (account selection)
 * Automatically shown by Next.js App Router during navigation
 */
export default function Loading() {
    return <AccountSelectionSkeleton />;
}
