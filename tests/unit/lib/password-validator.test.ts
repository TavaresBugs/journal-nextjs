import { describe, test, expect } from "bun:test";
import { validatePassword, getStrengthColor, getStrengthLabel } from "@/lib/password-validator";

describe("Password Validator", () => {
    describe("validatePassword", () => {
        test("accepts valid strong password", () => {
            const result = validatePassword("SecurePass123!");
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.strength).toBe("strong");
        });

        test("rejects password shorter than 8 characters", () => {
            const result = validatePassword("Abc123");
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain("Mínimo de 8 caracteres");
        });

        test("rejects password without uppercase letter", () => {
            const result = validatePassword("password123");
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain("Pelo menos 1 letra maiúscula");
        });

        test("rejects password without lowercase letter", () => {
            const result = validatePassword("PASSWORD123");
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain("Pelo menos 1 letra minúscula");
        });

        test("rejects password without number", () => {
            const result = validatePassword("SecurePassword");
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain("Pelo menos 1 número");
        });

        test("rejects password without special character", () => {
            const result = validatePassword("Password123");
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain("Pelo menos 1 caractere especial (!@#$%&*)");
        });

        test("accepts minimum valid password with special char", () => {
            const result = validatePassword("Abcd123!");
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
            // Score is 100 (25 length + 20 uppercase + 15 lowercase + 20 number + 20 special) = strong
            expect(result.strength).toBe("strong");
        });

        test("gives higher score for longer passwords", () => {
            const short = validatePassword("Ab1!");
            const long = validatePassword("Abcdefgh1!");
            expect(long.score).toBeGreaterThan(short.score);
        });

        test("classifies medium password correctly", () => {
            // Only length (25) + uppercase (20) + lowercase (15) = 60 points = medium
            // missing number and special char
            const result = validatePassword("Abcdefgh");
            expect(result.strength).toBe("medium");
        });

        test("classifies weak password correctly", () => {
            // Even if invalid, should classify as weak
            const result = validatePassword("abc");
            expect(result.strength).toBe("weak");
        });

        test("multiple errors are accumulated", () => {
            const result = validatePassword("abc");
            expect(result.errors.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe("getStrengthColor", () => {
        test("returns red for weak", () => {
            expect(getStrengthColor("weak")).toBe("#ef4444");
        });

        test("returns amber for medium", () => {
            expect(getStrengthColor("medium")).toBe("#f59e0b");
        });

        test("returns green for strong", () => {
            expect(getStrengthColor("strong")).toBe("#22c55e");
        });
    });

    describe("getStrengthLabel", () => {
        test("returns Portuguese labels", () => {
            expect(getStrengthLabel("weak")).toBe("Fraca");
            expect(getStrengthLabel("medium")).toBe("Média");
            expect(getStrengthLabel("strong")).toBe("Forte");
        });
    });
});
