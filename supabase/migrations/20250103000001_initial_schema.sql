-- Initial database schema for PBR MVP
-- This migration creates all the core tables for the application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'business', 'general');
CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');
CREATE TYPE rsvp_status AS ENUM ('attending', 'not_attending', 'maybe', 'waitlist');
CREATE TYPE chat_thread_type AS ENUM ('group', 'dm', 'event', 'organization');
CREATE TYPE message_type AS ENUM ('text', 'image', 'file', 'system');
CREATE TYPE media_type AS ENUM ('image', 'video', 'audio', 'document', 'other');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'approve', 'reject', 'invite', 'remove', 'publish', 'unpublish', 'cancel', 'restore');
CREATE TYPE processing_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    role VARCHAR(20) NOT NULL DEFAULT 'general',
    is_active BOOLEAN NOT NULL DEFAULT true,
    preferences JSONB DEFAULT '{
        "notifications": {"email": true, "push": true, "chat": true},
        "privacy": {"showEmail": false, "showPhone": false}
    }',
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    website VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address JSONB,
    business_hours JSONB DEFAULT '{
        "monday": {"open": "09:00", "close": "17:00", "closed": false},
        "tuesday": {"open": "09:00", "close": "17:00", "closed": false},
        "wednesday": {"open": "09:00", "close": "17:00", "closed": false},
        "thursday": {"open": "09:00", "close": "17:00", "closed": false},
        "friday": {"open": "09:00", "close": "17:00", "closed": false},
        "saturday": {"open": "10:00", "close": "16:00", "closed": false},
        "sunday": {"open": "10:00", "close": "16:00", "closed": false}
    }',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Organization memberships table
CREATE TABLE organization_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT NOW() NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    UNIQUE(user_id, organization_id)
);

-- Events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    slug VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    organization_id UUID NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    location JSONB,
    max_capacity INTEGER,
    current_rsvps INTEGER NOT NULL DEFAULT 0,
    is_free BOOLEAN NOT NULL DEFAULT true,
    price INTEGER,
    cover_image_url TEXT,
    gallery_urls JSONB DEFAULT '[]',
    allow_waitlist BOOLEAN NOT NULL DEFAULT true,
    require_approval BOOLEAN NOT NULL DEFAULT false,
    is_public BOOLEAN NOT NULL DEFAULT true,
    tags JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Activities table
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    location JSONB,
    max_capacity INTEGER,
    current_rsvps INTEGER NOT NULL DEFAULT 0,
    is_required BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Event RSVPs table
CREATE TABLE event_rsvps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    event_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'attending',
    guest_count INTEGER NOT NULL DEFAULT 1,
    dietary_restrictions TEXT,
    accessibility_needs TEXT,
    notes TEXT,
    is_approved BOOLEAN NOT NULL DEFAULT true,
    approved_at TIMESTAMP,
    approved_by UUID,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(user_id, event_id)
);

-- Activity RSVPs table
CREATE TABLE activity_rsvps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    activity_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'attending',
    guest_count INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    is_approved BOOLEAN NOT NULL DEFAULT true,
    approved_at TIMESTAMP,
    approved_by UUID,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(user_id, activity_id)
);

-- Chat threads table
CREATE TABLE chat_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200),
    description TEXT,
    type VARCHAR(20) NOT NULL DEFAULT 'group',
    is_private BOOLEAN NOT NULL DEFAULT false,
    organization_id UUID,
    event_id UUID,
    allow_member_invites BOOLEAN NOT NULL DEFAULT true,
    allow_file_uploads BOOLEAN NOT NULL DEFAULT true,
    max_members INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    last_message_at TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Chat messages table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID NOT NULL,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL DEFAULT 'text',
    reply_to_id UUID,
    event_id UUID,
    attachments JSONB DEFAULT '[]',
    is_edited BOOLEAN NOT NULL DEFAULT false,
    edited_at TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMP,
    reactions JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    FOREIGN KEY (thread_id) REFERENCES chat_threads(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_to_id) REFERENCES chat_messages(id) ON DELETE SET NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
);

-- Chat memberships table
CREATE TABLE chat_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'member',
    notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    mute_until TIMESTAMP,
    last_read_at TIMESTAMP,
    unread_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    joined_at TIMESTAMP DEFAULT NOW() NOT NULL,
    left_at TIMESTAMP,
    FOREIGN KEY (thread_id) REFERENCES chat_threads(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(thread_id, user_id)
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID NOT NULL,
    before_data JSONB,
    after_data JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Media objects table
CREATE TABLE media_objects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(20) NOT NULL,
    storage_path TEXT NOT NULL,
    storage_url TEXT NOT NULL,
    thumbnail_url TEXT,
    width INTEGER,
    height INTEGER,
    alt_text TEXT,
    uploaded_by UUID NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT false,
    processing_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    processing_error TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_events_organization_id ON events(organization_id);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_activities_event_id ON activities(event_id);
CREATE INDEX idx_event_rsvps_user_id ON event_rsvps(user_id);
CREATE INDEX idx_event_rsvps_event_id ON event_rsvps(event_id);
CREATE INDEX idx_activity_rsvps_user_id ON activity_rsvps(user_id);
CREATE INDEX idx_activity_rsvps_activity_id ON activity_rsvps(activity_id);
CREATE INDEX idx_chat_messages_thread_id ON chat_messages(thread_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_chat_memberships_thread_id ON chat_memberships(thread_id);
CREATE INDEX idx_chat_memberships_user_id ON chat_memberships(user_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_media_objects_uploaded_by ON media_objects(uploaded_by);
CREATE INDEX idx_media_objects_file_type ON media_objects(file_type);
