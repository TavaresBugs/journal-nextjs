/**
 * Trade Debugger - Development utility for debugging trade data
 * 
 * Usage:
 * import { TradeDebugger } from '@/lib/debug/tradeDebugger'
 * 
 * const trade = await getTrade(id)
 * TradeDebugger.log(trade, 'TradeDetailPage')
 * 
 * // Compare before/after update:
 * const oldTrade = { ...trade }
 * const updatedTrade = await updateTrade(id, changes)
 * TradeDebugger.compare(oldTrade, updatedTrade)
 */

interface TradeData {
  id?: string;
  user_id?: string;
  strategy?: string;
  outcome?: string;
  created_at?: string;
  _query_time?: number;
  [key: string]: unknown;
}

const styles = {
  title: 'color: #4CAF50; font-weight: bold; font-size: 14px',
  key: 'color: #2196F3; font-weight: bold',
  value: 'color: #FF9800',
  success: 'color: #4CAF50',
  error: 'color: #F44336',
  muted: 'color: #999',
};

export const TradeDebugger = {
  /**
   * Log detailed trade information to console
   */
  log(trade: TradeData, source: string = 'Unknown') {
    if (typeof window === 'undefined') return; // SSR safety
    if (process.env.NODE_ENV !== 'development') return;

    console.log(
      `%c🔍 Trade Debugger %c[${source}]`,
      styles.title,
      styles.muted
    );

    // ID Info
    console.log(
      `%cID:%c ${trade?.id}`,
      styles.key,
      styles.value
    );
    console.log(
      `%cUUID válido:%c ${this.isValidUUID(trade?.id) ? '✅ Sim' : '❌ Não'}`,
      styles.key,
      this.isValidUUID(trade?.id) ? styles.success : styles.error
    );

    // User Info
    console.log(
      `%cUser ID:%c ${trade?.user_id}`,
      styles.key,
      styles.value
    );

    // Trade Info
    console.log(
      `%cStrategy:%c ${trade?.strategy}`,
      styles.key,
      styles.value
    );
    console.log(
      `%cOutcome:%c ${trade?.outcome}`,
      styles.key,
      styles.value
    );

    // Timestamps
    console.log(
      `%cCreated:%c ${trade?.created_at}`,
      styles.key,
      styles.value
    );

    // Query time (if using TradeRepository with timing)
    if (trade?._query_time !== undefined) {
      const isGood = trade._query_time < 100;
      console.log(
        `%cQuery Time:%c ${trade._query_time}ms ${isGood ? '✅' : '⚠️'}`,
        styles.key,
        isGood ? styles.success : 'color: orange'
      );
    }

    // Full object
    console.log('%cFull Object:', styles.key, trade);

    console.log('─'.repeat(60));
  },

  /**
   * Validate if a string is a valid UUID
   */
  isValidUUID(uuid: string | undefined): boolean {
    if (!uuid) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
  },

  /**
   * Compare two trade objects and show differences
   */
  compare(oldTrade: TradeData | null, newTrade: TradeData | null) {
    if (typeof window === 'undefined') return;
    if (process.env.NODE_ENV !== 'development') return;

    console.group('🔄 Trade Comparison');

    if (!oldTrade || !newTrade) {
      console.warn('Cannot compare: one or both trades are null');
      console.groupEnd();
      return;
    }

    const keys = new Set([
      ...Object.keys(oldTrade),
      ...Object.keys(newTrade),
    ]);

    let changesFound = false;
    keys.forEach((key) => {
      const oldValue = oldTrade[key];
      const newValue = newTrade[key];

      if (oldValue !== newValue) {
        changesFound = true;
        console.log(
          `%c${key}:%c ${String(oldValue)} %c→%c ${String(newValue)}`,
          styles.key,
          styles.error,
          styles.muted,
          styles.success
        );
      }
    });

    if (!changesFound) {
      console.log('%cNo changes detected', styles.muted);
    }

    console.groupEnd();
  },

  /**
   * Log query performance metrics
   */
  logPerformance(queryName: string, durationMs: number, rowCount: number) {
    if (typeof window === 'undefined') return;
    if (process.env.NODE_ENV !== 'development') return;

    const isGood = durationMs < 100;
    const isMedium = durationMs < 500;

    console.log(
      `%c⚡ Query: %c${queryName} %c${durationMs.toFixed(2)}ms %c(${rowCount} rows)`,
      styles.key,
      styles.value,
      isGood ? styles.success : isMedium ? 'color: orange' : styles.error,
      styles.muted
    );
  },

  /**
   * Validate trade structure and log any issues
   */
  validate(trade: TradeData, requiredFields: string[] = ['id', 'user_id', 'strategy', 'outcome']): boolean {
    if (typeof window === 'undefined') return true;
    if (process.env.NODE_ENV !== 'development') return true;

    const missingFields = requiredFields.filter((field) => !(field in trade) || trade[field] === undefined);

    if (missingFields.length > 0) {
      console.warn(`%c⚠️ Trade Validation Failed - Missing fields: ${missingFields.join(', ')}`, styles.error);
      return false;
    }

    console.log('%c✅ Trade Validation Passed', styles.success);
    return true;
  },
};

export default TradeDebugger;
