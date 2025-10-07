import { z } from 'zod';

/**
 * Common validation schemas
 */
export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().email();
export const slugSchema = z.string().min(1).max(100).regex(/^[a-z0-9-]+$/);
export const phoneSchema = z.string().regex(/^\+?[\d\s-()]+$/);
export const urlSchema = z.string().url();

/**
 * Pagination validation schema
 */
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  orderBy: z.string().optional(),
  orderDirection: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Date range validation schema
 */
export const dateRangeSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
}).refine(data => {
  if (data.startDate && data.endDate) {
    return data.endDate > data.startDate;
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

/**
 * Search validation schema
 */
export const searchSchema = z.object({
  query: z.string().min(1).max(255),
  fields: z.array(z.string()).optional(),
});

/**
 * File upload validation schema
 */
export const fileUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  size: z.number().positive().max(10 * 1024 * 1024), // 10MB max
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type DateRangeInput = z.infer<typeof dateRangeSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
