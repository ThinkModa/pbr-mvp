// Re-export all types from schema files
export type { User, NewUser } from '../schema/users';
export type { Organization, NewOrganization, OrganizationMembership, NewOrganizationMembership } from '../schema/organizations';
export type { Event, NewEvent, Activity, NewActivity } from '../schema/events';
export type { EventRsvp, NewEventRsvp, ActivityRsvp, NewActivityRsvp } from '../schema/rsvps';
export type { ChatThread, NewChatThread, ChatMessage, NewChatMessage, ChatMembership, NewChatMembership } from '../schema/chat';
export type { AuditLog, NewAuditLog } from '../schema/audit';
export type { MediaObject, NewMediaObject } from '../schema/media';

// Common utility types
export type Timestamp = Date;
export type UUID = string;

// Database connection types
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

// Query result types
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}
