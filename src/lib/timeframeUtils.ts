/**
 * Timeframe and Session Utilities
 * 
 * Provides automatic detection of trading sessions and 
 * validation of HTF/LTF alignment for professional trading analysis.
 */

// ============================================
// TYPES
// ============================================

export type TradingSession = 
    | 'Tokyo'
    | 'London'
    | 'New York'
    | 'London-NY Overlap'
    | 'Sydney'
    | 'Off-Hours';

export type TimeframeType = 'HTF' | 'LTF';

export interface AlignmentResult {
    valid: boolean;
    classification: 'Top-Down Analysis' | 'LTF Only' | 'Invalid' | 'Same TF';
    message: string;
    recommendedEntryTF: string;
}

// ============================================
// ALIGNMENT TABLE
// ============================================

/**
 * Professional HTF → LTF alignment table
 * Key: Analysis TF, Value: Maximum Entry TF
 */
const ALIGNMENT_TABLE: Record<string, string> = {
    'Monthly': '4H',
    'M': '4H',
    'MN': '4H',
    'Weekly': '1H',
    'W': '1H',
    'W1': '1H',
    'Daily': '15m',
    'D': '15m',
    'D1': '15m',
    '4H': '5m',
    '4h': '5m',
    'H4': '5m',
    '1H': '1m',
    '1h': '1m',
    'H1': '1m',
    '15m': '1m',
    '15M': '1m',
    'M15': '1m',
};

// ============================================
// 3-STATE ALIGNMENT LOGIC
// ============================================

export type AlignmentStatus = 'ST_ALIGNED' | 'ST_RE_ALIGNED' | 'ST_RE_PLUS_ALERT';

export interface TimeframeAlignmentResult {
    status: AlignmentStatus;
    label: 'ST Aligned' | 'ST + RE Aligned' | 'ST + RE + …';
    isWarning: boolean;
}

/**
 * Lookup table for PD Array TF → Entry TF alignment states
 * Based on professional ICT/SMC methodology
 */
const ALIGNMENT_MAP: Record<string, Record<string, AlignmentStatus>> = {
    'Monthly': { 'Daily': 'ST_ALIGNED', '4H': 'ST_RE_ALIGNED', '1H': 'ST_RE_PLUS_ALERT', '15m': 'ST_RE_PLUS_ALERT', '5m': 'ST_RE_PLUS_ALERT', '1m': 'ST_RE_PLUS_ALERT' },
    'Weekly':  { 'Daily': 'ST_ALIGNED', '4H': 'ST_RE_ALIGNED', '1H': 'ST_RE_PLUS_ALERT', '15m': 'ST_RE_PLUS_ALERT', '5m': 'ST_RE_PLUS_ALERT', '1m': 'ST_RE_PLUS_ALERT' },
    'Daily':   { '4H': 'ST_ALIGNED', '1H': 'ST_RE_ALIGNED', '15m': 'ST_RE_PLUS_ALERT', '5m': 'ST_RE_PLUS_ALERT', '1m': 'ST_RE_PLUS_ALERT' },
    '4H':      { '1H': 'ST_ALIGNED', '15m': 'ST_RE_ALIGNED', '5m': 'ST_RE_PLUS_ALERT', '1m': 'ST_RE_PLUS_ALERT' },
    '1H':      { '15m': 'ST_ALIGNED', '5m': 'ST_RE_ALIGNED', '1m': 'ST_RE_PLUS_ALERT' },
    '15m':     { '5m': 'ST_ALIGNED', '1m': 'ST_RE_ALIGNED' },
    '5m':      { '1m': 'ST_ALIGNED' },
};

/**
 * Normalize timeframe string to standard format used in ALIGNMENT_MAP
 * Handles various input formats: H4 → 4H, M15 → 15m, M5 → 5m, M1 → 1m
 */
