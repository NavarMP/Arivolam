-- 14_floor_plans_schema.sql
-- Create campus_floor_plans table

CREATE TABLE IF NOT EXISTS public.campus_floor_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID NOT NULL REFERENCES public.campus_buildings(id) ON DELETE CASCADE,
    floor_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    width INTEGER NOT NULL DEFAULT 800,
    height INTEGER NOT NULL DEFAULT 600,
    elements JSONB NOT NULL DEFAULT '[]'::jsonb,
    background_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(building_id, floor_number)
);

-- RLS Policies
ALTER TABLE public.campus_floor_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Floor plans are viewable by everyone"
    ON public.campus_floor_plans FOR SELECT
    USING (true);

-- The server admin actions will use SUPABASE_SERVICE_ROLE_KEY to bypass RLS for inserts/updates.

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_campus_floor_plans_modtime
    BEFORE UPDATE ON public.campus_floor_plans
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();
