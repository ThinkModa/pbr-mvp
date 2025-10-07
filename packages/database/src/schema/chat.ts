import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb, integer } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './users';
import { organizations } from './organizations';
import { events } from './events';

// Chat thread types
export const chatThreadTypeEnum = z.enum(['group', 'dm', 'event', 'organization']);
export type ChatThreadType = z.infer<typeof chatThreadTypeEnum>;

// Chat threads table
export const chatThreads = pgTable('chat_threads', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 200 }),
  description: text('description'),
  type: varchar('type', { length: 20 }).notNull().default('group'),
  isPrivate: boolean('is_private').notNull().default(false),
  
  // Optional references
  organizationId: uuid('organization_id'),
  eventId: uuid('event_id'),
  
  // Settings
  allowMemberInvites: boolean('allow_member_invites').notNull().default(true),
  allowFileUploads: boolean('allow_file_uploads').notNull().default(true),
  maxMembers: integer('max_members'),
  
  // Metadata
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastMessageAt: timestamp('last_message_at'),
});

// Chat messages table
export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id').notNull(),
  userId: uuid('user_id').notNull(),
  content: text('content').notNull(),
  messageType: varchar('message_type', { length: 20 }).notNull().default('text'), // text, image, file, system
  
  // Optional references
  replyToId: uuid('reply_to_id'),
  eventId: uuid('event_id'), // for event-related messages
  
  // Media attachments
  attachments: jsonb('attachments').$type<{
    type: 'image' | 'file' | 'link';
    url: string;
    filename?: string;
    size?: number;
    mimeType?: string;
  }[]>().default([]),
  
  // Message status
  isEdited: boolean('is_edited').notNull().default(false),
  editedAt: timestamp('edited_at'),
  isDeleted: boolean('is_deleted').notNull().default(false),
  deletedAt: timestamp('deleted_at'),
  
  // Reactions
  reactions: jsonb('reactions').$type<Record<string, string[]>>().default({}), // emoji -> user IDs
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Chat memberships table
export const chatMemberships = pgTable('chat_memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id').notNull(),
  userId: uuid('user_id').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'), // admin, moderator, member
  
  // Notification settings
  notificationsEnabled: boolean('notifications_enabled').notNull().default(true),
  muteUntil: timestamp('mute_until'),
  
  // Read status
  lastReadAt: timestamp('last_read_at'),
  unreadCount: integer('unread_count').notNull().default(0),
  
  // Membership status
  isActive: boolean('is_active').notNull().default(true),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  leftAt: timestamp('left_at'),
});

// Zod schemas for validation
export const insertChatThreadSchema = createInsertSchema(chatThreads, {
  name: z.string().min(1).max(200).optional(),
  type: chatThreadTypeEnum,
  maxMembers: z.number().positive().optional(),
});

export const selectChatThreadSchema = createSelectSchema(chatThreads);

export const insertChatMessageSchema = createInsertSchema(chatMessages, {
  content: z.string().min(1).max(4000),
  messageType: z.enum(['text', 'image', 'file', 'system']),
});

export const selectChatMessageSchema = createSelectSchema(chatMessages);

export const insertChatMembershipSchema = createInsertSchema(chatMemberships, {
  role: z.enum(['admin', 'moderator', 'member']),
});

export const selectChatMembershipSchema = createSelectSchema(chatMemberships);

export type ChatThread = z.infer<typeof selectChatThreadSchema>;
export type NewChatThread = z.infer<typeof insertChatThreadSchema>;
export type ChatMessage = z.infer<typeof selectChatMessageSchema>;
export type NewChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMembership = z.infer<typeof selectChatMembershipSchema>;
export type NewChatMembership = z.infer<typeof insertChatMembershipSchema>;
