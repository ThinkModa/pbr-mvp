import type { PaginatedResult, QueryOptions } from '../types';

/**
 * Create pagination parameters for database queries
 */
export function createPaginationParams(options: QueryOptions = {}) {
  const limit = Math.min(options.limit || 20, 100); // Max 100 items per page
  const offset = options.offset || 0;
  
  return { limit, offset };
}

/**
 * Create a paginated result object
 */
export function createPaginatedResult<T>(
  data: T[],
  total: number,
  options: QueryOptions = {}
): PaginatedResult<T> {
  const limit = options.limit || 20;
  const page = Math.floor((options.offset || 0) / limit) + 1;
  const hasMore = (options.offset || 0) + data.length < total;
  
  return {
    data,
    total,
    page,
    limit,
    hasMore,
  };
}

/**
 * Calculate total pages for pagination
 */
export function calculateTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit);
}
