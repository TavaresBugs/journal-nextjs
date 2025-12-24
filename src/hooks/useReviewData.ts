"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyReviewsAction } from "@/app/actions/reviews";

export const reviewKeys = {
  all: ["reviews"] as const,
  mine: () => [...reviewKeys.all, "mine"] as const,
};

/**
 * Hook to fetch user's reviews (feedback) with caching
 */
export function useMyReviews() {
  return useQuery({
    queryKey: reviewKeys.mine(),
    queryFn: getMyReviewsAction,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false,
  });
}
