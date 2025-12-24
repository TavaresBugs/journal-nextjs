// Generic result type for Repository methods
export type Result<T, E = Error> = { data: T; error: null } | { data: null; error: E };

// Options for query methods
export interface QueryOptions {
  detailed?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
}
