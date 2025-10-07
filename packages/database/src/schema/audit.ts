import { pgTable, uuid, varchar, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Audit log actions
export const auditActionEnum = z.enum([
  'create', 'update', 'delete', 'login', 'logout', 'approve', 'reject',
  'invite', 'remove', 'publish', 'unpublish', 'cancel', 'restore'
]);
export type AuditAction = z.infer<typeof auditActionEnum>;

// Audit log table
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  action: varchar('action', { length: 20 }).notNull(),
  resourceType: varchar('resource_type', { length: 50 }).notNull(), // user, event, organization, etc.
  resourceId: uuid('resource_id').notNull(),
  
  // Change tracking
  beforeData: jsonb('before_data').$type<Record<string, any>>(),
  afterData: jsonb('after_data').$type<Record<string, any>>(),
  
  // Context
  ipAddress: varchar('ip_address', { length: 45 }), // IPv6 compatible
  userAgent: text('user_agent'),
  sessionId: varchar('session_id', { length: 255 }),
  
  // Additional metadata
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Zod schemas for validation
export const insertAuditLogSchema = createInsertSchema(auditLogs, {
  action: auditActionEnum,
  resourceType: z.string().min(1).max(50),
});

export const selectAuditLogSchema = createSelectSchema(auditLogs);

export type AuditLog = z.infer<typeof selectAuditLogSchema>;
export type NewAuditLog = z.infer<typeof insertAuditLogSchema>;
