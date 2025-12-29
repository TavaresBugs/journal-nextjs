import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should lock body scroll when open", async () => {
    const { unmount } = renderHook(() => useBlockBodyScroll(true));

    // Wait for requestAnimationFrame to apply styles
    await waitFor(() => {
      expect(document.body.style.overflow).toBe("hidden");
    });
    expect(document.body.style.position).toBe("fixed");

    unmount();

    // Wait for requestAnimationFrame to restore styles
    await waitFor(() => {
      expect(document.body.style.overflow).toBe("");
    });
    expect(document.body.style.position).toBe("");
  });

  it("should not lock body scroll when closed", () => {
    renderHook(() => useBlockBodyScroll(false));
    expect(document.body.style.overflow).toBe("");
  });

  it("should handle nested locks", async () => {
    // First lock
    const hook1 = renderHook(() => useBlockBodyScroll(true));
    await waitFor(() => {
      expect(document.body.style.overflow).toBe("hidden");
    });

    // Second lock (nested)
    const hook2 = renderHook(() => useBlockBodyScroll(true));

    // Unmount second
    hook2.unmount();
    // Should still be locked because hook1 is active
    expect(document.body.style.overflow).toBe("hidden");

    // Unmount first
    hook1.unmount();
    // Wait for styles to be restored
    await waitFor(() => {
      expect(document.body.style.overflow).toBe("");
    });
  });
});
