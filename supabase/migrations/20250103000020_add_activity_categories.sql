-- Create activity_categories table
CREATE TABLE activity_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) NOT NULL DEFAULT '#3B82F6', -- Hex color code
    icon VARCHAR(50), -- Icon name or emoji
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_activity_categories_name ON activity_categories(name);
CREATE INDEX idx_activity_categories_display_order ON activity_categories(display_order);
CREATE INDEX idx_activity_categories_is_active ON activity_categories(is_active);

-- Add trigger for updated_at
CREATE TRIGGER update_activity_categories_updated_at BEFORE UPDATE ON activity_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add category_id to activities table
ALTER TABLE activities ADD COLUMN category_id UUID REFERENCES activity_categories(id) ON DELETE SET NULL;

-- Create index for category_id
CREATE INDEX idx_activities_category_id ON activities(category_id);

-- Insert default categories
INSERT INTO activity_categories (name, description, color, icon, display_order) VALUES
('General', 'General activities and sessions', '#3B82F6', '📋', 1),
('Keynote', 'Keynote presentations and talks', '#EF4444', '🎤', 2),
('Workshop', 'Hands-on workshops and training', '#10B981', '🔧', 3),
('Networking', 'Networking and social activities', '#F59E0B', '🤝', 4),
('Break', 'Breaks, meals, and downtime', '#6B7280', '☕', 5),
('Panel', 'Panel discussions and Q&A', '#8B5CF6', '💬', 6),
('Demo', 'Product demos and showcases', '#EC4899', '🚀', 7),
('Training', 'Educational and training sessions', '#06B6D4', '📚', 8);

-- Enable RLS on activity_categories table
ALTER TABLE activity_categories ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view active categories
CREATE POLICY "Anyone can view active activity categories" ON activity_categories
    FOR SELECT USING (is_active = true);

-- Allow service role to bypass RLS (for admin operations)
CREATE POLICY "Service role bypass" ON activity_categories
    FOR ALL USING (auth.role() = 'service_role');

-- Allow anon role to perform all operations (for admin dashboard)
CREATE POLICY "Anon role can manage activity categories" ON activity_categories
    FOR ALL USING (auth.role() = 'anon');
