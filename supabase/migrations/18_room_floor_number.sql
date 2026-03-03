-- =====================================================
-- 18_room_floor_number.sql
-- Add floor_number to campus_rooms for floor grouping
-- =====================================================

ALTER TABLE public.campus_rooms ADD COLUMN IF NOT EXISTS floor_number INTEGER DEFAULT 0;

-- Create index for faster floor-based queries
CREATE INDEX IF NOT EXISTS idx_rooms_floor ON public.campus_rooms(building_id, floor_number);
