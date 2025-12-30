"use client";

// Validate if accountId is a valid UUID
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface AccountValidation {
  isValidAccount: boolean;
}

/**
 * Hook for validating account ID format.
 * Note: Server component (page.tsx) handles redirect with notFound() for invalid UUIDs.
 * This hook just provides validation state for client-side logic.
 *
 * @param accountId - The account ID to validate
 * @returns Validation state
 */
export function useAccountValidation(accountId: string): AccountValidation {
  const isValidAccount = UUID_REGEX.test(accountId);

  return {
    isValidAccount,
  };
}
