-- Create track system for simultaneous event tracks
-- Migration: 20250103000034_create_track_system.sql

-- 1. Add has_tracks flag to events table
ALTER TABLE events ADD COLUMN has_tracks BOOLEAN NOT NULL DEFAULT false;

-- 2. Create event_tracks table
CREATE TABLE event_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  max_capacity INTEGER,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create track_activities junction table
CREATE TABLE track_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES event_tracks(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(track_id, activity_id)
);

-- 4. Add track_id to event_rsvps table
ALTER TABLE event_rsvps ADD COLUMN track_id UUID REFERENCES event_tracks(id);

-- 5. Add indexes for performance
CREATE INDEX idx_event_tracks_event_id ON event_tracks(event_id);
CREATE INDEX idx_event_tracks_display_order ON event_tracks(event_id, display_order);
CREATE INDEX idx_track_activities_track_id ON track_activities(track_id);
CREATE INDEX idx_track_activities_activity_id ON track_activities(activity_id);
CREATE INDEX idx_event_rsvps_track_id ON event_rsvps(track_id);

-- 6. Add comments for documentation
COMMENT ON COLUMN events.has_tracks IS 'Whether this event requires track selection for RSVPs';
COMMENT ON TABLE event_tracks IS 'Tracks for events with simultaneous sessions';
COMMENT ON TABLE track_activities IS 'Junction table linking tracks to activities';
COMMENT ON COLUMN event_rsvps.track_id IS 'Selected track for this RSVP (required if event.has_tracks = true)';
