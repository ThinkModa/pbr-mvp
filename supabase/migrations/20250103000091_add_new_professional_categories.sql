-- Add new professional categories to the existing list
-- This migration adds 5 new professional categories to the professional_categories table

-- Insert new professional categories
INSERT INTO professional_categories (name, description, sort_order) VALUES
('Art', 'Visual arts, creative design, and artistic professions', 20),
('Human resources', 'HR management, talent acquisition, and employee relations', 21),
('Economics', 'Economic analysis, research, and financial planning', 22),
('Communications', 'Public relations, marketing communications, and media relations', 23),
('Entrepreneurship', 'Business ownership, startup development, and innovation', 24)
ON CONFLICT (name) DO NOTHING;

-- Update the sort_order for 'Other' to be last
UPDATE professional_categories 
SET sort_order = 25 
WHERE name = 'Other';