function normalizeTf(tf: string): string {
    if (!tf) return tf;
    
    const trimmed = tf.trim();
    const upper = trimmed.toUpperCase();
    
    // Map common variations to standard format
    const normalizations: Record<string, string> = {
        // Hour-based (uppercase input)
        'H4': '4H', 'H1': '1H',
        // Hour-based (preserve format)
        '4H': '4H', '1H': '1H',
        // Minute-based (MT4/MT5 format)
        'M15': '15m', 'M5': '5m', 'M1': '1m', 'M30': '30m', 'M3': '3m',
        // Minute-based (already lowercase)
        '15M': '15m', '5M': '5m', '1M': '1m', '30M': '30m', '3M': '3m',
        // Daily/Weekly/Monthly
        'D': 'Daily', 'D1': 'Daily', 'DAILY': 'Daily',
        'W': 'Weekly', 'W1': 'Weekly', 'WEEKLY': 'Weekly',
        'MN': 'Monthly', 'MONTHLY': 'Monthly',
    };
    
    // First try exact match, then try uppercase
    if (normalizations[trimmed]) return normalizations[trimmed];
    if (normalizations[upper]) return normalizations[upper];
    
    // Handle already-correct formats that weren't in the map
    if (trimmed === 'Daily' || trimmed === 'Weekly' || trimmed === 'Monthly') {
        return trimmed;
    }
    
    // Handle lowercase minute formats: 15m, 5m, 1m
    if (/^\d+m$/i.test(trimmed)) {
        return trimmed.toLowerCase();
    }
    
    return tf;
}

/**
 * Get timeframe alignment status between PD Array TF (context) and Entry TF
 * 
 * @param pdArrayTf - PD Array / Analysis timeframe (e.g., 'Daily', '4H', 'H4')
 * @param entryTf - Entry timeframe (e.g., '15m', 'M15', '5m')
 * @returns Alignment result with status, label, and warning flag
 * 
 * @example
 * getTimeframeAlignment('4H', 'M15') // { status: 'ST_ALIGNED', label: 'ST Aligned', isWarning: false }
 * getTimeframeAlignment('Daily', '5m') // { status: 'ST_RE_PLUS_ALERT', label: 'ST + RE + …', isWarning: true }
 */
export function getTimeframeAlignment(
    pdArrayTf: string,
    entryTf: string
): TimeframeAlignmentResult {
    // Normalize inputs to standard format
    const htf = normalizeTf(pdArrayTf);
    const ltf = normalizeTf(entryTf);
    
    const tfMap = ALIGNMENT_MAP[htf];
    const status: AlignmentStatus = tfMap?.[ltf] ?? 'ST_RE_PLUS_ALERT';

    const label = 
        status === 'ST_ALIGNED'
            ? 'ST Aligned'
            : status === 'ST_RE_ALIGNED'
            ? 'ST + RE Aligned'
            : 'ST + RE + …';

    const isWarning = status === 'ST_RE_PLUS_ALERT';

    return { status, label, isWarning };
}

/**
 * Timeframe hierarchy for comparison (higher number = higher TF)
 */
const TF_HIERARCHY: Record<string, number> = {
    '1m': 1,
    '1M': 1,
    'M1': 1,
    '3m': 2,
    '3M': 2,
    'M3': 2,
    '5m': 3,
    '5M': 3,
    'M5': 3,
    '15m': 4,
    '15M': 4,
    'M15': 4,
    '30m': 5,
    '30M': 5,
    'M30': 5,
    '1H': 6,
    '1h': 6,
    'H1': 6,
    '4H': 7,
    '4h': 7,
    'H4': 7,
    'Daily': 8,
    'D': 8,
    'D1': 8,
    'Weekly': 9,
    'W': 9,
    'W1': 9,
    'Monthly': 10,
    'M': 10,
    'MN': 10,
};

// ============================================
// SESSION DETECTION
// ============================================

