import { describe, it, expect } from 'vitest';
import { 
    detectSession,
    classifyTimeframe,
    validateAlignment,
    getRecommendedEntryTF,
    calculateRMultiple,
    formatRMultiple,
    ensureUTC
} from '@/lib/timeframeUtils';

describe('timeframeUtils', () => {
    describe('detectSession', () => {
        // Test with Brazil timezone (UTC-3)
        it('should detect London session (07:00-16:00 UTC)', () => {
            // 10:00 Brazil = 13:00 UTC (London-NY Overlap)
            expect(detectSession('2024-01-01', '10:00', -3)).toBe('London-NY Overlap');
        });

        it('should detect New York session (12:00-21:00 UTC)', () => {
            // 12:00 Brazil = 15:00 UTC (London-NY Overlap)
            expect(detectSession('2024-01-01', '12:00', -3)).toBe('London-NY Overlap');
            // 16:00 Brazil = 19:00 UTC (NY only)
            expect(detectSession('2024-01-01', '16:00', -3)).toBe('New York');
        });

        it('should detect London-NY Overlap (12:00-16:00 UTC)', () => {
            // 11:00 Brazil = 14:00 UTC
            expect(detectSession('2024-01-01', '11:00', -3)).toBe('London-NY Overlap');
        });

        it('should detect Tokyo session (00:00-09:00 UTC)', () => {
            // 22:00 Brazil = 01:00 UTC next day
            expect(detectSession('2024-01-01', '22:00', -3)).toBe('Tokyo');
        });

        it('should return Off-Hours for missing data', () => {
            expect(detectSession('', '', -3)).toBe('Off-Hours');
            expect(detectSession('2024-01-01', '', -3)).toBe('Off-Hours');
        });
    });

    describe('classifyTimeframe', () => {
        it('should classify HTF correctly (4H and above)', () => {
            expect(classifyTimeframe('4H')).toBe('HTF');
            expect(classifyTimeframe('H4')).toBe('HTF');
            expect(classifyTimeframe('Daily')).toBe('HTF');
            expect(classifyTimeframe('D')).toBe('HTF');
            expect(classifyTimeframe('Weekly')).toBe('HTF');
            expect(classifyTimeframe('Monthly')).toBe('HTF');
        });

        it('should classify LTF correctly (1H and below)', () => {
            expect(classifyTimeframe('1H')).toBe('LTF');
            expect(classifyTimeframe('H1')).toBe('LTF');
            expect(classifyTimeframe('15m')).toBe('LTF');
            expect(classifyTimeframe('M15')).toBe('LTF');
            expect(classifyTimeframe('5m')).toBe('LTF');
            expect(classifyTimeframe('1m')).toBe('LTF');
        });
    });

    describe('getRecommendedEntryTF', () => {
        it('should return correct entry TF for each analysis TF', () => {
            expect(getRecommendedEntryTF('Monthly')).toBe('4H');
            expect(getRecommendedEntryTF('Weekly')).toBe('1H');
            expect(getRecommendedEntryTF('Daily')).toBe('15m');
            expect(getRecommendedEntryTF('D')).toBe('15m');
            expect(getRecommendedEntryTF('4H')).toBe('5m');
            expect(getRecommendedEntryTF('H4')).toBe('5m');
            expect(getRecommendedEntryTF('1H')).toBe('1m');
            expect(getRecommendedEntryTF('15m')).toBe('1m');
        });
    });

    describe('validateAlignment', () => {
        it('should validate correct top-down alignment', () => {
            const result = validateAlignment('4H', '5m');
            expect(result.valid).toBe(true);
            expect(result.classification).toBe('Top-Down Analysis');
        });

        it('should validate Daily → 15m as correct', () => {
            const result = validateAlignment('Daily', 'M15');
            expect(result.valid).toBe(true);
        });

        it('should reject entry TF higher than recommended', () => {
            // 4H should use max 5m, not 15m
            const result = validateAlignment('4H', '15m');
            expect(result.valid).toBe(false);
            expect(result.recommendedEntryTF).toBe('5m');
        });

        it('should reject same timeframe for analysis and entry', () => {
            const result = validateAlignment('4H', '4H');
            expect(result.valid).toBe(false);
            expect(result.classification).toBe('Same TF');
        });

        it('should handle missing timeframes', () => {
            const result = validateAlignment('', '5m');
            expect(result.valid).toBe(false);
            expect(result.classification).toBe('Invalid');
        });
    });

    describe('calculateRMultiple', () => {
        it('should calculate positive R for winning Long', () => {
            // Entry: 100, Exit: 110, SL: 95 (Risk: 5, Profit: 10)
            const result = calculateRMultiple(100, 110, 95, 'Long');
            expect(result).toBe(2.0); // 10/5 = 2R
        });

        it('should calculate negative R for losing Long', () => {
            // Entry: 100, Exit: 95, SL: 95 (Risk: 5, Loss: -5)
            const result = calculateRMultiple(100, 95, 95, 'Long');
            expect(result).toBe(-1.0); // -5/5 = -1R
        });

        it('should calculate positive R for winning Short', () => {
            // Entry: 100, Exit: 90, SL: 105 (Risk: 5, Profit: 10)
            const result = calculateRMultiple(100, 90, 105, 'Short');
            expect(result).toBe(2.0); // 10/5 = 2R
        });

        it('should return null for missing data', () => {
            expect(calculateRMultiple(100, undefined, 95, 'Long')).toBe(null);
            expect(calculateRMultiple(0, 110, 95, 'Long')).toBe(null);
        });
    });

    describe('formatRMultiple', () => {
        it('should format positive R-Multiple', () => {
            expect(formatRMultiple(2.5)).toBe('+2.50R');
            expect(formatRMultiple(1)).toBe('+1.00R');
        });

        it('should format negative R-Multiple', () => {
            expect(formatRMultiple(-1)).toBe('-1.00R');
        });

        it('should handle null', () => {
            expect(formatRMultiple(null)).toBe('-');
        });
    });

    describe('ensureUTC', () => {
        it('should add Z suffix to datetime without timezone', () => {
            expect(ensureUTC('2025-09-23T17:58:00')).toBe('2025-09-23T17:58:00Z');
        });

        it('should preserve Z suffix if already present', () => {
            expect(ensureUTC('2025-09-23T17:58:00Z')).toBe('2025-09-23T17:58:00Z');
        });

        it('should preserve timezone offset +00:00', () => {
            expect(ensureUTC('2025-09-23T17:58:00+00:00')).toBe('2025-09-23T17:58:00+00:00');
        });

        it('should preserve timezone offset -03:00', () => {
            expect(ensureUTC('2025-09-23T17:58:00-03:00')).toBe('2025-09-23T17:58:00-03:00');
        });

        it('should return date-only string unchanged (no T separator)', () => {
            expect(ensureUTC('2025-09-23')).toBe('2025-09-23');
        });

        it('should handle empty string', () => {
            expect(ensureUTC('')).toBe('');
        });
    });
});

