import { describe, it, expect } from "vitest";
import { isPublicRoute, hasRouteAccess } from "../config/route-config";
import { resolveRedirect, UserContext } from "../lib/auth/middleware-utils";

describe("Route Configuration", () => {
  it("should identify public routes correctly", () => {
    expect(isPublicRoute("/login")).toBe(true);
    expect(isPublicRoute("/auth/callback")).toBe(true);
    expect(isPublicRoute("/_next/static/css/styles.css")).toBe(true);
    expect(isPublicRoute("/favicon.ico")).toBe(true);
    expect(isPublicRoute("/public-test")).toBe(false);
    expect(isPublicRoute("/dashboard")).toBe(false);
  });

  it("should check route permissions correctly", () => {
    // Admin routes
    expect(hasRouteAccess("/admin", "admin")).toBe(true);
    expect(hasRouteAccess("/admin", "user")).toBe(false);

    // Dashboard (shared)
    expect(hasRouteAccess("/dashboard", "user")).toBe(true);
    expect(hasRouteAccess("/dashboard", "admin")).toBe(true);

    // Default protected routes (fallback)
    expect(hasRouteAccess("/unknown-protected", "user")).toBe(true);
  });
});

describe("Middleware Redirect Logic", () => {
  const adminUser: UserContext = { id: "1", role: "admin", status: "approved" };
  const normalUser: UserContext = { id: "2", role: "user", status: "approved" };
  const pendingUser: UserContext = { id: "3", role: "user", status: "pending" };
  const suspendedUser: UserContext = { id: "4", role: "user", status: "suspended" };

  it("should redirect unauthenticated users to login for protected routes", () => {
    expect(resolveRedirect("/dashboard", null)).toBe("/login");
    expect(resolveRedirect("/admin", null)).toBe("/login");
  });

  it("should allow unauthenticated users on public routes", () => {
    expect(resolveRedirect("/login", null)).toBe(null);
    expect(resolveRedirect("/termos", null)).toBe(null);
  });

  it("should redirect suspended users to login with error", () => {
    expect(resolveRedirect("/dashboard", suspendedUser)).toBe("/login?error=account_suspended");
    expect(resolveRedirect("/login", suspendedUser)).toBe(null); // Allow them to be on login page
  });

  it("should redirect pending users to pending page", () => {
    expect(resolveRedirect("/dashboard", pendingUser)).toBe("/pending");
  });

  it("should allow pending users on pending page and public routes", () => {
    expect(resolveRedirect("/pending", pendingUser)).toBe(null);
    expect(resolveRedirect("/termos", pendingUser)).toBe(null);
  });

  it("should redirect approved users away from pending page", () => {
    expect(resolveRedirect("/pending", normalUser)).toBe("/");
  });

  it("should restrict admin routes", () => {
    expect(resolveRedirect("/admin", normalUser)).toBe("/dashboard");
    expect(resolveRedirect("/admin", adminUser)).toBe(null);
  });

  it("should allow normal access", () => {
    expect(resolveRedirect("/dashboard", normalUser)).toBe(null);
    expect(resolveRedirect("/trades", normalUser)).toBe(null);
  });
});
