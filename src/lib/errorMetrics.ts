'use client';

/**
 * Centralized error metrics for observability
 * Tracks error counts by service/context for debugging
 * 
 * @example
 * errorMetrics.increment('getJournalEntries');
 * errorMetrics.report(); // Shows table of error counts
 */

const errorCounts: Record<string, number> = {};
const errorTimestamps: Record<string, number[]> = {};

export const errorMetrics = {
    /**
     * Increment error count for a context
     */
    increment: (context: string): void => {
        errorCounts[context] = (errorCounts[context] || 0) + 1;
        
        if (!errorTimestamps[context]) {
            errorTimestamps[context] = [];
        }
        errorTimestamps[context].push(Date.now());
        
        // Keep only last 100 timestamps per context
        if (errorTimestamps[context].length > 100) {
            errorTimestamps[context] = errorTimestamps[context].slice(-100);
        }
    },

    /**
     * Get error count for a specific context
     */
    getCount: (context: string): number => {
        return errorCounts[context] || 0;
    },

    /**
     * Get all error counts as a report
     */
    report: (): void => {
        if (typeof console.table === 'function') {
            console.table(
                Object.entries(errorCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([context, count]) => ({
                        context,
                        count,
                        lastError: errorTimestamps[context]?.slice(-1)[0] 
                            ? new Date(errorTimestamps[context].slice(-1)[0]).toLocaleString()
                            : 'N/A'
                    }))
            );
        } else {
            console.log('Error Report:', errorCounts);
        }
    },

    /**
     * Reset all metrics (useful for testing)
     */
    reset: (): void => {
        Object.keys(errorCounts).forEach(key => delete errorCounts[key]);
        Object.keys(errorTimestamps).forEach(key => delete errorTimestamps[key]);
    },

    /**
     * Get errors in the last N minutes
     */
    getRecentErrors: (context: string, minutes: number = 5): number => {
        const cutoff = Date.now() - (minutes * 60 * 1000);
        return (errorTimestamps[context] || []).filter(ts => ts > cutoff).length;
    }
};

// Expose to window for debugging in production
if (typeof window !== 'undefined') {
    (window as unknown as { __errorMetrics: typeof errorMetrics }).__errorMetrics = errorMetrics;
}