/**
 * Detect trading session based on entry time
 * Uses UTC internally, expecting local time input
 * 
 * Sessions (in UTC):
 * - Tokyo: 00:00 - 09:00 UTC
 * - London: 07:00 - 16:00 UTC
 * - New York: 12:00 - 21:00 UTC
 * - London-NY Overlap: 12:00 - 16:00 UTC
 * - Sydney: 21:00 - 06:00 UTC
 * 
 * @param entryDate - Date string (YYYY-MM-DD)
 * @param entryTime - Time string (HH:mm)
 * @param timezoneOffsetHours - Offset from UTC (e.g., -3 for Brazil)
 */
export function detectSession(
    entryDate: string,
    entryTime: string,
    timezoneOffsetHours: number = -3 // Default: Brazil (UTC-3)
): TradingSession {
    if (!entryDate || !entryTime) return 'Off-Hours';

    try {
        const [, , ] = entryDate.split('-').map(Number);
        const [hours] = entryTime.split(':').map(Number);
        
        // Convert local time to UTC
        let utcHour = hours - timezoneOffsetHours;
        if (utcHour < 0) utcHour += 24;
        if (utcHour >= 24) utcHour -= 24;

        // London-NY Overlap (MOST LIQUID - highest priority)
        if (utcHour >= 12 && utcHour < 16) {
            return 'London-NY Overlap';
        }
        
        // New York Session
        if (utcHour >= 12 && utcHour < 21) {
            return 'New York';
        }
        
        // London Session
        if (utcHour >= 7 && utcHour < 16) {
            return 'London';
        }
        
        // Tokyo Session
        if (utcHour >= 0 && utcHour < 9) {
            return 'Tokyo';
        }
        
        // Sydney Session
        if (utcHour >= 21 || utcHour < 6) {
            return 'Sydney';
        }
        
        return 'Off-Hours';
    } catch {
        return 'Off-Hours';
    }
}

/**
 * Get session emoji for display
 */
export function getSessionEmoji(session: TradingSession): string {
    switch (session) {
        case 'Tokyo': return '🇯🇵';
        case 'London': return '🇬🇧';
        case 'New York': return '🇺🇸';
        case 'London-NY Overlap': return '🔥';
        case 'Sydney': return '🇦🇺';
        default: return '⏸️';
    }
}

// ============================================
// TIMEFRAME CLASSIFICATION
// ============================================

/**
 * Classify a timeframe as HTF or LTF
 * HTF: 4H and above
 * LTF: 1H and below
 */
export function classifyTimeframe(timeframe: string): TimeframeType {
    const hierarchy = TF_HIERARCHY[timeframe];
    if (hierarchy === undefined) return 'LTF'; // Default to LTF if unknown
    
    // 4H (7) and above is HTF
    return hierarchy >= 7 ? 'HTF' : 'LTF';
}

/**
 * Get the recommended maximum entry TF for a given analysis TF
 */
export function getRecommendedEntryTF(analysisTF: string): string {
    return ALIGNMENT_TABLE[analysisTF] || '5m';
}

/**
 * Validate HTF/LTF alignment
 * Returns whether the entry TF is appropriate for the analysis TF
 */
