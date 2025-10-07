-- Add visibility controls for capacity, price, and attendee count
-- Migration: 20250103000004_add_visibility_controls.sql

-- Add new columns to events table
ALTER TABLE events 
ADD COLUMN show_capacity BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN show_price BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN show_attendee_count BOOLEAN NOT NULL DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN events.show_capacity IS 'Whether to show the maximum capacity to users';
COMMENT ON COLUMN events.show_price IS 'Whether to show the price to users';
COMMENT ON COLUMN events.show_attendee_count IS 'Whether to show the current attendee count to users';

-- Update existing events to have visibility enabled by default
-- (This is already handled by the DEFAULT values above, but being explicit)
UPDATE events SET 
  show_capacity = true,
  show_price = true,
  show_attendee_count = true
WHERE show_capacity IS NULL OR show_price IS NULL OR show_attendee_count IS NULL;
