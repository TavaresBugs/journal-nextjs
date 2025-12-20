import { act } from "@testing-library/react";

/**
 * Helper to wait for async operations in tests
 */
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Wrapper for async state updates preventing act() warnings
 */
export const asyncAct = async (callback: () => Promise<void>) => {
  await act(async () => {
    await callback();
  });
};

/**
 * Date helper for fixed test dates
 */
export const getFixedDate = () => new Date("2025-12-19T12:00:00Z");
