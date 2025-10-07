import { pgTable, uuid, varchar, timestamp, boolean, text, integer } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './users';
import { events } from './events';
import { activities } from './activities';

// RSVP status enum
export const rsvpStatusEnum = z.enum(['attending', 'not_attending', 'maybe', 'waitlist']);
export type RsvpStatus = z.infer<typeof rsvpStatusEnum>;

// Event RSVPs table
export const eventRsvps = pgTable('event_rsvps', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  eventId: uuid('event_id').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('attending'),
  guestCount: integer('guest_count').notNull().default(1),
  dietaryRestrictions: text('dietary_restrictions'),
  accessibilityNeeds: text('accessibility_needs'),
  notes: text('notes'),
  isApproved: boolean('is_approved').notNull().default(true),
  approvedAt: timestamp('approved_at'),
  approvedBy: uuid('approved_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Activity RSVPs table
export const activityRsvps = pgTable('activity_rsvps', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  activityId: uuid('activity_id').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('attending'),
  guestCount: integer('guest_count').notNull().default(1),
  notes: text('notes'),
  isApproved: boolean('is_approved').notNull().default(true),
  approvedAt: timestamp('approved_at'),
  approvedBy: uuid('approved_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Zod schemas for validation
export const insertEventRsvpSchema = createInsertSchema(eventRsvps, {
  status: rsvpStatusEnum,
  guestCount: z.number().int().min(1).max(10),
});

export const selectEventRsvpSchema = createSelectSchema(eventRsvps);

export const insertActivityRsvpSchema = createInsertSchema(activityRsvps, {
  status: rsvpStatusEnum,
  guestCount: z.number().int().min(1).max(10),
});

export const selectActivityRsvpSchema = createSelectSchema(activityRsvps);

export type EventRsvp = z.infer<typeof selectEventRsvpSchema>;
export type NewEventRsvp = z.infer<typeof insertEventRsvpSchema>;
export type ActivityRsvp = z.infer<typeof selectActivityRsvpSchema>;
export type NewActivityRsvp = z.infer<typeof insertActivityRsvpSchema>;
