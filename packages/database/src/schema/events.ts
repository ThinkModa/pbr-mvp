import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { organizations } from './organizations';

// Event status enum
export const eventStatusEnum = z.enum(['draft', 'published', 'cancelled', 'completed']);
export type EventStatus = z.infer<typeof eventStatusEnum>;

// Activity Categories table
export const activityCategories = pgTable('activity_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  color: varchar('color', { length: 7 }).notNull().default('#3B82F6'), // Hex color code
  icon: varchar('icon', { length: 50 }), // Icon name or emoji
  isActive: boolean('is_active').notNull().default(true),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Events table
export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  organizationId: uuid('organization_id').notNull(),
  
  // Event timing
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  timezone: varchar('timezone', { length: 50 }).notNull().default('UTC'),
  
  // Location
  location: jsonb('location').$type<{
    name: string;
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    isVirtual: boolean;
    meetingUrl?: string;
  }>(),
  
  // Capacity and pricing
  maxCapacity: integer('max_capacity'),
  currentRsvps: integer('current_rsvps').notNull().default(0),
  isFree: boolean('is_free').notNull().default(true),
  price: integer('price'), // in cents
  
  // Visibility controls
  showCapacity: boolean('show_capacity').notNull().default(true),
  showPrice: boolean('show_price').notNull().default(true),
  showAttendeeCount: boolean('show_attendee_count').notNull().default(true),
  
  // Media
  coverImageUrl: text('cover_image_url'),
  galleryUrls: jsonb('gallery_urls').$type<string[]>().default([]),
  
  // Settings
  allowWaitlist: boolean('allow_waitlist').notNull().default(true),
  requireApproval: boolean('require_approval').notNull().default(false),
  isPublic: boolean('is_public').notNull().default(true),
  
  // Metadata
  tags: jsonb('tags').$type<string[]>().default([]),
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Activities table (sub-events within an event)
export const activities = pgTable('activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull(),
  categoryId: uuid('category_id').references(() => activityCategories.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  locationName: text('location_name'), // Custom location name (e.g., "Main Conference Room")
  location: jsonb('location').$type<{
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    placeId?: string;
  }>(), // Google Places data (address, coordinates, placeId)
  maxCapacity: integer('max_capacity'),
  currentRsvps: integer('current_rsvps').notNull().default(0),
  isRequired: boolean('is_required').notNull().default(false),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Zod schemas for validation
export const insertEventSchema = createInsertSchema(events, {
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  status: eventStatusEnum,
  startTime: z.date(),
  endTime: z.date(),
  maxCapacity: z.number().positive().optional(),
  price: z.number().nonnegative().optional(),
}).refine(data => data.endTime > data.startTime, {
  message: "End time must be after start time",
  path: ["endTime"],
});

export const selectEventSchema = createSelectSchema(events);

export const insertActivitySchema = createInsertSchema(activities, {
  title: z.string().min(1).max(200),
  startTime: z.date(),
  endTime: z.date(),
  maxCapacity: z.number().positive().optional(),
}).refine(data => data.endTime > data.startTime, {
  message: "End time must be after start time",
  path: ["endTime"],
});

export const selectActivitySchema = createSelectSchema(activities);

// Activity Categories schemas
export const insertActivityCategorySchema = createInsertSchema(activityCategories, {
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-F]{6}$/i),
});

export const selectActivityCategorySchema = createSelectSchema(activityCategories);

export type Event = z.infer<typeof selectEventSchema>;
export type NewEvent = z.infer<typeof insertEventSchema>;
export type Activity = z.infer<typeof selectActivitySchema>;
export type NewActivity = z.infer<typeof insertActivitySchema>;
export type ActivityCategory = z.infer<typeof selectActivityCategorySchema>;
export type NewActivityCategory = z.infer<typeof insertActivityCategorySchema>;
