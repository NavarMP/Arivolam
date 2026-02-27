-- =====================================================
-- 13_campus_map_v2.sql
-- Enhanced campus map: styles, seating, labels, surfaces
-- =====================================================

-- ─── Campus Map Styles / Settings ───
CREATE TABLE IF NOT EXISTS public.campus_map_styles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id  UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    name            TEXT NOT NULL DEFAULT 'Default',
    center_lat      DOUBLE PRECISION NOT NULL,
    center_lng      DOUBLE PRECISION NOT NULL,
    default_zoom    INT NOT NULL DEFAULT 17,
    max_zoom        INT DEFAULT 22,
    min_zoom        INT DEFAULT 14,
    boundary_polygon JSONB,          -- GeoJSON polygon for campus boundary
    custom_tile_url TEXT,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Add seating / occupancy to rooms ───
ALTER TABLE public.campus_rooms ADD COLUMN IF NOT EXISTS seating_layout JSONB;
-- Format: { type: "grid"|"custom", rows: 5, cols: 8, seats: [{id, row, col, label, status}] }

ALTER TABLE public.campus_rooms ADD COLUMN IF NOT EXISTS current_occupancy INT DEFAULT 0;
ALTER TABLE public.campus_rooms ADD COLUMN IF NOT EXISTS max_occupancy INT;

-- ─── Label / polygon display settings on buildings ───
ALTER TABLE public.campus_buildings ADD COLUMN IF NOT EXISTS label_visible_zoom INT DEFAULT 17;
ALTER TABLE public.campus_buildings ADD COLUMN IF NOT EXISTS show_polygon BOOLEAN DEFAULT true;

-- ─── Accessibility / surface info on nav edges ───
ALTER TABLE public.campus_nav_edges ADD COLUMN IF NOT EXISTS surface_type TEXT DEFAULT 'paved';
-- Values: 'paved', 'gravel', 'grass', 'stairs', 'ramp'

-- ─── RLS ───
ALTER TABLE public.campus_map_styles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Map styles are publicly readable"
    ON public.campus_map_styles FOR SELECT USING (true);

-- ─── Indexes ───
CREATE INDEX IF NOT EXISTS idx_map_styles_institution
    ON public.campus_map_styles(institution_id);
