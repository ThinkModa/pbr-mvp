-- Create track_groups table for mutually exclusive track functionality
-- Migration: 20250103000073_add_track_groups.sql

-- Create track_groups table
CREATE TABLE IF NOT EXISTS track_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_mutually_exclusive BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add track_group_id to event_tracks table
ALTER TABLE event_tracks 
ADD COLUMN IF NOT EXISTS track_group_id UUID REFERENCES track_groups(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_track_groups_event_id ON track_groups(event_id);
CREATE INDEX IF NOT EXISTS idx_event_tracks_group_id ON event_tracks(track_group_id);

-- Add RLS policies for track_groups
ALTER TABLE track_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON track_groups
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON track_groups
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON track_groups
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON track_groups
  FOR DELETE USING (true);

-- Add comment for documentation
COMMENT ON TABLE track_groups IS 'Groups of tracks that can be mutually exclusive (user can only select one track from the group)';
COMMENT ON COLUMN track_groups.is_mutually_exclusive IS 'If true, users can only select one track from this group';
COMMENT ON COLUMN event_tracks.track_group_id IS 'Optional reference to a track group for mutually exclusive selection';

