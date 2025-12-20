"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Validate if accountId is a valid UUID
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface AccountValidation {
  isValidAccount: boolean;
}

/**
 * Hook for validating account ID format and handling redirects.
 * Validates if the provided accountId is a valid UUID and redirects to home if invalid.
 *
 * @param accountId - The account ID to validate
 * @returns Validation state
 */
export function useAccountValidation(accountId: string): AccountValidation {
  const router = useRouter();

  const isValidAccount = UUID_REGEX.test(accountId);

  // Redirect if invalid account format
  useEffect(() => {
    if (!isValidAccount) {
      router.push("/");
    }
  }, [isValidAccount, router]);

  return {
    isValidAccount,
  };
}
