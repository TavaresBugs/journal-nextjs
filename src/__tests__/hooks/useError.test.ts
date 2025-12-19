import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useError } from "../../hooks/useError";
import * as toastProvider from "../../providers/ToastProvider";
import * as errorsLib from "../../lib/errors";

vi.mock("../../providers/ToastProvider", () => ({
  useToast: vi.fn(),
}));

vi.mock("../../lib/errors", () => ({
  getErrorMessage: vi.fn(),
}));

describe("useError", () => {
  it("should handle error correctly", () => {
    const showToastMock = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (toastProvider.useToast as any).mockReturnValue({ showToast: showToastMock });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (errorsLib.getErrorMessage as any).mockReturnValue("Mocked Error Message");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useError());

    act(() => {
      result.current.handleError(new Error("Test"));
    });

    expect(errorsLib.getErrorMessage).toHaveBeenCalledWith(expect.any(Error));
    expect(consoleSpy).toHaveBeenCalledWith("[ErrorHandler]", expect.any(Error));
    expect(showToastMock).toHaveBeenCalledWith("Mocked Error Message", "error");

    consoleSpy.mockRestore();
  });
});
