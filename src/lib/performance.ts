/**
 * Performance Monitoring Utilities
 * Track and measure query/component performance
 */

export class PerformanceMonitor {
    private metrics: Map<string, number[]> = new Map();

    startMeasure(name: string) {
        if (typeof performance !== 'undefined') {
            performance.mark(`${name}-start`);
        }
    }

    endMeasure(name: string): number | null {
        if (typeof performance === 'undefined') return null;

        try {
            performance.mark(`${name}-end`);
            performance.measure(name, `${name}-start`, `${name}-end`);

            const entries = performance.getEntriesByName(name, 'measure');
            const measure = entries[entries.length - 1];
            if (!measure) return null;

            const duration = measure.duration;

            // Store metric
            if (!this.metrics.has(name)) {
                this.metrics.set(name, []);
            }
            this.metrics.get(name)!.push(duration);

            // Log slow operations
            if (duration > 1000) {
                console.warn(`⚠️ Slow operation: ${name} took ${duration.toFixed(2)}ms`);
            }

            // Cleanup
            performance.clearMarks(`${name}-start`);
            performance.clearMarks(`${name}-end`);
            performance.clearMeasures(name);

            return duration;
        } catch {
            return null;
        }
    }

    getStats(name: string) {
        const values = this.metrics.get(name) || [];
        if (values.length === 0) return null;

        return {
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            count: values.length,
        };
    }

    reportAll() {
        console.table(
            Array.from(this.metrics.keys()).map(key => ({
                metric: key,
                ...this.getStats(key),
            }))
        );
    }

    clear() {
        this.metrics.clear();
    }
}

// Singleton instance
export const perfMonitor = new PerformanceMonitor();

/**
 * Tracked query wrapper - logs query execution time
 */
export async function trackQuery<T>(
    name: string,
    queryFn: () => Promise<T>
): Promise<T> {
    const start = performance.now();

    try {
        const result = await queryFn();
        const duration = performance.now() - start;

        if (process.env.NODE_ENV === 'development') {
            const emoji = duration > 2000 ? '🔴' : duration > 1000 ? '🟡' : '🟢';
            console.log(`${emoji} Query: ${name} - ${duration.toFixed(2)}ms`);
        }

        return result;
    } catch (error) {
        console.error(`❌ Query failed: ${name}`, error);
        throw error;
    }
}

/**
 * Performance budget definitions
 */
export const PERFORMANCE_BUDGET = {
    pages: {
        mainDashboard: 800,
        communityPage: 1000,
        adminPage: 1000,
        mentorPage: 1000,
        tradeHistory: 800,
    },
    queries: {
        critical: 500,
        standard: 1000,
        background: 2000,
    },
};
