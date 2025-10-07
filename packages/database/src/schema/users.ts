import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// User roles enum
export const userRoleEnum = z.enum(['admin', 'business', 'general']);
export type UserRole = z.infer<typeof userRoleEnum>;

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  avatarUrl: text('avatar_url'),
  role: varchar('role', { length: 20 }).notNull().default('general'),
  isActive: boolean('is_active').notNull().default(true),
  preferences: jsonb('preferences').$type<{
    notifications: {
      email: boolean;
      push: boolean;
      chat: boolean;
    };
    privacy: {
      showEmail: boolean;
      showPhone: boolean;
    };
  }>().default({
    notifications: { email: true, push: true, chat: true },
    privacy: { showEmail: false, showPhone: false }
  }),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: userRoleEnum,
});
export const selectUserSchema = createSelectSchema(users);

export type User = z.infer<typeof selectUserSchema>;
export type NewUser = z.infer<typeof insertUserSchema>;
