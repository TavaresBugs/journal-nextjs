import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useBlockBodyScroll } from "../../hooks/useBlockBodyScroll";

describe("useBlockBodyScroll", () => {
  beforeEach(() => {
    // Reset styles
    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    document.body.style.touchAction = "";
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    // Reset internal lockCount logic if possible?
    // Since it's a module level variable, we can't easily reset it without re-importing or exposing a reset function.
    // Or we assume tests run sequentially and we just need to ensure we unmount everything to decrement count to 0.
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should lock body scroll when open", () => {
    const { unmount } = renderHook(() => useBlockBodyScroll(true));

    expect(document.body.style.overflow).toBe("hidden");
    expect(document.body.style.position).toBe("fixed");

    unmount();

    expect(document.body.style.overflow).toBe("");
    expect(document.body.style.position).toBe("");
  });

  it("should not lock body scroll when closed", () => {
    renderHook(() => useBlockBodyScroll(false));
    expect(document.body.style.overflow).toBe("");
  });

  it("should handle nested locks", () => {
    // First lock
    const hook1 = renderHook(() => useBlockBodyScroll(true));
    expect(document.body.style.overflow).toBe("hidden");

    // Second lock (nested)
    const hook2 = renderHook(() => useBlockBodyScroll(true));

    // Unmount second
    hook2.unmount();
    // Should still be locked because hook1 is active
    expect(document.body.style.overflow).toBe("hidden");

    // Unmount first
    hook1.unmount();
    // Now it should be free
    expect(document.body.style.overflow).toBe("");
  });
});
