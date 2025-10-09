-- Bulk Import System Migration
-- This migration adds support for bulk user import and invitation tracking

-- Add status and invitation tracking to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('pending', 'invited', 'active', 'inactive')),
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS import_batch_id UUID;

-- Create import batches table for tracking bulk imports
CREATE TABLE IF NOT EXISTS import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  total_users INTEGER NOT NULL DEFAULT 0,
  successful_imports INTEGER NOT NULL DEFAULT 0,
  failed_imports INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create import errors table for tracking import failures
CREATE TABLE IF NOT EXISTS import_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES import_batches(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  email VARCHAR(255),
  error_message TEXT NOT NULL,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invitation batches table for tracking invitation sends
CREATE TABLE IF NOT EXISTS invitation_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES import_batches(id) ON DELETE CASCADE,
  user_ids UUID[] NOT NULL,
  email_sent INTEGER NOT NULL DEFAULT 0,
  sms_sent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_import_batch_id ON users(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_import_errors_batch_id ON import_errors(batch_id);
CREATE INDEX IF NOT EXISTS idx_invitation_batches_batch_id ON invitation_batches(batch_id);

-- Add RLS policies for import system
ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_batches ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage import batches
CREATE POLICY "Admins can manage import batches" ON import_batches
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can manage import errors" ON import_errors
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can manage invitation batches" ON invitation_batches
  FOR ALL USING (auth.role() = 'service_role');

-- Update existing users to have 'active' status
UPDATE users SET status = 'active' WHERE status IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN users.status IS 'User account status: pending (imported but not invited), invited (invitation sent), active (account activated), inactive (disabled)';
COMMENT ON COLUMN users.invited_at IS 'Timestamp when invitation was sent to user';
COMMENT ON COLUMN users.activated_at IS 'Timestamp when user activated their account';
COMMENT ON COLUMN users.import_batch_id IS 'Reference to the import batch that created this user';

COMMENT ON TABLE import_batches IS 'Tracks bulk import operations and their results';
COMMENT ON TABLE import_errors IS 'Records errors encountered during bulk import';
COMMENT ON TABLE invitation_batches IS 'Tracks invitation sending operations for imported users';
