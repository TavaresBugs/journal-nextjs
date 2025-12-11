import { describe, it, expect } from 'vitest';
import { validatePassword, getStrengthColor, getStrengthLabel } from '@/lib/password-validator';

describe('password-validator.ts', () => {
    describe('validatePassword', () => {
        it('should return invalid for short password', () => {
            const result = validatePassword('Short1!');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Mínimo de 8 caracteres');
        });

        it('should return invalid if missing uppercase', () => {
            const result = validatePassword('longpassword1!');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Pelo menos 1 letra maiúscula');
        });

        it('should return invalid if missing lowercase', () => {
            const result = validatePassword('LONGPASSWORD1!');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Pelo menos 1 letra minúscula');
        });

        it('should return invalid if missing number', () => {
            const result = validatePassword('LongPassword!');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Pelo menos 1 número');
        });

        it('should return invalid if missing special char', () => {
            const result = validatePassword('LongPassword1');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Pelo menos 1 caractere especial (!@#$%&*)');
        });

        it('should return valid for strong password', () => {
            const result = validatePassword('StrongPass1!');
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.strength).not.toBe('weak');
        });

        it('should calculate score correctly', () => {
             // 8+ chars (25) + Uppercase (20) + Lowercase (15) + Number (20) + Special (20) = 100
             const result = validatePassword('StrongPass1!');
             expect(result.score).toBe(100);
        });
    });

    describe('getStrengthColor', () => {
        it('should return correct colors', () => {
            expect(getStrengthColor('weak')).toBe('#ef4444');
            expect(getStrengthColor('medium')).toBe('#f59e0b');
            expect(getStrengthColor('strong')).toBe('#22c55e');
        });
    });

    describe('getStrengthLabel', () => {
         it('should return correct labels', () => {
            expect(getStrengthLabel('weak')).toBe('Fraca');
            expect(getStrengthLabel('medium')).toBe('Média');
            expect(getStrengthLabel('strong')).toBe('Forte');
        });
    });
});
