import { describe, it, expect } from "vitest";
import middleware, { config } from "@/lib/proxy";

describe("Middleware Configuration", () => {
  it("should export default middleware function", () => {
    expect(typeof middleware).toBe("function");
  });

  it("should export config with matcher", () => {
    expect(config).toBeDefined();
    expect(config.matcher).toBeDefined();
    expect(Array.isArray(config.matcher)).toBe(true);
  });

  it("matcher should exclude static files", () => {
    const matcher = config.matcher[0];
    expect(matcher).toContain("_next/static");
    expect(matcher).toContain("favicon.ico");
  });
});
