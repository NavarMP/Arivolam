-- Add canvas coordinate columns to campus map tables
ALTER TABLE public.campus_buildings
ADD COLUMN IF NOT EXISTS canvas_x double precision,
ADD COLUMN IF NOT EXISTS canvas_y double precision,
ADD COLUMN IF NOT EXISTS canvas_w double precision,
ADD COLUMN IF NOT EXISTS canvas_h double precision;

ALTER TABLE public.campus_pois
ADD COLUMN IF NOT EXISTS canvas_x double precision,
ADD COLUMN IF NOT EXISTS canvas_y double precision;

ALTER TABLE public.campus_nav_nodes
ADD COLUMN IF NOT EXISTS canvas_x double precision,
ADD COLUMN IF NOT EXISTS canvas_y double precision;
