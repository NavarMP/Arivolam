-- Migration to structure campus_rooms for detailed floor management
-- Adds missing fields for detailed room configuration

-- Up Migration
ALTER TABLE campus_rooms
ADD COLUMN IF NOT EXISTS operating_hours text,
ADD COLUMN IF NOT EXISTS amenities jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS is_accessible boolean DEFAULT false;

-- Down Migration
-- ALTER TABLE campus_rooms DROP COLUMN IF EXISTS operating_hours;
-- ALTER TABLE campus_rooms DROP COLUMN IF EXISTS amenities;
-- ALTER TABLE campus_rooms DROP COLUMN IF EXISTS is_accessible;
