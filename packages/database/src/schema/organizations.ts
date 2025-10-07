import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Organizations table
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  logoUrl: text('logo_url'),
  website: varchar('website', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
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
  businessHours: jsonb('business_hours').$type<{
    [key: string]: {
      open: string;
      close: string;
      closed: boolean;
    };
  }>().default({
    monday: { open: '09:00', close: '17:00', closed: false },
    tuesday: { open: '09:00', close: '17:00', closed: false },
    wednesday: { open: '09:00', close: '17:00', closed: false },
    thursday: { open: '09:00', close: '17:00', closed: false },
    friday: { open: '09:00', close: '17:00', closed: false },
    saturday: { open: '10:00', close: '16:00', closed: false },
    sunday: { open: '10:00', close: '16:00', closed: false },
  }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Organization memberships (many-to-many relationship)
export const organizationMemberships = pgTable('organization_memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  organizationId: uuid('organization_id').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'), // admin, member
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  isActive: boolean('is_active').notNull().default(true),
});

// Zod schemas for validation
export const insertOrganizationSchema = createInsertSchema(organizations, {
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
});
export const selectOrganizationSchema = createSelectSchema(organizations);

export const insertOrganizationMembershipSchema = createInsertSchema(organizationMemberships);
export const selectOrganizationMembershipSchema = createSelectSchema(organizationMemberships);

export type Organization = z.infer<typeof selectOrganizationSchema>;
export type NewOrganization = z.infer<typeof insertOrganizationSchema>;
export type OrganizationMembership = z.infer<typeof selectOrganizationMembershipSchema>;
export type NewOrganizationMembership = z.infer<typeof insertOrganizationMembershipSchema>;
