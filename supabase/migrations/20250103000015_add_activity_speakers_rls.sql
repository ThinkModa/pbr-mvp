-- Add RLS policies for activity_speakers table

-- Enable RLS on activity_speakers table
ALTER TABLE activity_speakers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view public activity speakers
CREATE POLICY "Anyone can view public activity speakers" ON activity_speakers
    FOR SELECT USING (is_public = true);

-- Allow service role to bypass RLS (for admin operations)
CREATE POLICY "Service role bypass" ON activity_speakers
    FOR ALL USING (auth.role() = 'service_role');

-- Allow anon role to perform all operations (for admin dashboard)
CREATE POLICY "Anon role can manage activity speakers" ON activity_speakers
    FOR ALL USING (auth.role() = 'anon');
