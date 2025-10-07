import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { organizations } from './organizations';

// Speakers table
export const speakers = pgTable('speakers', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  
  // Basic info
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  
  // Professional info
  title: varchar('title', { length: 200 }), // Job title
  company: varchar('company', { length: 200 }),
  bio: text('bio'),
  expertise: jsonb('expertise').$type<string[]>().default([]), // Areas of expertise
  
  // Media
  profileImageUrl: text('profile_image_url'),
  headshotUrl: text('headshot_url'),
  
  // Social links
  socialLinks: jsonb('social_links').$type<{
    linkedin?: string;
    twitter?: string;
    website?: string;
    github?: string;
  }>().default({}),
  
  // Contact preferences
  isPublic: boolean('is_public').notNull().default(true),
  allowContact: boolean('allow_contact').notNull().default(true),
  
  // Metadata
  tags: jsonb('tags').$type<string[]>().default([]),
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Event speakers junction table (many-to-many)
export const eventSpeakers = pgTable('event_speakers', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull(),
  speakerId: uuid('speaker_id').notNull(),
  
  // Speaker role in this specific event
  role: varchar('role', { length: 100 }).notNull().default('speaker'), // speaker, moderator, panelist, etc.
  sessionTitle: varchar('session_title', { length: 200 }), // Specific session they're speaking in
  sessionDescription: text('session_description'),
  
  // Timing (if different from main event)
  sessionStartTime: timestamp('session_start_time'),
  sessionEndTime: timestamp('session_end_time'),
  
  // Order for display
  displayOrder: integer('display_order').notNull().default(0),
  
  // Status
  isConfirmed: boolean('is_confirmed').notNull().default(false),
  isPublic: boolean('is_public').notNull().default(true),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Activity speakers junction table (speakers for specific activities)
export const activitySpeakers = pgTable('activity_speakers', {
  id: uuid('id').primaryKey().defaultRandom(),
  activityId: uuid('activity_id').notNull(),
  speakerId: uuid('speaker_id').notNull(),
  
  // Speaker role in this specific activity
  role: varchar('role', { length: 100 }).notNull().default('speaker'),
  
  // Order for display
  displayOrder: integer('display_order').notNull().default(0),
  
  // Status
  isConfirmed: boolean('is_confirmed').notNull().default(false),
  isPublic: boolean('is_public').notNull().default(true),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Zod schemas for validation
export const insertSpeakerSchema = createInsertSchema(speakers, {
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(20).optional(),
  title: z.string().max(200).optional(),
  company: z.string().max(200).optional(),
});

export const selectSpeakerSchema = createSelectSchema(speakers);

export const insertEventSpeakerSchema = createInsertSchema(eventSpeakers, {
  role: z.string().min(1).max(100),
  sessionTitle: z.string().max(200).optional(),
  displayOrder: z.number().int().min(0),
});

export const selectEventSpeakerSchema = createSelectSchema(eventSpeakers);

export const insertActivitySpeakerSchema = createInsertSchema(activitySpeakers, {
  role: z.string().min(1).max(100),
  displayOrder: z.number().int().min(0),
});

export const selectActivitySpeakerSchema = createSelectSchema(activitySpeakers);

// Types
export type Speaker = z.infer<typeof selectSpeakerSchema>;
export type NewSpeaker = z.infer<typeof insertSpeakerSchema>;
export type EventSpeaker = z.infer<typeof selectEventSpeakerSchema>;
export type NewEventSpeaker = z.infer<typeof insertEventSpeakerSchema>;
export type ActivitySpeaker = z.infer<typeof selectActivitySpeakerSchema>;
export type NewActivitySpeaker = z.infer<typeof insertActivitySpeakerSchema>;
