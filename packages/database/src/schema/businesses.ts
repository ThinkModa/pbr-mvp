import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb, integer } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { organizations } from './organizations';

// Businesses table
export const businesses = pgTable('businesses', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  
  // Basic info
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  industry: varchar('industry', { length: 100 }),
  size: varchar('size', { length: 50 }), // startup, small, medium, large, enterprise
  
  // Contact info
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  website: text('website'),
  
  // Address
  address: jsonb('address').$type<{
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  }>(),
  
  // Media
  logoUrl: text('logo_url'),
  coverImageUrl: text('cover_image_url'),
  galleryUrls: jsonb('gallery_urls').$type<string[]>().default([]),
  
  // Social links
  socialLinks: jsonb('social_links').$type<{
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
  }>().default({}),
  
  // Business details
  foundedYear: integer('founded_year'),
  employeeCount: integer('employee_count'),
  revenue: varchar('revenue', { length: 50 }), // revenue range
  
  // Services/Products
  services: jsonb('services').$type<string[]>().default([]),
  products: jsonb('products').$type<string[]>().default([]),
  
  // Contact preferences
  isPublic: boolean('is_public').notNull().default(true),
  allowContact: boolean('allow_contact').notNull().default(true),
  isSponsor: boolean('is_sponsor').notNull().default(false),
  
  // Metadata
  tags: jsonb('tags').$type<string[]>().default([]),
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Event businesses junction table (many-to-many)
export const eventBusinesses = pgTable('event_businesses', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull(),
  businessId: uuid('business_id').notNull(),
  
  // Business role in this specific event
  role: varchar('role', { length: 100 }).notNull().default('participant'), // sponsor, vendor, partner, participant
  sponsorshipLevel: varchar('sponsorship_level', { length: 50 }), // gold, silver, bronze, etc.
  boothNumber: varchar('booth_number', { length: 20 }),
  
  // Display settings
  displayOrder: integer('display_order').notNull().default(0),
  isFeatured: boolean('is_featured').notNull().default(false),
  
  // Status
  isConfirmed: boolean('is_confirmed').notNull().default(false),
  isPublic: boolean('is_public').notNull().default(true),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Business contacts (people representing the business)
export const businessContacts = pgTable('business_contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').notNull(),
  
  // Contact info
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  title: varchar('title', { length: 200 }), // Job title
  
  // Role in business
  role: varchar('role', { length: 100 }).notNull().default('contact'), // owner, manager, representative, etc.
  isPrimary: boolean('is_primary').notNull().default(false),
  
  // Contact preferences
  isPublic: boolean('is_public').notNull().default(true),
  allowContact: boolean('allow_contact').notNull().default(true),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Zod schemas for validation
export const insertBusinessSchema = createInsertSchema(businesses, {
  name: z.string().min(1).max(200),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(20).optional(),
  website: z.string().url().optional(),
  industry: z.string().max(100).optional(),
  size: z.string().max(50).optional(),
  foundedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  employeeCount: z.number().int().min(0).optional(),
});

export const selectBusinessSchema = createSelectSchema(businesses);

export const insertEventBusinessSchema = createInsertSchema(eventBusinesses, {
  role: z.string().min(1).max(100),
  sponsorshipLevel: z.string().max(50).optional(),
  boothNumber: z.string().max(20).optional(),
  displayOrder: z.number().int().min(0),
});

export const selectEventBusinessSchema = createSelectSchema(eventBusinesses);

export const insertBusinessContactSchema = createInsertSchema(businessContacts, {
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(20).optional(),
  title: z.string().max(200).optional(),
  role: z.string().min(1).max(100),
});

export const selectBusinessContactSchema = createSelectSchema(businessContacts);

// Types
export type Business = z.infer<typeof selectBusinessSchema>;
export type NewBusiness = z.infer<typeof insertBusinessSchema>;
export type EventBusiness = z.infer<typeof selectEventBusinessSchema>;
export type NewEventBusiness = z.infer<typeof insertEventBusinessSchema>;
export type BusinessContact = z.infer<typeof selectBusinessContactSchema>;
export type NewBusinessContact = z.infer<typeof insertBusinessContactSchema>;
