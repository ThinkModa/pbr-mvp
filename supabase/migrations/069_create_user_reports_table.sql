-- Create user_reports table for tracking user feedback and reports
CREATE TABLE IF NOT EXISTS user_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('bug_report', 'feature_request', 'general_feedback', 'support_request')),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  user_email TEXT,
  user_name TEXT,
  device_info TEXT,
  app_version TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_reports_type ON user_reports(type);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports(status);
CREATE INDEX IF NOT EXISTS idx_user_reports_created_at ON user_reports(created_at DESC);

-- Enable RLS
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to insert their own reports
CREATE POLICY "Users can insert their own reports" ON user_reports
  FOR INSERT WITH CHECK (true);

-- Allow admins to view all reports
CREATE POLICY "Admins can view all reports" ON user_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Allow admins to update reports
CREATE POLICY "Admins can update reports" ON user_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_user_reports_updated_at
  BEFORE UPDATE ON user_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_user_reports_updated_at();