export function validateAlignment(
    tfAnalise: string,
    tfEntrada: string
): AlignmentResult {
    if (!tfAnalise || !tfEntrada) {
        return {
            valid: false,
            classification: 'Invalid',
            message: 'Timeframes não definidos',
            recommendedEntryTF: ''
        };
    }

    const analysisHierarchy = TF_HIERARCHY[tfAnalise];
    const entryHierarchy = TF_HIERARCHY[tfEntrada];
    const recommendedTF = getRecommendedEntryTF(tfAnalise);
    const recommendedHierarchy = TF_HIERARCHY[recommendedTF];

    if (analysisHierarchy === undefined || entryHierarchy === undefined) {
        return {
            valid: false,
            classification: 'Invalid',
            message: 'Timeframe não reconhecido',
            recommendedEntryTF: recommendedTF
        };
    }

    // Same timeframe
    if (analysisHierarchy === entryHierarchy) {
        return {
            valid: false,
            classification: 'Same TF',
            message: 'Use timeframes diferentes para análise e entrada',
            recommendedEntryTF: recommendedTF
        };
    }

    // Entry TF should be LOWER than analysis TF
    if (entryHierarchy >= analysisHierarchy) {
        return {
            valid: false,
            classification: 'Invalid',
            message: `Entry TF deve ser menor que ${tfAnalise}`,
            recommendedEntryTF: recommendedTF
        };
    }

    // Check if entry is within recommended range (at or below recommended)
    if (entryHierarchy <= (recommendedHierarchy || 4)) {
        return {
            valid: true,
            classification: 'Top-Down Analysis',
            message: `✓ Alinhamento correto: ${tfAnalise} → ${tfEntrada}`,
            recommendedEntryTF: recommendedTF
        };
    }

    // Entry TF is too high for the analysis TF
    return {
        valid: false,
        classification: 'LTF Only',
        message: `Entry TF muito alto. Máximo: ${recommendedTF}`,
        recommendedEntryTF: recommendedTF
    };
}

// ============================================
// R-MULTIPLE CALCULATION
// ============================================

/**
 * Calculate R-Multiple (Risk Multiple)
 * Formula: (Exit Price - Entry Price) / (Entry Price - Stop Loss)
 * 
 * Positive R = Profit
 * Negative R = Loss
 * R > 1 = Gained more than risked
 * R < 1 = Gained less than risked
 * 
 * @param entryPrice - Trade entry price
 * @param exitPrice - Trade exit price
 * @param stopLoss - Stop loss price
 * @param type - 'Long' or 'Short'
 */
export function calculateRMultiple(
    entryPrice: number,
    exitPrice: number | undefined,
    stopLoss: number,
    type: 'Long' | 'Short'
): number | null {
    if (!exitPrice || !entryPrice || !stopLoss) return null;

    let risk: number;
    let profit: number;

    if (type === 'Long') {
        risk = entryPrice - stopLoss;
        profit = exitPrice - entryPrice;
    } else {
        risk = stopLoss - entryPrice;
        profit = entryPrice - exitPrice;
    }

    // Avoid division by zero
    if (risk <= 0) return null;

    const rMultiple = profit / risk;
    
    // Round to 2 decimal places
    return Math.round(rMultiple * 100) / 100;
}

/**
 * Get R-Multiple color for display
 */
export function getRMultipleColor(rMultiple: number | null): string {
    if (rMultiple === null) return 'text-gray-400';
    if (rMultiple >= 2) return 'text-emerald-400';
    if (rMultiple >= 1) return 'text-green-400';
    if (rMultiple >= 0) return 'text-amber-400';
    return 'text-red-400';
}

/**
 * Format R-Multiple for display
 */
export function formatRMultiple(rMultiple: number | null): string {
    if (rMultiple === null) return '-';
    const sign = rMultiple >= 0 ? '+' : '';
    return `${sign}${rMultiple.toFixed(2)}R`;
}

// ============================================
// UTC HELPERS
// ============================================

/**
 * Ensures a datetime string is interpreted as UTC by adding 'Z' suffix if needed.
 * Handles dates stored without timezone info that should be treated as UTC.
 * 
 * @param dateTimeStr - Date/time string, possibly without timezone indicator
 * @returns The same string with 'Z' suffix if no timezone info was present
 */
export function ensureUTC(dateTimeStr: string): string {
    if (!dateTimeStr) return dateTimeStr;
    
    // Already has 'Z' suffix
    if (dateTimeStr.endsWith('Z')) return dateTimeStr;
    
    // Already has timezone offset like +00:00 or -03:00
    if (/[+-]\d{2}:\d{2}$/.test(dateTimeStr)) return dateTimeStr;
    
    // Has 'T' separator, meaning it's a datetime - add 'Z'
    if (dateTimeStr.includes('T')) {
        return dateTimeStr + 'Z';
    }
    
    // Just a date without time, return as-is
    return dateTimeStr;
}

