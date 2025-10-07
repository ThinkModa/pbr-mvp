import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './users';

// Media types
export const mediaTypeEnum = z.enum(['image', 'video', 'audio', 'document', 'other']);
export type MediaType = z.infer<typeof mediaTypeEnum>;

// Media objects table
export const mediaObjects = pgTable('media_objects', {
  id: uuid('id').primaryKey().defaultRandom(),
  filename: varchar('filename', { length: 255 }).notNull(),
  originalFilename: varchar('original_filename', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSize: integer('file_size').notNull(), // in bytes
  fileType: varchar('file_type', { length: 20 }).notNull(),
  
  // Storage information
  storagePath: text('storage_path').notNull(),
  storageUrl: text('storage_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  
  // Image-specific metadata
  width: integer('width'),
  height: integer('height'),
  altText: text('alt_text'),
  
  // Ownership and permissions
  uploadedBy: uuid('uploaded_by').notNull(),
  isPublic: boolean('is_public').notNull().default(false),
  
  // Processing status
  processingStatus: varchar('processing_status', { length: 20 }).notNull().default('pending'), // pending, processing, completed, failed
  processingError: text('processing_error'),
  
  // Metadata
  metadata: jsonb('metadata').$type<{
    exif?: Record<string, any>;
    duration?: number; // for video/audio
    bitrate?: number;
    codec?: string;
  }>().default({}),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Zod schemas for validation
export const insertMediaObjectSchema = createInsertSchema(mediaObjects, {
  filename: z.string().min(1).max(255),
  originalFilename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  fileSize: z.number().positive(),
  fileType: mediaTypeEnum,
  storagePath: z.string().min(1),
  storageUrl: z.string().url(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  processingStatus: z.enum(['pending', 'processing', 'completed', 'failed']),
});

export const selectMediaObjectSchema = createSelectSchema(mediaObjects);

export type MediaObject = z.infer<typeof selectMediaObjectSchema>;
export type NewMediaObject = z.infer<typeof insertMediaObjectSchema>;
